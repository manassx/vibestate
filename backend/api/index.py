"""
Vercel Serverless Function Wrapper for Flask Backend
This file wraps the existing app.py for Vercel deployment
WITHOUT modifying the original Flask app.
"""

import sys
import os

# Add backend directory to path so we can import app.py
# backend/api/index.py -> go up one level to backend/
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

try:
    # Import the Flask app from app.py
    from app import app
    print("✅ Successfully imported Flask app")
except Exception as e:
    print(f"❌ Failed to import Flask app: {e}")
    import traceback
    traceback.print_exc()
    
    # Create a minimal Flask app that returns the error
    from flask import Flask, jsonify
    app = Flask(__name__)
    
    @app.route('/api/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])
    def error_handler(path):
        return jsonify({
            "error": "Backend failed to initialize",
            "details": str(e),
            "path": os.path.join(os.path.dirname(__file__), '..')
        }), 500

# This is the handler Vercel calls
handler = app
