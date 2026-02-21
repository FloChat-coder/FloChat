(function() {
    // 1. Find the script tag and the ID
    const scriptTag = document.getElementById('flochat-script');
    if (!scriptTag) return console.error("FloChat: Script tag missing id='flochat-script'");
    
    const clientId = scriptTag.getAttribute('data-client-id');
    if (!clientId) return console.error("FloChat: Missing data-client-id attribute");

    console.log("FloChat initializing for:", clientId);

    //session id to identify users
    let sessionId = localStorage.getItem('fc_session_id');
    if (!sessionId) {
    // Generate a simple UUID-like string if crypto.randomUUID isn't available
    sessionId = crypto.randomUUID ? crypto.randomUUID() : 'sess_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('fc_session_id', sessionId);
    }

    // 2. CONFIG: Switch this to your Render URL when going live!
    // const API_URL = "http://127.0.0.1:5000/api/chat"; 
    const API_URL = "https://flochat-ocya.onrender.com/api/chat";

    // 3. INJECT CSS
    const style = document.createElement('style');
    style.textContent = `
        .fc-launcher { position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px; background: #2563EB; border-radius: 50%; cursor: pointer; z-index: 9999; display: flex; justify-content: center; align-items: center; box-shadow: 0 4px 12px rgba(0,0,0,0.2); color: white; font-size: 30px; }
        .fc-window { position: fixed; bottom: 90px; right: 20px; width: 350px; height: 500px; background: white; border-radius: 12px; box-shadow: 0 5px 20px rgba(0,0,0,0.2); display: none; flex-direction: column; z-index: 9999; font-family: sans-serif; overflow: hidden; }
        .fc-header { background: #2563EB; color: white; padding: 15px; font-weight: bold; display: flex; justify-content: space-between; }
        .fc-msgs { flex: 1; padding: 15px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; background: #f9fafb; }
        .fc-msg { max-width: 80%; padding: 8px 12px; border-radius: 15px; font-size: 14px; line-height: 1.4; }
        .fc-bot { background: #e5e7eb; color: black; align-self: flex-start; border-bottom-left-radius: 2px; }
        .fc-user { background: #2563EB; color: white; align-self: flex-end; border-bottom-right-radius: 2px; }
        .fc-input-area { padding: 10px; border-top: 1px solid #eee; display: flex; gap: 5px; background: white; }
        .fc-input { flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 20px; outline: none; }
        .fc-send { background: #2563EB; color: white; border: none; width: 35px; height: 35px; border-radius: 50%; cursor: pointer; }
    `;
    document.head.appendChild(style);

    // 4. INJECT HTML
    const container = document.createElement('div');
    container.innerHTML = `
        <div class="fc-launcher" id="fcLauncher">💬</div>
        <div class="fc-window" id="fcWindow">
            <div class="fc-header">
                <span>Support</span>
                <span style="cursor:pointer" id="fcClose">✕</span>
            </div>
            <div class="fc-msgs" id="fcMsgs">
                <div class="fc-msg fc-bot">Hi! How can I help you today?</div>
            </div>
            <div class="fc-input-area">
                <input type="text" class="fc-input" id="fcInput" placeholder="Type a message...">
                <button class="fc-send" id="fcSend">➤</button>
            </div>
        </div>
    `;
    document.body.appendChild(container);

    // 5. EVENT HANDLERS
    const windowEl = document.getElementById('fcWindow');
    const msgsEl = document.getElementById('fcMsgs');
    const inputEl = document.getElementById('fcInput');

    function toggle() { windowEl.style.display = windowEl.style.display === 'flex' ? 'none' : 'flex'; }
    document.getElementById('fcLauncher').onclick = toggle;
    document.getElementById('fcClose').onclick = toggle;

    async function send() {
        const text = inputEl.value.trim();
        if (!text) return;
        
        inputEl.value = '';
        msgsEl.innerHTML += `<div class="fc-msg fc-user">${text}</div>`;
        msgsEl.scrollTop = msgsEl.scrollHeight;

        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, client_id: clientId, session_id: sessionId })
            });
            const data = await res.json();
            msgsEl.innerHTML += `<div class="fc-msg fc-bot">${data.reply}</div>`;
        } catch (e) {
            msgsEl.innerHTML += `<div class="fc-msg fc-bot">Error connecting to server.</div>`;
        }
        msgsEl.scrollTop = msgsEl.scrollHeight;
    }

    document.getElementById('fcSend').onclick = send;
    inputEl.onkeypress = (e) => { if (e.key === 'Enter') send(); };

})();
