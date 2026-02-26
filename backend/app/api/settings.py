from flask import Blueprint, request, jsonify, session
from litellm import completion
from app.utils.db import get_db_connection

# Define the Blueprint
settings_bp = Blueprint('settings', __name__)

@settings_bp.route('/api/ai/settings', methods=['GET'])
def get_ai_settings():
    if 'client_id' not in session: 
        return jsonify({"error": "Unauthorized"}), 401
    
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
        "system_instruction": instr or "You are a helpful assistant.",
        "client_id": session['client_id']
    })

@settings_bp.route('/api/ai/test', methods=['POST'])
def test_ai_connection():
    if 'client_id' not in session: 
        return jsonify({"error": "Unauthorized"}), 401
    
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

@settings_bp.route('/api/ai/save', methods=['POST'])
def save_ai_settings():
    if 'client_id' not in session: 
        return jsonify({"error": "Unauthorized"}), 401
    
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