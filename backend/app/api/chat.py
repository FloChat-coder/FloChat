import os
import json
import logging
import smtplib
from flask import Blueprint, request, jsonify, session
from datetime import datetime, timezone
from dateutil import parser
from email.mime.text import MIMEText
from litellm import completion, token_counter, get_max_tokens, completion_cost

from app.utils.db import get_db_connection
from app.utils.google_auth import get_user_services, sync_knowledge_base

chat_bp = Blueprint('chat', __name__)

@chat_bp.route('/api/chat', methods=['POST'])
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
            SELECT business_name, api_key, ai_provider, model_name, system_instruction 
            FROM clients WHERE client_id = %s
        """, (client_id,))
        row = cur.fetchone()

        if not row: return jsonify({"reply": "Invalid Client ID"})
        b_name, api_key, ai_provider, model_name, sys_instr = row

        if not api_key or not model_name:
            return jsonify({"reply": "AI Provider not configured. Please add your API key in the dashboard."})

        # --- MULTI-KNOWLEDGE BASE COMBINATION ---
        if temp_context:
            knowledge_base = json.dumps(temp_context)
            system_note = "IMPORTANT: Answer solely based on the USER PROVIDED DATA GRID below."
        else:
            cur.execute("SELECT file_id, file_type, sheet_range, cached_content, last_synced_at FROM knowledge_bases WHERE client_id = %s", (client_id,))
            kbs = cur.fetchall()
            
            if not kbs:
                return jsonify({"reply": "I'm not ready yet. Please configure my knowledge base."})

            combined_data = []
            _, drive_service = get_user_services(client_id)
            
            for file_id, file_type, sheet_range, cached_content, db_last_synced in kbs:
                need_sync = False
                current_content = cached_content
                
                # Only Google Sheets require dynamic live-syncing logic right now
                if file_type == 'sheet' and drive_service and file_id:
                    try:
                        file_meta = drive_service.files().get(fileId=file_id, fields="modifiedTime").execute()
                        google_time = parser.parse(file_meta.get('modifiedTime'))
                        if db_last_synced is None:
                            need_sync = True
                        else:
                            if db_last_synced.tzinfo is None:
                                db_last_synced = db_last_synced.replace(tzinfo=timezone.utc)
                            if google_time > db_last_synced:
                                need_sync = True
                    except Exception as e:
                        if not current_content: need_sync = True
                
                if need_sync:
                    updated = sync_knowledge_base(client_id, file_id, sheet_range)
                    if updated: current_content = updated

                # Parse the JSON string back to a list and add it to our combined master list
                if current_content and current_content != "[]":
                    try:
                        combined_data.extend(json.loads(current_content))
                    except json.JSONDecodeError:
                        pass
            
            if not combined_data:
                return jsonify({"reply": "I'm not ready yet. My knowledge bases are currently empty."})
                
            knowledge_base = json.dumps(combined_data, ensure_ascii=False)
            
            system_note = "CRITICAL INSTRUCTION: You will answer greetings but " \
            "if the question is about a product you MUST answer based STRICTLY on " \
            "the DATA provided above. If the exact answer is not present in the DATA, " \
            "do not guess, do not apologize, and do not explain yourself. Instead, you " \
            "MUST output exactly and only this string: [HANDOFF_REQUIRED]. " \
            "If a user asks for a product that is out of stock or not available, or if they " \
            "don't find what they are looking for but show purchasing intent, output EXACTLY " \
            "this string at the end of your response: [LEAD_REQUIRED]"

        # 2. Fetch or Create Chat History
        chat_history = []
        if session_id:
            cur.execute("SELECT messages FROM chat_sessions WHERE session_id = %s", (session_id,))
            session_row = cur.fetchone()
            if session_row and session_row[0]:
                chat_history = session_row[0]

        # 3. Apply Sliding Window 
        recent_history = chat_history[-6:] 

        # 4. Fetch Resolved Handoffs for Context Learning
        cur.execute("SELECT combined_question, answer FROM handoff_clusters WHERE client_id = %s AND status = 'resolved'", (client_id,))
        resolved_tickets = cur.fetchall()
        
        learned_context = ""
        if resolved_tickets:
            learned_context = "\n\nPREVIOUSLY ANSWERED QUESTIONS (If the user asks something similar to these, answer using this exact information):\n"
            for q, a in resolved_tickets:
                learned_context += f"Q: {q}\nA: {a}\n\n"
        
        # 4. Format messages for LiteLLM
        full_system_prompt = f"ROLE: {sys_instr or 'Helpful Assistant'} for {b_name}.\n\nDATA:\n{knowledge_base}{learned_context}\n\n{system_note}"
        
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
        msg_tokens = 0
        msg_cost = 0.0
        
        try:
            response = completion(
                model=model_name,
                messages=llm_messages,
                api_key=api_key
            )
            bot_reply = response.choices[0].message.content
            
            # Safely calculate tokens and cost for this specific turn
            if hasattr(response, 'usage') and response.usage:
                msg_tokens = response.usage.total_tokens
                
            try:
                # completion_cost can sometimes throw errors if the model isn't mapped, so we nest it
                msg_cost = completion_cost(completion_response=response) or 0.0
            except Exception as cost_err:
                logging.warning(f"LiteLLM cost calculation error for {model_name}: {cost_err}")
                msg_cost = 0.0

        except Exception as e:
            logging.error(f"LiteLLM Error: {str(e)}")
            return jsonify({"reply": f"AI Provider Error: {str(e)}"}), 500
        
        is_handoff = False
        is_lead = False
        frontend_reply = bot_reply

        # Handle Handoff
        if "[handoff_required]" in bot_reply.lower():
            is_handoff = True
            frontend_reply = "I'm sorry, I don't have the exact information for that right now. I will escalate this to a human representative."
            
        # Handle Lead Capture Trigger
        elif "[lead_required]" in bot_reply.lower():
            is_lead = True
            # Clean the tag out of the message so the user just sees the bot's natural response
            frontend_reply = bot_reply.lower().replace("[lead_required]", "").strip()

        # 7. Save back to Database 
        if session_id:
            chat_history.append({"role": "user", "content": user_message})
            chat_history.append({"role": "model", "content": frontend_reply})
            
            cur.execute("""
                INSERT INTO chat_sessions (session_id, client_id, messages, total_tokens, estimated_cost, model_used, handoff_triggered, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
                ON CONFLICT (session_id) 
                DO UPDATE SET 
                    messages = EXCLUDED.messages,
                    total_tokens = chat_sessions.total_tokens + EXCLUDED.total_tokens,
                    estimated_cost = chat_sessions.estimated_cost + EXCLUDED.estimated_cost,
                    model_used = EXCLUDED.model_used,
                    handoff_triggered = chat_sessions.handoff_triggered OR EXCLUDED.handoff_triggered,
                    updated_at = NOW();
            """, (session_id, client_id, json.dumps(chat_history), msg_tokens, msg_cost, model_name, is_handoff))
            conn.commit()
            
        # Return the appropriate flags to the widget
        if is_handoff:
            return jsonify({"handoff": True, "reply": frontend_reply})
        elif is_lead:
            return jsonify({"lead": True, "reply": frontend_reply})
        else:
            return jsonify({"reply": frontend_reply})
        
    finally:
        cur.close()
        conn.close()

@chat_bp.route('/api/chats/search', methods=['POST'])
def search_chats():
    if 'client_id' not in session: return jsonify({"error": "Unauthorized"}), 401
    keyword = request.json.get('keyword', '').strip()
    
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        if keyword:
            search_pattern = f"%{keyword}%"
            cur.execute("""
                SELECT session_id, created_at, messages 
                FROM chat_sessions 
                WHERE client_id = %s AND messages::text ILIKE %s
                ORDER BY updated_at DESC LIMIT 50
            """, (session['client_id'], search_pattern))
        else:
            # If no keyword, fetch all recent chats
            cur.execute("""
                SELECT session_id, created_at, messages 
                FROM chat_sessions 
                WHERE client_id = %s
                ORDER BY updated_at DESC LIMIT 50
            """, (session['client_id'],))
            
        results = []
        for row in cur.fetchall():
            session_id, created_at, messages = row
            snippet = "..."
            
            if keyword:
                for msg in messages:
                    if keyword.lower() in msg.get('content', '').lower():
                        snippet = msg['content'][:100] + "..." if len(msg['content']) > 100 else msg['content']
                        break
            else:
                if messages:
                    snippet = messages[0]['content'][:100] + "..." if len(messages[0]['content']) > 100 else messages[0]['content']
                    
            results.append({
                "session_id": session_id,
                "date": created_at.strftime("%Y-%m-%d %H:%M"),
                "snippet": snippet,
                "messages": messages
            })
        return jsonify(results)
    finally:
        cur.close()
        conn.close()