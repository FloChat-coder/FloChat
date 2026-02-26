import io
import re
import json
import logging
import PyPDF2
from flask import Blueprint, request, jsonify, session

# Import your newly created helper functions
from app.utils.db import get_db_connection
from app.utils.google_auth import get_user_services, fetch_and_process_sheet

# Define the Blueprint
integrations_bp = Blueprint('integrations', __name__)

@integrations_bp.route('/api/drive/process', methods=['POST'])
def process_drive_file():
    if 'client_id' not in session: return jsonify({"error": "Unauthorized"}), 401
    
    client_id = session['client_id']
    file_id = request.json.get('fileId')
    if not file_id: return jsonify({"error": "No file ID provided"}), 400

    _, drive_service = get_user_services(client_id)
    if not drive_service: return jsonify({"error": "Failed to connect to Google Drive"}), 500

    try:
        file_meta = drive_service.files().get(fileId=file_id, fields="mimeType, name", supportsAllDrives=True).execute()
        mime_type = file_meta.get('mimeType')
        file_name = file_meta.get('name')
        
        extracted_text = ""
        file_type = "unknown"
        
        if mime_type == 'application/vnd.google-apps.document':
            response = drive_service.files().export(fileId=file_id, mimeType='text/plain').execute()
            extracted_text = response.decode('utf-8')
            file_type = 'doc'
        elif mime_type == 'application/pdf':
            response = drive_service.files().get_media(fileId=file_id, supportsAllDrives=True).execute()
            pdf_file = io.BytesIO(response)
            reader = PyPDF2.PdfReader(pdf_file)
            for page in reader.pages:
                text = page.extract_text()
                if text: extracted_text += text + "\n"
            file_type = 'pdf'
        else:
            return jsonify({"error": "Unsupported file type."}), 400

        paragraphs = [p.strip() for p in extracted_text.split('\n\n') if p.strip()]
        json_data = [{"content": p} for p in paragraphs if len(p) > 10] 
        new_content = json.dumps(json_data, ensure_ascii=False)
        
        # INSERT into the new knowledge_bases table
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO knowledge_bases (client_id, file_id, file_name, file_type, cached_content) 
            VALUES (%s, %s, %s, %s, %s)
        """, (client_id, file_id, file_name, file_type, new_content))
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({"success": True, "message": "Document added to knowledge base."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@integrations_bp.route('/api/integrations/list', methods=['GET'])
def list_integrations():
    if 'client_id' not in session: return jsonify({"error": "Unauthorized"}), 401
        
    conn = get_db_connection()
    cur = conn.cursor()
    # Fetch ALL knowledge bases for this client
    cur.execute("SELECT id, file_id, file_name, file_type, sheet_range, cached_content FROM knowledge_bases WHERE client_id = %s ORDER BY last_synced_at DESC", (session['client_id'],))
    rows = cur.fetchall()
    cur.close()
    conn.close()
    
    results = []
    for row in rows:
        db_id, file_id, file_name, file_type, sheet_range, cached_content = row
        item_count = len(json.loads(cached_content)) if cached_content else 0
        
        details = f"{item_count} items extracted"
        if file_type == 'sheet':
            details = f"Range: {sheet_range or 'N/A'} • {item_count} rows"
            
        results.append({
            "id": db_id,           # The Database Primary Key (used for deleting)
            "file_id": file_id,    # The Google Drive ID
            "name": file_name,
            "type": file_type,
            "details": details
        })
        
    return jsonify(results)

@integrations_bp.route('/api/google/status', methods=['GET'])
def check_google_status():
    if 'client_id' not in session: 
        return jsonify({"error": "Unauthorized"}), 401
    
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT google_token FROM clients WHERE client_id = %s", (session['client_id'],))
    row = cur.fetchone()
    cur.close()
    conn.close()
    
    # Return true if they have a token, false if it's None/empty
    return jsonify({"linked": bool(row and row[0])})

@integrations_bp.route('/api/sheets/save', methods=['POST'])
def save_sheet():
    if 'client_id' not in session: 
        return jsonify({"error": "Unauthorized"}), 401
    
    data = request.json
    sheet_url = data.get('sheetUrl', '')
    sheet_range = data.get('range', 'A1:Z100')
    
    # 1. Extract the unique Google Sheet ID from the URL
    match = re.search(r'/d/([a-zA-Z0-9-_]+)', sheet_url)
    if not match:
        return jsonify({"error": "Invalid Google Sheets URL"}), 400
    
    file_id = match.group(1)
    client_id = session['client_id']
    
    # 2. Connect to Google APIs 
    sheets_service, _ = get_user_services(client_id)
    if not sheets_service:
        return jsonify({"error": "Failed to connect to Google API. Try logging in again."}), 500
        
    try:
        # 3. Use the SHEETS API to get the title
        sheet_metadata = sheets_service.spreadsheets().get(spreadsheetId=file_id).execute()
        file_name = sheet_metadata.get('properties', {}).get('title', 'Google Sheet')
        
        # 4. Fetch the initial data content
        new_content = fetch_and_process_sheet(client_id, file_id, sheet_range)
        if new_content is None or new_content == "[]":
            return jsonify({"error": "Could not read sheet. Ensure the range is correct and the sheet has data."}), 400
            
        # 5. Insert into your new knowledge_bases table
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO knowledge_bases (client_id, file_id, file_name, file_type, sheet_range, cached_content) 
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (client_id, file_id, file_name, 'sheet', sheet_range, new_content))
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({"success": True, "message": "Sheet connected successfully!"})
        
    except Exception as e:
        logging.error(f"Sheet Save Error: {e}")
        return jsonify({"error": str(e)}), 500

@integrations_bp.route('/api/integrations/delete', methods=['POST'])
def delete_integration():
    if 'client_id' not in session: return jsonify({"error": "Unauthorized"}), 401
    
    kb_id = request.json.get('id')
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM knowledge_bases WHERE id = %s AND client_id = %s", (kb_id, session['client_id']))
    conn.commit()
    cur.close()
    conn.close()
    
    return jsonify({"success": True})