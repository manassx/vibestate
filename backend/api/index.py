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

# Import the Flask app from app.py
from app import app

# Vercel serverless function handler
def handler(request, response):
    """
    Vercel serverless function entry point
    """
    return app(request, response)

# For Vercel's Python runtime
app = app
