"""Prompt template blocks — Vietnamese filter values to English fragments."""

GARMENT_TYPE = {
    "áo": "top, shirt or blouse",
    "quần": "pants or trousers",
    "váy": "dress",
    "set": "full outfit, coordinated top and bottom set",
}

SEASON = {
    "xuân": "spring outfit, light layers, pastel colors",
    "hè": "summer outfit, breathable light fabrics, short sleeves",
    "thu": "autumn outfit, earthy colors, light jacket",
    "đông": "winter outfit, warm layered clothing, long sleeves, coat",
}

BODY_TYPE = {
    "gầy": "slim body friendly, relaxed fit, not too tight",
    "trung bình": "average body friendly, comfortable fit",
    "mũm mĩm": "plus size friendly, comfortable flattering fit, not tight",
}

BODY_SHAPE = {
    "pear": "pear body friendly, accentuate upper body, balance hips",
    "apple": "apple body friendly, elongate torso, define waist",
    "hourglass": "hourglass body friendly, emphasize waist, balanced silhouette",
    "rectangle": "rectangle body friendly, create curves, add volume",
    "triangle": "inverted triangle friendly, soften shoulders, add hip volume",
}

OCCASION = {
    "đi tiệc": "formal party outfit, elegant, luxurious",
    "đi chơi": "casual outing outfit, comfortable, trendy",
    "đi làm": "professional work outfit, business polished",
    "đi học": "student outfit, casual youthful",
    "thể thao": "sports outfit, athletic breathable",
}

STYLE = {
    "minimalist": "minimalist style, clean lines, simple",
    "bohemian": "bohemian style, flowy, vintage patterns",
    "streetwear": "streetwear style, urban trendy",
    "luxury": "luxury style, high-end elegant",
    "vintage": "vintage style, retro classic",
}

BUDGET = {
    "low": "budget-friendly, affordable fashion, simple materials, value-oriented",
    "mid": "mid-range fashion, good quality materials, balanced price point",
    "high": "premium luxury materials, high-end fashion, designer quality",
}

REGION = {
    "việt nam": "Vietnam style, modest conservative fashion",
    "châu á": "Asian style, modest elegant",
    "châu âu": "European style, trendy fashionable",
    "mỹ": "US style, casual bold",
}

FIT = {
    "slim fit": "slim fit, tailored close to body",
    "regular fit": "regular fit, comfortable standard",
    "loose fit": "loose fit, relaxed comfortable",
}

PERSON_BODY_SIZING = (
    "garment sized and proportioned for the body type and measurements described above, "
    "inspired by the uploaded person's proportions but output must be clothing only"
)

PRODUCT_FRAMING = (
    "front-facing garment display, straight flat lay, symmetrical and centered composition, "
    "garment laid flat and facing the camera directly, no tilt, no side angle, "
    "isolated clothing item only"
)

QUALITY = (
    "e-commerce product photography, pure white background mandatory, studio lighting, "
    "high detail, realistic fabric texture, photorealistic, garment-only focus, "
    "no human, no person, no model, no mannequin, no body, no limbs, "
    "no human face, no portrait, no head visible"
)
