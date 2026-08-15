"""Smoke tests for fashion-app backend routes (no live API keys required)."""
import base64
import io
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from PIL import Image
from server import app


def _tiny_jpeg_b64():
    img = Image.new("RGB", (512, 512), color=(200, 180, 160))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return base64.b64encode(buf.getvalue()).decode("utf-8")


def test_health():
    client = app.test_client()
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.get_json()["status"] == "ok"
    print("OK health")


def test_validate_fabric_missing():
    client = app.test_client()
    resp = client.post("/api/validate-fabric", json={"fabricImageBase64": "", "clothesType": ""})
    assert resp.status_code == 400
    print("OK validate-fabric missing fields")


def test_generate_garment_missing():
    client = app.test_client()
    resp = client.post("/api/generate-garment", json={"filters": {}, "context": {}})
    assert resp.status_code == 400
    print("OK generate-garment missing fields")


def test_temp_image_not_found():
    client = app.test_client()
    resp = client.get("/api/temp-image/nonexistent-id")
    assert resp.status_code == 404
    print("OK temp-image 404")


def test_temp_image_roundtrip():
    client = app.test_client()
    b64 = _tiny_jpeg_b64()
    from services.image_service import store_temp_image

    image_id, _ = store_temp_image(b64)
    resp = client.get(f"/api/temp-image/{image_id}")
    assert resp.status_code == 200
    assert resp.content_type.startswith("image/")
    print("OK temp-image serve")


def test_prompt_builder():
    from utils.promptBuilder import build_prompt

    prompt = build_prompt(
        {"season": "Hè", "clothesType": "Váy", "budget": "Mid"},
        {"personImageBase64": "x", "bodyMeasurements": {"height": 165}},
    )
    assert "dress" in prompt
    assert "summer" in prompt
    assert "165cm" in prompt
    assert "mid-range" in prompt
    assert "pure white background mandatory" in prompt
    assert "no human" in prompt
    assert "clothing only" in prompt
    assert "front-facing garment display" in prompt
    print("OK promptBuilder")


if __name__ == "__main__":
    test_health()
    test_validate_fabric_missing()
    test_generate_garment_missing()
    test_temp_image_not_found()
    test_temp_image_roundtrip()
    test_prompt_builder()
    print("\nAll smoke tests passed.")
