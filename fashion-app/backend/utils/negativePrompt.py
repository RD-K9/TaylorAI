from .promptTemplates import OCCASION, REGION, SEASON


def build_negative_prompt(filters):
    parts = [
        "blurry",
        "distorted",
        "watermark",
        "text",
        "logo",
        "deformed",
        "low quality",
        "human",
        "person",
        "people",
        "model",
        "mannequin",
        "human body",
        "full body",
        "standing person",
        "human figure",
        "human face",
        "face",
        "portrait",
        "head",
        "visible face",
        "model face",
        "arms",
        "legs",
        "hands",
        "feet",
        "skin",
        "side view",
        "angled garment",
        "tilted garment",
        "wrinkled layout",
        "colored background",
        "gradient background",
        "outdoor background",
        "busy background",
        "shadow on background",
    ]

    region = (filters.get("region") or "").strip().lower()
    if region in ("việt nam", "châu á"):
        parts.extend(["revealing", "inappropriate"])

    occasion = (filters.get("occasion") or "").strip().lower()
    if occasion in ("đi làm", "đi tiệc"):
        parts.extend(["casual sloppy", "wrinkled"])

    return ", ".join(parts)
