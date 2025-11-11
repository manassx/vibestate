"""
Vercel Serverless Function Wrapper for Flask Backend
This file wraps the existing app.py for Vercel deployment
WITHOUT modifying the original Flask app.
"""

import sys
import os

# Add parent directory to path so we can import app.py
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

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
