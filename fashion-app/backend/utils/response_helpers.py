from flask import jsonify

from utils.api_logger import export_logs_text, get_request_logs


def error_response(err, extra_message=None):
    logs = get_request_logs()
    if hasattr(err, "debug_log") and err.debug_log:
        logs = err.debug_log + logs
    body = {
        "error": {
            "code": err.code,
            "message": err.message,
        },
        "debugLog": logs,
        "debugLogText": export_logs_text(logs),
    }
    if extra_message:
        body["error"]["detail"] = extra_message
    return jsonify(body), err.status


def success_with_logs(data: dict):
    logs = get_request_logs()
    if logs:
        data = {**data, "debugLog": logs}
    return jsonify(data)
