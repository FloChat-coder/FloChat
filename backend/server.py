import os
import json
import secrets
import psycopg2
import logging
import requests
from flask import Flask, redirect, url_for, session, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timezone
from dateutil import parser 

# Google Libraries
import google.generativeai as genai
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

# --- 1. SETUP ---
load_dotenv()
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')

# Calculate paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, '..', 'frontend')
WEB_DIST = os.path.join(FRONTEND_DIR, 'web', 'dist')
DASH_DIST = os.path.join(FRONTEND_DIR, 'dash', 'dist')
TEMPLATE_DIR = os.path.join(BASE_DIR, 'templates')

app = Flask(__name__, static_folder=None)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev_secret_key_change_in_prod")
CORS(app)

# Allow OAuth over HTTP (Render proxy handles HTTPS)
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

DB_URL = os.getenv("DATABASE_URL")

# --- SMART SECRET FILE FINDER ---
def get_client_secrets_file():
    # Check Render's secret path first
    render_path = "/etc/secrets/client_secret.json"
    if os.path.exists(render_path):
        return render_path
    # Fallback to local (development)
    local_path = os.path.join(BASE_DIR, "client_secret.json")
    if os.path.exists(local_path):
        return local_path
    # Fallback to env var
    return os.getenv("GOOGLE_CLIENT_SECRETS_FILE", "client_secret.json")

CLIENT_SECRETS_FILE = get_client_secrets_file()

SCOPES = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/spreadsheets.readonly',
    'https://www.googleapis.com/auth/drive.readonly',
    'openid'
]

def get_db_connection():
    try:
        return psycopg2.connect(DB_URL)
    except Exception as e:
        logging.error(f"❌ DB Connection Failed: {e}")
        return None

# --- HELPER: DYNAMIC GOOGLE AUTH ---
def get_user_services(client_id):
    conn = get_db_connection()
    if not conn: return None, None
    
    cur = conn.cursor()
    cur.execute("SELECT google_token, google_refresh_token, token_uri, client_id_google, client_secret_google FROM clients WHERE client_id = %s", (client_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    
    if not row: return None, None
    token, refresh_token, token_uri, client_id_google, client_secret_google = row
    
    with open(CLIENT_SECRETS_FILE, 'r') as f:
        c_conf = json.load(f).get('web', {})
        
    creds = Credentials(
        token=token,
        refresh_token=refresh_token,
        token_uri=c_conf.get('token_uri', "https://oauth2.googleapis.com/token"),
        client_id=c_conf.get('client_id'),
        client_secret=c_conf.get('client_secret'),
        scopes=SCOPES
    )

    if creds.expired and creds.refresh_token:
        try:
            creds.refresh(Request())
        except Exception as e:
            logging.error(f"Token Refresh Failed for {client_id}: {e}")
            return None, None

    try:
        sheets_service = build('sheets', 'v4', credentials=creds)
        drive_service = build('drive', 'v3', credentials=creds)
        return sheets_service, drive_service
    except Exception as e:
        logging.error(f"Service Build Failed: {e}")
        return None, None

# --- HELPER: SYNC SHEET ---
def fetch_and_process_sheet(client_id, sheet_id, sheet_range):
    sheets_service, _ = get_user_services(client_id)
    if not sheets_service: return None

    try:
        result = sheets_service.spreadsheets().values().get(
            spreadsheetId=sheet_id, range=sheet_range).execute()
        rows = result.get('values', [])
        if not rows: return "[]"

        headers = [h.strip() for h in rows[0]]
        json_data = []
        for row in rows[1:501]: 
            row_dict = {}
            for i, header in enumerate(headers):
                if i < len(row) and row[i]:
                    row_dict[header] = row[i]
            if row_dict: json_data.append(row_dict)
            
        return json.dumps(json_data, ensure_ascii=False)
    except Exception as e:
        logging.error(f"Sheet Read Error: {e}")
        return None

def sync_knowledge_base(client_id, sheet_id, sheet_range):
    new_content = fetch_and_process_sheet(client_id, sheet_id, sheet_range)
    if new_content is None: return None

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("UPDATE clients SET cached_content = %s, last_synced_at = NOW() WHERE client_id = %s", (new_content, client_id))
    conn.commit()
    cur.close()
    conn.close()
    return new_content

# --- 2. API & AUTH ROUTES (MUST BE DEFINED FIRST) ---

@app.route('/api/chat', methods=['POST'])
def chat():
    # Force JSON parsing (silence 400 error if header is wrong)
    data = request.get_json(force=True, silent=True)
    if not data:
        return jsonify({"reply": "Error: No data sent"}), 400

    client_id = data.get('client_id')
    user_message = data.get('message')
    session_id = data.get('session_id')
    temp_context = data.get('temp_context')

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT business_name, sheet_id, gemini_key, sheet_range, cached_content, last_synced_at, system_instruction 
        FROM clients WHERE client_id = %s
    """, (client_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row: return jsonify({"reply": "Invalid Client ID"})
    
    b_name, sheet_id, gemini_key, sheet_range, cached_content, db_last_synced, sys_instr = row

    # --- KNOWLEDGE BASE SELECTION ---
    if temp_context:
        # 1. Use Data Grid from Website if available
        knowledge_base = json.dumps(temp_context)
        system_note = "IMPORTANT: Answer solely based on the USER PROVIDED DATA GRID below."
    else:
        # 2. Use Google Sheet (Check for updates first)
        need_sync = False
        _, drive_service = get_user_services(client_id)
        
        if drive_service and sheet_id:
            try:
                file_meta = drive_service.files().get(fileId=sheet_id, fields="modifiedTime").execute()
                google_time = parser.parse(file_meta.get('modifiedTime'))
                if db_last_synced is None:
                    need_sync = True
                else:
                    if db_last_synced.tzinfo is None:
                        db_last_synced = db_last_synced.replace(tzinfo=timezone.utc)
                    if google_time > db_last_synced:
                        need_sync = True
            except Exception as e:
                if not cached_content: need_sync = True
        
        if need_sync:
            updated = sync_knowledge_base(client_id, sheet_id, sheet_range)
            if updated: cached_content = updated

        if not cached_content or cached_content == "[]":
            return jsonify({"reply": "I'm not ready yet. Please configure my knowledge base."})
            
        knowledge_base = cached_content
        system_note = "Answer based on your knowledge base."
    # 2. Fetch or Create Chat History
    cur.execute("SELECT messages FROM chat_sessions WHERE session_id = %s", (session_id,))
    session_row = cur.fetchone()
    
    chat_history = []
    if session_row and session_row[0]:
        chat_history = session_row[0] # This is a list of dicts

    # 3. Apply Sliding Window (Keep only the last 6 interactions to save tokens)
    # Gemini expects history in a specific format: {"role": "user"/"model", "parts": ["text"]}
    recent_history = chat_history[-6:] 
    
    # Format history for Gemini SDK
    gemini_history = []
    for msg in recent_history:
        gemini_history.append({
            "role": msg["role"],
            "parts": [msg["content"]]
        })    

    # --- GEMINI CALL ---
    try:
        genai.configure(api_key=gemini_key)
        
        # In Gemini 1.5/2.0, we can pass system instructions directly to the model configuration
        full_system_prompt = f"ROLE: {sys_instr or 'Helpful Assistant'} for {b_name}. {system_note} DATA: {knowledge_base}"
        
        model = genai.GenerativeModel(
            model_name='gemini-2.5-flash',
            system_instruction=full_system_prompt
        )
        
        # Start a chat session with the recent history
        chat = model.start_chat(history=gemini_history)
        response = chat.send_message(user_message)
        bot_reply = response.text
        
        # 5. Save back to Database
        # Append the new interaction to our internal history tracker
        chat_history.append({"role": "user", "content": user_message})
        chat_history.append({"role": "model", "content": bot_reply})
        
        # Upsert into database
        cur.execute("""
            INSERT INTO chat_sessions (session_id, client_id, messages, updated_at)
            VALUES (%s, %s, %s, NOW())
            ON CONFLICT (session_id) 
            DO UPDATE SET messages = EXCLUDED.messages, updated_at = NOW();
        """, (session_id, client_id, json.dumps(chat_history)))
        conn.commit()
        
        return jsonify({"reply": bot_reply})
        
    except Exception as e:
        logging.error(f"AI Error: {str(e)}")
        return jsonify({"reply": f"AI Error: {str(e)}"})
    finally:
        cur.close()
        conn.close()

@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT client_id, password_hash, verified FROM clients WHERE email = %s", (email,))
    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row: return jsonify({"error": "Invalid credentials"}), 401
    client_id, stored_hash, is_verified = row

    if not stored_hash: return jsonify({"error": "Please log in with Google"}), 400
    if not check_password_hash(stored_hash, password): return jsonify({"error": "Invalid credentials"}), 401

    session['client_id'] = client_id
    return jsonify({"message": "Login successful", "redirect": "/dashboard"})

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT client_id FROM clients WHERE email = %s", (email,))
    if cur.fetchone():
        cur.close()
        conn.close()
        return jsonify({"error": "Email already registered"}), 400

    alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    client_id = ''.join(secrets.choice(alphabet) for i in range(5))
    token = secrets.token_urlsafe(32)
    hashed_pw = generate_password_hash(password)

    try:
        cur.execute("""
            INSERT INTO clients (client_id, email, password_hash, verification_token, verified)
            VALUES (%s, %s, %s, %s, FALSE)
        """, (client_id, email, hashed_pw, token))
        conn.commit()
    except Exception as e:
        return jsonify({"error": "Database error"}), 500
    finally:
        cur.close()
        conn.close()

    return jsonify({"message": "Registration successful."})

# --- 3. GOOGLE OAUTH ROUTES ---

@app.route('/login')
def login():
    try:
        if not os.path.exists(CLIENT_SECRETS_FILE):
            return f"Configuration Error: Secret file not found at {CLIENT_SECRETS_FILE}", 500

        flow = Flow.from_client_secrets_file(CLIENT_SECRETS_FILE, scopes=SCOPES)
        flow.redirect_uri = url_for('oauth2callback', _external=True, _scheme='https')
        
        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true')
        
        session['state'] = state
        return redirect(authorization_url)
    except Exception as e:
        logging.error(f"Login Start Error: {e}")
        return f"Error starting login: {e}", 500

@app.route('/login/callback')
def oauth2callback():
    state = session.get('state')
    if not state: return redirect('/login')

    try:
        flow = Flow.from_client_secrets_file(CLIENT_SECRETS_FILE, scopes=SCOPES, state=state)
        flow.redirect_uri = url_for('oauth2callback', _external=True, _scheme='https')

        authorization_response = request.url
        if authorization_response.startswith('http:'):
            authorization_response = authorization_response.replace('http:', 'https:', 1)

        flow.fetch_token(authorization_response=authorization_response)
        creds = flow.credentials
        
        user_info = requests.get(
            'https://www.googleapis.com/oauth2/v1/userinfo', 
            headers={'Authorization': f'Bearer {creds.token}'}).json()
        email = user_info.get('email')

        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT client_id FROM clients WHERE email = %s;", (email,))
        existing_user = cur.fetchone()
        
        with open(CLIENT_SECRETS_FILE, 'r') as f:
            c_conf = json.load(f).get('web', {})

        if existing_user:
            client_id = existing_user[0]
            cur.execute("""
                UPDATE clients 
                SET google_token=%s, google_refresh_token=%s 
                WHERE client_id=%s
            """, (creds.token, creds.refresh_token, client_id))
        else:
            alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
            client_id = ''.join(secrets.choice(alphabet) for i in range(5))
            cur.execute("""
                INSERT INTO clients (client_id, email, google_token, google_refresh_token, token_uri, client_id_google, client_secret_google)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (client_id, email, creds.token, creds.refresh_token, creds.token_uri, c_conf.get('client_id'), c_conf.get('client_secret')))
        
        conn.commit()
        cur.close()
        conn.close()

        session['client_id'] = client_id
        return redirect('/dashboard')
        
    except Exception as e:
        logging.error(f"Callback Error: {e}")
        return f"Authentication failed: {e}", 500

# --- 4. STATIC & FRONTEND SERVING ROUTES ---

@app.route('/static/widget.js')
def serve_widget():
    # Explicitly serve the widget
    return send_from_directory(os.path.join(BASE_DIR, 'static'), 'widget.js')

@app.route('/dashboard/assets/<path:path>')
def serve_dash_assets(path):
    return send_from_directory(os.path.join(DASH_DIST, 'assets'), path)

@app.route('/dashboard')
@app.route('/dashboard/<path:path>')
def serve_dashboard(path=''):
    if 'client_id' not in session:
        return redirect('/login')
    try:
        return send_from_directory(DASH_DIST, path)
    except:
        return send_from_directory(DASH_DIST, 'index.html')

@app.route('/assets/<path:path>')
def serve_web_assets(path):
    return send_from_directory(os.path.join(WEB_DIST, 'assets'), path)

@app.route('/demo')
def demo():
    try:
        return send_from_directory(TEMPLATE_DIR, 'demo_website.html')
    except Exception as e:
        return f"Demo file not found: {e}", 404

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_root(path):
    if path.startswith('api/') or path.startswith('login'):
        return "Not Found", 404
    try:
        return send_from_directory(WEB_DIST, path)
    except:
        return send_from_directory(WEB_DIST, 'index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)