import os
import re
import json
import secrets
import psycopg2
import logging
import requests
from flask import Flask,Blueprint, redirect, url_for, session, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timezone
from dateutil import parser 
# SMTP Email
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

import io
import PyPDF2

# Universal LLM Router
import litellm 
from litellm import completion, token_counter, get_max_tokens, completion_cost

# Google Libraries (Kept for Drive/Sheets sync)
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from app.utils.db import get_db_connection

handoff_bp = Blueprint('handoff', __name__)

@handoff_bp.route('/api/handoff/request', methods=['POST'])
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

@handoff_bp.route('/api/handoff/inbox', methods=['GET'])
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

@handoff_bp.route('/api/handoff/resolve', methods=['POST'])
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
                    # Changed from SMTP_SSL(465) to SMTP(587) with starttls()
                    with smtplib.SMTP('smtp.gmail.com', 587, timeout=10) as server:
                        server.starttls() # Secure the connection
                        server.login(smtp_user, smtp_pass)
                        
                        for user_email, original_q in set(users):
                            body = f"Hello,\n\nOur team has reviewed your request regarding: '{original_q}'.\n\nHere is the answer:\n{answer}\n\nBest regards,\nSupport Team"
                            
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