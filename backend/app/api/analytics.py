import logging
from flask import Blueprint, jsonify, session

from app.utils.db import get_db_connection



analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/api/analytics/metrics', methods=['GET'])
def get_analytics_metrics():
    if 'client_id' not in session: 
        return jsonify({"error": "Unauthorized"}), 401
    
    conn = get_db_connection()
    cur = conn.cursor()
    client_id = session['client_id']
    
    try:
        cur.execute("""
            SELECT 
                COUNT(*) as total_sessions,
                COALESCE(SUM(jsonb_array_length(messages)), 0) as total_messages,
                COALESCE(SUM(total_tokens), 0) as total_tokens,
                COALESCE(SUM(estimated_cost), 0.0) as total_cost,
                COUNT(NULLIF(handoff_triggered, false)) as handoff_count
            FROM chat_sessions WHERE client_id = %s
        """, (client_id,))
        base_metrics = cur.fetchone()
        
        cur.execute("""
            SELECT model_used FROM chat_sessions 
            WHERE client_id = %s AND model_used IS NOT NULL
            GROUP BY model_used ORDER BY COUNT(*) DESC LIMIT 1
        """, (client_id,))
        top_model_row = cur.fetchone()
        
        cur.execute("SELECT COUNT(*) FROM leads WHERE client_id = %s", (client_id,))
        lead_count = cur.fetchone()[0]
        
        total_sessions = base_metrics[0]
        handoff_count = base_metrics[4]
        
        metrics = {
            "total_sessions": total_sessions,
            "total_messages": base_metrics[1],
            "avg_messages_per_session": round(base_metrics[1] / total_sessions, 1) if total_sessions > 0 else 0,
            "total_tokens": base_metrics[2],
            "total_cost": float(base_metrics[3]),
            "top_model": top_model_row[0] if top_model_row else "N/A",
            "handoff_rate": round((handoff_count / total_sessions) * 100, 1) if total_sessions > 0 else 0,
            "resolution_rate": round(((total_sessions - handoff_count) / total_sessions) * 100, 1) if total_sessions > 0 else 0,
            "lead_capture_count": lead_count,
            "client_id": session['client_id']
        }
        return jsonify(metrics)
    except Exception as e:
        logging.error(f"Analytics Metrics Error: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()