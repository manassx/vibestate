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
    def app(environ, start_response):
        """Minimal WSGI app - no dependencies at all"""
        import json
        
        status = '200 OK'
        headers = [
            ('Content-Type', 'application/json'),
            ('Access-Control-Allow-Origin', '*')
        ]
        start_response(status, headers)
        
        response = {
            "status": "alive",
            "message": "Raw WSGI works - no Flask",
            "path": environ.get('PATH_INFO', '/'),
            "method": environ.get('REQUEST_METHOD', 'GET')
        }
        
        return [json.dumps(response).encode('utf-8')]

# Export for Vercel
handler = app