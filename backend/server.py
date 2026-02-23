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
# SMTP Email
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Universal LLM Router
import litellm 
from litellm import completion, token_counter, get_max_tokens

# Google Libraries (Kept for Drive/Sheets sync)
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
    render_path = "/etc/secrets/client_secret.json"
    if os.path.exists(render_path):
        return render_path
    local_path = os.path.join(BASE_DIR, "client_secret.json")
    if os.path.exists(local_path):
        return local_path
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

# --- 2. API & AUTH ROUTES ---

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json(force=True, silent=True)
    if not data:
        return jsonify({"reply": "Error: No data sent"}), 400

    client_id = data.get('client_id')
    user_message = data.get('message')
    session_id = data.get('session_id')
    temp_context = data.get('temp_context')

    conn = get_db_connection()
    if not conn:
        return jsonify({"reply": "Database connection failed"}), 500
        
    cur = conn.cursor()

    try:
        # 1. Get Client Data
        cur.execute("""
            SELECT business_name, sheet_id, api_key, ai_provider, model_name, sheet_range, cached_content, last_synced_at, system_instruction 
            FROM clients WHERE client_id = %s
        """, (client_id,))
        row = cur.fetchone()

        if not row: 
            return jsonify({"reply": "Invalid Client ID"})
        
        b_name, sheet_id, api_key, ai_provider, model_name, sheet_range, cached_content, db_last_synced, sys_instr = row

        if not api_key or not model_name:
            return jsonify({"reply": "AI Provider not configured. Please add your API key in the dashboard."})

        # --- KNOWLEDGE BASE SELECTION ---
        if temp_context:
            knowledge_base = json.dumps(temp_context)
            system_note = "IMPORTANT: Answer solely based on the USER PROVIDED DATA GRID below."
        else:
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
            system_note = "CRITICAL INSTRUCTION: You will answer greetings but " \
            "if the question is about a product you MUST answer based STRICTLY on " \
            "the DATA provided above. If the exact answer is not present in the DATA, " \
            "do not guess, do not apologize, and do not explain yourself. Instead, you " \
            "MUST output exactly and only this string: [HANDOFF_REQUIRED]"

        # 2. Fetch or Create Chat History
        chat_history = []
        if session_id:
            cur.execute("SELECT messages FROM chat_sessions WHERE session_id = %s", (session_id,))
            session_row = cur.fetchone()
            if session_row and session_row[0]:
                chat_history = session_row[0]

        # 3. Apply Sliding Window 
        recent_history = chat_history[-6:] 
        
        # 4. Format messages for LiteLLM
        full_system_prompt = f"ROLE: {sys_instr or 'Helpful Assistant'} for {b_name}.\n\nDATA:\n{knowledge_base}\n\n{system_note}"
        
        llm_messages = [{"role": "system", "content": full_system_prompt}]
        for msg in recent_history:
            # map 'model' role back to standard 'assistant'
            role = "assistant" if msg["role"] == "model" else msg["role"]
            llm_messages.append({"role": role, "content": msg["content"]})
            
        llm_messages.append({"role": "user", "content": user_message})

        # 5. Token Limit Check (Protects smaller context models)
        try:
            tokens = token_counter(model=model_name, messages=llm_messages)
            max_tokens = get_max_tokens(model_name)
            
            # If we don't know the max, default to a safe 8k
            if max_tokens is None: max_tokens = 8000 
            
            if tokens > max_tokens:
                return jsonify({"reply": f"Warning: Your knowledge base is too large for the selected model ({model_name}). It uses {tokens} tokens but the limit is {max_tokens}. Please reduce your sheet size or upgrade to a model with a larger context window (like gemini-2.5-flash or claude-3.5-sonnet)."})
        except Exception as e:
            logging.warning(f"Could not calculate tokens for {model_name}: {e}")

        # 6. LITELLM API CALL
        try:
            response = completion(
                model=model_name,
                messages=llm_messages,
                api_key=api_key
            )
            bot_reply = response.choices[0].message.content
            if "[HANDOFF_REQUIRED]" in bot_reply.lower():
                return jsonify({
                    "handoff": True, 
                    "reply": "I'm sorry, I don't have the exact information for that right now. I will escalate this to a human representative."
                })
        except Exception as e:
            logging.error(f"LiteLLM Error: {str(e)}")
            return jsonify({"reply": f"AI Provider Error: {str(e)}"}), 500
        
        # 7. Save back to Database
        if session_id:
            chat_history.append({"role": "user", "content": user_message})
            chat_history.append({"role": "model", "content": bot_reply})
            
            cur.execute("""
                INSERT INTO chat_sessions (session_id, client_id, messages, updated_at)
                VALUES (%s, %s, %s, NOW())
                ON CONFLICT (session_id) 
                DO UPDATE SET messages = EXCLUDED.messages, updated_at = NOW();
            """, (session_id, client_id, json.dumps(chat_history)))
            conn.commit()
        
        return jsonify({"reply": bot_reply})

    except Exception as e:
        logging.error(f"Chat Error: {str(e)}")
        return jsonify({"reply": f"Internal Error: {str(e)}"})
        
    finally:
        cur.close()
        conn.close()

# AI Human Handoff
@app.route('/api/handoff/request', methods=['POST'])
def request_handoff():
    data = request.json
    client_id = data.get('client_id')
    email = data.get('email')
    question = data.get('question')
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # 1. Fetch pending clusters for this client
        cur.execute("SELECT id, combined_question FROM handoff_clusters WHERE client_id = %s AND status = 'pending'", (client_id,))
        pending_clusters = cur.fetchall()
        
        assigned_cluster_id = None
        combined_q = question
        
        # 2. Ask LLM to cluster the question
        if pending_clusters:
            cur.execute("SELECT api_key, model_name FROM clients WHERE client_id = %s", (client_id,))
            client_config = cur.fetchone()
            
            if client_config and client_config[0]:
                cluster_prompt = f"""
                Existing Unanswered Questions: {[{'id': c[0], 'question': c[1]} for c in pending_clusters]}
                New Question: "{question}"
                
                If the new question is semantically identical or a direct variation of an existing question, return the ID of that existing question and provide a new 'combined_question' that merges their details (e.g., if existing is "red?" and new is "black?", combined is "red, black?").
                If it is a completely new topic, return id: null.
                Respond strictly in JSON format: {{"cluster_id": id_or_null, "combined_question": "string"}}
                """
                
                try:
                    res = completion(
                        model=client_config[1],
                        messages=[{"role": "user", "content": cluster_prompt}],
                        api_key=client_config[0],
                        response_format={"type": "json_object"}
                    )
                    clustering_result = json.loads(res.choices[0].message.content)
                    assigned_cluster_id = clustering_result.get('cluster_id')
                    if clustering_result.get('combined_question'):
                        combined_q = clustering_result.get('combined_question')
                except Exception as e:
                    logging.error(f"Clustering failed: {e}")

        # 3. Insert or Update DB
        if assigned_cluster_id:
            cur.execute("UPDATE handoff_clusters SET combined_question = %s, updated_at = NOW() WHERE id = %s", (combined_q, assigned_cluster_id))
        else:
            cur.execute("INSERT INTO handoff_clusters (client_id, combined_question) VALUES (%s, %s) RETURNING id", (client_id, question))
            assigned_cluster_id = cur.fetchone()[0]
            
        cur.execute("INSERT INTO handoff_users (cluster_id, user_email, original_question) VALUES (%s, %s, %s)", (assigned_cluster_id, email, question))
        conn.commit()
        return jsonify({"success": True})
        
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

@app.route('/api/handoff/inbox', methods=['GET'])
def get_inbox():
    if 'client_id' not in session: return jsonify({"error": "Unauthorized"}), 401
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT c.id, c.combined_question, c.created_at, COUNT(u.id) as user_count 
        FROM handoff_clusters c 
        LEFT JOIN handoff_users u ON c.id = u.cluster_id 
        WHERE c.client_id = %s AND c.status = 'pending'
        GROUP BY c.id ORDER BY c.created_at DESC
    """, (session['client_id'],))
    
    results = [{"id": r[0], "question": r[1], "date": r[2], "users": r[3]} for r in cur.fetchall()]
    cur.close()
    conn.close()
    return jsonify(results)

@app.route('/api/handoff/resolve', methods=['POST'])
def resolve_handoff():
    # 1. Initialize variables outside the try block so they always exist
    conn = None
    cur = None
    
    try:
        # 2. Check Auth
        if 'client_id' not in session: 
            return jsonify({"error": "Unauthorized"}), 401
        
        data = request.get_json(force=True, silent=True) or {}
        cluster_id = data.get('cluster_id')
        answer = data.get('answer')
        
        if not cluster_id or not answer:
            return jsonify({"error": "Missing cluster_id or answer"}), 400
        
        # 3. Database Connection & Updates
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
            
        cur = conn.cursor()
        cur.execute("UPDATE handoff_clusters SET status = 'resolved', answer = %s WHERE id = %s AND client_id = %s", (answer, cluster_id, session['client_id']))
        cur.execute("SELECT user_email, original_question FROM handoff_users WHERE cluster_id = %s", (cluster_id,))
        users = cur.fetchall()
        
        # COMMIT IMMEDIATELY so it clears from the dashboard
        conn.commit()
        
        # 4. --- EMAIL SENDING ---
        email_status = "Success"
        
        smtp_user = os.getenv("SMTP_EMAIL") or os.getenv("SMTP_USER")
        smtp_pass = os.getenv("SMTP_PASSWORD") or os.getenv("SMTP_PASS")
        
        if users:
            if smtp_user and smtp_pass:
                try:
                    with smtplib.SMTP_SSL('smtp.gmail.com', 465, timeout=10) as server:
                        server.login(smtp_user, smtp_pass)
                        
                        for user_email, original_q in set(users):
                            body = f"Hello,\n\nYou recently asked us: '{original_q}'.\n\nOur team has reviewed your request, and here is the answer:\n\n{answer}\n\nBest regards,\nSupport Team"
                            
                            msg = MIMEText(body, 'plain')
                            msg['Subject'] = "Follow-up regarding your recent question"
                            msg['From'] = smtp_user
                            msg['To'] = user_email
                            
                            server.send_message(msg)
                except Exception as e:
                    email_status = f"SMTP Error: {str(e)}"
                    logging.error(f"Handoff Email Failed: {e}")
            else:
                email_status = "Missing SMTP_EMAIL or SMTP_PASSWORD in backend environment variables"
        else:
            email_status = "No users found attached to this question."
            
        return jsonify({"success": True, "email_status": email_status})
        
    except Exception as e:
        # 5. SAFE ROLLBACK
        if conn:
            try:
                conn.rollback()
            except Exception as rollback_err:
                logging.error(f"Rollback failed: {rollback_err}")
                
        logging.error(f"Fatal Resolve Error: {str(e)}")
        
        # 6. FORCE JSON RESPONSE (Prevents Flask from throwing the HTML error page)
        response = jsonify({"error": f"Server crash prevented: {str(e)}"})
        response.status_code = 500
        return response
        
    finally:
        # 7. SAFE DISCONNECT
        try:
            if cur: cur.close()
            if conn: conn.close()
        except Exception as close_err:
            logging.error(f"Error cleanly closing DB connection: {close_err}")

# --- AI CONFIGURATION API ---

@app.route('/api/ai/settings', methods=['GET'])
def get_ai_settings():
    if 'client_id' not in session: return jsonify({"error": "Unauthorized"}), 401
    
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT ai_provider, model_name, api_key, system_instruction FROM clients WHERE client_id = %s", (session['client_id'],))
    row = cur.fetchone()
    cur.close()
    conn.close()
    
    if not row: return jsonify({"error": "Not found"}), 404
    
    provider, model, key, instr = row
    return jsonify({
        "provider": provider or "google",
        "model": model or "gemini/gemini-2.5-flash",
        "has_key": bool(key),
        "system_instruction": instr or "You are a helpful assistant."
    })

@app.route('/api/ai/test', methods=['POST'])
def test_ai_connection():
    if 'client_id' not in session: return jsonify({"error": "Unauthorized"}), 401
    
    data = request.json
    provider = data.get('provider')
    model = data.get('model')
    api_key = data.get('api_key')
    
    if not model or not api_key:
        return jsonify({"success": False, "error": "Model and API Key required"}), 400

    try:
        response = completion(
            model=model,
            messages=[{"role": "user", "content": "Ping."}],
            api_key=api_key,
            max_tokens=5
        )
        return jsonify({"success": True, "message": "Connection successful!"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/ai/save', methods=['POST'])
def save_ai_settings():
    if 'client_id' not in session: return jsonify({"error": "Unauthorized"}), 401
    
    data = request.json
    provider = data.get('provider')
    model = data.get('model')
    api_key = data.get('api_key')
    sys_instr = data.get('system_instruction')
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Only update API key if one was provided (don't overwrite with empty string if they are just updating prompt)
    if api_key and api_key.strip():
        cur.execute("""
            UPDATE clients SET ai_provider=%s, model_name=%s, api_key=%s, system_instruction=%s 
            WHERE client_id=%s
        """, (provider, model, api_key, sys_instr, session['client_id']))
    else:
        cur.execute("""
            UPDATE clients SET ai_provider=%s, model_name=%s, system_instruction=%s 
            WHERE client_id=%s
        """, (provider, model, sys_instr, session['client_id']))
        
    conn.commit()
    cur.close()
    conn.close()
    
    return jsonify({"success": True, "message": "Settings saved successfully"})

def send_verification_email(user_email, token):
    smtp_user = os.getenv("SMTP_EMAIL") or os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASSWORD") or os.getenv("SMTP_PASS")

    if not smtp_user or not smtp_pass:
        logging.error("❌ SMTP Credentials missing. Cannot send email.")
        return

    # Generate the verification URL
    verify_url = url_for('verify_email', token=token, _external=True)
    
    msg = MIMEText(f"Welcome to FloChat!\n\nPlease click here to verify your account:\n{verify_url}")
    msg['Subject'] = "Verify your FloChat Account"
    msg['From'] = smtp_user
    msg['To'] = user_email

    try:
        # Using Gmail's standard SSL port
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
        logging.info(f"✅ Verification email sent to {user_email}")
    except Exception as e:
        logging.error(f"❌ Verification Email Failed: {e}")

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

    # --- NEW: Check if email is verified ---
    if not is_verified:
        return jsonify({"error": "Please verify your email first. Check your inbox."}), 403

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

    # --- NEW: Send Verification Email ---
    send_verification_email(email, token)

    return jsonify({"message": "Registration successful. Please check your email to verify your account."})

@app.route('/api/verify')
def verify_email():
    token = request.args.get('token')
    if not token: return "Missing token", 400

    conn = get_db_connection()
    cur = conn.cursor()
    
    # Find user by token
    cur.execute("SELECT client_id FROM clients WHERE verification_token = %s", (token,))
    row = cur.fetchone()
    
    if not row:
        cur.close()
        conn.close()
        return "Invalid or expired token.", 400

    # Verify User
    client_id = row[0]
    cur.execute("UPDATE clients SET verified = TRUE, verification_token = NULL WHERE client_id = %s", (client_id,))
    conn.commit()
    cur.close()
    conn.close()

    # Automatically log the user in after clicking the link
    session['client_id'] = client_id
    
    # Redirect straight to the dashboard
    return redirect('/dashboard')

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