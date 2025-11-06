import os
import re
import uuid
from datetime import datetime
from flask import Flask, request, jsonify
from supabase import create_client, Client
from dotenv import load_dotenv
from flask_cors import CORS
from werkzeug.utils import secure_filename
from PIL import Image
import io

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
# Enable CORS for all routes, allowing your React app to make requests
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Get Supabase URL and Key from environment variables
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in the .env file")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Configuration
STORAGE_BUCKET = "gallery-images"
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp'}
THUMBNAIL_SIZE = (400, 400)


# ==================== Utility Functions ====================

def get_user_from_token():
    """Extract user from Authorization header"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header.replace('Bearer ', '')
    try:
        # Get user from token
        user = supabase.auth.get_user(token)
        return user.user if user else None
    except Exception as e:
        print(f"Token validation error: {e}")
        return None


def get_token_from_request():
    """Extract just the token from Authorization header"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    return auth_header.replace('Bearer ', '')

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
    """Create a thumbnail from image data"""
    try:
        img = Image.open(io.BytesIO(image_data))
        img.thumbnail(THUMBNAIL_SIZE, Image.Resampling.LANCZOS)
        
        # Convert to RGB if necessary (for PNG with transparency)
        if img.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
            img = background
        
        # Save to bytes
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
    return jsonify({"message": "CursorGallery API is running!", "version": "1.0.0"})


@app.route("/api/auth/signup", methods=["POST"])
def signup():
    """
    Handle user signup.
    Expects JSON body with: { "email": "", "password": "", "name": "" }
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

        # Create a new user in Supabase Auth
        res = supabase.auth.sign_up({
            "email": email,
            "password": password,
            "options": {
                "data": {
                    "full_name": name
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
    """
    try:
        print("=" * 50)
        print("Login attempt received")
        
        data = request.get_json()
        if not data:
            print("Error: Missing JSON data")
            return jsonify({"error": "Missing JSON data"}), 400

        email = data.get("email")
        password = data.get("password")
        
        print(f"Email: {email}")

        if not email or not password:
            print("Error: Missing email or password")
            return jsonify({"error": "Missing required fields (email, password)"}), 400

        # Sign in the user
        print("Attempting Supabase sign in...")
        res = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
        
        print("Sign in successful!")
        user = res.user
        session = res.session

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
        print(f"Login error: {error_message}")
        print(f"Error type: {type(e).__name__}")
        
        if "Invalid login credentials" in error_message:
            return jsonify({"error": "Invalid email or password"}), 401

        return jsonify({"error": error_message}), 500


@app.route("/api/auth/logout", methods=["POST"])
def logout():
    """Handle user logout"""
    return jsonify({"message": "Logged out successfully"}), 200


@app.route("/api/auth/me", methods=["GET"])
def get_current_user():
    """Get current user info with latest metadata"""
    user = get_user_from_token()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        # Fetch latest user data from Supabase to get updated metadata
        fresh_user = supabase.auth.admin.get_user_by_id(user.id)
        if fresh_user and fresh_user.user:
            return jsonify({
                "user": {
                    "id": fresh_user.user.id,
                    "email": fresh_user.user.email,
                    "name": fresh_user.user.user_metadata.get("full_name", ""),
                    "createdAt": fresh_user.user.created_at
                }
            }), 200
        else:
            # Fallback to token user
            return jsonify({
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "name": user.user_metadata.get("full_name", ""),
                    "createdAt": user.created_at
                }
            }), 200
    except Exception as e:
        print(f"Error fetching user: {e}")
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
        
        print(f"Updating profile for user {user.id}")
        print(f"Data received: {data}")
        
        # Update auth metadata if name changed
        if "name" in data:
            try:
                print(f"Updating user name to: {data['name']}")
                supabase.auth.admin.update_user_by_id(
                    user.id,
                    {"user_metadata": {"full_name": data["name"]}}
                )
                print("Name updated successfully in auth")
            except Exception as e:
                print(f"Error updating auth metadata: {e}")
        
        # Get current settings
        result = supabase.table('user_settings').select('*').eq('user_id', user.id).execute()
        
        profile_data = {
            "bio": data.get("bio", ""),
            "website": data.get("website", ""),
            "location": data.get("location", "")
        }
        
        print(f"Updating profile data: {profile_data}")
        
        if result.data and len(result.data) > 0:
            # Update existing
            supabase.table('user_settings').update({"profile": profile_data}).eq('user_id', user.id).execute()
        else:
            # Create new
            supabase.table('user_settings').insert({
                "user_id": user.id,
                "profile": profile_data
            }).execute()
        
        print("Profile updated successfully")
        return jsonify({"message": "Profile updated successfully", "profile": profile_data}), 200
    
    except Exception as e:
        print(f"Error updating profile: {e}")
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
            supabase.auth.admin.update_user_by_id(
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
            supabase.auth.admin.delete_user(user.id)
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
        
        return jsonify(galleries), 200
    
    except Exception as e:
        print(f"Error fetching galleries: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/galleries", methods=["POST"])
def create_gallery():
    """Create a new gallery"""
    user = get_user_from_token()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
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
        
        # Prepare update data
        update_data = {}
        
        if "name" in data:
            update_data["name"] = data["name"]
            # Regenerate slug if name changed
            update_data["slug"] = generate_slug(data["name"], user.id)
        
        if "description" in data:
            update_data["description"] = data["description"]
        
        if "config" in data:
            update_data["config"] = data["config"]
        
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
                    
                    # Get image metadata
                    img = Image.open(io.BytesIO(file_data))
                    metadata = {
                        "width": img.width,
                        "height": img.height,
                        "size": len(file_data),
                        "format": img.format
                    }
                    
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
        
        # Update gallery status
        if uploaded_images and gallery['status'] == 'draft':
            supabase.table('galleries').update({"status": "processing"}).eq('id', gallery_id).execute()
        
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
        user_result = supabase.auth.admin.get_user_by_id(gallery['user_id'])
        
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
            user_result = supabase.auth.admin.get_user_by_id(gallery['user_id'])
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
    # Run the app on port 8000 to match frontend expectations
    app.run(host='0.0.0.0', port=8000, debug=True)