import os
from flask import Blueprint, send_from_directory, redirect, session

frontend_bp = Blueprint('frontend', __name__)

# --- PATH CALCULATIONS ---
# __file__ is backend/app/frontend.py
APP_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(APP_DIR)
ROOT_DIR = os.path.dirname(BACKEND_DIR)

FRONTEND_DIR = os.path.join(ROOT_DIR, 'frontend')
WEB_DIST = os.path.join(FRONTEND_DIR, 'web', 'dist')
DASH_DIST = os.path.join(FRONTEND_DIR, 'dash', 'dist')
TEMPLATE_DIR = os.path.join(BACKEND_DIR, 'templates')
STATIC_DIR = os.path.join(BACKEND_DIR, 'static')

# --- ROUTES ---
@frontend_bp.route('/static/widget.js')
def serve_widget():
    return send_from_directory(STATIC_DIR, 'widget.js')

@frontend_bp.route('/dashboard/assets/<path:path>')
def serve_dash_assets(path):
    return send_from_directory(os.path.join(DASH_DIST, 'assets'), path)

@frontend_bp.route('/dashboard')
@frontend_bp.route('/dashboard/<path:path>')
def serve_dashboard(path=''):
    if 'client_id' not in session:
        return redirect('/login')
    try:
        return send_from_directory(DASH_DIST, path)
    except:
        return send_from_directory(DASH_DIST, 'index.html')

@frontend_bp.route('/assets/<path:path>')
def serve_web_assets(path):
    return send_from_directory(os.path.join(WEB_DIST, 'assets'), path)

@frontend_bp.route('/demo')
def demo():
    try:
        return send_from_directory(TEMPLATE_DIR, 'demo_website.html')
    except Exception as e:
        return f"Demo file not found: {e}", 404

@frontend_bp.route('/', defaults={'path': ''})
@frontend_bp.route('/<path:path>')
def serve_root(path):
    if path.startswith('api/') or path.startswith('login'):
        return "Not Found", 404
    try:
        return send_from_directory(WEB_DIST, path)
    except:
        return send_from_directory(WEB_DIST, 'index.html')