import os
import json
import secrets
import psycopg2
import logging
import requests
import google.generativeai as genai

from flask import Flask, redirect, url_for, session, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

# Google Libraries
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

# Google Config
GOOGLE_CLIENT_SECRET_FILE = os.path.join(BASE_DIR, 'client_secret.json')
SCOPES = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/spreadsheets.readonly',
    'https://www.googleapis.com/auth/drive.readonly'
]

# Database Config
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_NAME = os.getenv("DB_NAME", "flochat")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "password")

# --- 2. DATABASE HELPER ---
def get_db_connection():
    conn = psycopg2.connect(host=DB_HOST, database=DB_NAME, user=DB_USER, password=DB_PASS)
    return conn

# --- 3. HELPER FUNCTIONS ---

def credentials_to_dict(credentials):
    return {
        'token': credentials.token,
        'refresh_token': credentials.refresh_token,
        'token_uri': credentials.token_uri,
        'client_id': credentials.client_id,
        'client_secret': credentials.client_secret,
        'scopes': credentials.scopes
    }

def get_google_creds(user_id):
    """Retreives and refreshes Google Credentials for a user from DB"""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT google_token FROM users WHERE id = %s", (user_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row or not row[0]:
        return None

    token_data = json.loads(row[0])
    creds = Credentials(**token_data)

    if creds.expired and creds.refresh_token:
        try:
            creds.refresh(Request())
            # Update DB with new token
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("UPDATE users SET google_token = %s WHERE id = %s", 
                        (json.dumps(credentials_to_dict(creds)), user_id))
            conn.commit()
            cur.close()
            conn.close()
        except Exception as e:
            logging.error(f"Failed to refresh token: {e}")
            return None
    return creds

def get_sheet_data(creds, spreadsheet_id):
    """Fetches all data from the first sheet"""
    try:
        service = build('sheets', 'v4', credentials=creds)
        sheet = service.spreadsheets()
        # Fetch spreadsheet metadata to get the first sheet's title
        spreadsheet = sheet.get(spreadsheetId=spreadsheet_id).execute()
        first_sheet_title = spreadsheet['sheets'][0]['properties']['title']
        
        # Fetch values
        result = sheet.values().get(spreadsheetId=spreadsheet_id, range=first_sheet_title).execute()
        rows = result.get('values', [])
        
        # Simple serialization: Join rows with newlines
        context_text = ""
        for row in rows:
            context_text += ", ".join([str(item) for item in row]) + "\n"
            
        return context_text
    except Exception as e:
        logging.error(f"Error fetching sheet data: {e}")
        return ""

# --- 4. API ROUTES (CHAT & CONFIG) ---

@app.route('/api/chat', methods=['POST'])
def chat():
    """Core Chat Endpoint used by the Widget"""
    data = request.json
    user_message = data.get('message')
    widget_id = data.get('clientId') # In this SaaS, clientId is the user_id

    if not user_message or not widget_id:
        return jsonify({'error': 'Missing data'}), 400

    conn = get_db_connection()
    cur = conn.cursor()
    
    # Fetch User Configuration
    cur.execute("SELECT sheet_id, system_prompt, openai_key FROM users WHERE id = %s", (widget_id,))
    user_config = cur.fetchone()
    cur.close()
    conn.close()

    if not user_config:
        return jsonify({'error': 'Widget not found'}), 404

    sheet_id, system_prompt, api_key = user_config

    if not api_key:
        return jsonify({'error': 'AI Provider not configured'}), 500

    # 1. Fetch Context (RAG)
    context = ""
    if sheet_id:
        creds = get_google_creds(widget_id)
        if creds:
            context = get_sheet_data(creds, sheet_id)
            # Limit context size roughly
            context = context[:30000] 

    # 2. Prepare Gemini
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-pro')
        
        full_prompt = f"""
        {system_prompt or 'You are a helpful assistant. You will be asked questions from the user. '
        'Use the provided knowledge base to answer the question. If the context does not contain the answer, say you don''t know. '
        'The column names signify the type of data in the column. For example, if a column is named "Revenue", it contains revenue data. '
        'If a column is named "Product Name", ''it contains product names.'}
        
        Here is the knowledge base you should use to answer user queries:
        ---
        {context}
        ---
        
        User Query: {user_message}
        """
        
        response = model.generate_content(full_prompt)
        return jsonify({'response': response.text})
    
    except Exception as e:
        logging.error(f"AI Generation Error: {e}")
        return jsonify({'error': 'Failed to generate response'}), 500


@app.route('/api/save-config', methods=['POST'])
def save_config():
    """Saves Settings from the Dashboard"""
    if 'client_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
        
    data = request.json
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Update logic
    if 'sheetUrl' in data:
        # Extract ID from URL for simplicity
        sheet_url = data['sheetUrl']
        sheet_id = sheet_url.split('/d/')[1].split('/')[0] if '/d/' in sheet_url else sheet_url
        cur.execute("UPDATE users SET sheet_id = %s WHERE id = %s", (sheet_id, session['client_id']))
        
    if 'systemPrompt' in data:
        cur.execute("UPDATE users SET system_prompt = %s WHERE id = %s", (data['systemPrompt'], session['client_id']))
        
    if 'apiKey' in data:
         cur.execute("UPDATE users SET openai_key = %s WHERE id = %s", (data['apiKey'], session['client_id']))

    conn.commit()
    cur.close()
    conn.close()
    
    return jsonify({'status': 'success'})

# --- 5. AUTH ROUTES (Google) ---

@app.route('/api/auth/google')
def google_auth():
    """Initiates Google OAuth Flow"""
    if 'client_id' not in session:
         return jsonify({'error': 'Please log in to the dashboard first'}), 401

    flow = Flow.from_client_secrets_file(
        GOOGLE_CLIENT_SECRET_FILE, 
        scopes=SCOPES,
        # ADD _scheme='https' here:
        redirect_uri=url_for('google_auth_callback', _external=True, _scheme='https')
    )
    
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true'
    )
    session['google_state'] = state
    return redirect(authorization_url)

@app.route('/api/auth/google/callback')
def google_auth_callback():
    """Handles Google OAuth Callback"""
    state = session.get('google_state')
    
    flow = Flow.from_client_secrets_file(
        GOOGLE_CLIENT_SECRET_FILE, 
        scopes=SCOPES, 
        state=state,
        redirect_uri=url_for('google_auth_callback', _external=True, _scheme='https')
    )
    
    flow.fetch_token(authorization_response=request.url)
    credentials = flow.credentials
    
    # Save credentials to DB linked to the logged-in user
    creds_json = json.dumps(credentials_to_dict(credentials))
    
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("UPDATE users SET google_token = %s WHERE id = %s", (creds_json, session['client_id']))
    conn.commit()
    cur.close()
    conn.close()
    
    return redirect('/dashboard/integrations/google-sheets')

# --- 6. STATIC SERVING ROUTES (Merged from your file) ---

# Serve Widget (Allow CORS)
@app.route('/static/widget.js')
def serve_widget_js():
    return send_from_directory(os.path.join(BASE_DIR, 'static'), 'widget.js')

# Serve Dashboard Assets
@app.route('/dashboard/assets/<path:path>')
def serve_dash_assets(path):
    return send_from_directory(os.path.join(DASH_DIST, 'assets'), path)

# Serve Dashboard Index - Handles all dashboard routes
@app.route('/dashboard', defaults={'path': ''})
@app.route('/dashboard/<path:path>')
def serve_dashboard(path):
    # In a real app, you might check session here, 
    # but for now we let the frontend handle the redirect if not logged in
    # OR we implement a simple session check:
    # if 'client_id' not in session and path != 'login':
    #     return redirect('/login') 
    
    # Serve index.html for any dashboard route (SPA support)
    return send_from_directory(DASH_DIST, 'index.html')

# Serve Web Assets
@app.route('/assets/<path:path>')
def serve_web_assets(path):
    return send_from_directory(os.path.join(WEB_DIST, 'assets'), path)

# Serve Demo Page
@app.route('/demo')
def demo():
    try:
        return send_from_directory(TEMPLATE_DIR, 'demo_website.html')
    except Exception as e:
        return f"Demo file not found: {e}", 404

# Serve Web Landing Page (Catch-All - MUST BE LAST)
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_root(path):
    try:
        # Try to serve file if it exists (e.g. robots.txt)
        return send_from_directory(WEB_DIST, path)
    except:
        # Otherwise serve index.html for SPA
        return send_from_directory(WEB_DIST, 'index.html')

# --- 7. RUNNER ---
if __name__ == '__main__':
    # Ensure client_secret.json exists
    if not os.path.exists(GOOGLE_CLIENT_SECRET_FILE):
        logging.warning("⚠️  client_secret.json not found! Google Auth will fail.")
        
    app.run(host='0.0.0.0', port=5000, debug=True)