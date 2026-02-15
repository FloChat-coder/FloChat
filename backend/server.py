import os
import json
import secrets
import psycopg2
import logging
import requests
from flask import Flask, redirect, url_for, session, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import smtplib
from email.mime.text import MIMEText
from werkzeug.security import generate_password_hash, check_password_hash

# Google Libraries
import google.generativeai as genai
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

# --- 1. SETUP ---
load_dotenv()
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')

# Calculate paths to the frontend build folders
# ".." means go up one level from 'backend' to the repo root
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, '..', 'frontend')
WEB_DIST = os.path.join(FRONTEND_DIR, 'web', 'dist')
DASH_DIST = os.path.join(FRONTEND_DIR, 'dash', 'dist')

# Initialize Flask (disable default static folder to avoid confusion)
app = Flask(__name__, static_folder=None)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev_secret_key_change_in_prod")
CORS(app)

os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

# Import SMTP
SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

# DATABASE & CONFIG
DB_URL = os.getenv("DATABASE_URL")
CLIENT_SECRETS_FILE = os.getenv("GOOGLE_CLIENT_SECRETS_FILE", "client_secret.json")

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

# --- 2. HELPER: DYNAMIC GOOGLE AUTH ---
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
        client_config = json.load(f)
        config_root = client_config.get('web', client_config.get('installed', {}))
        
    creds = Credentials(
        token=token,
        refresh_token=refresh_token,
        token_uri=config_root.get('token_uri', "https://oauth2.googleapis.com/token"),
        client_id=config_root.get('client_id'),
        client_secret=config_root.get('client_secret'),
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

# --- 3. FRONTEND SERVING ROUTES (NEW) ---

# --- Serve Dashboard (DashDark) ---
@app.route('/dashboard/assets/<path:path>')
def serve_dash_assets(path):
    return send_from_directory(os.path.join(DASH_DIST, 'assets'), path)

# B. Serve Dashboard Index
@app.route('/dashboard')
@app.route('/dashboard/<path:path>')
def serve_dashboard(path=''):
    if 'client_id' not in session:
        return redirect('/login')
    # If it's a file request (like favicon.ico in dashboard root), try to serve it
    try:
        return send_from_directory(DASH_DIST, path)
    except:
        # Otherwise serve index.html for React Router
        return send_from_directory(DASH_DIST, 'index.html')

# C. Serve Web Assets (e.g. /assets/style.css)
@app.route('/assets/<path:path>')
def serve_web_assets(path):
    return send_from_directory(os.path.join(WEB_DIST, 'assets'), path)

# D. Serve Web Landing Page
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_root(path):
    # Don't block API or Auth
    if path.startswith('api/') or path.startswith('login'):
        return "Not Found", 404
        
    try:
        return send_from_directory(WEB_DIST, path)
    except:
        return send_from_directory(WEB_DIST, 'index.html')

# --- 4. OAUTH & API ROUTES (Keep Existing Logic) ---

@app.route('/login')
def login():
    flow = Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE, scopes=SCOPES)
    flow.redirect_uri = url_for('oauth2callback', _external=True)
    
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true')
    
    session['state'] = state
    return redirect(authorization_url)

@app.route('/login/callback')
def oauth2callback():
    state = session['state']
    flow = Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE, scopes=SCOPES, state=state)
    flow.redirect_uri = url_for('oauth2callback', _external=True)

    authorization_response = request.url
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

def send_verification_email(user_email, token):
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        logging.error("❌ SMTP Credentials missing.")
        return

    verify_url = url_for('verify_email', token=token, _external=True)
    msg = MIMEText(f"Welcome to FloChat! Verify here: {verify_url}")
    msg['Subject'] = "Verify your FloChat Account"
    msg['From'] = SMTP_EMAIL
    msg['To'] = user_email

    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.send_message(msg)
    except Exception as e:
        logging.error(f"❌ Email Failed: {e}")

@app.route('/api/update_settings', methods=['POST'])
def update_settings():
    if 'client_id' not in session: return "Unauthorized", 401
    
    c_id = session['client_id']
    sheet_id = request.form.get('sheet_id')
    gemini_key = request.form.get('gemini_key')
    sys_instr = request.form.get('system_instruction')
    b_name = request.form.get('business_name')
    
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        UPDATE clients 
        SET sheet_id=%s, gemini_key=%s, system_instruction=%s, business_name=%s
        WHERE client_id=%s
    """, (sheet_id, gemini_key, sys_instr, b_name, c_id))
    conn.commit()
    cur.close()
    conn.close()
    
    sync_knowledge_base(c_id, sheet_id, "Sheet1!A1:Z100")
    return jsonify({"status": "success", "message": "Settings Saved"})

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

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    client_id = data.get('client_id')
    user_message = data.get('message')

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

    try:
        genai.configure(api_key=gemini_key)
        model = genai.GenerativeModel('gemini-2.5-flash')
        prompt = f"ROLE: {sys_instr or 'Helpful Assistant'} for {b_name}. GOAL: Answer using ONLY the JSON below. DATA: {cached_content} USER: {user_message}"
        response = model.generate_content(prompt)
        return jsonify({"reply": response.text})
    except Exception as e:
        return jsonify({"reply": "AI Error. Check API Key."})

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
        logging.error(f"Register DB Error: {e}")
        return jsonify({"error": "Database error"}), 500
    finally:
        cur.close()
        conn.close()

    send_verification_email(email, token)
    return jsonify({"message": "Registration successful. Please check your email."})

@app.route('/api/verify')
def verify_email():
    token = request.args.get('token')
    if not token: return "Missing token", 400

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT client_id FROM clients WHERE verification_token = %s", (token,))
    row = cur.fetchone()
    
    if not row:
        cur.close()
        conn.close()
        return "Invalid or expired token.", 400

    client_id = row[0]
    cur.execute("UPDATE clients SET verified = TRUE, verification_token = NULL WHERE client_id = %s", (client_id,))
    conn.commit()
    cur.close()
    conn.close()

    session['client_id'] = client_id
    return redirect('/dashboard')

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
    if not is_verified: return jsonify({"error": "Please verify your email first."}), 403

    session['client_id'] = client_id
    return jsonify({"message": "Login successful", "redirect": "/dashboard"})

if __name__ == '__main__':
    print("🚀 OAuth Server Running on http://127.0.0.1:5000")
    app.run(port=5000, debug=True)