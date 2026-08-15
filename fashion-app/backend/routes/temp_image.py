from flask import Blueprint, jsonify, send_file

from services.image_service import get_temp_path
from utils.errors import FashionError

bp = Blueprint("temp_image", __name__)


@bp.route("/temp-image/<image_id>", methods=["GET"])
def temp_image(image_id):
    try:
        path = get_temp_path(image_id)
        return send_file(path, mimetype="image/jpeg")
    except FashionError as err:
        return jsonify({"error": {"code": err.code, "message": err.message}}), err.status
