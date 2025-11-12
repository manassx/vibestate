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

try:
    # Import the Flask WSGI app from `backend/app.py`
    from app import app as flask_app
    print("✅ Successfully imported Flask app")
except Exception as e:
    # If import fails, surface the error via a minimal Flask app for diagnostics
    import traceback
    traceback.print_exc()
    from flask import Flask, jsonify

    flask_app = Flask(__name__)

    @flask_app.route('/api/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])
    def error_handler(path):
        return jsonify({
            "error": "Backend failed to initialize",
            "details": str(e),
            "cwd": os.getcwd(),
            "module_path": backend_dir
        }), 500

# Expose the WSGI app for Vercel's Python runtime
app = flask_app
