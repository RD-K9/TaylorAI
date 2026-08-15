import os
import time
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, g, jsonify, request, send_from_directory
from flask_cors import CORS

from routes.ai_logs import bp as ai_logs_bp
from routes.generate_garment import bp as generate_bp
from routes.health import bp as health_bp
from routes.temp_image import bp as temp_bp
from routes.try_on import bp as tryon_bp
from routes.validate_fabric import bp as validate_bp

from utils.api_logger import get_request_logs, reset_request_logs
from utils.response_helpers import error_response

load_dotenv()

app = Flask(__name__, static_folder=None)

origins_raw = os.getenv(
    "FRONTEND_ORIGIN",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8080,http://127.0.0.1:8080,http://localhost:4173,https://rd-k9.github.io",
)
CORS(app, origins=[o.strip() for o in origins_raw.split(",") if o.strip()])


@app.before_request
def start_timer():
    g.start = time.time()
    if request.path.startswith("/api/") and request.path != "/api/ai-logs":
        reset_request_logs()


@app.after_request
def log_request(response):
    duration = int((time.time() - getattr(g, "start", time.time())) * 1000)
    print(f"{request.method} {request.path} -> {response.status_code} ({duration}ms)")
    return response


app.register_blueprint(health_bp, url_prefix="/api")
app.register_blueprint(validate_bp, url_prefix="/api")
app.register_blueprint(generate_bp, url_prefix="/api")
app.register_blueprint(tryon_bp, url_prefix="/api")
app.register_blueprint(temp_bp, url_prefix="/api")
app.register_blueprint(ai_logs_bp, url_prefix="/api")

FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"
SERVE_FRONTEND = os.getenv("SERVE_FRONTEND", "false").lower() == "true"


if SERVE_FRONTEND and FRONTEND_DIST.exists():

    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_frontend(path):
        if path.startswith("api/"):
            return jsonify({"error": {"code": "NOT_FOUND", "message": "Không tìm thấy endpoint."}}), 404
        target = FRONTEND_DIST / path
        if path and target.is_file():
            return send_from_directory(FRONTEND_DIST, path)
        return send_from_directory(FRONTEND_DIST, "index.html")


@app.errorhandler(Exception)
def handle_unexpected(err):
    if request.path.startswith("/api"):
        logs = get_request_logs()
        from utils.errors import FashionError

        print(f"Unhandled API error: {err}")
        return error_response(
            FashionError("INTERNAL_ERROR", str(err) or "Lỗi máy chủ nội bộ.", 500, debug_log=logs)
        )
    raise err


@app.errorhandler(404)
def not_found(_):
    if request.path.startswith("/api"):
        return jsonify({"error": {"code": "NOT_FOUND", "message": "Không tìm thấy endpoint."}}), 404
    if SERVE_FRONTEND and FRONTEND_DIST.exists():
        return send_from_directory(FRONTEND_DIST, "index.html")
    return jsonify({"error": {"code": "NOT_FOUND", "message": "Không tìm thấy endpoint."}}), 404


if __name__ == "__main__":
    port = int(os.getenv("PORT", "3000"))
    debug = os.getenv("FLASK_DEBUG", "true").lower() == "true"
    print(f"Server running at http://localhost:{port}")
    if SERVE_FRONTEND:
        print(f"Serving frontend from {FRONTEND_DIST}")
    app.run(host="0.0.0.0", port=port, debug=debug)
