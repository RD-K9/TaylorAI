# Thiết kế quần áo

Web app gợi ý quần áo phù hợp với dáng người, mùa, style, mục đích sử dụng.

## Tech Stack

- **Frontend (Lovable):** `../magic-markdown-fe` — TanStack Start + Tailwind (UI chính)
- **Frontend (legacy):** `frontend/` — React + Vite scaffold cũ
- **Backend:** Python Flask
- **Generate:** Pollinations AI — model `kontext` (Flux Kontext)
- **Validate vải:** Pollinations Vision (gemini/openai)
- **Try-On:** Gradio Client → Kolors Virtual Try-On (fallback OOTDiffusion)

## Cài đặt

### Backend

```bash
cd fashion-app/backend
pip install -r requirements.txt
cp .env.example .env
# Chỉnh POLLINATIONS_API_KEY và HF_TOKEN trong .env
python server.py
```

Server chạy tại `http://localhost:3000`

### Frontend Lovable (khuyên dùng)

```bash
# Terminal 1 — backend
cd fashion-app/backend
python server.py

# Terminal 2 — Lovable UI
cd magic-markdown-fe
npm install
npm run dev
```

Mở **http://localhost:8080** (port Vite có thể khác — xem terminal).  
Header hiện **"Backend kết nối OK"** khi BE chạy.

Hoặc chạy cả hai một lần (Windows):

```powershell
cd fashion-app
.\start-dev.ps1
```

`magic-markdown-fe` dùng Vite proxy `/api` → `localhost:3000` (`.env` để trống `VITE_API_URL`).

### Frontend legacy (fashion-app/frontend)

## Luồng sử dụng

1. Upload ảnh người (bắt buộc) + optional: vải, ảnh mẫu, số đo dáng người
2. Chọn bộ lọc (Mùa + Loại quần áo bắt buộc)
3. Generate 1/3/5/10 style tuần tự
4. Preview → Remix hoặc Chọn → Try-On → Download/Share

## API

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/api/health` | GET | Health check |
| `/api/validate-fabric` | POST | AI validate vải (chỉ khi có upload) |
| `/api/generate-garment` | POST | Kontext generate 1 ảnh |
| `/api/temp-image/{id}` | GET | Host ảnh tạm cho Pollinations |
| `/api/try-on` | POST | Virtual try-on |

### POST `/api/generate-garment`

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
    "personImageBase64": "...",
    "fabricImageBase64": "...",
    "referenceImageBase64": "..."
  },
  "options": { "seed": -1 }
}
```

### POST `/api/try-on`

```json
{
  "personImageBase64": "...",
  "garmentImageBase64": "..."
}
```

## Environment

| Biến | Mô tả |
|------|-------|
| `POLLINATIONS_API_KEY` | API key Pollinations (`sk_...`) |
| `POLLINATIONS_IMAGE_MODEL` | `kontext` (default) |
| `POLLINATIONS_VISION_MODEL` | `gemini` hoặc `openai` |
| `HF_TOKEN` | Hugging Face token cho Gradio Spaces |
| `TRYON_SPACE` | Kolors Space (default) |
| `TRYON_FALLBACK_SPACE` | OOTDiffusion fallback |

## Deploy

Xem chi tiết: [DEPLOY.md](./DEPLOY.md)

- **Local:** `python server.py` + `npm run dev`
- **Docker:** `docker compose up --build` → http://localhost:8080
- **GitHub Pages:** chỉ frontend — backend deploy riêng (Render/Railway)
- **Không bắt buộc Docker** cho dev local

## AI debug logs

Khi API AI (Pollinations / Gradio) không trả kết quả, backend ghi log và trả về trong response:

- `debugLog` — mảng JSON chi tiết từng bước gọi API
- `debugLogText` — cùng nội dung dạng text (copy/paste)

**File log trên server:** `backend/logs/ai-api.log`

**Xem log qua API:**

```bash
GET /api/ai-logs?limit=50
GET /api/ai-logs?limit=100&source=file
```

Frontend Lovable: toast lỗi có nút **Copy log** / **Tải log**; log cũng in ra Console (F12).


- **Generate fail:** Kiểm tra `POLLINATIONS_API_KEY` và số dư Pollen
- **Validate vải fail:** App vẫn cho generate — warning mang tính gợi ý
- **Try-on fail:** Kolors Space có thể tắt API — fallback OOTDiffusion tự động
- **Generate 10 ảnh:** Mất nhiều thời gian — dùng progress bar
