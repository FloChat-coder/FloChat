import os
import secrets
import string
import psycopg2
import logging
import time
import json
from datetime import datetime, timezone
from dateutil import parser  # You may need to: pip install python-dateutil
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

# --- 2. GOOGLE SERVICES (Sheets + Drive) ---
SERVICE_ACCOUNT_FILE = os.getenv("SERVICE_ACCOUNT_FILE")
DEFAULT_GEMINI_KEY = os.getenv("GEMINI_API_KEY") # Fallback for testing
# Using the Supabase Transaction Pooler URL (IPv4 compatible)
DB_URL = os.getenv("DATABASE_URL")

if not SERVICE_ACCOUNT_FILE or not os.path.exists(SERVICE_ACCOUNT_FILE):
    logging.error("CRITICAL: Service Account File not found.")
    exit(1)

try:
    creds = Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE)
    # We need BOTH Sheets (for data) and Drive (for metadata/modifiedTime)
    sheets_service = build('sheets', 'v4', credentials=creds)
    drive_service = build('drive', 'v3', credentials=creds)
    logging.info("✅ Google Services Connected")
except Exception as e:
    logging.error(f"❌ Google Auth Failed: {e}")
    exit(1)

def get_db_connection():
    try:
        return psycopg2.connect(DB_URL)
    except Exception as e:
        logging.error(f"❌ DB Connection Failed: {e}")
        return None

# --- 3. THE SMART SYNC ENGINE ---

def fetch_and_process_sheet(sheet_id, sheet_range):
    """
    Reads the Google Sheet and converts it into a clean JSON string.
    """
    try:
        result = sheets_service.spreadsheets().values().get(
            spreadsheetId=sheet_id, range=sheet_range).execute()
        rows = result.get('values', [])
        
        if not rows: return "[]" # Return empty JSON array

        # 1. Extract Headers (Keys)
        headers = [h.strip() for h in rows[0]]
        
        # 2. Build List of Dictionaries
        json_data = []
        
        # SLICING LIMIT: 500 Rows Max to keep JSON manageable
        data_rows = rows[1:501] 
        
        for row in data_rows:
            # Zip headers with cells to create a dictionary for this row
            # We use a comprehensive dict comprehension to handle missing cells safely
            row_dict = {}
            for i, header in enumerate(headers):
                if i < len(row) and row[i]: # Only add if cell has data
                    row_dict[header] = row[i]
            
            if row_dict: # Only add if the row wasn't empty
                json_data.append(row_dict)
        
        # 3. Convert to String (ensure_ascii=False keeps special chars like £, €, etc.)
        return json.dumps(json_data, ensure_ascii=False)
        
    except Exception as e:
        logging.error(f"Sheet Processing Error: {e}")
        return None

def sync_knowledge_base(client_id, sheet_id, sheet_range):
    """
    1. Fetches fresh data from Google Sheets.
    2. Updates Supabase 'cached_content' and 'last_synced_at'.
    3. Returns the new content.
    """
    logging.info(f"🔄 SYNC TRIGGERED for Client: {client_id}")
    
    new_content = fetch_and_process_sheet(sheet_id, sheet_range)
    if new_content is None:
        return None # Sync failed, keep old data if possible

    conn = get_db_connection()
    if conn:
        try:
            cur = conn.cursor()
            query = """
                UPDATE clients 
                SET cached_content = %s, last_synced_at = NOW() 
                WHERE client_id = %s;
            """
            cur.execute(query, (new_content, client_id))
            conn.commit()
            cur.close()
            conn.close()
            logging.info(f"✅ Database Cache Updated for {client_id}")
        except Exception as e:
            logging.error(f"❌ DB Update Failed: {e}")
            if conn: conn.close()
    
    return new_content

# --- 4. API ENDPOINTS ---

@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.json
        business_name = data.get('business_name')
        gemini_key = data.get('gemini_key') or DEFAULT_GEMINI_KEY
        sheet_id = data.get('sheet_id') 
        sheet_range = "Sheet1!A1:Z100"

        if not business_name or not sheet_id:
            return jsonify({"status": "error", "message": "Name and Sheet ID required."}), 400

        conn = get_db_connection()
        cur = conn.cursor()

        # Generate unique ID
        while True:
            new_client_id = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(5))
            cur.execute("SELECT client_id FROM clients WHERE client_id = %s;", (new_client_id,))
            if not cur.fetchone():
                break 

        # Insert User (Cache starts empty)
        insert_query = """
            INSERT INTO clients (client_id, business_name, sheet_id, gemini_key, sheet_range)
            VALUES (%s, %s, %s, %s, %s);
        """
        cur.execute(insert_query, (new_client_id, business_name, sheet_id, gemini_key, sheet_range))
        conn.commit()
        cur.close()
        conn.close()

        # 🔥 IMMEDIATE SYNC: Populate cache so bot works instantly
        sync_knowledge_base(new_client_id, sheet_id, sheet_range)
        
        return jsonify({
            "status": "success", 
            "message": "Account created & Synced!", 
            "client_id": new_client_id 
        })

    except Exception as e:
        logging.error(f"Registration Error: {e}")
        return jsonify({"status": "error", "message": "Server Error"}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    client_id = data.get('client_id')
    user_message = data.get('message')

    # 1. FETCH CLIENT CONFIG + CACHE METADATA
    conn = get_db_connection()
    if not conn: return jsonify({"reply": "Database Error"})
    
    cur = conn.cursor()
    cur.execute("""
        SELECT business_name, sheet_id, gemini_key, sheet_range, cached_content, last_synced_at 
        FROM clients WHERE client_id = %s;
    """, (client_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row:
        return jsonify({"reply": "Invalid Client ID."})

    business_name, sheet_id, gemini_key, sheet_range, cached_content, db_last_synced = row

    # 2. THE SMART SYNC CHECK (Metadata API)
    # We check if the Google Sheet has been touched since our last sync
    need_sync = False
    
    try:
        # Fetch Google File Metadata (Lightweight call)
        file_meta = drive_service.files().get(fileId=sheet_id, fields="modifiedTime").execute()
        google_modified_time_str = file_meta.get('modifiedTime') # e.g. '2023-10-01T12:00:00.000Z'
        
        # Parse Dates
        google_time = parser.parse(google_modified_time_str)
        
        if db_last_synced is None:
            logging.info("reason: Cache is empty")
            need_sync = True
        else:
            # Ensure DB time is timezone-aware for comparison
            if db_last_synced.tzinfo is None:
                db_last_synced = db_last_synced.replace(tzinfo=timezone.utc)
            
            if google_time > db_last_synced:
                logging.info(f"reason: Sheet modified at {google_time} > Last Sync {db_last_synced}")
                need_sync = True
                
    except Exception as e:
        logging.warning(f"Drive API Check Failed (using cache): {e}")
        # If check fails, fallback to cache unless empty
        if not cached_content: need_sync = True

    # 3. SYNC IF NEEDED
    knowledge_base = cached_content
    if need_sync:
        updated_text = sync_knowledge_base(client_id, sheet_id, sheet_range)
        if updated_text:
            knowledge_base = updated_text

    # 4. GEMINI INFERENCE (Context Stuffing)
    if not knowledge_base or knowledge_base == "[]":
        return jsonify({"reply": "My brain is empty! Please add data to your Google Sheet."})

    try:
        genai.configure(api_key=gemini_key)
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        # NEW PROMPT STRATEGY: JSON RAG
        system_prompt = f"""
        ROLE: You are an enthusiastic sales agent for {business_name}.
        GOAL: Answer the user's question using ONLY the provided JSON dataset.
        
        INSTRUCTIONS:
        1. Search the JSON below for the answer.
        2. If the user asks about a specific item, look for matching keys/values.
        3. Format your answer nicely (don't just dump the JSON). Use bullet points.
        4. If the answer is not in the JSON, say "I don't have that info."
        
        DATA (JSON):
        {knowledge_base}
        
        USER: {user_message}
        """
        
        response = model.generate_content(system_prompt)
        return jsonify({"reply": response.text})
        
    except Exception as e:
        logging.error(f"Gemini Error: {e}")
        return jsonify({"reply": "I'm having a connection issue. Please try again."})

if __name__ == '__main__':
    print("🚀 Smart-Cache Server Running on http://127.0.0.1:5000")
    app.run(port=5000, debug=True)
