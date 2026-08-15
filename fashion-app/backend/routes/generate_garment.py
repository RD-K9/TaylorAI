import base64
import os
import time

from flask import Blueprint, request

from services.image_service import create_blank_canvas_path, store_temp_image
from services.pollinations_service import generate_kontext
from utils.errors import FashionError
from utils.negativePrompt import build_negative_prompt
from utils.promptBuilder import build_prompt
from utils.response_helpers import error_response, success_with_logs

bp = Blueprint("generate_garment", __name__)
TTL = int(os.getenv("TEMP_IMAGE_TTL_SEC", "600"))
PUBLIC_BASE = os.getenv("PUBLIC_BASE_URL", "http://localhost:3000")


def _public_url(image_id):
    return f"{PUBLIC_BASE}/api/temp-image/{image_id}"


@bp.route("/generate-garment", methods=["POST"])
def generate_garment_route():
    start = time.time()
    try:
        data = request.get_json(force=True) or {}
        filters = data.get("filters") or {}
        context = data.get("context") or {}
        options = data.get("options") or {}

        person = context.get("personImageBase64")
        if not person or not filters.get("season") or not filters.get("clothesType"):
            return error_response(
                FashionError(
                    "MISSING_REQUIRED",
                    "Thiếu ảnh người, mùa hoặc loại quần áo.",
                    400,
                )
            )

        prompt = build_prompt(filters, context)
        negative = build_negative_prompt(filters)
        seed = options.get("seed", -1)
        width = options.get("width", 1024)
        height = options.get("height", 1024)

        # Person image is required for sizing context + try-on later, but must NOT
        # be sent to Kontext — otherwise the model preserves the standing person.
        store_temp_image(person, TTL)

        image_urls = []
        fabric_path = None
        reference_path = None

        fabric = context.get("fabricImageBase64")
        if fabric:
            fabric_id, fabric_path = store_temp_image(fabric, TTL)
            image_urls.append(_public_url(fabric_id))

        reference = context.get("referenceImageBase64")
        if reference:
            ref_id, reference_path = store_temp_image(reference, TTL)
            image_urls.append(_public_url(ref_id))

        if fabric_path:
            kontext_input_path = fabric_path
        elif reference_path:
            kontext_input_path = reference_path
        else:
            kontext_input_path = create_blank_canvas_path(width, height)

        image_bytes, used_seed, model_used = generate_kontext(
            prompt,
            negative,
            image_urls,
            kontext_input_path=kontext_input_path,
            seed=seed,
            width=width,
            height=height,
        )

        duration_ms = int((time.time() - start) * 1000)
        return success_with_logs({
            "image": base64.b64encode(image_bytes).decode("utf-8"),
            "prompt": prompt,
            "negativePrompt": negative,
            "seed": used_seed,
            "meta": {
                "model": model_used,
                "durationMs": duration_ms,
            },
        })
    except FashionError as err:
        return error_response(err)
    except Exception as exc:
        return error_response(
            FashionError("GENERATION_FAILED", str(exc), 502),
            extra_message=str(exc),
        )
