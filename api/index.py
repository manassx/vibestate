"""
Vercel Serverless Function Entry Point for Flask Backend
"""
import sys
import os

# Add backend directory to Python path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend'))
sys.path.insert(0, backend_path)

# Import and expose the Flask app
from app import app

# Vercel will call this app
app = app
