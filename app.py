import os
import json
import logging
import datetime
import re
from difflib import SequenceMatcher # For basic string similarity
from dotenv import load_dotenv
import requests
from flask import Flask, request, jsonify
from dotenv import load_dotenv

import google.generativeai as genai
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build

# For Email Notifications (using smtplib, simple example)
import smtplib
from email.mime.text import MIMEText

# --- Basic Logging Setup ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Load Environment Variables ---
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
FB_PAGE_ACCESS_TOKEN = os.getenv("FB_PAGE_ACCESS_TOKEN")
FB_VERIFY_TOKEN = os.getenv("FB_VERIFY_TOKEN")
GOOGLE_SPREADSHEET_ID = os.getenv("GOOGLE_SPREADSHEET_ID")
GOOGLE_SHEET_RANGE_PRODUCTS = os.getenv("GOOGLE_SHEET_RANGE_PRODUCTS")
GOOGLE_SHEET_RANGE_LEARNED_QNA = os.getenv("GOOGLE_SHEET_RANGE_LEARNED_QNA")
OWNER_NOTIFICATION_EMAIL = os.getenv("OWNER_NOTIFICATION_EMAIL")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")
SENDER_EMAIL = os.getenv("SENDER_EMAIL")
SERVICE_ACCOUNT_FILE = os.getenv("SERVICE_ACCOUNT_FILE")
YOUR_FACEBOOK_PAGE_ID = os.getenv("YOUR_FACEBOOK_PAGE_ID")
FOUND_DOTENV = load_dotenv()
logging.info(f".env file found and loaded: {FOUND_DOTENV}")

# --- Global Variables & Cache ---
product_knowledge_base = []
learned_qna_data = []
# Simple in-memory store for escalated queries awaiting owner reply
# For production, use a persistent DB (SQLite, Redis, etc.)
escalated_queries_awaiting_reply = {} # Key: customer_message_id, Value: {'customer_id': ..., 'query_text': ..., 'timestamp': ...}

# --- Flask App Initialization ---
app = Flask(__name__)

# --- Google Sheets API Setup ---
SCOPES_SHEETS = ['https://www.googleapis.com/auth/spreadsheets'] # Use .readonly if only reading
creds_sheets = None
try:
    creds_sheets = Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=SCOPES_SHEETS)
    sheets_service = build('sheets', 'v4', credentials=creds_sheets)
except Exception as e:
    logging.error(f"Failed to initialize Google Sheets credentials: {e}")
    sheets_service = None

# --- Gemini API Setup ---
try:
    if GEMINI_API_KEY:
        genai.configure(api_key=GEMINI_API_KEY)
    # For Vertex AI, Application Default Credentials (ADC) are often used if running on GCP
    # If using Vertex AI models, initialize the model differently:
    # from google.cloud import aiplatform
    # aiplatform.init(project=YOUR_GCP_PROJECT_ID, location=YOUR_GCP_REGION)
    # gemini_model = genai.GenerativeModel('gemini-1.5-flash-latest') # or 'gemini-pro' etc.
    gemini_model = genai.GenerativeModel(os.getenv("GEMINI_MODEL_NAME", 'gemini-1.5-flash-latest'))
except Exception as e:
    logging.error(f"Failed to initialize Gemini API: {e}")
    gemini_model = None

# --- Helper Functions ---

def load_data_from_google_sheet(spreadsheet_id, range_name):
    """Loads data from a specific range in a Google Sheet."""
    if not sheets_service:
        logging.error("Sheets service not initialized.")
        return []
    try:
        result = sheets_service.spreadsheets().values().get(
            spreadsheetId=spreadsheet_id, range=range_name).execute()
        values = result.get('values', [])
        if not values:
            logging.info(f'No data found in sheet range: {range_name}')
            return []
        else:
            # Assuming first row is headers
            headers = [header.lower().replace(" ", "_") for header in values[0]]
            data = []
            for row in values[1:]:
                item_dict = {}
                for i, header in enumerate(headers):
                    if i < len(row):
                        item_dict[header] = row[i]
                    else:
                        item_dict[header] = None
                data.append(item_dict)
            logging.info(f"Successfully loaded {len(data)} items from {range_name}")
            return data
    except Exception as e:
        logging.error(f"Error loading data from Google Sheet ({range_name}): {e}")
        return []

def refresh_knowledge_bases():
    """Refreshes both product knowledge and learned Q&A from Google Sheets."""
    global product_knowledge_base, learned_qna_data
    logging.info("Refreshing knowledge bases...")
    product_knowledge_base = load_data_from_google_sheet(GOOGLE_SPREADSHEET_ID, GOOGLE_SHEET_RANGE_PRODUCTS)
    # Prepare 'details_for_rag' for product knowledge
    for item in product_knowledge_base:
        item['details_for_rag'] = (
            f"Product: {item.get('product_name', 'N/A')}. "
            f"Price: ${item.get('price', 'N/A')}. "
            f"Description: {item.get('description_for_rag', 'N/A')}. "
            f"Stock: {item.get('stock', 'N/A')}. "
            f"Link: {item.get('product_page_link', 'N/A')}."
        )
    learned_qna_data = load_data_from_google_sheet(GOOGLE_SPREADSHEET_ID, GOOGLE_SHEET_RANGE_LEARNED_QNA)
    logging.info(f"Product KB: {len(product_knowledge_base)} items, Learned Q&A: {len(learned_qna_data)} items.")

def is_query_similar(query1, query2, threshold=0.75):
    """Basic string similarity check."""
    if not query1 or not query2:
        return False
    return SequenceMatcher(None, query1.lower(), query2.lower()).ratio() >= threshold

def find_in_learned_qna(user_query):
    """Checks if a similar query exists in the learned Q&A."""
    for item in learned_qna_data:
        original_query = item.get('original_customer_query')
        learned_answer = item.get("owner's_learned_answer") # Ensure header matches sheet
        if original_query and learned_answer and is_query_similar(user_query, original_query):
            logging.info(f"Found similar query in learned Q&A for: '{user_query}'")
            return learned_answer
    return None

def find_relevant_knowledge_in_sheet(user_query):
    """Finds relevant product descriptions from the Google Sheet for RAG."""
    relevant_snippets = []
    # Simple keyword matching - can be improved with more sophisticated search
    query_words = set(re.findall(r'\w+', user_query.lower()))
    if not query_words: return ""

    for item in product_knowledge_base:
        # Check product name first for higher relevance
        product_name_words = set(re.findall(r'\w+', item.get('product_name', '').lower()))
        if query_words.intersection(product_name_words):
             relevant_snippets.append(item['details_for_rag'])
             continue # Prioritize product name matches

        # Then check description for RAG
        # This part can be smarter, e.g., count word overlaps, use TF-IDF, etc.
        # For simplicity, if any query word is in the description, add it.
        description_words = set(re.findall(r'\w+', item.get('description_for_rag', '').lower()))
        if query_words.intersection(description_words):
            relevant_snippets.append(item['details_for_rag'])

    # Limit context size for Gemini
    # A more robust way is to count tokens.
    MAX_CONTEXT_SNIPPETS = 3
    joined_snippets = "\n\n---\n\n".join(list(set(relevant_snippets))[:MAX_CONTEXT_SNIPPETS]) # Use set to avoid duplicates
    if joined_snippets:
        logging.info(f"Found RAG context for '{user_query}': {len(joined_snippets)} chars")
    else:
        logging.info(f"No RAG context found for '{user_query}' in product sheet.")
    return joined_snippets


def get_gemini_response(user_query, context):
    """Gets a response from Gemini API using provided context."""
    if not gemini_model:
        logging.error("Gemini model not initialized.")
        return "I'm currently unable to process requests, please try again later."

    prompt = f"""You are a friendly and helpful chatbot for a book business.
    Your goal is to answer customer questions based ONLY on the information provided below.
    Do not make up information, prices, or features not present in the provided context.
    If the information isn't available in the provided context to answer the question,
    clearly and politely state: "I'm sorry, I don't have that specific information right now."
    Be concise and helpful.

    Provided Information (Context):
    ---
    {context if context else "No specific product information was found related to your query."}
    ---

    Customer Question: {user_query}

    Answer:"""
    try:
        logging.info(f"Sending prompt to Gemini for query: {user_query}")
        # print(f"DEBUG: Prompt to Gemini:\n{prompt}\n") # Uncomment for debugging prompts
        response = gemini_model.generate_content(prompt)
        # print(f"DEBUG: Gemini Response object: {response}") # Uncomment for debugging response object
        # Accessing the text part of the response. Adapt based on the actual response structure.
        # Assuming response.text is the way to get the text.
        # If response.parts is used, it might be: response.parts[0].text
        if hasattr(response, 'text'):
            answer = response.text
        elif hasattr(response, 'parts') and response.parts:
            answer = "".join(part.text for part in response.parts if hasattr(part, 'text'))
        else: # Fallback if structure is unexpected
            logging.warning(f"Unexpected Gemini response structure: {response}")
            answer = "I received a response, but couldn't extract the text properly."

        logging.info(f"Gemini response: {answer}")
        return answer
    except Exception as e:
        logging.error(f"Error calling Gemini API: {e}")
        return "I encountered an issue trying to understand that. Could you please rephrase?"

def send_facebook_message(recipient_id, message_text):
    """Sends a text message to the specified recipient using Facebook Graph API."""
    params = {"access_token": FB_PAGE_ACCESS_TOKEN}
    headers = {"Content-Type": "application/json"}
    payload = {
        "recipient": {"id": recipient_id},
        "message": {"text": message_text},
        "messaging_type": "RESPONSE" # Important for standard messaging
    }
    try:
        r = requests.post("https://graph.facebook.com/v12.0/me/messages", params=params, headers=headers, data=json.dumps(payload))
        r.raise_for_status()
        logging.info(f"Successfully sent message to {recipient_id}")
    except requests.exceptions.RequestException as e:
        logging.error(f"Error sending Facebook message to {recipient_id}: {e}")
        if hasattr(e, 'response') and e.response is not None:
            logging.error(f"FB API Response content: {e.response.text}")

def notify_owner(customer_id, user_query, customer_message_id):
    """Notifies the business owner about an unanswered query."""
    subject = f"Chatbot: Unanswered Query from User {customer_id}"
    body = (f"The chatbot could not answer the following query from user {customer_id} "
            f"(Facebook User ID) associated with their message ID {customer_message_id}:\n\n"
            f"'{user_query}'\n\n"
            f"Please check your Facebook Page Inbox to reply manually. "
            f"If possible, reply directly to this message in the inbox so the bot can learn.")

    logging.info(f"Attempting to notify owner about query from {customer_id}: {user_query}")

    # Store for linking owner's reply (if not using reply_to.mid)
    # This is a simple in-memory approach; a DB would be better for persistence
    escalated_queries_awaiting_reply[customer_message_id] = {
        'customer_id': customer_id,
        'query_text': user_query,
        'timestamp': datetime.datetime.utcnow()
    }
    logging.info(f"Stored escalated query for MID {customer_message_id}")


    # Simple Email Notification (Example using Gmail - Requires GMAIL_APP_PASSWORD & SENDER_EMAIL in .env)
    if OWNER_NOTIFICATION_EMAIL and GMAIL_APP_PASSWORD and SENDER_EMAIL:
        try:
            msg = MIMEText(body)
            msg['Subject'] = subject
            msg['From'] = SENDER_EMAIL
            msg['To'] = OWNER_NOTIFICATION_EMAIL

            with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp_server:
                smtp_server.login(SENDER_EMAIL, GMAIL_APP_PASSWORD)
                smtp_server.sendmail(SENDER_EMAIL, OWNER_NOTIFICATION_EMAIL, msg.as_string())
            logging.info(f"Email notification sent to {OWNER_NOTIFICATION_EMAIL}")
        except Exception as e:
            logging.error(f"Failed to send email notification: {e}")
    else:
        logging.warning("Email notification for owner not configured or missing credentials.")

def add_learned_qna_to_sheet(original_query, learned_answer):
    """Appends a new learned Q&A pair to the Google Sheet."""
    if not sheets_service:
        logging.error("Sheets service not initialized. Cannot save learned Q&A.")
        return
    try:
        timestamp = datetime.datetime.utcnow().isoformat()
        values_to_append = [[original_query, learned_answer, timestamp]]
        body = {'values': values_to_append}
        sheets_service.spreadsheets().values().append(
            spreadsheetId=GOOGLE_SPREADSHEET_ID,
            range=GOOGLE_SHEET_RANGE_LEARNED_QNA, # Append to the LearnedQnA sheet
            valueInputOption='USER_ENTERED', # Or 'RAW' if not needing parsing
            insertDataOption='INSERT_ROWS', # Insert as new rows
            body=body
        ).execute()
        logging.info(f"Successfully added learned Q&A to Google Sheet: '{original_query}' -> '{learned_answer}'")
        # Refresh learned Q&A cache immediately
        global learned_qna_data
        learned_qna_data = load_data_from_google_sheet(GOOGLE_SPREADSHEET_ID, GOOGLE_SHEET_RANGE_LEARNED_QNA)
    except Exception as e:
        logging.error(f"Error appending learned Q&A to Google Sheet: {e}")


# ... (other imports and setup) ...

# --- Facebook Webhook ---
@app.route('/webhook', methods=['GET', 'POST'])
def webhook():
    if request.method == 'GET':
        # Facebook App Verification (Keep your existing GET logic with logging)
        token_sent = request.args.get("hub.verify_token")
        logging.info(f"GET /webhook - hub.verify_token received: {token_sent}, Expected token: {FB_VERIFY_TOKEN}")
        if token_sent == FB_VERIFY_TOKEN:
            challenge = request.args.get("hub.challenge")
            logging.info(f"GET /webhook - Verification SUCCESS. Challenge: {challenge}")
            return challenge, 200
        else:
            logging.warning(f"GET /webhook - Verification FAILED. Mismatched tokens.")
            return 'Invalid verification token', 403
    
    elif request.method == 'POST':
        data = request.get_json()
        logging.info("------------------- POST /webhook RECEIVED -------------------") # START OF POST
        logging.info(f"RAW POST DATA: {json.dumps(data, indent=2)}") # Log the entire payload

        if data.get("object") == "page":
            logging.info("POST data object is 'page'. Processing entries.")
            for entry_idx, entry in enumerate(data.get("entry", [])):
                logging.info(f"Processing Entry #{entry_idx}: {json.dumps(entry, indent=2)}")
                for msg_idx, messaging_event in enumerate(entry.get("messaging", [])):
                    logging.info(f"Processing Messaging Event #{msg_idx} in Entry #{entry_idx}: {json.dumps(messaging_event, indent=2)}")

                    sender_id = messaging_event.get("sender", {}).get("id")
                    recipient_id = messaging_event.get("recipient", {}).get("id")
                    
                    logging.info(f"Event Details: sender_id={sender_id}, recipient_id={recipient_id}, YOUR_PAGE_ID_FROM_ENV={YOUR_FACEBOOK_PAGE_ID}")

                    # --- Case 1: Message sent BY THE PAGE (Owner's manual reply) ---
                    if sender_id == YOUR_FACEBOOK_PAGE_ID and recipient_id != YOUR_FACEBOOK_PAGE_ID:
                        logging.info("Interpreting as OWNER message to a user.")
                        owner_reply_text = messaging_event.get("message", {}).get("text")
                        customer_message_id_replied_to = messaging_event.get("message", {}).get("reply_to", {}).get("mid")
                        message_id_of_owner_reply = messaging_event.get("message", {}).get("mid")
                        logging.info(f"Owner reply text: '{owner_reply_text}', Reply_to_MID: {customer_message_id_replied_to}, OwnerMsgMID: {message_id_of_owner_reply}")

                        if owner_reply_text and customer_message_id_replied_to:
                            if customer_message_id_replied_to in escalated_queries_awaiting_reply:
                                escalated_info = escalated_queries_awaiting_reply.pop(customer_message_id_replied_to)
                                original_customer_query = escalated_info['query_text']
                                logging.info(f"Owner replied to escalated query (UserMID: {customer_message_id_replied_to}). Original: '{original_customer_query}', Owner's reply: '{owner_reply_text}'")
                                add_learned_qna_to_sheet(original_customer_query, owner_reply_text) # Make sure this function also logs success/failure
                            else:
                                logging.info(f"Owner replied (OwnerMsgMID: {message_id_of_owner_reply}), but no matching *escalated* query found for UserMID: {customer_message_id_replied_to}. Might be regular chat or already processed.")
                        elif owner_reply_text:
                             logging.info(f"Owner sent a message (OwnerMsgMID: {message_id_of_owner_reply}) to user {recipient_id}, but it wasn't a reply to an escalated bot message (no reply_to.mid for an escalated query).")
                        # Always return 200 OK for owner messages quickly
                        logging.info("------------------- POST /webhook OWNER MESSAGE PROCESSED -------------------")
                        return "OWNER_MESSAGE_PROCESSED", 200

                    # --- Case 2: Message sent BY A USER to the Page ---
                    elif sender_id != YOUR_FACEBOOK_PAGE_ID and recipient_id == YOUR_FACEBOOK_PAGE_ID:
                        logging.info("Interpreting as USER message to the Page.")
                        if messaging_event.get("message"):
                            message_obj = messaging_event.get("message")
                            user_query_text = message_obj.get("text")
                            customer_message_id = message_obj.get("mid")
                            logging.info(f"User Message Object: {json.dumps(message_obj, indent=2)}")

                            if user_query_text and customer_message_id:
                                logging.info(f"Received query from {sender_id} (UserMID: {customer_message_id}): '{user_query_text}'")

                                # 1. Check Learned Q&A first
                                logging.info("Checking learned Q&A...")
                                learned_answer = find_in_learned_qna(user_query_text)
                                if learned_answer:
                                    logging.info(f"Found in learned Q&A. Replying with: '{learned_answer}'")
                                    send_facebook_message(sender_id, learned_answer)
                                    logging.info("------------------- POST /webhook USER MESSAGE HANDLED (Learned) -------------------")
                                    return "EVENT_RECEIVED_ANSWERED_BY_LEARNED", 200

                                # 2. If not in learned, try RAG with Google Sheet Product Data + Gemini
                                logging.info("Not in learned Q&A. Trying RAG with Google Sheet + Gemini...")
                                rag_context = find_relevant_knowledge_in_sheet(user_query_text) # This function should log if context is found or not
                                
                                if not rag_context:
                                    logging.info(f"No relevant RAG context found for '{user_query_text}'. Preparing to escalate.")
                                    # Set bot_reply to the specific phrase that indicates escalation
                                    bot_reply = "I'm sorry, I don't have that specific information right now."
                                else:
                                    logging.info("RAG context found. Getting Gemini response...")
                                    bot_reply = get_gemini_response(user_query_text, rag_context) # This function logs Gemini's actual response

                                # 3. Check Gemini's response for "I cannot answer" phrase or if no context was found
                                NO_ANSWER_PHRASE_FROM_GEMINI = "I'm sorry, I don't have that specific information right now."
                                logging.info(f"Bot reply before escalation check: '{bot_reply}'")
                                if NO_ANSWER_PHRASE_FROM_GEMINI.lower() in bot_reply.lower() or not rag_context: # Explicitly check rag_context again
                                    logging.info("Escalating to human.")
                                    fallback_message_to_user = "I'm not quite sure how to answer that. Let me get a human expert to help you. We'll reply here as soon as possible!"
                                    send_facebook_message(sender_id, fallback_message_to_user)
                                    notify_owner(sender_id, user_query_text, customer_message_id) # This function logs and stores for learning
                                else:
                                    logging.info("Sending Gemini's successful answer.")
                                    send_facebook_message(sender_id, bot_reply)
                                
                                logging.info("------------------- POST /webhook USER MESSAGE HANDLED (RAG/Escalated) -------------------")
                                return "EVENT_RECEIVED_USER_QUERY_PROCESSED", 200
                            elif message_obj.get("attachments"):
                                logging.info(f"Received message with attachments from user {sender_id}: {json.dumps(message_obj['attachments'], indent=2)}")
                                # Handle attachments (e.g., images) here if you plan to
                                send_facebook_message(sender_id, "I see you sent an attachment, but I can only process text messages right now.")
                                logging.info("------------------- POST /webhook USER ATTACHMENT HANDLED (Placeholder) -------------------")
                                return "EVENT_RECEIVED_USER_ATTACHMENT_PROCESSED", 200
                            else:
                                logging.info(f"Received message from user {sender_id}, but no text or recognized attachments.")
                        else:
                            logging.info(f"Received a messaging event from user {sender_id}, but it's not a 'message' object (e.g., could be a delivery confirmation if subscribed). Event: {json.dumps(messaging_event, indent=2)}")
                    else:
                        logging.warning(f"Unrecognized sender/recipient combination or other event type: sender={sender_id}, recipient={recipient_id}. Event: {json.dumps(messaging_event, indent=2)}")
        else:
            logging.warning(f"Received POST data, but object is not 'page'. Object: {data.get('object')}")
        
        logging.info("------------------- POST /webhook COMPLETED (Default Fallback) -------------------")
        return "EVENT_RECEIVED", 200 # Default acknowledge if no other return hit
    
    return "Unsupported request method", 405

# ... (rest of your app.py: helper functions, if __name__ == '__main__': etc.) ...

# --- Initial Data Load ---
if __name__ == '__main__':
    refresh_knowledge_bases() # Load data when the app starts
    # For local development, you'll use ngrok to expose this port
    # Example: ngrok http 5000
    # Then update Facebook Webhook callback URL with the ngrok URL + /webhook
    app.run(debug=True, port=int(os.getenv("PORT", 5000)))