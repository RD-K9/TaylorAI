from flask import Blueprint, jsonify, request

from utils.api_logger import export_logs_text, get_recent_logs, read_log_file

bp = Blueprint("ai_logs", __name__)


@bp.route("/ai-logs", methods=["GET"])
def ai_logs():
    limit = min(int(request.args.get("limit", 50)), 500)
    source = request.args.get("source", "memory")
    if source == "file":
        logs = read_log_file(limit)
    else:
        logs = get_recent_logs(limit)
    return jsonify({
        "count": len(logs),
        "logs": logs,
        "logText": export_logs_text(logs),
    })
