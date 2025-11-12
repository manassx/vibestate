import sys
import os

# Add backend directory to Python path
backend_path = os.path.join(os.path.dirname(__file__), '..', 'backend')
sys.path.insert(0, backend_path)

print(f"[API WRAPPER] Python path configured: {backend_path}")

try:
    from app import app
    print("[API WRAPPER] ✅ Flask app imported successfully")
except Exception as e:
    print(f"[API WRAPPER] ❌ Import failed: {type(e).__name__}: {str(e)}")
    import traceback
    traceback.print_exc()
    
    # Create fallback app
    from flask import Flask, jsonify
    app = Flask(__name__)
    
    @app.route('/')
    @app.route('/api/')
    @app.route('/api/<path:path>')
    def handler(path=None):
        return jsonify({
            "status": "alive",
            "message": "Minimal Python function works",
            "path": path or "root"
        }), 200

# Export for Vercel
handler = app