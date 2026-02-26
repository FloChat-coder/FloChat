
from flask import Blueprint, session, request, jsonify 

from app.utils.db import get_db_connection



leads_bp = Blueprint('leads', __name__)

@leads_bp.route('/api/leads/request', methods=['POST'])
def capture_lead():
    data = request.json
    client_id = data.get('client_id')
    email = data.get('email')
    session_id = data.get('session_id')
    
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO leads (client_id, session_id, email) VALUES (%s, %s, %s)",
            (client_id, session_id, email)
        )
        conn.commit()
        return jsonify({"success": True})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

@leads_bp.route('/api/leads/list', methods=['GET'])
def get_leads_list():
    if 'client_id' not in session: 
        return jsonify({"error": "Unauthorized"}), 401
    
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # Join with chat_sessions to get the full conversation
        cur.execute("""
            SELECT l.id, l.email, l.session_id, l.created_at, c.messages 
            FROM leads l
            LEFT JOIN chat_sessions c ON l.session_id = c.session_id
            WHERE l.client_id = %s 
            ORDER BY l.created_at DESC
        """, (session['client_id'],))
        
        leads = []
        for row in cur.fetchall():
            messages = row[4] if row[4] else []
            
            # Create a snippet from the user's last message to show in the table
            snippet = "No chat history available."
            if messages:
                for msg in reversed(messages):
                    if msg.get('role') == 'user':
                        snippet = msg['content'][:80] + "..." if len(msg['content']) > 80 else msg['content']
                        break

            leads.append({
                "id": row[0],
                "email": row[1],
                "session_id": str(row[2]),
                "created_at": row[3].strftime("%Y-%m-%d %H:%M") if row[3] else "Unknown",
                "messages": messages,
                "snippet": snippet
            })
        return jsonify(leads)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()