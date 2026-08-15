import json
import os
from collections import deque
from contextvars import ContextVar
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock

LOG_DIR = Path(__file__).resolve().parent.parent / "logs"
LOG_FILE = LOG_DIR / "ai-api.log"
MAX_MEMORY = int(os.getenv("AI_LOG_MEMORY_MAX", "200"))
MAX_BODY_CHARS = int(os.getenv("AI_LOG_BODY_MAX", "800"))

_request_logs: ContextVar[list | None] = ContextVar("request_logs", default=None)
_memory: deque = deque(maxlen=MAX_MEMORY)
_lock = Lock()


def _now_iso():
    return datetime.now(timezone.utc).isoformat()


def _truncate(value, limit=MAX_BODY_CHARS):
    if value is None:
        return None
    text = value if isinstance(value, str) else json.dumps(value, ensure_ascii=False, default=str)
    if len(text) <= limit:
        return text
    return f"{text[:limit]}… (+{len(text) - limit} chars)"


def reset_request_logs():
    _request_logs.set([])


def get_request_logs():
    logs = _request_logs.get()
    return list(logs) if logs else []


def log_ai(
    *,
    service: str,
    action: str,
    method: str = "POST",
    url: str = "",
    request_summary: dict | None = None,
    status_code: int | None = None,
    response_summary: str | None = None,
    error: str | None = None,
    duration_ms: int | None = None,
    extra: dict | None = None,
):
    entry = {
        "ts": _now_iso(),
        "service": service,
        "action": action,
        "method": method,
        "url": url,
        "request": request_summary,
        "statusCode": status_code,
        "response": _truncate(response_summary),
        "error": error,
        "durationMs": duration_ms,
        "extra": extra or {},
    }

    try:
        logs = _request_logs.get()
        if logs is None:
            logs = []
    except LookupError:
        logs = []
    logs.append(entry)
    _request_logs.set(logs)

    with _lock:
        _memory.append(entry)
        LOG_DIR.mkdir(parents=True, exist_ok=True)
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")

    line = (
        f"[{entry['ts']}] {service}/{action} {method} {url or '-'} "
        f"status={status_code} err={error or '-'} {duration_ms or '-'}ms"
    )
    print(line)
    return entry


def get_recent_logs(limit=50):
    with _lock:
        items = list(_memory)
    return items[-limit:]


def read_log_file(limit=100):
    if not LOG_FILE.exists():
        return []
    with _lock:
        lines = LOG_FILE.read_text(encoding="utf-8").splitlines()
    tail = lines[-limit:]
    out = []
    for line in tail:
        try:
            out.append(json.loads(line))
        except json.JSONDecodeError:
            out.append({"raw": line})
    return out


def export_logs_text(logs: list | None = None) -> str:
    items = logs if logs is not None else get_request_logs()
    if not items:
        return "(không có log cho request này)"
    return json.dumps(items, ensure_ascii=False, indent=2)
