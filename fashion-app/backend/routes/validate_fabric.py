from flask import Blueprint, jsonify, request

from services.image_service import strip_data_url_prefix
from services.pollinations_service import validate_fabric
from utils.api_logger import export_logs_text, get_request_logs
from utils.errors import ERROR_MESSAGES, FashionError
from utils.response_helpers import error_response

bp = Blueprint("validate_fabric", __name__)


@bp.route("/validate-fabric", methods=["POST"])
def validate_fabric_route():
    try:
        data = request.get_json(force=True) or {}
        fabric = strip_data_url_prefix(data.get("fabricImageBase64", ""))
        clothes_type = data.get("clothesType", "")
        if not fabric or not clothes_type:
            return error_response(
                FashionError("MISSING_REQUIRED", "Thiếu ảnh vải hoặc loại quần áo.", 400)
            )

        result = validate_fabric(
            fabric,
            clothes_type,
            season_vi=data.get("season"),
            occasion_vi=data.get("occasion"),
        )
        if "debugLog" not in result:
            result["debugLog"] = get_request_logs()
        result["debugLogText"] = export_logs_text(result.get("debugLog"))
        return jsonify(result)
    except FashionError as err:
        return error_response(err)
    except Exception as exc:
        logs = get_request_logs()
        return jsonify({
            "fabric_type": "unknown",
            "compatible": True,
            "message_vi": ERROR_MESSAGES["FABRIC_VALIDATE_FAILED"],
            "debugLog": logs,
            "debugLogText": export_logs_text(logs),
            "error": {"code": "FABRIC_VALIDATE_FAILED", "message": str(exc)},
        })
