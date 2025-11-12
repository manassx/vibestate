"""
Vercel Serverless Function Wrapper for Flask Backend
This file wraps the existing app.py for Vercel deployment
WITHOUT modifying the original Flask app.
"""

import sys
import os

# Add backend directory to path so we can import app.py
# backend/api/index.py -> go up one level to backend/
backend_dir = os.path.dirname(os.path.abspath(__file__))  # Gets backend/api/
backend_dir = os.path.dirname(backend_dir)  # Gets backend/
sys.path.insert(0, backend_dir)

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
            "path": backend_dir
        }), 500

# Vercel serverless function handler
def handler(request, response):
    """
    Vercel serverless function entry point
    """
    return app(request, response)

# For Vercel's Python runtime
app = app
