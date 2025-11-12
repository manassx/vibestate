from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/')
@app.route('/api/test')
def test():
    return jsonify({"status": "alive", "message": "Minimal test endpoint works"}), 200