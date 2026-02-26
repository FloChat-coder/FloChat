import os
import json
import logging
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from app.utils.db import get_db_connection

# Calculate BASE_DIR (which is the root backend/ directory, 2 levels up from this file)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

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
    'https://www.googleapis.com/auth/drive.file',
    'openid'
]

def get_user_services(client_id):
    conn = get_db_connection()
    if not conn: return None, None
    
    cur = conn.cursor()
    cur.execute("SELECT google_token, google_refresh_token FROM clients WHERE client_id = %s", (client_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    
    if not row: return None, None
    token, refresh_token = row
    
    with open(CLIENT_SECRETS_FILE, 'r') as f:
        raw_conf = json.load(f)
        c_conf = raw_conf.get('web') or raw_conf.get('installed') or {}
        
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
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("UPDATE clients SET google_token = %s WHERE client_id = %s", (creds.token, client_id))
            conn.commit()
            cur.close()
            conn.close()
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

def sync_knowledge_base(client_id, file_id, sheet_range):
    new_content = fetch_and_process_sheet(client_id, file_id, sheet_range)
    if new_content is None: return None

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("UPDATE knowledge_bases SET cached_content = %s, last_synced_at = NOW() WHERE client_id = %s AND file_id = %s", (new_content, client_id, file_id))
    conn.commit()
    cur.close()
    conn.close()
    return new_content