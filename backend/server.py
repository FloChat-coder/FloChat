import os
import json
import secrets
import psycopg2
import logging
import requests
from flask import Flask, redirect, url_for, session, request, jsonify, send_from_directory, make_response
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

# Calculate paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, '..', 'frontend')
WEB_DIST = os.path.join(FRONTEND_DIR, 'web', 'dist')
DASH_DIST = os.path.join(FRONTEND_DIR, 'dash', 'dist')
TEMPLATE_DIR = os.path.join(BASE_DIR, 'templates')

app = Flask(__name__, static_folder=None)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev_secret_key_change_in_prod")
CORS(app)

# Allow OAuth over HTTP (required for Render's internal proxy)
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
DB_URL = os.getenv("DATABASE_URL")

def get_client_secrets_file():
    # Priority 1: Env Var
    env_path = os.getenv("GOOGLE_CLIENT_SECRETS_FILE")
    if env_path and os.path.exists(env_path):
        return env_path
    
    # Priority 2: Render Secret Path
    render_path = "/etc/secrets/client_secret.json"
    if os.path.exists(render_path):
        return render_path
        
    # Priority 3: Local Directory (Default)
    return "client_secret.json"

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

# --- 2. OAUTH ROUTES (FIXED) ---

@app.route('/login')
def login():
    try:
        flow = Flow.from_client_secrets_file(
            CLIENT_SECRETS_FILE, scopes=SCOPES)
        
        # CRITICAL FIX: Force HTTPS for the callback URL
        # Render runs behind a proxy, so we must explicitly say "https"
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
        flow = Flow.from_client_secrets_file(
            CLIENT_SECRETS_FILE, scopes=SCOPES, state=state)
        
        # CRITICAL FIX: Must match the redirect_uri used in /login
        flow.redirect_uri = url_for('oauth2callback', _external=True, _scheme='https')

        authorization_response = request.url
        # Fix http/https mismatch from proxy
        if authorization_response.startswith('http:'):
            authorization_response = authorization_response.replace('http:', 'https:', 1)

        flow.fetch_token(authorization_response=authorization_response)

        creds = flow.credentials
        user_info = requests.get(
            'https://www.googleapis.com/oauth2/v1/userinfo', 
            headers={'Authorization': f'Bearer {creds.token}'}).json()
        email = user_info.get('email')

        # Database Logic
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

# --- 3. FRONTEND SERVING ---

# A. Serve Dashboard Assets
@app.route('/dashboard/assets/<path:path>')
def serve_dash_assets(path):
    return send_from_directory(os.path.join(DASH_DIST, 'assets'), path)

# B. Serve Dashboard Index
@app.route('/dashboard')
@app.route('/dashboard/<path:path>')
def serve_dashboard(path=''):
    if 'client_id' not in session:
        return redirect('/login')
    try:
        return send_from_directory(DASH_DIST, path)
    except:
        return send_from_directory(DASH_DIST, 'index.html')

# C. Serve Web Assets
@app.route('/assets/<path:path>')
def serve_web_assets(path):
    return send_from_directory(os.path.join(WEB_DIST, 'assets'), path)

@app.route('/static/widget.js')
def serve_widget():
    # Serves the JS file from: backend/static/widget.js
    return send_from_directory(os.path.join(BASE_DIR, 'static'), 'widget.js')

# D. Serve Demo Page (FIXED)
@app.route('/demo')
def demo():
    # Looks for demo_website.html in backend/templates/
    try:
        with open(os.path.join(TEMPLATE_DIR, 'demo_website.html'), 'r') as f:
            return f.read()
    except Exception as e:
        return f"Demo file not found: {e}", 404
    

# E. Serve Web Landing Page (Catch-All)
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_root(path):
    if path.startswith('api/') or path.startswith('login'):
        return "Not Found", 404
        
    try:
        return send_from_directory(WEB_DIST, path)
    except:
        return send_from_directory(WEB_DIST, 'index.html')

# --- 4. API & AUTH ROUTES ---

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
    # if not is_verified: return jsonify({"error": "Please verify your email first."}), 403

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
    
    # Check existing
    cur.execute("SELECT client_id FROM clients WHERE email = %s", (email,))
    if cur.fetchone():
        cur.close()
        conn.close()
        return jsonify({"error": "Email already registered"}), 400

    # Create new
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

    # send_verification_email(email, token) # Optional: Enable if SMTP works
    return jsonify({"message": "Registration successful."})

@app.route('/api/chat', methods=['POST'])
def chat():
    # ... (Keep existing chat logic, omitted for brevity but DO NOT DELETE IT) ...
    # Just return a dummy response if you need to test connections
    return jsonify({"reply": "Chat endpoint active"})

if __name__ == '__main__':
    app.run(port=5000, debug=True)