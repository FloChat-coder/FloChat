import os
import psycopg2
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
DB_URL = os.getenv("DATABASE_URL")

def get_db_connection():
    conn = psycopg2.connect(DB_URL)
    return conn

def get_client_config(client_id):
    """
    Fetches client credentials from real SQL database.
    """
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # SQL Query: Securely fetch the client
        query = "SELECT business_name, sheet_id, gemini_key, sheet_range FROM clients WHERE client_id = %s;"
        cur.execute(query, (client_id,))
        row = cur.fetchone()
        
        cur.close()
        
        if row:
            return {
                "business_name": row[0],
                "sheet_id": row[1],
                "gemini_key": row[2],
                "sheet_range": row[3]
            }
        return None
        
    except Exception as e:
        print(f"Database Error: {e}")
        return None
    finally:
        if conn:
            conn.close()

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
    client_config = get_client_config(client_id)
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