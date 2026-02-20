"""
Flask API server for Route Optimization.
"""

import os
import shutil
import tempfile
from flask import Flask, request, jsonify
from flask_cors import CORS
from optimizer import optimize_routes

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@app.route('/', methods=['GET'])
def index():
    return jsonify({
        "name": "RouteAI Optimizer API",
        "status": "running",
        "endpoints": [
            "GET  /api/health",
            "POST /api/optimize?clusters=20",
            "GET  /api/optimize/demo?clusters=20",
        ]
    })


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "message": "Route Optimizer API is running"})


@app.route('/api/optimize', methods=['POST'])
def optimize():
    """
    Accept an Excel file upload and run route optimization.
    Optional query param: clusters (default=20)
    """
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded. Send an Excel file with key 'file'."}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "Empty filename"}), 400

    if not file.filename.endswith(('.xlsx', '.xls')):
        return jsonify({"error": "Only .xlsx or .xls files are accepted"}), 400

    num_clusters = request.args.get('clusters', 20, type=int)
    cluster_size = request.args.get('cluster_size', None, type=int)

    # Save to temp file with unique name to avoid conflicts
    temp_path = os.path.join(UPLOAD_FOLDER, f"temp_{os.getpid()}_{file.filename}")
    file.save(temp_path)

    try:
        result = optimize_routes(temp_path, num_clusters=num_clusters, max_cluster_size=cluster_size)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        # Clean up — gracefully handle Windows file locks
        try:
            if os.path.exists(temp_path):
                os.remove(temp_path)
        except PermissionError:
            pass  # Windows may still hold the file; it'll be cleaned up later


@app.route('/api/optimize/demo', methods=['GET'])
def optimize_demo():
    """
    Run optimization on the bundled demo Excel file.
    """
    demo_path = os.path.join(os.path.dirname(__file__), '..', 'smart_route_optimization.xlsx')
    if not os.path.exists(demo_path):
        return jsonify({"error": "Demo Excel file not found"}), 404

    num_clusters = request.args.get('clusters', 20, type=int)
    cluster_size = request.args.get('cluster_size', None, type=int)

    try:
        result = optimize_routes(demo_path, num_clusters=num_clusters, max_cluster_size=cluster_size)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
