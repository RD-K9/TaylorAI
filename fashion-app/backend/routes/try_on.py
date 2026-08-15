import base64
import os
import time

from flask import Blueprint, request

from services.image_service import save_temp_file_from_b64, strip_data_url_prefix
from services.tryon_service import try_on_with_fallback
from utils.errors import FashionError
from utils.response_helpers import error_response, success_with_logs

bp = Blueprint("try_on", __name__)


@bp.route("/try-on", methods=["POST"])
def try_on_route():
    start = time.time()
    person_path = None
    garment_path = None
    try:
        data = request.get_json(force=True) or {}
        person = strip_data_url_prefix(data.get("personImageBase64", ""))
        garment = strip_data_url_prefix(data.get("garmentImageBase64", ""))
        if not person or not garment:
            return error_response(
                FashionError("MISSING_REQUIRED", "Thiếu ảnh người hoặc ảnh quần áo.", 400)
            )

        person_path = save_temp_file_from_b64(person)
        garment_path = save_temp_file_from_b64(garment)
        garment_description = (data.get("garmentDescription") or "").strip() or None

        result_bytes, space = try_on_with_fallback(person_path, garment_path, garment_description)
        duration_ms = int((time.time() - start) * 1000)

        return success_with_logs({
            "image": base64.b64encode(result_bytes).decode("utf-8"),
            "meta": {"space": space, "durationMs": duration_ms},
        })
    except FashionError as err:
        return error_response(err)
    except Exception as exc:
        return error_response(FashionError("TRYON_FAILED", str(exc), 502))
    finally:
        for path in (person_path, garment_path):
            if path and os.path.exists(path):
                os.remove(path)
