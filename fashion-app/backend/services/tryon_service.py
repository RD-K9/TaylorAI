import os
import re
import time

from utils.api_logger import get_request_logs, log_ai
from utils.errors import ERROR_MESSAGES, FashionError

HF_TOKEN = os.getenv("HF_TOKEN", "")

_client_spaces = {}


def _tryon_config():
    """Read env each request so restart/reload picks up .env without stale module constants."""
    return {
        "space": os.getenv("TRYON_SPACE", "yisol/IDM-VTON"),
        "api_name": os.getenv("TRYON_API_NAME", "/tryon"),
        "garment_desc": os.getenv("TRYON_GARMENT_DESC", "fashion garment"),
        "fallback_space": (os.getenv("TRYON_FALLBACK_SPACE") or "").strip(),
        "fallback_api": os.getenv("TRYON_FALLBACK_API_NAME", "/generate"),
        "fallback_workflow": os.getenv("TRYON_FALLBACK_WORKFLOW", "top"),
        "denoise_steps": int(os.getenv("TRYON_DENOISE_STEPS", "20")),
        "seed": int(os.getenv("TRYON_SEED", "42")),
    }


def _get_client(space):
    global _client_spaces
    from gradio_client import Client

    if space in _client_spaces:
        return _client_spaces[space]

    kwargs = {}
    token = os.getenv("HF_TOKEN", "")
    if token and token not in ("hf_xxxxx", "hf_xxx", ""):
        kwargs["token"] = token
    log_ai(
        service="gradio",
        action="connect",
        url=space,
        request_summary={"hfTokenSet": bool(kwargs.get("token"))},
    )
    _client_spaces[space] = Client(space, **kwargs)
    return _client_spaces[space]


def _read_result(result):
    if isinstance(result, (bytes, bytearray)):
        return bytes(result)
    if isinstance(result, str) and os.path.isfile(result):
        with open(result, "rb") as f:
            return f.read()
    if isinstance(result, (list, tuple)) and result:
        return _read_result(result[0])
    if isinstance(result, dict):
        if "path" in result and result["path"] and os.path.isfile(result["path"]):
            return _read_result(result["path"])
        if "url" in result and result["url"]:
            import requests

            resp = requests.get(result["url"], timeout=120)
            resp.raise_for_status()
            return resp.content
    log_ai(
        service="gradio",
        action="read_result",
        error=f"Unexpected result type: {type(result).__name__}",
        response_summary=str(result)[:500],
    )
    raise FashionError("TRYON_FAILED", ERROR_MESSAGES["TRYON_FAILED"], 502, debug_log=get_request_logs())


def _load_images(person_path, garment_path):
    from gradio_client import handle_file
    from PIL import Image

    return {
        "file": (handle_file(person_path), handle_file(garment_path)),
        "pil": (Image.open(person_path), Image.open(garment_path)),
    }


def _is_idm_vton(space):
    slug = space.lower()
    return "idm-vton" in slug or slug.endswith("idm-vton")


def _is_kolors(space):
    slug = space.lower()
    return "kolors" in slug


def _predict_idm_vton(client, space, person_path, garment_path, garment_description, api_name, denoise_steps=20, seed=42):
    from gradio_client import handle_file

    person_file = handle_file(person_path)
    garment_file = handle_file(garment_path)
    editor = {"background": person_file, "layers": [], "composite": None}

    start = time.time()
    log_ai(
        service="gradio",
        action="idm_vton_predict",
        url=space,
        request_summary={
            "apiName": api_name,
            "personPath": person_path,
            "garmentPath": garment_path,
            "garmentDescription": garment_description[:120],
            "denoiseSteps": denoise_steps,
            "seed": seed,
        },
    )
    result = client.predict(
        editor,
        garment_file,
        garment_description,
        True,
        False,
        denoise_steps,
        seed,
        api_name=api_name,
    )
    log_ai(
        service="gradio",
        action="idm_vton_predict_ok",
        url=space,
        duration_ms=int((time.time() - start) * 1000),
    )
    return _read_result(result)


def _predict_kolors_style(client, space, person_path, garment_path, api_name):
    """Gradio client pattern: Client(space).predict(person_image=..., garment_image=...)."""
    images = _load_images(person_path, garment_path)
    person_file, garment_file = images["file"]
    person_pil, garment_pil = images["pil"]

    attempts = [
        ("person_image/garment_image files", lambda: client.predict(person_image=person_file, garment_image=garment_file)),
        ("person_img/garment_img files", lambda: client.predict(person_img=person_file, garment_img=garment_file)),
        ("person_image/garment_image PIL", lambda: client.predict(person_image=person_pil, garment_image=garment_pil)),
        ("positional files", lambda: client.predict(person_file, garment_file)),
        ("api_name env", lambda: client.predict(person_file, garment_file, api_name=api_name)),
        ("api_name /tryon", lambda: client.predict(person_file, garment_file, api_name="/tryon")),
        ("api_name /predict", lambda: client.predict(person_file, garment_file, api_name="/predict")),
    ]

    last_error = None
    for label, fn in attempts:
        start = time.time()
        log_ai(
            service="gradio",
            action="kolors_predict",
            url=space,
            request_summary={"mode": label, "personPath": person_path, "garmentPath": garment_path},
        )
        try:
            result = fn()
            log_ai(
                service="gradio",
                action="kolors_predict_ok",
                url=space,
                duration_ms=int((time.time() - start) * 1000),
                extra={"mode": label},
            )
            return _read_result(result)
        except Exception as exc:
            last_error = exc
            log_ai(
                service="gradio",
                action="kolors_predict",
                url=space,
                error=str(exc),
                duration_ms=int((time.time() - start) * 1000),
                extra={"mode": label},
            )

    hint = (
        "Kolors Space hiện tắt API công khai (show_api=False). "
        "Đổi TRYON_SPACE=yisol/IDM-VTON hoặc dùng Space khác có /tryon."
    )
    raise RuntimeError(f"{last_error}. {hint}") from last_error


def _predict_primary(person_path, garment_path, garment_description=None):
    cfg = _tryon_config()
    space = cfg["space"]
    api_name = cfg["api_name"]
    garment_description = (garment_description or cfg["garment_desc"]).strip() or cfg["garment_desc"]

    client = _get_client(space)

    if _is_idm_vton(space):
        return _predict_idm_vton(
            client,
            space,
            person_path,
            garment_path,
            garment_description,
            api_name,
            denoise_steps=cfg["denoise_steps"],
            seed=cfg["seed"],
        )

    if _is_kolors(space):
        return _predict_kolors_style(client, space, person_path, garment_path, api_name)

    return _predict_kolors_style(client, space, person_path, garment_path, api_name)


def _predict_sm4ll_vton(person_path, garment_path):
    cfg = _tryon_config()
    fallback_space = cfg["fallback_space"]
    fallback_api = cfg["fallback_api"]
    fallback_workflow = cfg["fallback_workflow"]
    from gradio_client import handle_file

    client = _get_client(fallback_space)

    start = time.time()
    log_ai(
        service="gradio",
        action="sm4ll_vton_predict",
        url=fallback_space,
        request_summary={"apiName": fallback_api, "workflow": fallback_workflow},
    )
    try:
        result = client.predict(
            handle_file(person_path),
            handle_file(garment_path),
            fallback_workflow,
            None,
            api_name=fallback_api,
        )
        log_ai(
            service="gradio",
            action="sm4ll_vton_predict_ok",
            url=fallback_space,
            duration_ms=int((time.time() - start) * 1000),
        )
        return _read_result(result)
    except Exception as exc:
        log_ai(
            service="gradio",
            action="sm4ll_vton_predict",
            url=fallback_space,
            error=str(exc),
            duration_ms=int((time.time() - start) * 1000),
        )
        raise


def _has_hf_token():
    token = os.getenv("HF_TOKEN", "")
    return bool(token and token not in ("hf_xxxxx", "hf_xxx", ""))


def _ensure_hf_token():
    if _has_hf_token():
        return
    raise FashionError(
        "TRYON_AUTH",
        ERROR_MESSAGES["TRYON_AUTH"],
        401,
        debug_log=get_request_logs(),
    )


def _friendly_tryon_error(exc):
    text = str(exc)
    if "ZeroGPU quota" in text or "zero gpu quota" in text.lower():
        retry = re.search(r"Try again in (\d+:\d+:\d+)", text)
        wait = f" Thử lại sau {retry.group(1)}." if retry else ""
        pro_hint = ""
        if "Subscribe to Hugging Face PRO" in text or "free ZeroGPU" in text:
            pro_hint = " Tài khoản free: quota ZeroGPU rất thấp và dùng chung với Generate (Flux Kontext). Cân nhắc HF PRO hoặc chờ quota reset."
        return f"{ERROR_MESSAGES['TRYON_ZERO_GPU']}{wait}{pro_hint}"
    if "Authenticate with a Hugging Face token" in text:
        return ERROR_MESSAGES["TRYON_AUTH"]
    if "Invalid API key format" in text or "runpod" in text.lower():
        return "Space fallback (RunPod) đang lỗi cấu hình phía chủ Space — không phải lỗi app của bạn."
    if "Cannot find a function with `api_name`" in text or "show_api=False" in text:
        return (
            "Space try-on không có API công khai. Kiểm tra TRYON_SPACE trong .env "
            "(đề xuất: yisol/IDM-VTON)."
        )
    return text


def try_on_with_fallback(person_path, garment_path, garment_description=None):
    _ensure_hf_token()
    cfg = _tryon_config()
    primary_space = cfg["space"]
    fallback_space = cfg["fallback_space"]
    errors = []
    try:
        try:
            return _predict_primary(person_path, garment_path, garment_description), primary_space
        except Exception as primary_err:
            errors.append(f"{primary_space}: {_friendly_tryon_error(primary_err)}")
            log_ai(service="gradio", action="tryon_primary_failed", error=str(primary_err))
            if not fallback_space:
                msg = _friendly_tryon_error(primary_err)
                code = "TRYON_ZERO_GPU" if "ZeroGPU quota" in str(primary_err) else "TRYON_FAILED"
                raise FashionError(
                    code,
                    f"{ERROR_MESSAGES.get(code, ERROR_MESSAGES['TRYON_FAILED'])} — {msg}",
                    502,
                    debug_log=get_request_logs(),
                ) from primary_err
            try:
                return _predict_sm4ll_vton(person_path, garment_path), fallback_space
            except Exception as fallback_err:
                errors.append(f"{fallback_space}: {_friendly_tryon_error(fallback_err)}")
                raise FashionError(
                    "TRYON_FAILED",
                    f"{ERROR_MESSAGES['TRYON_FAILED']} — {' | '.join(errors)}",
                    502,
                    debug_log=get_request_logs(),
                ) from fallback_err
    except FashionError:
        raise
    except Exception as exc:
        raise FashionError(
            "TRYON_FAILED",
            f"{ERROR_MESSAGES['TRYON_FAILED']} — {_friendly_tryon_error(exc)}",
            502,
            debug_log=get_request_logs(),
        ) from exc
