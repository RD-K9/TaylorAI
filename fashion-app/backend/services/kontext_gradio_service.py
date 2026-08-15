import os
import random
import time

from utils.api_logger import get_request_logs, log_ai
from utils.errors import ERROR_MESSAGES, FashionError

KONTEXT_SPACE = os.getenv("KONTEXT_GRADIO_SPACE", "black-forest-labs/FLUX.1-Kontext-Dev")
KONTEXT_API_NAME = os.getenv("KONTEXT_GRADIO_API_NAME", "/infer")
KONTEXT_GUIDANCE = float(os.getenv("KONTEXT_GRADIO_GUIDANCE", "2.5"))
KONTEXT_STEPS = int(os.getenv("KONTEXT_GRADIO_STEPS", "28"))
KONTEXT_TIMEOUT = int(os.getenv("KONTEXT_GRADIO_TIMEOUT_SEC", "180"))
HF_TOKEN = os.getenv("HF_TOKEN", "")

_client = None
_client_token = None


def _has_hf_token():
    token = os.getenv("HF_TOKEN", "")
    return bool(token and token not in ("hf_xxxxx", "hf_xxx", ""))


def _get_client():
    global _client, _client_token
    from gradio_client import Client

    token = os.getenv("HF_TOKEN", "") if _has_hf_token() else ""
    if _client is not None and _client_token == token:
        return _client

    kwargs = {}
    if token:
        kwargs["token"] = token
    log_ai(
        service="gradio",
        action="kontext_connect",
        url=KONTEXT_SPACE,
        request_summary={"hfTokenSet": bool(token)},
    )
    _client = Client(KONTEXT_SPACE, **kwargs)
    _client_token = token
    return _client


def _read_image_result(result):
    if isinstance(result, (bytes, bytearray)):
        return bytes(result)
    if isinstance(result, str) and os.path.isfile(result):
        with open(result, "rb") as f:
            return f.read()
    if isinstance(result, (list, tuple)) and result:
        return _read_image_result(result[0])
    if isinstance(result, dict):
        if "path" in result and os.path.isfile(result["path"]):
            with open(result["path"], "rb") as f:
                return f.read()
        if "url" in result:
            import requests
            resp = requests.get(result["url"], timeout=60)
            resp.raise_for_status()
            return resp.content
    log_ai(
        service="gradio",
        action="kontext_read_result",
        error=f"Unexpected result: {type(result).__name__}",
        response_summary=str(result)[:500],
    )
    raise FashionError("GENERATION_FAILED", ERROR_MESSAGES["GENERATION_FAILED"], 502, debug_log=get_request_logs())


def generate_flux_kontext_gradio(input_image_path, prompt, seed=-1, negative_prompt=None):
    """Generate flat-lay garment via FLUX.1 Kontext [dev] Hugging Face Gradio space."""
    from gradio_client import handle_file

    if seed is None or seed < 0:
        seed = random.randint(1, 2_147_483_647)

    full_prompt = prompt
    if negative_prompt:
        full_prompt = f"{prompt}. Avoid: {negative_prompt}"

    client = _get_client()
    start = time.time()
    log_ai(
        service="gradio",
        action="flux_kontext_infer",
        method="POST",
        url=KONTEXT_SPACE,
        request_summary={
            "apiName": KONTEXT_API_NAME,
            "seed": seed,
            "guidanceScale": KONTEXT_GUIDANCE,
            "steps": KONTEXT_STEPS,
            "promptPreview": full_prompt[:400],
            "inputImagePath": input_image_path,
        },
    )

    api_names = [KONTEXT_API_NAME, "/infer", "/predict"]
    last_error = None

    for api_name in api_names:
        try:
            result = client.predict(
                handle_file(input_image_path),
                full_prompt,
                int(seed),
                False,
                KONTEXT_GUIDANCE,
                KONTEXT_STEPS,
                api_name=api_name,
            )
            image_bytes = _read_image_result(result)
            duration = int((time.time() - start) * 1000)
            log_ai(
                service="gradio",
                action="flux_kontext_infer_ok",
                url=KONTEXT_SPACE,
                duration_ms=duration,
                extra={"apiName": api_name, "bytes": len(image_bytes)},
            )
            return image_bytes, seed, "flux.1-kontext-gradio"
        except Exception as exc:
            last_error = exc
            log_ai(
                service="gradio",
                action="flux_kontext_infer",
                url=KONTEXT_SPACE,
                error=str(exc),
                extra={"apiName": api_name},
            )

    raise FashionError(
        "GENERATION_FAILED",
        _generation_error_message(last_error),
        502,
        debug_log=get_request_logs(),
    )


def _generation_error_message(exc):
    text = str(exc)
    if "ZeroGPU quota" in text or "Authenticate with a Hugging Face token" in text:
        if _has_hf_token():
            return (
                f"{ERROR_MESSAGES['GENERATION_FAILED']} — ZeroGPU quota vẫn hết dù đã có HF_TOKEN. "
                "Thử lại sau vài phút hoặc đổi GENERATE_PRIMARY=pollinations với POLLINATIONS_API_KEY."
            )
        return (
            f"{ERROR_MESSAGES['GENERATION_FAILED']} — Cần HF_TOKEN trong .env rồi restart backend."
        )
    return f"{ERROR_MESSAGES['GENERATION_FAILED']} (Flux Kontext Gradio: {exc})"
