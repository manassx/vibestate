import requests
import json
import os
import time
from io import BytesIO
from PIL import Image

# Configuration
BASE_URL = "http://localhost:8000"
TEST_EMAIL = f"test.user.{int(time.time())}@gmail.com"
TEST_PASSWORD = "TestPassword123!"
TEST_NAME = "Test User"

# Colors for output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'
    BOLD = '\033[1m'

def print_success(message):
    print(f"{Colors.GREEN}✓{Colors.END} {message}")

def print_error(message):
    print(f"{Colors.RED}✗{Colors.END} {message}")

def print_info(message):
    print(f"{Colors.BLUE}ℹ{Colors.END} {message}")

def print_section(message):
    print(f"\n{Colors.BOLD}{Colors.YELLOW}{'='*60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.YELLOW}{message}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.YELLOW}{'='*60}{Colors.END}\n")

# Global variables to store state
auth_token = None
user_id = None
gallery_id = None
image_id = None

def create_test_image():
    """Create a test image in memory"""
    img = Image.new('RGB', (800, 600), color=(73, 109, 137))
    img_byte_arr = BytesIO()
    img.save(img_byte_arr, format='JPEG')
    img_byte_arr.seek(0)
    return img_byte_arr

def test_server_status():
    """Test if server is running"""
    print_section("Testing Server Status")
    try:
        response = requests.get(f"{BASE_URL}/")
        if response.status_code == 200:
            data = response.json()
            print_success(f"Server is running: {data.get('message')}")
            print_info(f"Version: {data.get('version')}")
            return True
        else:
            print_error(f"Server returned status code: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Failed to connect to server: {e}")
        print_info(f"Make sure the server is running on {BASE_URL}")
        return False

def test_signup():
    """Test user signup"""
    print_section("Testing User Signup")
    global auth_token, user_id
    
    try:
        payload = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "name": TEST_NAME
        }
        
        response = requests.post(f"{BASE_URL}/api/auth/signup", json=payload)
        
        if response.status_code == 201:
            data = response.json()
            auth_token = data.get('token')
            user_id = data['user'].get('id')
            print_success(f"Signup successful!")
            print_info(f"User ID: {user_id}")
            print_info(f"Email: {data['user'].get('email')}")
            print_info(f"Token: {auth_token[:20]}...")
            return True
        else:
            print_error(f"Signup failed: {response.text}")
            return False
    except Exception as e:
        print_error(f"Signup error: {e}")
        return False

def test_login():
    """Test user login"""
    print_section("Testing User Login")
    global auth_token, user_id
    
    try:
        payload = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
        
        response = requests.post(f"{BASE_URL}/api/auth/login", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            auth_token = data.get('token')
            user_id = data['user'].get('id')
            print_success(f"Login successful!")
            print_info(f"User ID: {user_id}")
            print_info(f"Token: {auth_token[:20]}...")
            return True
        else:
            print_error(f"Login failed: {response.text}")
            return False
    except Exception as e:
        print_error(f"Login error: {e}")
        return False

def test_create_gallery():
    """Test gallery creation"""
    print_section("Testing Gallery Creation")
    global gallery_id
    
    try:
        headers = {"Authorization": f"Bearer {auth_token}"}
        payload = {
            "name": "Test Gallery",
            "description": "This is a test gallery created by automated tests",
            "config": {
                "threshold": 120,
                "animationType": "fade",
                "mood": "calm"
            }
        }
        
        response = requests.post(f"{BASE_URL}/api/galleries", json=payload, headers=headers)
        
        if response.status_code == 201:
            data = response.json()
            gallery_id = data.get('id')
            print_success(f"Gallery created successfully!")
            print_info(f"Gallery ID: {gallery_id}")
            print_info(f"Name: {data.get('name')}")
            print_info(f"Slug: {data.get('slug')}")
            print_info(f"Status: {data.get('status')}")
            return True
        else:
            print_error(f"Gallery creation failed: {response.text}")
            return False
    except Exception as e:
        print_error(f"Gallery creation error: {e}")
        return False

def test_list_galleries():
    """Test listing galleries"""
    print_section("Testing List Galleries")
    
    try:
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/galleries", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Successfully retrieved {len(data)} gallery(s)")
            for gallery in data:
                print_info(f"  - {gallery.get('name')} (ID: {gallery.get('id')})")
            return True
        else:
            print_error(f"List galleries failed: {response.text}")
            return False
    except Exception as e:
        print_error(f"List galleries error: {e}")
        return False

def test_get_gallery():
    """Test getting a single gallery"""
    print_section("Testing Get Single Gallery")
    
    try:
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/galleries/{gallery_id}", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Successfully retrieved gallery!")
            print_info(f"Name: {data.get('name')}")
            print_info(f"Description: {data.get('description')}")
            print_info(f"Image count: {data.get('image_count')}")
            print_info(f"Images: {len(data.get('images', []))}")
            return True
        else:
            print_error(f"Get gallery failed: {response.text}")
            return False
    except Exception as e:
        print_error(f"Get gallery error: {e}")
        return False

def test_update_gallery():
    """Test updating a gallery"""
    print_section("Testing Update Gallery")
    
    try:
        headers = {"Authorization": f"Bearer {auth_token}"}
        payload = {
            "name": "Updated Test Gallery",
            "description": "Updated description",
            "config": {
                "threshold": 150,
                "animationType": "zoom",
                "mood": "energetic"
            }
        }
        
        response = requests.put(f"{BASE_URL}/api/galleries/{gallery_id}", json=payload, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Gallery updated successfully!")
            print_info(f"New name: {data.get('name')}")
            print_info(f"New description: {data.get('description')}")
            print_info(f"New config: {json.dumps(data.get('config'), indent=2)}")
            return True
        else:
            print_error(f"Update gallery failed: {response.text}")
            return False
    except Exception as e:
        print_error(f"Update gallery error: {e}")
        return False

def test_upload_images():
    """Test image upload"""
    print_section("Testing Image Upload")
    global image_id
    
    try:
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Create test images
        img1 = create_test_image()
        img2 = create_test_image()
        
        files = [
            ('images', ('test1.jpg', img1, 'image/jpeg')),
            ('images', ('test2.jpg', img2, 'image/jpeg'))
        ]
        
        print_info("Uploading 2 test images...")
        response = requests.post(
            f"{BASE_URL}/api/galleries/{gallery_id}/upload",
            files=files,
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Successfully uploaded {data.get('uploadedCount')} image(s)!")
            
            if data.get('images'):
                image_id = data['images'][0].get('id')
                for img in data['images']:
                    print_info(f"  - Image ID: {img.get('id')}")
                    print_info(f"    URL: {img.get('url')[:50]}...")
                    print_info(f"    Thumbnail: {img.get('thumbnail_url')[:50] if img.get('thumbnail_url') else 'None'}...")
            return True
        else:
            print_error(f"Image upload failed: {response.text}")
            return False
    except Exception as e:
        print_error(f"Image upload error: {e}")
        return False

def test_analyze_gallery():
    """Test gallery analysis"""
    print_section("Testing Gallery Analysis")
    
    try:
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.post(f"{BASE_URL}/api/galleries/{gallery_id}/analyze", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Gallery analyzed successfully!")
            print_info(f"Analysis complete: {data.get('analysisComplete')}")
            print_info(f"Config: {json.dumps(data.get('config'), indent=2)}")
            print_info(f"Message: {data.get('message')}")
            return True
        else:
            print_error(f"Gallery analysis failed: {response.text}")
            return False
    except Exception as e:
        print_error(f"Gallery analysis error: {e}")
        return False

def test_publish_gallery():
    """Test publishing a gallery"""
    print_section("Testing Publish Gallery")
    
    try:
        headers = {"Authorization": f"Bearer {auth_token}"}
        payload = {
            "status": "published"
        }
        
        response = requests.patch(f"{BASE_URL}/api/galleries/{gallery_id}", json=payload, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Gallery published successfully!")
            print_info(f"Status: {data.get('status')}")
            return True
        else:
            print_error(f"Publish gallery failed: {response.text}")
            return False
    except Exception as e:
        print_error(f"Publish gallery error: {e}")
        return False

def test_public_gallery():
    """Test accessing public gallery"""
    print_section("Testing Public Gallery Access")
    
    try:
        # No auth header needed for public access
        response = requests.get(f"{BASE_URL}/api/gallery/{gallery_id}")
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Successfully accessed public gallery!")
            print_info(f"Name: {data.get('name')}")
            print_info(f"Image count: {data.get('image_count')}")
            print_info(f"Images available: {len(data.get('images', []))}")
            return True
        else:
            print_error(f"Public gallery access failed: {response.text}")
            return False
    except Exception as e:
        print_error(f"Public gallery access error: {e}")
        return False

def test_delete_gallery():
    """Test deleting a gallery"""
    print_section("Testing Delete Gallery")
    
    try:
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.delete(f"{BASE_URL}/api/galleries/{gallery_id}", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Gallery deleted successfully!")
            print_info(f"Message: {data.get('message')}")
            return True
        else:
            print_error(f"Delete gallery failed: {response.text}")
            return False
    except Exception as e:
        print_error(f"Delete gallery error: {e}")
        return False

def test_unauthorized_access():
    """Test unauthorized access"""
    print_section("Testing Unauthorized Access")
    
    try:
        # Try to access without token
        response = requests.get(f"{BASE_URL}/api/galleries")
        
        if response.status_code == 401:
            print_success(f"Unauthorized access correctly blocked!")
            return True
        else:
            print_error(f"Expected 401 but got {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Unauthorized access test error: {e}")
        return False

def run_all_tests():
    """Run all tests in sequence"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}CursorGallery Backend Test Suite{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}\n")
    
    results = []
    
    # Test server
    if not test_server_status():
        print_error("\nServer is not running. Exiting tests.")
        return
    
    # Auth tests
    results.append(("User Signup", test_signup()))
    results.append(("User Login", test_login()))
    results.append(("Unauthorized Access", test_unauthorized_access()))
    
    # Gallery tests
    results.append(("Create Gallery", test_create_gallery()))
    results.append(("List Galleries", test_list_galleries()))
    results.append(("Get Single Gallery", test_get_gallery()))
    results.append(("Update Gallery", test_update_gallery()))
    results.append(("Upload Images", test_upload_images()))
    results.append(("Analyze Gallery", test_analyze_gallery()))
    results.append(("Publish Gallery", test_publish_gallery()))
    results.append(("Public Gallery Access", test_public_gallery()))
    results.append(("Delete Gallery", test_delete_gallery()))
    
    # Summary
    print_section("Test Summary")
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = f"{Colors.GREEN}PASS{Colors.END}" if result else f"{Colors.RED}FAIL{Colors.END}"
        print(f"{status} - {test_name}")
    
    print(f"\n{Colors.BOLD}Results: {passed}/{total} tests passed{Colors.END}")
    
    if passed == total:
        print(f"\n{Colors.GREEN}{Colors.BOLD}✓ All tests passed!{Colors.END}\n")
    else:
        print(f"\n{Colors.RED}{Colors.BOLD}✗ Some tests failed. Check the output above.{Colors.END}\n")

if __name__ == "__main__":
    try:
        run_all_tests()
    except KeyboardInterrupt:
        print(f"\n\n{Colors.YELLOW}Tests interrupted by user.{Colors.END}\n")
    except Exception as e:
        print(f"\n\n{Colors.RED}Unexpected error: {e}{Colors.END}\n")
