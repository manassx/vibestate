import os
from flask import Flask, request, jsonify
from supabase import create_client, Client
from dotenv import load_dotenv
from flask_cors import CORS

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
# Enable CORS for all routes, allowing your React app to make requests
CORS(app)

# Get Supabase URL and Key from environment variables
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in the .env file")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


@app.route("/")
def home():
    """A simple route to check if the backend is running."""
    return jsonify({"message": "Auth backend is running!"})


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
        name = data.get("name")  # Get the name from the request

        if not email or not password or not name:
            return jsonify({"error": "Missing required fields (email, password, name)"}), 400

        # Create a new user in Supabase Auth
        # We store the 'name' in the user_metadata (options.data)
        res = supabase.auth.sign_up({
            "email": email,
            "password": password,
            "options": {
                "data": {
                    "full_name": name
                }
            }
        })

        # Supabase sign_up returns a user and session
        # If email confirmation is off, session will be present.
        # If email confirmation is on, session will be None, but user will be returned.

        user = res.user
        session = res.session

        if session:
            # User signed up and logged in (email confirmation likely off)
            return jsonify({
                "user": user.dict(),
                "token": session.access_token
            }), 201
        elif user:
            # User signed up but needs to confirm email
            return jsonify({
                "user": user.dict(),
                "message": "Signup successful. Please check your email to confirm."
            }), 201
        else:
            # This case should rarely be hit if Supabase is working correctly
            return jsonify({"error": "Signup failed for an unknown reason"}), 500

    except Exception as e:
        # Handle specific Supabase errors
        error_message = str(e)
        if "User already registered" in error_message:
            return jsonify({"error": "User with this email already exists"}), 409

        print(f"Error during signup: {e}")  # Log the full error for debugging
        return jsonify({"error": error_message}), 500


@app.route("/api/auth/login", methods=["POST"])
def login():
    """
    Handle user login.
    Expects JSON body with: { "email": "", "password": "" }
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

        # Successful login returns user and session
        user = res.user
        session = res.session

        return jsonify({
            "user": user.dict(),
            "token": session.access_token
        }), 200

    except Exception as e:
        # Handle specific errors
        error_message = str(e)
        if "Invalid login credentials" in error_message:
            return jsonify({"error": "Invalid email or password"}), 401

        print(f"Error during login: {e}")  # Log the full error for debugging
        return jsonify({"error": error_message}), 500


if __name__ == "__main__":
    # Run the app on port 5001 (to avoid conflict with React's dev server)
    app.run(port=5001, debug=True)