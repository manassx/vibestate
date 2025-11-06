"""
Simple test script to verify authentication endpoints
Run the backend (python app.py) first, then run this script
"""
import requests
import json

BASE_URL = "http://localhost:5001"

def test_health():
    """Test if backend is running"""
    print("\n🔍 Testing health check...")
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"✅ Status: {response.status_code}")
        print(f"📦 Response: {response.json()}")
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_signup():
    """Test signup endpoint"""
    print("\n🔍 Testing signup...")
    data = {
        "name": "Test User",
        "email": "test@example.com",
        "password": "testpassword123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/auth/signup", json=data)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code in [201, 409]:  # 409 if user already exists
            print("✅ Signup working!")
            return True
        else:
            print("❌ Unexpected status code")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_login():
    """Test login endpoint"""
    print("\n🔍 Testing login...")
    data = {
        "email": "test@example.com",
        "password": "testpassword123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", json=data)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Login successful!")
            print(f"👤 User: {result.get('user', {}).get('email')}")
            print(f"🔑 Token: {result.get('token', '')[:20]}...")
            return True
        else:
            print(f"❌ Login failed: {response.json()}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("=" * 50)
    print("🧪 Backend Auth Test Suite")
    print("=" * 50)
    
    # Test 1: Health check
    if not test_health():
        print("\n❌ Backend is not running! Start it with: python app.py")
        exit(1)
    
    # Test 2: Signup
    test_signup()
    
    # Test 3: Login
    test_login()
    
    print("\n" + "=" * 50)
    print("✅ All tests completed!")
    print("=" * 50)
