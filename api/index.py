"""
Vercel Serverless Function Entry Point
"""
import sys
import os

# Add backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Import the Flask app
from app import app

# Export for Vercel
handler = app
