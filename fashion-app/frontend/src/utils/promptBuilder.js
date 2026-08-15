const GARMENT_TYPE = {
  áo: 'top, shirt or blouse',
  quần: 'pants or trousers',
  váy: 'dress',
  set: 'full outfit, coordinated top and bottom set',
};

const SEASON = {
  xuân: 'spring outfit, light layers, pastel colors',
  hè: 'summer outfit, breathable light fabrics, short sleeves',
  thu: 'autumn outfit, earthy colors, light jacket',
  đông: 'winter outfit, warm layered clothing, long sleeves, coat',
};

const BODY_TYPE = {
  gầy: 'slim body friendly, relaxed fit, not too tight',
  'trung bình': 'average body friendly, comfortable fit',
  'mũm mĩm': 'plus size friendly, comfortable flattering fit, not tight',
};

const BODY_SHAPE = {
  pear: 'pear body friendly, accentuate upper body, balance hips',
  apple: 'apple body friendly, elongate torso, define waist',
  hourglass: 'hourglass body friendly, emphasize waist, balanced silhouette',
  rectangle: 'rectangle body friendly, create curves, add volume',
  triangle: 'inverted triangle friendly, soften shoulders, add hip volume',
};

const OCCASION = {
  'đi tiệc': 'formal party outfit, elegant, luxurious',
  'đi chơi': 'casual outing outfit, comfortable, trendy',
  'đi làm': 'professional work outfit, business polished',
  'đi học': 'student outfit, casual youthful',
  'thể thao': 'sports outfit, athletic breathable',
};

const STYLE = {
  minimalist: 'minimalist style, clean lines, simple',
  bohemian: 'bohemian style, flowy, vintage patterns',
  streetwear: 'streetwear style, urban trendy',
  luxury: 'luxury style, high-end elegant',
  vintage: 'vintage style, retro classic',
};

const BUDGET = {
  low: 'budget-friendly, affordable fashion, simple materials, value-oriented',
  mid: 'mid-range fashion, good quality materials, balanced price point',
  high: 'premium luxury materials, high-end fashion, designer quality',
};

const REGION = {
  'việt nam': 'Vietnam style, modest conservative fashion',
  'châu á': 'Asian style, modest elegant',
  'châu âu': 'European style, trendy fashionable',
  mỹ: 'US style, casual bold',
};

const FIT = {
  'slim fit': 'slim fit, tailored close to body',
  'regular fit': 'regular fit, comfortable standard',
  'loose fit': 'loose fit, relaxed comfortable',
};

const norm = (v) => (v || '').trim().toLowerCase();

function buildMeasurements(measurements) {
  if (!measurements) return null;
  const parts = [];
  if (measurements.height) parts.push(`height ${measurements.height}cm`);
  if (measurements.bust) parts.push(`bust ${measurements.bust}cm`);
  if (measurements.waist) parts.push(`waist ${measurements.waist}cm`);
  if (measurements.hips) parts.push(`hips ${measurements.hips}cm`);
  return parts.length ? `tailored proportions for ${parts.join(', ')}` : null;
}

export function buildPrompt(filters, context = {}) {
  const parts = [];
  const clothes = norm(filters.clothesType);
  if (GARMENT_TYPE[clothes]) parts.push(GARMENT_TYPE[clothes]);

  const season = norm(filters.season);
  if (SEASON[season]) parts.push(SEASON[season]);

  const bodyType = norm(filters.bodyType);
  const bodyShape = norm(filters.bodyShape);
  if (bodyType && bodyShape) {
    parts.push(`${bodyShape}-shaped ${bodyType} body, ${BODY_SHAPE[bodyShape] || ''}`);
  } else if (BODY_TYPE[bodyType]) {
    parts.push(BODY_TYPE[bodyType]);
  } else if (BODY_SHAPE[bodyShape]) {
    parts.push(BODY_SHAPE[bodyShape]);
  }

  const occasion = norm(filters.occasion);
  if (OCCASION[occasion]) parts.push(OCCASION[occasion]);

  const style = norm(filters.stylePref);
  if (STYLE[style]) parts.push(STYLE[style]);

  const budget = norm(filters.budget);
  if (BUDGET[budget]) parts.push(BUDGET[budget]);

  const region = norm(filters.region);
  if (REGION[region]) parts.push(REGION[region]);

  const fit = norm(filters.fitPref);
  if (FIT[fit]) parts.push(FIT[fit]);

  const m = buildMeasurements(context.bodyMeasurements);
  if (m) parts.push(m);

  if (context.fabricImageBase64) {
    parts.push('apply fabric texture and material from the fabric reference image');
  }
  if (context.referenceImageBase64) {
    parts.push('outfit inspired by reference style silhouette and color palette');
  }
  if (context.personImageBase64) {
    parts.push(
      'garment sized and proportioned for the body type and measurements described above, inspired by the uploaded person proportions but output must be clothing only'
    );
  }

  parts.push(
    'front-facing garment display, straight flat lay, symmetrical and centered composition, garment laid flat and facing the camera directly, no tilt, no side angle, isolated clothing item only',
    'e-commerce product photography, pure white background mandatory, studio lighting, high detail, realistic fabric texture, photorealistic, garment-only focus, no human, no person, no model, no mannequin, no body, no limbs, no human face, no portrait, no head visible'
  );
  return parts.filter(Boolean).join(', ');
}
