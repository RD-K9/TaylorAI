# Lovable Prompt — Frontend Fashion App (Classic Editorial UI)

Copy toàn bộ nội dung trong block dưới vào Lovable.

---

Build a Vietnamese fashion recommendation web app frontend. **Do NOT call Pollinations or any AI API directly from the browser.** All AI goes through an existing Flask backend REST API.

## Visual direction — Classic fashion / editorial

Design like a **luxury fashion magazine** or **haute couture lookbook** — timeless, elegant, not generic SaaS.

- **Palette:** ivory/cream background (`#FAF7F2`), charcoal text (`#1C1917`), accent gold/brass (`#B8860B`) or deep burgundy (`#722F37`). Optional soft blush (`#E8D5D0`).
- **Typography:** Serif display for headings (Playfair Display, Cormorant Garamond, or Libre Baskerville) + clean sans for body (Inter, Lato). Large elegant headlines, generous letter-spacing on labels.
- **Layout:** Editorial asymmetry — hero upload area like a magazine spread; garment grid like a lookbook catalog. Thin gold borders, subtle shadows, lots of whitespace.
- **Components:** Ornate section dividers (thin lines), pill buttons with refined borders, select dropdowns styled like fashion filters. No neon, no glassmorphism, no generic purple gradient startup look.
- **Imagery:** Photo frames with thin double borders; preview cards feel like **polaroid / runway stills**.
- **Mobile:** Same classic tone — drawer for filters styled as a "styling menu", FAB for generate in gold/burgundy.

100% **Vietnamese UI copy**. English only in API field values where noted (style names Low/Mid/High).

---

## App title

**Thiết kế quần áo**

Tagline: *"Phong cách dành riêng cho bạn"*

---

## 5-step user flow

1. **Input** — upload + filters
2. **AI Process** — validate fabric (if any) + generate garments
3. **Preview** — grid of generated outfits
4. **Feedback** — Good / Not Good → Remix
5. **Try-On** (optional) — virtual try-on, download, share

Step indicator bar at top: *Nhập liệu → Xử lý AI → Xem trước → Phản hồi → Thử đồ*

---

## Backend API (required integration)

Base URL from env: `VITE_API_URL` (e.g. `http://localhost:3000`). All paths prefixed with `/api`.

### `GET /api/health`
Response: `{ "status": "ok" }`

### `POST /api/validate-fabric` (only if user uploaded fabric)
Request:
```json
{
  "fabricImageBase64": "<base64 without data URL prefix>",
  "clothesType": "Váy",
  "season": "Hè",
  "occasion": "Đi tiệc"
}
```
Response:
```json
{
  "fabric_type": "linen",
  "compatible": true,
  "message_vi": "Vải linen phù hợp váy mùa hè"
}
```
If `compatible === false`, show amber warning banner with `message_vi` and button **"Tiếp tục generate"** — do NOT auto-generate until user confirms.

### `POST /api/generate-garment` (one image per request)
Request:
```json
{
  "filters": {
    "season": "Hè",
    "bodyType": "Trung bình",
    "bodyShape": "Pear",
    "clothesType": "Váy",
    "occasion": "Đi chơi",
    "stylePref": "Minimalist",
    "budget": "Mid",
    "region": "Việt Nam",
    "fitPref": "Regular fit"
  },
  "context": {
    "personImageBase64": "<base64>",
    "fabricImageBase64": "<optional>",
    "referenceImageBase64": "<optional>",
    "bodyMeasurements": { "height": 165, "bust": 88, "waist": 70, "hips": 95 }
  },
  "options": { "seed": 12345, "width": 1024, "height": 1024 }
}
```
Only include `bodyMeasurements` fields the user filled. Strip `data:image/...;base64,` prefix before sending.

Response:
```json
{
  "image": "<base64 JPEG>",
  "prompt": "...",
  "seed": 12345,
  "meta": { "model": "kontext", "durationMs": 4200 }
}
```

Loop **sequentially** for count 1, 3, 5, or 10 — different seed each time (`Date.now() + i * 997`). Show progress bar *"Đang generate 2/5..."*.

### `POST /api/try-on`
Request:
```json
{
  "personImageBase64": "<base64>",
  "garmentImageBase64": "<base64>"
}
```
Response:
```json
{
  "image": "<base64>",
  "meta": { "space": "...", "durationMs": 8000 }
}
```
Timeout: 180s. Show loading *"Đang thử đồ ảo..."*.

Error shape: `{ "error": { "code": "...", "message": "..." } }`

---

## Inputs (STEP 1)

### Upload zones — prominent buttons, NOT hidden native file inputs

| Field | Label | Required |
|-------|-------|----------|
| Person photo | **Ảnh người** | Yes |
| Fabric | **Chất liệu vải (Tùy chọn)** — hint: *"Không upload vẫn generate bình thường"* | No |
| Style ref | **Ảnh mẫu (Tùy chọn)** | No |

Large drag-and-drop zone for person photo on main panel when empty. Accept JPG/PNG/WebP, max 10MB, min 512px short edge. Client-side resize max 1536px before base64.

### Manual body measurements (optional) — NO AI body detect, NO size S/M/L/XL

Section **"Dáng người (Tùy chọn)"** — 4 number inputs:
- Chiều cao (cm), Ngực (cm), Eo (cm), Mông (cm)

---

## Filters (9 groups + generate count)

| # | Label | Control | Options | Required |
|---|-------|---------|---------|----------|
| 1 | Mùa | Button group | Xuân, Hè, Thu, Đông | **Yes** |
| 2 | Thể trạng | Button group | Gầy, Trung bình, Mũm mĩm | No |
| 3 | Body type | Select | Không chọn, Pear, Apple, Hourglass, Rectangle, Triangle | No |
| 4 | Loại quần áo | Button group | Áo, Quần, Váy, Set | **Yes** |
| 5 | Mục đích | Select | Không chọn, Đi tiệc, Đi chơi, Đi làm, Đi học, Thể thao | No |
| 6 | Style preference | Select | Không chọn, Minimalist, Bohemian, Streetwear, Luxury, Vintage | No |
| 7 | Ngân sách | Select | Không chọn, Low, Mid, High | No |
| 8 | Vùng địa lý | Select | Không chọn, Việt Nam, Châu Á, Châu Âu, Mỹ | No |
| 9 | Fit preference | Select | Không chọn, Slim fit, Regular fit, Loose fit | No |
| — | Generate multiple | Select | 1, 3, 5, 10 (default 1, sequential) | No |

Primary CTA: **"Generate Quần Áo"** — disabled until person image + season + clothesType. Tooltip when disabled explains what's missing.

Warn when count=10: *"10 ảnh sẽ mất nhiều thời gian và tốn pollen."*

Soft conflict hint: Slim fit + Mũm mĩm → *"Có thể không thoải mái với Slim fit — thử Regular fit."*

---

## Generate pipeline logic

```
startGenerate():
  1. Validate personImage + season + clothesType
  2. If NO fabricImage → skip validate
  3. If fabricImage → POST validate-fabric
     - If compatible=false → show FabricWarning, WAIT for "Tiếp tục generate"
  4. Loop count times POST generate-garment (sequential, not parallel)
  5. Convert response.image base64 → blob URL for display
  6. Go to Preview step
```

---

## Preview & Feedback (STEP 3–4)

- **Garment grid** — catalog cards with style/budget tags
- **Texture zoom** — only if user uploaded fabric; compare fabric vs garment
- **FeedbackPanel** per card: 👍 Thích / 👎 Không thích
- **Chọn** — select garment for try-on
- **Không muốn → Remix** — opens modal to change: Mùa, Thể trạng, Loại quần áo, Style, Ngân sách + **"Remix ngẫu nhiên"** (rotate season/bodyType/clothesType/style/budget)
- **Xóa** — remove card from grid

---

## Try-On (STEP 5 — optional)

Button **"Người Mặc Quần Áo"** — requires selected garment + person image.

Result section **"Người Mặc:"** with before/after compare slider, **Tải Xuống**, **Share**, **Thử outfit khác**.

---

## State shape (reference)

```typescript
{
  step: 'input' | 'processing' | 'preview' | 'feedback' | 'tryon' | 'done',
  inputs: { personImage, fabricImage, referenceImage, bodyMeasurements },
  filters: { season, bodyType, bodyShape, clothesType, occasion, stylePref, budget, region, fitPref },
  generateCount: 1 | 3 | 5 | 10,
  fabricValidation: { compatible, message_vi, fabric_type } | null,
  garments: [{ id, imageUrl, imageBase64, prompt, seed, stylePref, budget, feedback }],
  selectedGarmentId: string | null,
  generate: { count, current, status: 'idle' | 'validating' | 'generating' | 'awaiting_fabric_confirm' | 'done' },
  tryOn: { result, status, error }
}
```

Persist filters + generateCount to sessionStorage draft.

---

## Pages / layout

**Desktop:** Left sidebar (upload + filters) + main content (preview / try-on).  
**Mobile:** Upload hero on main; **"Upload & Lọc"** opens drawer; FAB **"Tạo outfit"** when ready.

Loading overlay during validate/generate/try-on with elegant spinner (thin gold ring, not chunky loader).

Toast notifications for success messages in Vietnamese.

---

## Explicit exclusions

- NO AI auto-detect body
- NO checkbox "AI tự detect"
- NO size estimate S/M/L/XL badges
- NO direct Pollinations/HuggingFace calls from frontend
- NO building English prompts on frontend (backend handles prompts)

---

## Tech stack for Lovable

- React + TypeScript + Tailwind CSS
- `fetch` API client module (`fashionApi.ts`)
- Image utils: base64 strip, blob URL, client resize, download/share helpers
- Env: `VITE_API_URL`

Make it beautiful, responsive, and production-ready with the classic fashion editorial aesthetic described above.
