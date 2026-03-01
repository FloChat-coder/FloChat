import logging
from flask import Blueprint, jsonify, session,request

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


@analytics_bp.route('/api/analytics/timeseries', methods=['GET'])
def get_analytics_timeseries():
    if 'client_id' not in session: 
        return jsonify({"error": "Unauthorized"}), 401
    
    period = request.args.get('period', 'day')
    if period not in ['day', 'month', 'year']:
        period = 'day'
        
    conn = get_db_connection()
    cur = conn.cursor()
    client_id = session['client_id']
    
    try:
        # Use CTEs to group sessions and leads separately, then join them by date
        cur.execute("""
            WITH session_stats AS (
                SELECT 
                    DATE_TRUNC(%s, created_at) as time_period,
                    COUNT(*) as total_sessions,
                    COALESCE(SUM(jsonb_array_length(messages)), 0) as total_messages,
                    COALESCE(SUM(total_tokens), 0) as total_tokens,
                    COALESCE(SUM(estimated_cost), 0.0) as total_cost,
                    COUNT(NULLIF(handoff_triggered, false)) as handoff_count
                FROM chat_sessions 
                WHERE client_id = %s
                GROUP BY time_period
            ),
            lead_stats AS (
                SELECT 
                    DATE_TRUNC(%s, created_at) as time_period,
                    COUNT(*) as lead_count
                FROM leads
                WHERE client_id = %s
                GROUP BY time_period
            )
            SELECT 
                COALESCE(s.time_period, l.time_period) as time_period,
                COALESCE(s.total_sessions, 0) as total_sessions,
                COALESCE(s.total_messages, 0) as total_messages,
                COALESCE(s.total_tokens, 0) as total_tokens,
                COALESCE(s.total_cost, 0.0) as total_cost,
                COALESCE(s.handoff_count, 0) as handoff_count,
                COALESCE(l.lead_count, 0) as lead_count
            FROM session_stats s
            FULL OUTER JOIN lead_stats l ON s.time_period = l.time_period
            ORDER BY time_period ASC
        """, (period, client_id, period, client_id))
        
        rows = cur.fetchall()
        timeseries_data = []
        
        for row in rows:
            total_sessions = row[1]
            handoff_count = row[5]
            
            timeseries_data.append({
                "date": row[0].strftime('%Y-%m-%d'),
                "sessions": total_sessions,
                "avg_messages": round(row[2] / total_sessions, 1) if total_sessions > 0 else 0,
                "tokens": row[3],
                "cost": float(row[4]),
                "handoff_rate": round((handoff_count / total_sessions) * 100, 1) if total_sessions > 0 else 0,
                "resolution_rate": round(((total_sessions - handoff_count) / total_sessions) * 100, 1) if total_sessions > 0 else 0,
                "leads": row[6]
            })
            
        return jsonify(timeseries_data)
    except Exception as e:
        import logging
        logging.error(f"Analytics Timeseries Error: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()