"""
Vercel Serverless Function Wrapper for Flask Backend
This file wraps the existing app.py for Vercel deployment
WITHOUT modifying the original Flask app.
"""

import sys
import os

# Ensure the parent `backend/` directory is in sys.path so we can import `app.py`
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Try to import Flask app, capture detailed error if it fails
flask_app = None
import_error = None
import_traceback = None

try:
    # Import the Flask WSGI app from `backend/app.py`
    print("=" * 60)
    print("[VERCEL WRAPPER] Attempting to import Flask app from app.py")
    print(f"[VERCEL WRAPPER] Backend directory: {backend_dir}")
    print(f"[VERCEL WRAPPER] sys.path: {sys.path[:3]}")
    print(f"[VERCEL WRAPPER] Python version: {sys.version}")
    print("=" * 60)
    
    from app import app as flask_app
    print("[VERCEL WRAPPER] Successfully imported Flask app")
    
except Exception as e:
    # Capture the full error details
    import traceback
    import_error = e
    import_traceback = traceback.format_exc()
    
    print("=" * 60)
    print("[VERCEL WRAPPER] IMPORT FAILED")
    print(f"[VERCEL WRAPPER] Error type: {type(e).__name__}")
    print(f"[VERCEL WRAPPER] Error message: {str(e)}")
    print("[VERCEL WRAPPER] Full traceback:")
    print(import_traceback)
    print("=" * 60)
    
    # Create a minimal diagnostic Flask app
    from flask import Flask, jsonify
    flask_app = Flask(__name__)
    
    @flask_app.route('/')
    @flask_app.route('/api/')
    @flask_app.route('/api/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])
    def error_handler(path=None):
        return jsonify({
            "error": "Backend failed to initialize",
            "errorType": type(import_error).__name__,
            "errorMessage": str(import_error),
            "traceback": import_traceback.split('\n') if import_traceback else [],
            "pythonVersion": sys.version,
            "backendDir": backend_dir,
            "cwd": os.getcwd(),
            "sysPath": sys.path[:5],
            "environmentVars": {
                "SUPABASE_URL": bool(os.environ.get("SUPABASE_URL")),
                "SUPABASE_KEY": bool(os.environ.get("SUPABASE_KEY")),
                "GOOGLE_AUTH_SALT": bool(os.environ.get("GOOGLE_AUTH_SALT")),
            }
        }), 500

# Expose the WSGI app for Vercel's Python runtime
app = flask_app
