import json
import os
import random
import re
import time
from urllib.parse import quote

import requests

from utils.api_logger import get_request_logs, log_ai
from utils.errors import ERROR_MESSAGES, FashionError

BASE_URL = "https://gen.pollinations.ai"
API_KEY = os.getenv("POLLINATIONS_API_KEY", "")
VISION_MODEL = os.getenv("POLLINATIONS_VISION_MODEL", "gemini")
IMAGE_MODEL = os.getenv("POLLINATIONS_IMAGE_MODEL", "kontext")
GENERATE_TIMEOUT = int(os.getenv("GENERATE_TIMEOUT_SEC", "120"))
VISION_TIMEOUT = int(os.getenv("VISION_TIMEOUT_SEC", "30"))
# auto = Pollinations trước, Gradio fallback | gradio = chỉ Gradio | pollinations = chỉ Pollinations
GENERATE_PRIMARY = os.getenv("GENERATE_PRIMARY", "auto").strip().lower()


def _has_pollinations_key():
    return bool(API_KEY and API_KEY not in ("sk_xxxxx", "sk_xxx", ""))


def _headers(*, required=True):
    if not _has_pollinations_key():
        log_ai(
            service="pollinations",
            action="auth_check",
            error="Missing or placeholder POLLINATIONS_API_KEY",
        )
        if required:
            raise FashionError(
                "POLLINATIONS_AUTH",
                ERROR_MESSAGES["POLLINATIONS_AUTH"],
                401,
                debug_log=get_request_logs(),
            )
        return None
    return {"Authorization": f"Bearer {API_KEY}"}


def _parse_json_from_text(text):
    text = text.strip()
    if not text:
        raise ValueError("Empty response body from vision API")
    match = re.search(r"\{[\s\S]*\}", text)
    if match:
        return json.loads(match.group())
    return json.loads(text)


def _fail(code, message, status=502, **log_kw):
    log_ai(service="pollinations", action=log_kw.pop("action", "unknown"), error=message, **log_kw)
    raise FashionError(code, message, status, debug_log=get_request_logs())


def validate_fabric(fabric_b64, clothes_type_vi, season_vi=None, occasion_vi=None):
    season_part = f", mùa: {season_vi}" if season_vi else ""
    occasion_part = f", mục đích: {occasion_vi}" if occasion_vi else ""
    prompt = (
        f"Analyze this fabric image for clothing type '{clothes_type_vi}'{season_part}{occasion_part}. "
        "Respond ONLY with JSON: "
        '{"fabric_type":"...", "compatible": true/false, "message_vi":"..."} '
        "message_vi must be in Vietnamese explaining compatibility."
    )

    url = f"{BASE_URL}/v1/chat/completions"
    payload = {
        "model": VISION_MODEL,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{fabric_b64[:80]}…"},
                    },
                ],
            }
        ],
        "max_tokens": 300,
    }
    payload_send = {
        **payload,
        "messages": [
            {
                **payload["messages"][0],
                "content": [
                    payload["messages"][0]["content"][0],
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{fabric_b64}"},
                    },
                ],
            }
        ],
    }

    start = time.time()
    log_ai(
        service="pollinations",
        action="validate_fabric",
        method="POST",
        url=url,
        request_summary={
            "model": VISION_MODEL,
            "clothesType": clothes_type_vi,
            "fabricBase64Len": len(fabric_b64),
            "promptPreview": prompt[:200],
        },
    )

    try:
        resp = requests.post(
            url,
            headers={**_headers(), "Content-Type": "application/json"},
            json=payload_send,
            timeout=VISION_TIMEOUT,
        )
        duration = int((time.time() - start) * 1000)
        body_preview = resp.text[:800] if resp.text else "(empty)"

        log_ai(
            service="pollinations",
            action="validate_fabric_response",
            method="POST",
            url=url,
            status_code=resp.status_code,
            response_summary=body_preview,
            duration_ms=duration,
        )

        if resp.status_code == 429:
            _fail("POLLINATIONS_RATE_LIMIT", ERROR_MESSAGES["POLLINATIONS_RATE_LIMIT"], 429, action="validate_fabric")
        if resp.status_code >= 400:
            return {
                "fabric_type": "unknown",
                "compatible": True,
                "message_vi": "Không thể phân tích vải tự động. Bạn vẫn có thể tiếp tục.",
                "debugLog": get_request_logs(),
            }

        data = resp.json()
        choices = data.get("choices") or []
        if not choices:
            log_ai(service="pollinations", action="validate_fabric", error="No choices in vision response")
            return {
                "fabric_type": "unknown",
                "compatible": True,
                "message_vi": "AI không trả kết quả phân tích vải. Bạn vẫn có thể tiếp tục.",
                "debugLog": get_request_logs(),
            }

        content = (choices[0].get("message") or {}).get("content") or ""
        if not content.strip():
            log_ai(service="pollinations", action="validate_fabric", error="Empty content in vision response")
            return {
                "fabric_type": "unknown",
                "compatible": True,
                "message_vi": "AI trả về rỗng. Bạn vẫn có thể tiếp tục generate.",
                "debugLog": get_request_logs(),
            }

        result = _parse_json_from_text(content)
        return {
            "fabric_type": result.get("fabric_type", "unknown"),
            "compatible": bool(result.get("compatible", True)),
            "message_vi": result.get("message_vi", "Phân tích vải hoàn tất."),
            "debugLog": get_request_logs(),
        }
    except FashionError:
        raise
    except Exception as exc:
        log_ai(
            service="pollinations",
            action="validate_fabric",
            error=str(exc),
            duration_ms=int((time.time() - start) * 1000),
        )
        return {
            "fabric_type": "unknown",
            "compatible": True,
            "message_vi": "Không thể phân tích vải tự động. Bạn vẫn có thể tiếp tục.",
            "debugLog": get_request_logs(),
        }


def generate_kontext(prompt, negative_prompt, image_urls, kontext_input_path=None, seed=-1, width=1024, height=1024):
    if seed is None or seed < 0:
        seed = random.randint(1, 999999)

    use_gradio_only = GENERATE_PRIMARY == "gradio" or (GENERATE_PRIMARY == "auto" and not _has_pollinations_key())
    post_error = None

    if use_gradio_only:
        post_error = (
            "GENERATE_PRIMARY=gradio"
            if GENERATE_PRIMARY == "gradio"
            else "Không có POLLINATIONS_API_KEY — bỏ qua Pollinations, dùng Flux Kontext Gradio"
        )
        log_ai(
            service="pollinations",
            action="generate_kontext_skip_pollinations",
            request_summary={"reason": post_error, "generatePrimary": GENERATE_PRIMARY},
        )
    else:
        post_url = f"{BASE_URL}/v1/images/generations"
        body = {
            "model": IMAGE_MODEL,
            "prompt": prompt,
            "size": f"{width}x{height}",
            "response_format": "b64_json",
            "n": 1,
            "seed": seed,
        }
        if negative_prompt:
            body["negative_prompt"] = negative_prompt
        if image_urls:
            body["image"] = image_urls if len(image_urls) > 1 else image_urls[0]

        start = time.time()
        log_ai(
            service="pollinations",
            action="generate_kontext_post",
            method="POST",
            url=post_url,
            request_summary={
                "model": IMAGE_MODEL,
                "seed": seed,
                "size": f"{width}x{height}",
                "promptPreview": prompt[:300],
                "imageUrls": image_urls,
                "negativePreview": (negative_prompt or "")[:120],
            },
        )

        try:
            headers = _headers(required=True)
            resp = requests.post(
                post_url,
                headers={**headers, "Content-Type": "application/json"},
                json=body,
                timeout=GENERATE_TIMEOUT,
            )
            duration = int((time.time() - start) * 1000)
            body_preview = resp.text[:800] if resp.text else "(empty)"

            log_ai(
                service="pollinations",
                action="generate_kontext_post_response",
                method="POST",
                url=post_url,
                status_code=resp.status_code,
                response_summary=body_preview,
                duration_ms=duration,
                extra={"contentLength": len(resp.content or b"")},
            )

            if resp.status_code == 429:
                _fail("POLLINATIONS_RATE_LIMIT", ERROR_MESSAGES["POLLINATIONS_RATE_LIMIT"], 429, action="generate_kontext")
            if resp.status_code < 400:
                data = resp.json()
                items = data.get("data") or []
                if items and items[0].get("b64_json"):
                    import base64
                    return base64.b64decode(items[0]["b64_json"]), seed, "pollinations-kontext"
                post_error = f"POST OK but no b64_json in data (keys={list(data.keys())}, dataLen={len(items)})"
            else:
                post_error = f"POST HTTP {resp.status_code}: {body_preview[:200]}"
        except FashionError as err:
            if err.code == "POLLINATIONS_AUTH":
                post_error = err.message
            else:
                raise
        except Exception as exc:
            post_error = f"POST exception: {exc}"
            log_ai(service="pollinations", action="generate_kontext_post", error=str(exc))

    # Fallback #2: FLUX.1 Kontext via Gradio (HF Space)
    if kontext_input_path and os.path.isfile(kontext_input_path):
        log_ai(
            service="pollinations",
            action="generate_kontext_gradio_fallback",
            request_summary={"postError": post_error, "kontextInputPath": kontext_input_path},
        )
        try:
            from services.kontext_gradio_service import generate_flux_kontext_gradio

            image_bytes, used_seed, _model = generate_flux_kontext_gradio(
                kontext_input_path, prompt, seed=seed, negative_prompt=negative_prompt
            )
            return image_bytes, used_seed, _model
        except FashionError:
            raise
        except Exception as exc:
            log_ai(service="gradio", action="flux_kontext_fallback", error=str(exc))

    # Legacy fallback: Pollinations GET (chỉ khi có API key)
    if not _has_pollinations_key() or GENERATE_PRIMARY == "gradio":
        _fail(
            "GENERATION_FAILED",
            f"{ERROR_MESSAGES['GENERATION_FAILED']} (Gradio fallback thất bại — xem debugLog)",
            502,
            action="generate_kontext",
        )

    get_url = f"{BASE_URL}/image/{quote(prompt)}"
    params = {
        "model": IMAGE_MODEL,
        "width": width,
        "height": height,
        "seed": seed,
        "negative_prompt": negative_prompt,
    }
    if image_urls:
        params["image"] = "|".join(image_urls)

    log_ai(
        service="pollinations",
        action="generate_kontext_get_fallback",
        method="GET",
        url=get_url,
        request_summary={"params": params, "postError": post_error},
    )

    start_get = time.time()
    resp = requests.get(
        get_url,
        headers=_headers(),
        params=params,
        timeout=GENERATE_TIMEOUT,
    )
    duration_get = int((time.time() - start_get) * 1000)
    content_type = resp.headers.get("Content-Type", "")

    log_ai(
        service="pollinations",
        action="generate_kontext_get_response",
        method="GET",
        url=get_url,
        status_code=resp.status_code,
        response_summary=(resp.text[:800] if "json" in content_type else f"binary {len(resp.content)} bytes"),
        duration_ms=duration_get,
        extra={"contentType": content_type},
    )

    if resp.status_code == 429:
        _fail("POLLINATIONS_RATE_LIMIT", ERROR_MESSAGES["POLLINATIONS_RATE_LIMIT"], 429, action="generate_kontext")
    if resp.status_code >= 400 or not resp.content:
        _fail(
            "GENERATION_FAILED",
            f"{ERROR_MESSAGES['GENERATION_FAILED']} (API không trả ảnh — xem debugLog)",
            502,
            action="generate_kontext",
        )
    if "json" in content_type:
        _fail(
            "GENERATION_FAILED",
            f"{ERROR_MESSAGES['GENERATION_FAILED']} (API trả JSON thay vì ảnh)",
            502,
            action="generate_kontext",
        )

    return resp.content, seed, "pollinations-kontext-get"
