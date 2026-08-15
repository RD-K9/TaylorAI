from .promptTemplates import (
    BUDGET,
    BODY_SHAPE,
    BODY_TYPE,
    FIT,
    GARMENT_TYPE,
    OCCASION,
    PERSON_BODY_SIZING,
    PRODUCT_FRAMING,
    QUALITY,
    REGION,
    SEASON,
    STYLE,
)


def _norm(value):
    return (value or "").strip().lower()


def build_measurements_prompt(measurements):
    if not measurements:
        return None
    parts = []
    h = measurements.get("height")
    b = measurements.get("bust")
    w = measurements.get("waist")
    hip = measurements.get("hips")
    if h:
        parts.append(f"height {h}cm")
    if b:
        parts.append(f"bust {b}cm")
    if w:
        parts.append(f"waist {w}cm")
    if hip:
        parts.append(f"hips {hip}cm")
    if not parts:
        return None
    return "tailored proportions for " + ", ".join(parts)


def build_prompt(filters, context=None):
    context = context or {}
    parts = []

    clothes = _norm(filters.get("clothesType"))
    if clothes in GARMENT_TYPE:
        parts.append(GARMENT_TYPE[clothes])

    season = _norm(filters.get("season"))
    if season in SEASON:
        parts.append(SEASON[season])

    body_type = _norm(filters.get("bodyType"))
    body_shape = _norm(filters.get("bodyShape"))
    if body_type and body_shape:
        parts.append(f"{body_shape}-shaped {body_type} body, {BODY_SHAPE.get(body_shape, '')}")
    elif body_type and body_type in BODY_TYPE:
        parts.append(BODY_TYPE[body_type])
    elif body_shape and body_shape in BODY_SHAPE:
        parts.append(BODY_SHAPE[body_shape])

    occasion = _norm(filters.get("occasion"))
    if occasion in OCCASION:
        parts.append(OCCASION[occasion])

    style = _norm(filters.get("stylePref"))
    if style in STYLE:
        parts.append(STYLE[style])

    budget = _norm(filters.get("budget"))
    if budget in BUDGET:
        parts.append(BUDGET[budget])

    region = _norm(filters.get("region"))
    if region in REGION:
        parts.append(REGION[region])

    fit = _norm(filters.get("fitPref"))
    if fit in FIT:
        parts.append(FIT[fit])

    m = build_measurements_prompt(context.get("bodyMeasurements"))
    if m:
        parts.append(m)

    if context.get("fabricImageBase64"):
        parts.append("apply fabric texture and material from the fabric reference image")

    if context.get("referenceImageBase64"):
        parts.append("outfit inspired by reference style silhouette and color palette")

    if context.get("personImageBase64"):
        parts.append(PERSON_BODY_SIZING)

    parts.append(PRODUCT_FRAMING)
    parts.append(QUALITY)
    return ", ".join(p for p in parts if p)
