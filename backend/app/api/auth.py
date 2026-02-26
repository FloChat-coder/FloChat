import os
import secrets
import logging
import requests
import smtplib
import json
from flask import Blueprint, request, jsonify, session, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash
from email.mime.text import MIMEText
from google_auth_oauthlib.flow import Flow

from app.utils.db import get_db_connection
from app.utils.google_auth import CLIENT_SECRETS_FILE, SCOPES

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/api/auth/token', methods=['GET'])
def get_access_token():
    if 'client_id' not in session: return jsonify({"error": "Unauthorized"}), 401
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT google_token FROM clients WHERE client_id = %s", (session['client_id'],))
    row = cur.fetchone()
    cur.close()
    conn.close()
    if row and row[0]: return jsonify({"token": row[0]})
    return jsonify({"error": "No token found"}), 404

def send_verification_email(user_email, token):
    smtp_user = os.getenv("SMTP_EMAIL") or os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASSWORD") or os.getenv("SMTP_PASS")
    if not smtp_user or not smtp_pass: return

    # Notice 'auth.verify_email' - required for blueprints
    verify_url = url_for('auth.verify_email', token=token, _external=True)
    msg = MIMEText(f"Welcome to FloChat!\n\nPlease click here to verify your account:\n{verify_url}")
    msg['Subject'] = "Verify your FloChat Account"
    msg['From'] = smtp_user
    msg['To'] = user_email

    try:
        with smtplib.SMTP('smtp.gmail.com', 587, timeout=10) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
    except Exception as e:
        logging.error(f"❌ Verification Email Failed: {e}")

@auth_bp.route('/api/login', methods=['POST'])
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
    if not is_verified: return jsonify({"error": "Please verify your email first. Check your inbox."}), 403

    session['client_id'] = client_id
    return jsonify({"message": "Login successful", "redirect": "/dashboard"})

@auth_bp.route('/api/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password: return jsonify({"error": "Email and password required"}), 400

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
        cur.execute("INSERT INTO clients (client_id, email, password_hash, verification_token, verified) VALUES (%s, %s, %s, %s, FALSE)", (client_id, email, hashed_pw, token))
        conn.commit()
    except Exception as e:
        return jsonify({"error": "Database error"}), 500
    finally:
        cur.close()
        conn.close()

    send_verification_email(email, token)
    return jsonify({"message": "Registration successful. Please check your email to verify your account."})

@auth_bp.route('/api/verify')
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

@auth_bp.route('/login')
def login():
    try:
        flow = Flow.from_client_secrets_file(CLIENT_SECRETS_FILE, scopes=SCOPES)
        flow.redirect_uri = url_for('auth.oauth2callback', _external=True, _scheme='https')
        authorization_url, state = flow.authorization_url(access_type='offline', prompt='consent', include_granted_scopes='true')
        session['state'] = state
        return redirect(authorization_url)
    except Exception as e:
        return f"Error starting login: {e}", 500

@auth_bp.route('/login/callback')
def oauth2callback():
    state = session.get('state')
    if not state: return redirect('/login')

    try:
        flow = Flow.from_client_secrets_file(CLIENT_SECRETS_FILE, scopes=SCOPES, state=state)
        flow.redirect_uri = url_for('auth.oauth2callback', _external=True, _scheme='https')

        authorization_response = request.url.replace('http:', 'https:', 1) if request.url.startswith('http:') else request.url
        flow.fetch_token(authorization_response=authorization_response)
        creds = flow.credentials
        
        user_info = requests.get('https://www.googleapis.com/oauth2/v1/userinfo', headers={'Authorization': f'Bearer {creds.token}'}).json()
        email = user_info.get('email')

        conn = get_db_connection()
        cur = conn.cursor()
        
        with open(CLIENT_SECRETS_FILE, 'r') as f:
            c_conf = json.load(f).get('web') or json.load(f).get('installed') or {}

        logged_in_client = session.get('client_id')
        
        if logged_in_client:
            if creds.refresh_token: cur.execute("UPDATE clients SET google_token=%s, google_refresh_token=%s WHERE client_id=%s", (creds.token, creds.refresh_token, logged_in_client))
            else: cur.execute("UPDATE clients SET google_token=%s WHERE client_id=%s", (creds.token, logged_in_client))
            client_id = logged_in_client
        else:
            cur.execute("SELECT client_id FROM clients WHERE email = %s;", (email,))
            existing_user = cur.fetchone()
            if existing_user:
                client_id = existing_user[0]
                if creds.refresh_token: cur.execute("UPDATE clients SET google_token=%s, google_refresh_token=%s WHERE client_id=%s", (creds.token, creds.refresh_token, client_id))
                else: cur.execute("UPDATE clients SET google_token=%s WHERE client_id=%s", (creds.token, client_id))
            else:
                alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
                client_id = ''.join(secrets.choice(alphabet) for i in range(5))
                cur.execute("INSERT INTO clients (client_id, email, google_token, google_refresh_token, token_uri, client_id_google, client_secret_google) VALUES (%s, %s, %s, %s, %s, %s, %s)", 
                            (client_id, email, creds.token, creds.refresh_token, creds.token_uri, c_conf.get('client_id'), c_conf.get('client_secret')))
        
        conn.commit()
        cur.close()
        conn.close()

        session['client_id'] = client_id
        return redirect('/dashboard')
    except Exception as e:
        return f"Authentication failed: {e}", 500