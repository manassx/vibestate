import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

print("=" * 50)
print("Testing Supabase Connection")
print("=" * 50)
print(f"URL: {SUPABASE_URL}")
print(f"Key: {SUPABASE_KEY[:30]}..." if SUPABASE_KEY else "Key: MISSING")
print()

try:
    print("Creating Supabase client...")
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✓ Client created successfully!")
    print()
    
    # Test with a sample login (you'll need to enter your credentials)
    email = input("Enter your email: ")
    password = input("Enter your password: ")
    print()
    
    print("Attempting login...")
    result = supabase.auth.sign_in_with_password({
        "email": email,
        "password": password
    })
    
    print("✓ LOGIN SUCCESSFUL!")
    print(f"User ID: {result.user.id}")
    print(f"Email: {result.user.email}")
    print()
    print("Your Supabase connection is working perfectly!")
    print("The issue might be in your Flask app configuration.")
    
except Exception as e:
    print("✗ ERROR OCCURRED!")
    print(f"Error type: {type(e).__name__}")
    print(f"Error message: {str(e)}")
    print()
    print("This error tells us what's wrong:")
    
    error_str = str(e).lower()
    if "11001" in error_str or "getaddrinfo" in error_str:
        print("→ DNS/Network issue - Check your internet connection")
        print("→ Try: ping dmhihoqijrjasjgjsxgn.supabase.co")
    elif "timeout" in error_str:
        print("→ Connection timeout - Firewall or network issue")
    elif "ssl" in error_str:
        print("→ SSL certificate issue")
    elif "auth" in error_str or "401" in error_str:
        print("→ Wrong credentials or Supabase key")
    else:
        print("→ Unknown error - see details above")

print("=" * 50)
