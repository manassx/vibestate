import os
import re
import uuid
from datetime import datetime
from flask import Flask, request, jsonify
from supabase import create_client, Client
from dotenv import load_dotenv
from flask_cors import CORS
from werkzeug.utils import secure_filename
try:
    from PIL import Image  # Optional: may fail on serverless without native libs
    PIL_AVAILABLE = True
except Exception as _pil_err:
    Image = None  # type: ignore
    PIL_AVAILABLE = False
    print(f"[WARN] Pillow import failed or unavailable: {_pil_err}")
import io
import hashlib

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
# Enable CORS for all routes, allowing your React app to make requests
# Production: Will be restricted via environment variable
# Development: Allows all origins for local testing
allowed_origins = os.environ.get("CORS_ORIGINS", "*").split(",")
CORS(app, resources={r"/api/*": {"origins": allowed_origins if allowed_origins != ["*"] else "*"}})

# Get Supabase URL and Key from environment variables
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in the .env file")

# Use a SINGLE Supabase client for all operations (including admin)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
admin_supabase: Client = supabase

# Basic startup status message (critical environment vars)
print(f"Supabase URL: {SUPABASE_URL}")
print(f"Supabase Key starts with: {SUPABASE_KEY[:20]}... (length: {len(SUPABASE_KEY)})")

if "service_role" in SUPABASE_KEY or SUPABASE_KEY.startswith("eyJ"):
    print("[INFO] Using JWT key (likely service_role): Admin operations enabled.")
else:
    print("[WARNING] SUPABASE_KEY may be an anon key. Admin operations will NOT work unless you use your service_role key.")

# Configuration
STORAGE_BUCKET = "gallery-images"
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp'}
THUMBNAIL_SIZE = (400, 400)


# ==================== Utility Functions ====================

def get_user_from_token():
    """Extract user from Authorization header with improved error handling"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header.replace('Bearer ', '')

    # Retry logic for transient network errors
    max_retries = 2
    for attempt in range(max_retries):
        try:
            # Get user from token
            user = supabase.auth.get_user(token)
            return user.user if user else None
        except OSError as e:
            # Handle Windows socket errors (WinError 10035, etc.)
            error_code = getattr(e, 'winerror', None) or getattr(e, 'errno', None)
            if error_code == 10035 or 'non-blocking' in str(e).lower():
                # Transient network error - retry
                if attempt < max_retries - 1:
                    print(f"[INFO] Transient socket error (attempt {attempt + 1}/{max_retries}), retrying...")
                    import time
                    time.sleep(0.1)  # Brief delay before retry
                    continue
                else:
                    print(f"[WARN] Socket error persisted after retries: {e}")
                    # Don't fail auth on transient network errors - this is too strict
                    # Instead, try to decode token locally as fallback
                    return None
            else:
                # Other OS errors
                print(f"[ERROR] OS error during token validation: {e}")
                return None
        except Exception as e:
            # Log error without exposing details
            error_msg = str(e)
            
            # Check if it's a token expiry issue
            if 'expired' in error_msg.lower() or 'invalid' in error_msg.lower():
                print(f"[INFO] Token expired or invalid (expected behavior)")
            elif 'network' in error_msg.lower() or 'timeout' in error_msg.lower():
                # Network errors - retry once more
                if attempt < max_retries - 1:
                    print(f"[INFO] Network error (attempt {attempt + 1}/{max_retries}), retrying...")
                    import time
                    time.sleep(0.1)
                    continue
                print(f"[WARN] Network error during token validation: {error_msg}")
            else:
                print(f"[ERROR] Token validation error: {error_msg}")
            
            return None

    return None


def generate_slug(name, user_id):
    """Generate a URL-friendly slug from gallery name"""
    # Convert to lowercase and replace spaces with hyphens
    slug = re.sub(r'[^\w\s-]', '', name.lower())
    slug = re.sub(r'[-\s]+', '-', slug).strip('-')
    
    # Ensure uniqueness by checking database
    base_slug = slug
    counter = 1
    while True:
        try:
            result = supabase.table('galleries').select('id').eq('user_id', user_id).eq('slug', slug).execute()
            if not result.data:
                break
            slug = f"{base_slug}-{counter}"
            counter += 1
        except:
            break
    
    return slug


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def create_thumbnail(image_data):
    """Create a thumbnail from image data. Safe if Pillow is unavailable."""
    if not PIL_AVAILABLE:
        return None
    try:
        img = Image.open(io.BytesIO(image_data))
        # Pillow 10: use Image.Resampling if available
        try:
            resample = Image.Resampling.LANCZOS
        except Exception:
            resample = Image.LANCZOS
        img.thumbnail(THUMBNAIL_SIZE, resample)

        if img.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
            img = background

        thumb_io = io.BytesIO()
        img.save(thumb_io, format='JPEG', quality=85)
        thumb_io.seek(0)
        return thumb_io.read()
    except Exception as e:
        print(f"Thumbnail creation error: {e}")
        return None


# ==================== Auth Routes ====================

@app.route("/")
def home():
    """A simple route to check if the backend is running."""
    print("[HOME] Root endpoint accessed")
    return jsonify({"message": "CursorGallery API is running!", "version": "1.0.0"})

@app.route("/api/debug", methods=["GET"])
def debug_info():
    """Debug endpoint to check environment configuration"""
    print("[DEBUG] Debug endpoint accessed")
    
    env_status = {
        "SUPABASE_URL": bool(os.environ.get("SUPABASE_URL")),
        "SUPABASE_KEY": bool(os.environ.get("SUPABASE_KEY")),
        "GOOGLE_AUTH_SALT": bool(os.environ.get("GOOGLE_AUTH_SALT")),
        "CORS_ORIGINS": os.environ.get("CORS_ORIGINS", "*"),
        "PIL_AVAILABLE": PIL_AVAILABLE,
        "python_version": f"{os.sys.version_info.major}.{os.sys.version_info.minor}.{os.sys.version_info.micro}",
    }
    
    print(f"[DEBUG] Environment status: {env_status}")
    
    return jsonify({
        "status": "ok",
        "environment": env_status,
        "message": "Backend is operational"
    }), 200


@app.route("/api/auth/google", methods=["POST"])
def google_auth():
    """
    Handle Google Sign-In authentication.
    Expects JSON body with: { "idToken": "", "email": "", "name": "" }

    This creates a Supabase user account (if needed) and returns a valid JWT token.

    Updated: This endpoint now unifies Google and email/password users. If an account exists,
    regardless of method, it is linked using the same password so login can happen from either side.
    """
    try:
        print(f"[GOOGLE AUTH] ===== REQUEST STARTED =====")
        print(f"[GOOGLE AUTH] Request headers: {dict(request.headers)}")
        print(f"[GOOGLE AUTH] Request method: {request.method}")
        print(f"[GOOGLE AUTH] Request path: {request.path}")
        
        data = request.get_json()
        print(f"[GOOGLE AUTH] Request body received: {bool(data)}")
        
        if not data:
            print(f"[GOOGLE AUTH] ERROR: No JSON data in request body")
            return jsonify({"error": "Missing JSON data"}), 400

        id_token = data.get("idToken")
        email = data.get("email")
        name = data.get("name", "User")
        
        print(f"[GOOGLE AUTH] Parsed data - Email: {email}, Name: {name}, Token present: {bool(id_token)}")

        if not id_token or not email:
            print(f"[GOOGLE AUTH] ERROR: Missing required fields - idToken: {bool(id_token)}, email: {bool(email)}")
            return jsonify({"error": "Missing required fields (idToken, email)"}), 400

        # Use a consistent password hash for Google login (unify logic)
        secret_salt = os.environ.get("GOOGLE_AUTH_SALT", "cursor-gallery-google-auth-2024")
        print(f"[GOOGLE AUTH] Salt configured: {bool(secret_salt)}")
        
        password_hash = hashlib.sha256(f"{email}{secret_salt}".encode()).hexdigest()
        google_password = password_hash[:32]
        print(f"[GOOGLE AUTH] Generated password hash for user")

        try:
            print(f"[GOOGLE AUTH] Attempting sign-in with existing credentials...")
            res = supabase.auth.sign_in_with_password({
                "email": email,
                "password": google_password
            })
            print(f"[GOOGLE AUTH] ✅ Sign-in successful for existing user")

            user = res.user
            session = res.session

            # Always update user metadata to latest name from Google
            try:
                print(f"[GOOGLE AUTH] Updating user metadata...")
                admin_supabase.auth.admin.update_user_by_id(
                    user.id,
                    {"user_metadata": {"full_name": name, "auth_provider": "google"}}
                )
                print(f"[GOOGLE AUTH] ✅ Metadata updated")
            except Exception as e:
                print(f"[GOOGLE AUTH] ⚠️ Metadata update failed (non-critical): {str(e)}")

            # Always fetch latest user data
            try:
                print(f"[GOOGLE AUTH] Fetching fresh user data...")
                fresh_user_response = admin_supabase.auth.admin.get_user_by_id(user.id)
                if fresh_user_response and fresh_user_response.user:
                    fresh_user = fresh_user_response.user
                    print(f"[GOOGLE AUTH] ✅ Fresh user data fetched")
                    return jsonify({
                        "user": {
                            "id": fresh_user.id,
                            "email": fresh_user.email,
                            "name": fresh_user.user_metadata.get("full_name", name),
                            "createdAt": fresh_user.created_at
                        },
                        "token": session.access_token
                    }), 200
            except Exception as e:
                print(f"[GOOGLE AUTH] ⚠️ Fresh user fetch failed (non-critical): {str(e)}")

            # Fallback on old token
            print(f"[GOOGLE AUTH] ✅ Returning with existing token")
            return jsonify({
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "name": user.user_metadata.get("full_name", name),
                    "createdAt": user.created_at
                },
                "token": session.access_token
            }), 200

        except Exception as signin_error:
            print(f"[GOOGLE AUTH] Sign-in failed, attempting account creation/unification...")
            print(f"[GOOGLE AUTH] Sign-in error type: {type(signin_error).__name__}")
            print(f"[GOOGLE AUTH] Sign-in error message: {str(signin_error)}")
            
            try:
                print(f"[GOOGLE AUTH] Fetching existing users to check for account...")
                users_response = supabase.auth.admin.list_users()
                existing_user = None

                if users_response:
                    for u in users_response:
                        if u.email == email:
                            existing_user = u
                            print(f"[GOOGLE AUTH] Found existing user with email: {email}")
                            break

                if existing_user:
                    print(f"[GOOGLE AUTH] Unifying existing account...")
                    # Unify account (update password for Google login)
                    admin_supabase.auth.admin.update_user_by_id(
                        existing_user.id,
                        {
                            "password": google_password,
                            "user_metadata": {
                                "full_name": name if name else existing_user.user_metadata.get("full_name", ""),
                                "auth_provider": "unified"
                            }
                        }
                    )
                    print(f"[GOOGLE AUTH] ✅ Account unified, attempting sign-in...")
                    
                    final_signin = supabase.auth.sign_in_with_password({
                        "email": email,
                        "password": google_password
                    })
                    print(f"[GOOGLE AUTH] ✅ Unified account sign-in successful")

                    try:
                        fresh_user_response = admin_supabase.auth.admin.get_user_by_id(final_signin.user.id)
                        if fresh_user_response and fresh_user_response.user:
                            fresh_user = fresh_user_response.user
                            return jsonify({
                                "user": {
                                    "id": fresh_user.id,
                                    "email": fresh_user.email,
                                    "name": fresh_user.user_metadata.get("full_name", name),
                                    "createdAt": fresh_user.created_at
                                },
                                "token": final_signin.session.access_token
                            }), 200
                    except Exception as e:
                        print(f"[GOOGLE AUTH] ⚠️ Fresh user fetch failed (non-critical): {str(e)}")

                    return jsonify({
                        "user": {
                            "id": final_signin.user.id,
                            "email": final_signin.user.email,
                            "name": final_signin.user.user_metadata.get("full_name", name),
                            "createdAt": final_signin.user.created_at
                        },
                        "token": final_signin.session.access_token
                    }), 200

                else:
                    print(f"[GOOGLE AUTH] No existing user found, creating new account...")
                    # User does not exist, create new account
                    signup_res = supabase.auth.sign_up({
                        "email": email,
                        "password": google_password,
                        "options": {
                            "data": {
                                "full_name": name,
                                "auth_provider": "google"
                            }
                        }
                    })
                    print(f"[GOOGLE AUTH] ✅ New account created")

                    user = signup_res.user
                    session = signup_res.session

                    if user:
                        try:
                            print(f"[GOOGLE AUTH] Creating user settings...")
                            user_settings_data = {
                                "user_id": user.id,
                                "profile": {
                                    "bio": "",
                                    "website": "",
                                    "location": ""
                                },
                                "preferences": {
                                    "emailNotifications": True,
                                    "browserNotifications": False,
                                    "galleryUpdates": True,
                                    "marketingEmails": False,
                                    "defaultGalleryVisibility": "private",
                                    "autoSave": True,
                                    "compressImages": True,
                                    "defaultThreshold": 80,
                                    "language": "en"
                                }
                            }
                            supabase.table('user_settings').insert(user_settings_data).execute()
                            print(f"[GOOGLE AUTH] ✅ User settings created")
                        except Exception as settings_error:
                            print(f"[GOOGLE AUTH] ⚠️ User settings creation failed (non-critical): {str(settings_error)}")

                    if session and session.access_token:
                        try:
                            fresh_user_response = admin_supabase.auth.admin.get_user_by_id(user.id)
                            if fresh_user_response and fresh_user_response.user:
                                fresh_user = fresh_user_response.user
                                print(f"[GOOGLE AUTH] ✅ New user account fully set up")
                                return jsonify({
                                    "user": {
                                        "id": fresh_user.id,
                                        "email": fresh_user.email,
                                        "name": fresh_user.user_metadata.get("full_name", name),
                                        "createdAt": fresh_user.created_at
                                    },
                                    "token": session.access_token
                                }), 201
                        except Exception as e:
                            print(f"[GOOGLE AUTH] ⚠️ Fresh user fetch failed (non-critical): {str(e)}")

                        return jsonify({
                            "user": {
                                "id": user.id,
                                "email": user.email,
                                "name": user.user_metadata.get("full_name", name),
                                "createdAt": user.created_at
                            },
                            "token": session.access_token
                        }), 201
                    else:
                        print(f"[GOOGLE AUTH] No session token after signup, attempting sign-in...")
                        try:
                            signin_res = supabase.auth.sign_in_with_password({
                                "email": email,
                                "password": google_password
                            })
                            print(f"[GOOGLE AUTH] ✅ Post-signup sign-in successful")
                            
                            try:
                                fresh_user_response = admin_supabase.auth.admin.get_user_by_id(signin_res.user.id)
                                if fresh_user_response and fresh_user_response.user:
                                    fresh_user = fresh_user_response.user
                                    return jsonify({
                                        "user": {
                                            "id": fresh_user.id,
                                            "email": fresh_user.email,
                                            "name": fresh_user.user_metadata.get("full_name", name),
                                            "createdAt": fresh_user.created_at
                                        },
                                        "token": signin_res.session.access_token
                                    }), 201
                            except Exception as e:
                                print(f"[GOOGLE AUTH] ⚠️ Fresh user fetch failed (non-critical): {str(e)}")

                            return jsonify({
                                "user": {
                                    "id": signin_res.user.id,
                                    "email": signin_res.user.email,
                                    "name": signin_res.user.user_metadata.get("full_name", name),
                                    "createdAt": signin_res.user.created_at
                                },
                                "token": signin_res.session.access_token
                            }), 201
                        except Exception as post_signin_error:
                            print(f"[GOOGLE AUTH] ❌ Post-signup sign-in failed")
                            print(f"[GOOGLE AUTH] Error type: {type(post_signin_error).__name__}")
                            print(f"[GOOGLE AUTH] Error: {str(post_signin_error)}")
                            return jsonify({
                                "error": "Account created but email confirmation may be required. Please check your email or try logging in with email/password.",
                                "details": str(post_signin_error)
                            }), 500

            except Exception as lookup_error:
                print(f"[GOOGLE AUTH] ❌ CRITICAL: Account lookup/creation failed")
                print(f"[GOOGLE AUTH] Error type: {type(lookup_error).__name__}")
                print(f"[GOOGLE AUTH] Error: {str(lookup_error)}")
                import traceback
                print(f"[GOOGLE AUTH] Traceback: {traceback.format_exc()}")
                return jsonify({
                    "error": f"Authentication error: {str(lookup_error)}",
                    "errorType": type(lookup_error).__name__,
                    "step": "account_lookup_or_creation"
                }), 500

    except Exception as e:
        error_message = str(e)
        error_type = type(e).__name__
        print(f"[GOOGLE AUTH] ❌ CRITICAL TOP-LEVEL ERROR")
        print(f"[GOOGLE AUTH] Error type: {error_type}")
        print(f"[GOOGLE AUTH] Error message: {error_message}")
        import traceback
        print(f"[GOOGLE AUTH] Full traceback:")
        print(traceback.format_exc())
        
        return jsonify({
            "error": f"Server error: {error_message}",
            "errorType": error_type,
            "step": "google_auth_handler",
            "details": "Check Vercel runtime logs for full traceback"
        }), 500


@app.route("/api/auth/signup", methods=["POST"])
def signup():
    """
    Handle user signup.
    Expects JSON body with: { "email": "", "password": "", "name": "" }

    Also unifies with Google accounts if they previously registered via Google.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing JSON data"}), 400

        email = data.get("email")
        password = data.get("password")
        name = data.get("name")

        if not email or not password or not name:
            return jsonify({"error": "Missing required fields (email, password, name)"}), 400

        # First, check if this email already exists (may be a Google user)
        try:
            users_response = admin_supabase.auth.admin.list_users()
            existing_user = None

            if users_response:
                for u in users_response:
                    if u.email == email:
                        existing_user = u
                        break

            if existing_user:
                print(f"User {email} already exists from Google auth, unifying account...")

                # Update password and mark as unified
                admin_supabase.auth.admin.update_user_by_id(
                    existing_user.id,
                    {
                        "password": password,
                        "user_metadata": {
                            "full_name": existing_user.user_metadata.get("full_name", name),
                            "auth_provider": "unified"
                        }
                    }
                )

                # Sign in now with new password
                res = supabase.auth.sign_in_with_password({
                    "email": email,
                    "password": password
                })

                try:
                    fresh_user_response = admin_supabase.auth.admin.get_user_by_id(res.user.id)
                    if fresh_user_response and fresh_user_response.user:
                        fresh_user = fresh_user_response.user
                        return jsonify({
                            "user": {
                                "id": fresh_user.id,
                                "email": fresh_user.email,
                                "name": fresh_user.user_metadata.get("full_name", name),
                                "createdAt": fresh_user.created_at
                            },
                            "token": res.session.access_token,
                            "message": "Account linked successfully"
                        }), 200
                except Exception as e:
                    print(f"Error fetching fresh user data: {e}")

                return jsonify({
                    "user": {
                        "id": res.user.id,
                        "email": res.user.email,
                        "name": res.user.user_metadata.get("full_name", name),
                        "createdAt": res.user.created_at
                    },
                    "token": res.session.access_token,
                    "message": "Account linked successfully"
                }), 200
        except Exception as e:
            print(f"Error checking existing user: {e}")

        # Create a new user in Supabase Auth
        res = supabase.auth.sign_up({
            "email": email,
            "password": password,
            "options": {
                "data": {
                    "full_name": name,
                    "auth_provider": "email"
                }
            }
        })

        user = res.user
        session = res.session

        # Create user settings entry
        if user:
            try:
                user_settings_data = {
                    "user_id": user.id,
                    "profile": {
                        "bio": "",
                        "website": "",
                        "location": ""
                    },
                    "preferences": {
                        "emailNotifications": True,
                        "browserNotifications": False,
                        "galleryUpdates": True,
                        "marketingEmails": False,
                        "defaultGalleryVisibility": "private",
                        "autoSave": True,
                        "compressImages": True,
                        "defaultThreshold": 80,
                        "language": "en"
                    }
                }
                supabase.table('user_settings').insert(user_settings_data).execute()
            except Exception as e:
                print(f"Error creating user settings: {e}")

        if session:
            try:
                fresh_user_response = supabase.auth.admin.get_user_by_id(user.id)
                if fresh_user_response and fresh_user_response.user:
                    fresh_user = fresh_user_response.user
                    return jsonify({
                        "user": {
                            "id": fresh_user.id,
                            "email": fresh_user.email,
                            "name": fresh_user.user_metadata.get("full_name", name),
                            "createdAt": fresh_user.created_at
                        },
                        "token": session.access_token
                    }), 201
            except Exception as e:
                print(f"Error fetching fresh user data: {e}")

            return jsonify({
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "name": user.user_metadata.get("full_name", name),
                    "createdAt": user.created_at
                },
                "token": session.access_token
            }), 201
        elif user:
            return jsonify({
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "name": user.user_metadata.get("full_name", name),
                    "createdAt": user.created_at
                },
                "message": "Signup successful. Please check your email to confirm."
            }), 201
        else:
            return jsonify({"error": "Signup failed for an unknown reason"}), 500

    except Exception as e:
        error_message = str(e)
        if "User already registered" in error_message:
            return jsonify({"error": "User with this email already exists"}), 409

        print(f"Error during signup: {e}")
        return jsonify({"error": error_message}), 500


@app.route("/api/auth/login", methods=["POST"])
def login():
    """
    Handle user login.
    Expects JSON body with: { "email": "", "password": "" }
    Unifies Google and email/password login.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing JSON data"}), 400

        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return jsonify({"error": "Missing required fields (email, password)"}), 400

        # Sign in the user
        res = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })

        user = res.user
        session = res.session

        # Mark account as unified if they log in via email/password (even if originally Google)
        try:
            current_provider = user.user_metadata.get("auth_provider", "")
            if current_provider != "unified":
                supabase.auth.admin.update_user_by_id(
                    user.id,
                    {"user_metadata": {
                        "full_name": user.user_metadata.get("full_name", ""),
                        "auth_provider": "unified"
                    }}
                )
        except Exception:
            pass  # non-critical

        try:
            fresh_user_response = admin_supabase.auth.admin.get_user_by_id(user.id)
            if fresh_user_response and fresh_user_response.user:
                fresh_user = fresh_user_response.user
                return jsonify({
                    "user": {
                        "id": fresh_user.id,
                        "email": fresh_user.email,
                        "name": fresh_user.user_metadata.get("full_name", ""),
                        "createdAt": fresh_user.created_at
                    },
                    "token": session.access_token
                }), 200
            else:
                return jsonify({
                    "user": {
                        "id": user.id,
                        "email": user.email,
                        "name": user.user_metadata.get("full_name", ""),
                        "createdAt": user.created_at
                    },
                    "token": session.access_token
                }), 200
        except Exception:
            # Fallback to token user data
            return jsonify({
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "name": user.user_metadata.get("full_name", ""),
                    "createdAt": user.created_at
                },
                "token": session.access_token
            }), 200

    except Exception as e:
        error_message = str(e)

        if "Invalid login credentials" in error_message:
            return jsonify({"error": "Invalid email or password"}), 401

        print(f"[ERROR] Login error: {error_message}")
        return jsonify({"error": error_message}), 500


@app.route("/api/auth/logout", methods=["POST"])
def logout():
    """Handle user logout"""
    return jsonify({"message": "Logged out successfully"}), 200


@app.route("/api/auth/me", methods=["GET"])
def get_current_user():
    """Get current user info with latest metadata (reads name from user_settings for RLS safety)"""
    user = get_user_from_token()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    try:
        # Try to read name from user_settings first (RLS safe)
        user_settings_result = supabase.table('user_settings').select('profile').eq('user_id', user.id).execute()
        name_from_settings = ""
        if user_settings_result.data and 'profile' in user_settings_result.data[0]:
            # If `name` exists in profile, prefer it
            name_from_settings = user_settings_result.data[0]['profile'].get("name", "")

        # Fallback: try admin API to get Auth metadata (may fail if RLS/service_role not allowed, so non-fatal)
        name_from_auth = ""
        try:
            fresh_user_response = admin_supabase.auth.admin.get_user_by_id(user.id)
            if fresh_user_response and fresh_user_response.user:
                name_from_auth = fresh_user_response.user.user_metadata.get("full_name", "")
        except Exception:
            pass  # non-critical

        # Choose name: prefer user_settings (so it's always available), fallback to Auth, fallback to empty
        final_name = name_from_settings or name_from_auth or user.user_metadata.get("full_name", "")

        return jsonify({
            "user": {
                "id": user.id,
                "email": user.email,
                "name": final_name,
                "createdAt": user.created_at
            }
        }), 200

    except Exception as e:
        print(f"[ERROR] /api/auth/me failed: {e}")
        # Fallback to token user
        return jsonify({
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.user_metadata.get("full_name", ""),
                "createdAt": user.created_at
            }
        }), 200


# ==================== User Settings Routes ====================

@app.route("/api/user/settings", methods=["GET"])
def get_user_settings():
    """Get user settings"""
    user = get_user_from_token()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        # Fetch user settings
        result = supabase.table('user_settings').select('*').eq('user_id', user.id).execute()
        
        if result.data and len(result.data) > 0:
            settings = result.data[0]
            # Include user info
            return jsonify({
                "profile": settings.get('profile', {}),
                "preferences": settings.get('preferences', {})
            }), 200
        else:
            # Create default settings if not exist
            default_settings = {
                "user_id": user.id,
                "profile": {
                    "bio": "",
                    "website": "",
                    "location": ""
                },
                "preferences": {
                    "emailNotifications": True,
                    "browserNotifications": False,
                    "galleryUpdates": True,
                    "marketingEmails": False,
                    "defaultGalleryVisibility": "private",
                    "autoSave": True,
                    "compressImages": True,
                    "defaultThreshold": 80,
                    "language": "en"
                }
            }
            result = supabase.table('user_settings').insert(default_settings).execute()
            return jsonify({
                "profile": default_settings["profile"],
                "preferences": default_settings["preferences"]
            }), 200
    
    except Exception as e:
        print(f"Error fetching user settings: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/user/profile", methods=["PUT"])
def update_user_profile():
    """Update user profile information"""
    user = get_user_from_token()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing JSON data"}), 400

        # Get current settings
        result = supabase.table('user_settings').select('*').eq('user_id', user.id).execute()

        # Prepare profile data for user_settings table
        profile_data = {
            "name": data.get("name", ""),  # Store name in user_settings
            "bio": data.get("bio", ""),
            "website": data.get("website", ""),
            "location": data.get("location", "")
        }

        if result.data and len(result.data) > 0:
            # Update existing
            supabase.table('user_settings').update({"profile": profile_data}).eq('user_id', user.id).execute()
        else:
            # Create new
            supabase.table('user_settings').insert({
                "user_id": user.id,
                "profile": profile_data,
                "preferences": {
                    "emailNotifications": True,
                    "browserNotifications": False,
                    "galleryUpdates": True,
                    "marketingEmails": False,
                    "defaultGalleryVisibility": "private",
                    "autoSave": True,
                    "compressImages": True,
                    "defaultThreshold": 80,
                    "language": "en"
                }
            }).execute()

        # ALSO TRY to update auth metadata (best effort - won't fail if it doesn't work, and runs AFTER user_settings updates)
        if "name" in data and data["name"]:
            try:
                admin_supabase.auth.admin.update_user_by_id(
                    uid=user.id,
                    attributes={"user_metadata": {"full_name": data["name"]}}
                )
            except Exception:
                pass  # non-critical

        # Return the updated name in the response
        response_data = {
            "message": "Profile updated successfully",
            "profile": profile_data
        }
        if "name" in data:
            response_data["name"] = data["name"]

        return jsonify(response_data), 200

    except Exception as e:
        print(f"[ERROR] /api/user/profile failed: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/user/preferences", methods=["PUT"])
def update_user_preferences():
    """Update user preferences"""
    user = get_user_from_token()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing JSON data"}), 400
        
        # Get current settings
        result = supabase.table('user_settings').select('*').eq('user_id', user.id).execute()
        
        if result.data and len(result.data) > 0:
            # Update existing
            supabase.table('user_settings').update({"preferences": data}).eq('user_id', user.id).execute()
        else:
            # Create new
            supabase.table('user_settings').insert({
                "user_id": user.id,
                "preferences": data
            }).execute()
        
        return jsonify({"message": "Preferences updated successfully", "preferences": data}), 200
    
    except Exception as e:
        print(f"Error updating preferences: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/user/change-password", methods=["POST"])
def change_password():
    """Change user password"""
    user = get_user_from_token()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing JSON data"}), 400
        
        current_password = data.get("currentPassword")
        new_password = data.get("newPassword")
        
        if not current_password or not new_password:
            return jsonify({"error": "Missing required fields"}), 400
        
        if len(new_password) < 6:
            return jsonify({"error": "Password must be at least 6 characters"}), 400
        
        # Verify current password by trying to sign in
        try:
            supabase.auth.sign_in_with_password({
                "email": user.email,
                "password": current_password
            })
        except Exception as e:
            return jsonify({"error": "Current password is incorrect"}), 401
        
        # Update password
        try:
            admin_supabase.auth.admin.update_user_by_id(
                user.id,
                {"password": new_password}
            )
            return jsonify({"message": "Password changed successfully"}), 200
        except Exception as e:
            print(f"Error updating password: {e}")
            return jsonify({"error": "Failed to update password"}), 500
    
    except Exception as e:
        print(f"Error changing password: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/user/export-data", methods=["GET"])
def export_user_data():
    """Export all user data"""
    user = get_user_from_token()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        # Fetch all user galleries
        result = supabase.table('galleries').select('*').eq('user_id', user.id).execute()
        
        galleries = result.data if result.data else []
        
        # Fetch images for each gallery
        for gallery in galleries:
            images_result = supabase.table('images').select('*').eq('gallery_id', gallery['id']).execute()
            gallery['images'] = images_result.data if images_result.data else []
        
        # Fetch user settings
        settings_result = supabase.table('user_settings').select('*').eq('user_id', user.id).execute()
        settings = settings_result.data[0] if settings_result.data else {}
        
        # Compile export data
        export_data = {
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.user_metadata.get("full_name", ""),
                "created_at": user.created_at
            },
            "settings": settings,
            "galleries": galleries,
            "export_date": datetime.utcnow().isoformat()
        }
        
        return jsonify(export_data), 200
    
    except Exception as e:
        print(f"Error exporting data: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/user/account", methods=["DELETE"])
def delete_user_account():
    """Delete user account and all associated data"""
    user = get_user_from_token()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        # Get all galleries
        galleries_result = supabase.table('galleries').select('*').eq('user_id', user.id).execute()
        galleries = galleries_result.data if galleries_result.data else []
        
        # Delete all images from storage
        for gallery in galleries:
            images_result = supabase.table('images').select('url').eq('gallery_id', gallery['id']).execute()
            if images_result.data:
                for image in images_result.data:
                    try:
                        # Extract file path from URL
                        url = image['url']
                        if STORAGE_BUCKET in url:
                            file_path = url.split(f"{STORAGE_BUCKET}/")[-1].split("?")[0]
                            supabase.storage.from_(STORAGE_BUCKET).remove([file_path])
                    except Exception as e:
                        print(f"Error deleting image from storage: {e}")
        
        # Delete user settings
        supabase.table('user_settings').delete().eq('user_id', user.id).execute()
        
        # Delete galleries (cascade will delete images from database)
        supabase.table('galleries').delete().eq('user_id', user.id).execute()
        
        # Delete user from auth
        try:
            admin_supabase.auth.admin.delete_user(user.id)
        except Exception as e:
            print(f"Error deleting user from auth: {e}")
        
        return jsonify({"message": "Account deleted successfully"}), 200
    
    except Exception as e:
        print(f"Error deleting account: {e}")
        return jsonify({"error": str(e)}), 500


# ==================== Gallery Routes ====================

@app.route("/api/galleries", methods=["GET"])
def list_galleries():
    """List all galleries for the authenticated user"""
    user = get_user_from_token()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        # Fetch galleries for this user
        result = supabase.table('galleries').select('*').eq('user_id', user.id).order('created_at', desc=True).execute()
        
        galleries = result.data if result.data else []
        
        # Update image_count for each gallery
        for gallery in galleries:
            images_result = supabase.table('images').select('id').eq('gallery_id', gallery['id']).execute()
            gallery['image_count'] = len(images_result.data) if images_result.data else 0
        
        return jsonify(galleries), 200
    
    except Exception as e:
        print(f"Error fetching galleries: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/galleries", methods=["POST"])
def create_gallery():
    """Create a new gallery - ONE GALLERY PER USER CONSTRAINT"""
    user = get_user_from_token()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        # CHECK: Enforce one gallery per user constraint
        existing_galleries = supabase.table('galleries').select('id').eq('user_id', user.id).execute()
        if existing_galleries.data and len(existing_galleries.data) > 0:
            return jsonify({
                "error": "You already have a portfolio. Only one portfolio is allowed per account.",
                "existingGalleryId": existing_galleries.data[0]['id']
            }), 400
        
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing JSON data"}), 400
        
        name = data.get("name")
        description = data.get("description", "")
        config = data.get("config", {
            "threshold": 80,
            "animationType": "fade",
            "mood": "calm"
        })
        
        if not name:
            return jsonify({"error": "Gallery name is required"}), 400
        
        # Generate slug
        slug = generate_slug(name, user.id)
        
        # Create gallery in database
        gallery_data = {
            "user_id": user.id,
            "name": name,
            "description": description,
            "slug": slug,
            "status": "draft",
            "image_count": 0,
            "config": config,
            "analysis_complete": False
        }
        
        result = supabase.table('galleries').insert(gallery_data).execute()
        
        if result.data:
            return jsonify(result.data[0]), 201
        else:
            return jsonify({"error": "Failed to create gallery"}), 500
    
    except Exception as e:
        print(f"Error creating gallery: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/galleries/<gallery_id>", methods=["GET"])
def get_gallery(gallery_id):
    """Get a single gallery with its images"""
    user = get_user_from_token()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        # Fetch gallery
        gallery_result = supabase.table('galleries').select('*').eq('id', gallery_id).eq('user_id', user.id).execute()
        
        if not gallery_result.data:
            return jsonify({"error": "Gallery not found"}), 404
        
        gallery = gallery_result.data[0]
        
        # Fetch images for this gallery
        images_result = supabase.table('images').select('*').eq('gallery_id', gallery_id).order('order_index').execute()
        
        gallery['images'] = images_result.data if images_result.data else []
        
        # Update image_count to match actual count
        gallery['image_count'] = len(gallery['images'])
        
        return jsonify(gallery), 200
    
    except Exception as e:
        print(f"Error fetching gallery: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/galleries/<gallery_id>", methods=["PUT", "PATCH"])
def update_gallery(gallery_id):
    """Update a gallery"""
    user = get_user_from_token()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing JSON data"}), 400

        # Verify ownership
        gallery_result = supabase.table('galleries').select('*').eq('id', gallery_id).eq('user_id', user.id).execute()
        if not gallery_result.data:
            return jsonify({"error": "Gallery not found"}), 404

        current_gallery = gallery_result.data[0]
        current_config = current_gallery.get('config', {})

        # Prepare update data
        update_data = {}

        if "name" in data:
            update_data["name"] = data["name"]
            # Regenerate slug if name changed
            update_data["slug"] = generate_slug(data["name"], user.id)

        if "description" in data:
            update_data["description"] = data["description"]

        if "config" in data:
            # MERGE configs instead of replacing
            new_config = data["config"]
            merged_config = {**current_config, **new_config}
            update_data["config"] = merged_config

        if "status" in data:
            update_data["status"] = data["status"]

        # Update gallery
        result = supabase.table('galleries').update(update_data).eq('id', gallery_id).execute()
        if result.data:
            return jsonify(result.data[0]), 200
        else:
            return jsonify({"error": "Failed to update gallery"}), 500

    except Exception as e:
        print(f"Error updating gallery: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/galleries/<gallery_id>", methods=["DELETE"])
def delete_gallery(gallery_id):
    """Delete a gallery and all its images"""
    user = get_user_from_token()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        # Verify ownership
        gallery_result = supabase.table('galleries').select('*').eq('id', gallery_id).eq('user_id', user.id).execute()
        
        if not gallery_result.data:
            return jsonify({"error": "Gallery not found"}), 404
        
        # Get all images to delete from storage
        images_result = supabase.table('images').select('url').eq('gallery_id', gallery_id).execute()
        
        # Delete images from storage
        if images_result.data:
            for image in images_result.data:
                try:
                    # Extract file path from URL
                    url = image['url']
                    if STORAGE_BUCKET in url:
                        file_path = url.split(f"{STORAGE_BUCKET}/")[-1].split("?")[0]
                        supabase.storage.from_(STORAGE_BUCKET).remove([file_path])
                except Exception as e:
                    print(f"Error deleting image from storage: {e}")
        
        # Delete gallery (cascade will delete images from database)
        supabase.table('galleries').delete().eq('id', gallery_id).execute()
        
        return jsonify({"message": "Gallery deleted successfully"}), 200
    
    except Exception as e:
        print(f"Error deleting gallery: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/galleries/<gallery_id>/register-image", methods=["POST"])
def register_uploaded_image(gallery_id):
    """
    Register an image that was uploaded directly to Supabase Storage.
    This endpoint only receives metadata (URLs, dimensions), not the actual file.
    Bypasses Vercel's 4.5MB limit since payload is tiny (< 1KB).
    """
    user = get_user_from_token()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        # Verify gallery ownership
        gallery_result = supabase.table('galleries').select('*').eq('id', gallery_id).eq('user_id', user.id).execute()
        
        if not gallery_result.data:
            return jsonify({"error": "Gallery not found"}), 404
        
        gallery = gallery_result.data[0]
        
        # Get metadata from request (tiny JSON payload)
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing JSON data"}), 400
        
        url = data.get('url')
        storage_key = data.get('storageKey')
        file_name = data.get('fileName')
        file_size = data.get('size')
        width = data.get('width')
        height = data.get('height')
        
        if not url or not storage_key:
            return jsonify({"error": "Missing required fields (url, storageKey)"}), 400
        
        print(f"📝 [Register Image] Gallery: {gallery_id}, File: {file_name}, Size: {file_size} bytes")
        
        # Use same URL for thumbnail (Supabase can do transforms later)
        thumbnail_url = url
        
        # Get current max order index
        max_order_result = supabase.table('images').select('order_index').eq('gallery_id', gallery_id).order('order_index', desc=True).limit(1).execute()
        current_max_order = max_order_result.data[0]['order_index'] if max_order_result.data else -1
        
        # Prepare metadata
        metadata = {
            "width": width,
            "height": height,
            "size": file_size,
            "format": file_name.rsplit('.', 1)[1].lower() if '.' in file_name else 'unknown',
            "storage_key": storage_key
        }
        
        # Save image record to database
        image_data = {
            "gallery_id": gallery_id,
            "url": url,
            "thumbnail_url": thumbnail_url,
            "metadata": metadata,
            "order_index": current_max_order + 1
        }
        
        image_result = supabase.table('images').insert(image_data).execute()
        
        if not image_result.data:
            return jsonify({"error": "Failed to save image record"}), 500
        
        # Update gallery image count
        new_count = gallery['image_count'] + 1
        supabase.table('galleries').update({
            "image_count": new_count,
            "status": "processing" if new_count > 0 else gallery['status']
        }).eq('id', gallery_id).execute()
        
        print(f"✅ [Register Image] Success! Total images in gallery: {new_count}")
        
        return jsonify({
            "success": True,
            "image": image_result.data[0]
        }), 200
    
    except Exception as e:
        print(f"❌ [Register Image] Error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/galleries/<gallery_id>/upload", methods=["POST"])
def upload_images(gallery_id):
    """Upload images to a gallery"""
    user = get_user_from_token()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        # Verify ownership
        gallery_result = supabase.table('galleries').select('*').eq('id', gallery_id).eq('user_id', user.id).execute()
        
        if not gallery_result.data:
            return jsonify({"error": "Gallery not found"}), 404
        
        gallery = gallery_result.data[0]
        
        # Check if files were uploaded
        if 'images' not in request.files:
            return jsonify({"error": "No images provided"}), 400
        
        files = request.files.getlist('images')
        
        if not files or len(files) == 0:
            return jsonify({"error": "No images provided"}), 400
        
        # Check total image count
        if gallery['image_count'] + len(files) > 50:
            return jsonify({"error": "Maximum 50 images per gallery"}), 400
        
        uploaded_images = []
        
        # Get current max order index
        max_order_result = supabase.table('images').select('order_index').eq('gallery_id', gallery_id).order('order_index', desc=True).limit(1).execute()
        current_max_order = max_order_result.data[0]['order_index'] if max_order_result.data else -1
        
        for idx, file in enumerate(files):
            if file and allowed_file(file.filename):
                # Read file data
                file_data = file.read()
                
                # Check file size
                if len(file_data) > MAX_FILE_SIZE:
                    continue
                
                # Generate unique filename
                file_ext = file.filename.rsplit('.', 1)[1].lower()
                unique_filename = f"{user.id}/{gallery_id}/{uuid.uuid4()}.{file_ext}"
                
                try:
                    # Upload original image
                    supabase.storage.from_(STORAGE_BUCKET).upload(
                        unique_filename,
                        file_data,
                        file_options={"content-type": f"image/{file_ext}"}
                    )
                    
                    # Get public URL
                    image_url = supabase.storage.from_(STORAGE_BUCKET).get_public_url(unique_filename)
                    
                    # Create and upload thumbnail
                    thumbnail_data = create_thumbnail(file_data)
                    thumbnail_filename = None
                    thumbnail_url = None
                    
                    if thumbnail_data:
                        thumbnail_filename = f"{user.id}/{gallery_id}/thumbs/{uuid.uuid4()}.jpg"
                        supabase.storage.from_(STORAGE_BUCKET).upload(
                            thumbnail_filename,
                            thumbnail_data,
                            file_options={"content-type": "image/jpeg"}
                        )
                        thumbnail_url = supabase.storage.from_(STORAGE_BUCKET).get_public_url(thumbnail_filename)
                    
                    # Get image metadata (safe if Pillow unavailable)
                    metadata = {"size": len(file_data)}
                    if PIL_AVAILABLE:
                        try:
                            img = Image.open(io.BytesIO(file_data))
                            metadata.update({
                                "width": img.width,
                                "height": img.height,
                                "format": img.format
                            })
                        except Exception as meta_err:
                            print(f"Pillow metadata read failed: {meta_err}")
                    
                    # Save image record to database
                    image_data = {
                        "gallery_id": gallery_id,
                        "url": image_url,
                        "thumbnail_url": thumbnail_url,
                        "metadata": metadata,
                        "order_index": current_max_order + idx + 1
                    }
                    
                    image_result = supabase.table('images').insert(image_data).execute()
                    
                    if image_result.data:
                        uploaded_images.append(image_result.data[0])
                
                except Exception as e:
                    print(f"Error uploading image: {e}")
                    continue
        
        # Update gallery image_count and status
        new_image_count = gallery['image_count'] + len(uploaded_images)
        update_data = {"image_count": new_image_count}
        
        if uploaded_images and gallery['status'] == 'draft':
            update_data["status"] = "processing"
        
        supabase.table('galleries').update(update_data).eq('id', gallery_id).execute()
        
        return jsonify({
            "uploadedCount": len(uploaded_images),
            "images": uploaded_images
        }), 200
    
    except Exception as e:
        print(f"Error uploading images: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/galleries/<gallery_id>/analyze", methods=["POST"])
def analyze_gallery(gallery_id):
    """Analyze gallery (placeholder for future AI integration)"""
    user = get_user_from_token()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        # Verify ownership
        gallery_result = supabase.table('galleries').select('*').eq('id', gallery_id).eq('user_id', user.id).execute()
        
        if not gallery_result.data:
            return jsonify({"error": "Gallery not found"}), 404
        
        # For now, just mark as analyzed with default config
        # In the future, this will integrate with AI services
        config = {
            "threshold": 80,
            "animationType": "fade",
            "mood": "calm"
        }
        
        result = supabase.table('galleries').update({
            "status": "analyzed",
            "analysis_complete": True,
            "config": config
        }).eq('id', gallery_id).execute()
        
        return jsonify({
            "analysisComplete": True,
            "config": config,
            "message": "Gallery marked as analyzed. AI analysis coming soon!"
        }), 200
    
    except Exception as e:
        print(f"Error analyzing gallery: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/images/<image_id>/transform", methods=["PATCH"])
def update_image_transform(image_id):
    """Update image transformation metadata (crop, scale, rotation)"""
    user = get_user_from_token()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing JSON data"}), 400

        # First, get the image
        image_result = supabase.table('images').select('*').eq('id', image_id).execute()
        if not image_result.data:
            return jsonify({"error": "Image not found"}), 404

        current_image = image_result.data[0]
        gallery_id = current_image.get('gallery_id')

        # Now check gallery ownership
        gallery_result = supabase.table('galleries').select('user_id').eq('id', gallery_id).execute()
        if not gallery_result.data:
            return jsonify({"error": "Gallery not found"}), 404

        gallery_owner_id = gallery_result.data[0]['user_id']
        if gallery_owner_id != user.id:
            return jsonify({"error": "Unauthorized"}), 403

        # Get current metadata
        current_metadata = current_image.get('metadata', {})

        # Update transformation data
        transform_data = {
            'crop': data.get('crop'),  # {x, y, width, height, unit: 'px' or '%'}
            'scale': data.get('scale', 1.0),  # Scale factor (0.5 to 3.0)
            'rotation': data.get('rotation', 0)  # Degrees (0-360)
        }

        # Merge with existing metadata
        updated_metadata = {**current_metadata, 'transform': transform_data}

        # Update in database
        result = supabase.table('images').update({
            'metadata': updated_metadata
        }).eq('id', image_id).execute()

        if result.data:
            return jsonify({
                "success": True,
                "image": result.data[0]
            }), 200
        else:
            return jsonify({"error": "Failed to update image"}), 500

    except Exception as e:
        print(f"Error updating image transform: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/galleries/<gallery_id>/branding", methods=["PATCH"])
def update_gallery_branding(gallery_id):
    """Update gallery branding (custom name, email, social links)"""
    user = get_user_from_token()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing JSON data"}), 400

        # Verify ownership
        gallery_result = supabase.table('galleries').select('*').eq('id', gallery_id).eq('user_id', user.id).execute()

        if not gallery_result.data:
            return jsonify({"error": "Gallery not found"}), 404

        # Get current config
        current_gallery = gallery_result.data[0]
        current_config = current_gallery.get('config', {})
        current_branding = current_config.get('branding', {})

        # Update branding data - merge with existing
        updated_branding = {**current_branding}
        if 'customName' in data:
            updated_branding['customName'] = data['customName']
        if 'customNameLink' in data:
            updated_branding['customNameLink'] = data['customNameLink']
        if 'customEmail' in data:
            updated_branding['customEmail'] = data['customEmail']

        # Merge branding into config, preserving all other fields
        updated_config = {**current_config, 'branding': updated_branding}

        # Update in database
        result = supabase.table('galleries').update({
            'config': updated_config
        }).eq('id', gallery_id).execute()

        if result.data:
            return jsonify({
                "success": True,
                "gallery": result.data[0]
            }), 200
        else:
            return jsonify({"error": "Failed to update gallery branding"}), 500

    except Exception as e:
        print(f"[ERROR] /api/galleries/<gallery_id>/branding failed: {e}")
        return jsonify({"error": str(e)}), 500


# ==================== Public Routes ====================

@app.route("/api/public/<username>/<slug>", methods=["GET"])
def get_public_gallery(username, slug):
    """Get a published gallery by username and slug (public access)"""
    try:
        # First, we need to get user by email/username
        # For now, we'll search by slug and status=published
        # In production, you'd want a username field in auth.users
        
        gallery_result = supabase.table('galleries').select('*, images(*)').eq('slug', slug).eq('status', 'published').execute()
        
        if not gallery_result.data:
            return jsonify({"error": "Gallery not found or not published"}), 404
        
        gallery = gallery_result.data[0]
        
        # Get user info
        user_result = admin_supabase.auth.admin.get_user_by_id(gallery['user_id'])
        
        owner_info = {
            "username": user_result.user.email.split('@')[0] if user_result.user else "user",
            "name": user_result.user.user_metadata.get("full_name", "") if user_result.user else ""
        }
        
        # Format response
        response = {
            "id": gallery['id'],
            "name": gallery['name'],
            "description": gallery['description'],
            "owner": owner_info,
            "imageCount": gallery['image_count'],
            "images": gallery.get('images', []),
            "config": gallery['config'],
            "publishedAt": gallery['updated_at']
        }
        
        return jsonify(response), 200
    
    except Exception as e:
        print(f"Error fetching public gallery: {e}")
        return jsonify({"error": "Gallery not found"}), 404


@app.route("/api/gallery/<gallery_id>", methods=["GET"])
def get_public_gallery_by_id(gallery_id):
    """Get a published gallery by ID (public access, alternative route)"""
    try:
        gallery_result = supabase.table('galleries').select('*').eq('id', gallery_id).eq('status', 'published').execute()
        
        if not gallery_result.data:
            return jsonify({"error": "Gallery not found or not published"}), 404
        
        gallery = gallery_result.data[0]
        
        # Get images
        images_result = supabase.table('images').select('*').eq('gallery_id', gallery_id).order('order_index').execute()
        
        gallery['images'] = images_result.data if images_result.data else []
        
        # Get user info
        try:
            user_result = admin_supabase.auth.admin.get_user_by_id(gallery['user_id'])
            gallery['owner'] = {
                "username": user_result.user.email.split('@')[0] if user_result.user else "user",
                "name": user_result.user.user_metadata.get("full_name", "") if user_result.user else ""
            }
        except:
            gallery['owner'] = {"username": "user", "name": ""}
        
        return jsonify(gallery), 200
    
    except Exception as e:
        print(f"Error fetching public gallery: {e}")
        return jsonify({"error": "Gallery not found"}), 404


# ==================== Error Handlers ====================

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Endpoint not found"}), 404


@app.errorhandler(500)
def internal_error(e):
    return jsonify({"error": "Internal server error"}), 500


if __name__ == "__main__":
    # Get port from environment variable (Render sets this automatically)
    port = int(os.environ.get('PORT', 8000))
    # Run the app on the port Render provides
    app.run(host='0.0.0.0', port=port, debug=False)