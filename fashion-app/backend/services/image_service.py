import base64
import io
import os
import tempfile
import uuid
from datetime import datetime, timedelta

from PIL import Image

from utils.errors import FashionError

TEMP_DIR = os.path.join(tempfile.gettempdir(), "fashion-app-images")
TEMP_REGISTRY = {}
MAX_DIMENSION = 1536
TRYON_MAX = 1024


def ensure_temp_dir():
    os.makedirs(TEMP_DIR, exist_ok=True)


def decode_base64_image(b64_string):
    if not b64_string:
        raise FashionError("INVALID_IMAGE", "Thiếu dữ liệu ảnh.", 400)
    if "," in b64_string:
        b64_string = b64_string.split(",", 1)[1]
    try:
        raw = base64.b64decode(b64_string)
        img = Image.open(io.BytesIO(raw))
        img.load()
        return img.convert("RGB"), raw
    except Exception as exc:
        raise FashionError("INVALID_IMAGE", "Ảnh không hợp lệ.", 400) from exc


def resize_image(img, max_dim=MAX_DIMENSION):
    w, h = img.size
    if max(w, h) <= max_dim:
        return img
    ratio = max_dim / max(w, h)
    new_size = (int(w * ratio), int(h * ratio))
    return img.resize(new_size, Image.Resampling.LANCZOS)


def image_to_jpeg_bytes(img, quality=92):
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=quality)
    return buf.getvalue()


def image_to_base64(img):
    return base64.b64encode(image_to_jpeg_bytes(img)).decode("utf-8")


def strip_data_url_prefix(b64_string):
    if b64_string and "," in b64_string:
        return b64_string.split(",", 1)[1]
    return b64_string


def cleanup_expired():
    now = datetime.utcnow()
    expired = [k for k, v in TEMP_REGISTRY.items() if v["expires"] < now]
    for key in expired:
        path = TEMP_REGISTRY[key]["path"]
        if os.path.exists(path):
            os.remove(path)
        del TEMP_REGISTRY[key]


def store_temp_image(b64_string, ttl_sec=600):
    ensure_temp_dir()
    cleanup_expired()
    img, _ = decode_base64_image(b64_string)
    img = resize_image(img)
    image_id = str(uuid.uuid4())
    path = os.path.join(TEMP_DIR, f"{image_id}.jpg")
    img.save(path, format="JPEG", quality=92)
    TEMP_REGISTRY[image_id] = {
        "path": path,
        "expires": datetime.utcnow() + timedelta(seconds=ttl_sec),
    }
    return image_id, path


def get_temp_path(image_id):
    cleanup_expired()
    entry = TEMP_REGISTRY.get(image_id)
    if not entry or not os.path.exists(entry["path"]):
        raise FashionError("INVALID_IMAGE", "Ảnh tạm không tồn tại hoặc đã hết hạn.", 404)
    return entry["path"]


def create_blank_canvas_path(width=1024, height=1024):
    """White canvas for text-to-image style Kontext when no fabric/reference image."""
    ensure_temp_dir()
    path = os.path.join(TEMP_DIR, f"{uuid.uuid4()}_blank.jpg")
    Image.new("RGB", (width, height), color=(255, 255, 255)).save(path, format="JPEG", quality=95)
    return path


def save_temp_file_from_b64(b64_string, max_dim=TRYON_MAX):
    img, _ = decode_base64_image(b64_string)
    img = resize_image(img, max_dim)
    ensure_temp_dir()
    path = os.path.join(TEMP_DIR, f"{uuid.uuid4()}.jpg")
    img.save(path, format="JPEG", quality=92)
    return path
