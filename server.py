import os
import logging
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import google.generativeai as genai
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build

# --- 1. SETUP ---
load_dotenv()
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')

app = Flask(__name__)
CORS(app)

# CLOUD-READY CREDENTIALS LOGIC
# If we are on the cloud, we read the JSON from a text variable.
# If we are local, we read from the file.
google_creds_json = os.getenv("GOOGLE_CREDENTIALS_JSON")

if google_creds_json:
    # We are in the cloud!
    creds_dict = json.loads(google_creds_json)
    creds = Credentials.from_service_account_info(creds_dict)
else:
    # We are local!
    service_account_file = os.getenv("SERVICE_ACCOUNT_FILE")
    creds = Credentials.from_service_account_file(service_account_file)

sheets_service = build('sheets', 'v4', credentials=creds)

# --- 2. THE MOCK DATABASE (Replace this with Supabase later) ---
# This simulates 2 different customers paying for your software.
CLIENTS_DB = {
    "demo_client_1": {
        "business_name": "My BBQ Shop",
        "sheet_id": os.getenv("GOOGLE_SPREADSHEET_ID"), # Your current BBQ sheet
        "gemini_key": os.getenv("GEMINI_API_KEY"),      # Your current Key
        "sheet_range": "Sheet1!A1:D100"               # Assuming tab name is 'Products'
    },
    "demo_client_2": {
        "business_name": "Tech Gadget Store",
        "sheet_id": "1pIYyrHO56RefNGbakd4Ae36Sxc_tYc3fSh4SNdy_sDs", # Create a dummy sheet to test!
        "gemini_key": os.getenv("GEMINI_API_KEY"),      # Can use same key for testing
        "sheet_range": "Sheet1!A1:D20"
    }
}

# --- 3. HELPER FUNCTIONS ---

def get_sheet_data(sheet_id, range_name):
    """Fetches data from a specific client's sheet"""
    try:
        result = sheets_service.spreadsheets().values().get(
            spreadsheetId=sheet_id, range=range_name).execute()
        rows = result.get('values', [])
        return rows
    except Exception as e:
        logging.error(f"Sheet Error: {e}")
        return []

def format_knowledge_base(rows):
    """Turns raw rows into a string for the AI"""
    if not rows: return "No products found."
    
    headers = [h.lower() for h in rows[0]]
    text_corpus = ""
    
    for row in rows[1:]:
        item_parts = []
        for i, cell in enumerate(row):
            if i < len(headers):
                item_parts.append(f"{headers[i]}: {cell}")
        text_corpus += " | ".join(item_parts) + "\n"
    
    return text_corpus

# --- 4. THE MULTI-TENANT API ---
@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get('message', '')
    client_id = data.get('client_id', '') # <--- CRITICAL NEW FIELD

    # 1. Validate the Client
    client_config = CLIENTS_DB.get(client_id)
    if not client_config:
        return jsonify({"reply": "Error: Invalid Client ID. Who are you?"})

    # 2. Configure the Brain (Use the CLIENT'S Key)
    try:
        genai.configure(api_key=client_config['gemini_key'])
        # Use the model that worked for you
        model = genai.GenerativeModel('gemini-2.5-flash') 
    except Exception as e:
        return jsonify({"reply": "Configuration Error. Check API Key."})

    # 3. Fetch the Client's Data (Real-time RAG)
    # Note: In production, we would cache this so we don't hit Google Sheets every time.
    raw_rows = get_sheet_data(client_config['sheet_id'], client_config['sheet_range'])
    knowledge_base = format_knowledge_base(raw_rows)

    # 4. Ask the AI
    system_prompt = f"""
    ROLE: You are an enthusiastic and helpful sales expert for {client_config['business_name']}.
    GOAL: Answer the customer's question using ONLY the provided product data.
    
    RULES:
    1. TONE: Be friendly, concise, and professional. Use emojis sparingly.
    2. DATA: If the exact answer is in the DATA, use it.
    3. HONESTY: If the answer is NOT in the DATA, do not make it up. Instead, say: "I don't have that specific detail handy, but I can ask a human to follow up!"
    4. FORMAT: Use bullet points for lists. Mention prices clearly (e.g., "$9.99").
    
    DATA (Inventory):
    {knowledge_base}
    
    Current Conversation:
    User: {user_message}
    """

    try:
        # We lower the temperature to 0.3 to make it less creative (less hallucination)
        generation_config = genai.types.GenerationConfig(temperature=0.3)
        
        response = model.generate_content(
            system_prompt, 
            generation_config=generation_config
        )
        return jsonify({"reply": response.text})
    except Exception as e:
        logging.error(e)
        return jsonify({"reply": "My brain is tired (API Limit or Error)."})

if __name__ == '__main__':
    app.run(port=5000, debug=True)