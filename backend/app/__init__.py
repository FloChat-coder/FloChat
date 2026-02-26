import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Import all your Blueprints
from app.api.auth import auth_bp
from app.api.chat import chat_bp
from app.api.handoff import handoff_bp
from app.api.integrations import integrations_bp
from app.api.leads import leads_bp
from app.api.settings import settings_bp
from app.api.analytics import analytics_bp
from app.frontend import frontend_bp

def create_app():
    load_dotenv()
    
    app = Flask(__name__, static_folder=None)
    app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev_secret_key_change_in_prod")
    CORS(app)

    # Allow OAuth over HTTP (Render proxy handles HTTPS)
    os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

    # Register all Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(handoff_bp)
    app.register_blueprint(integrations_bp)
    app.register_blueprint(leads_bp)
    app.register_blueprint(settings_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(frontend_bp)

    # Health Check Route
    @app.route('/healthz', methods=['GET'])
    def health_check():
        return jsonify({"status": "healthy", "message": "Modular Server is running!"}), 200

    return app