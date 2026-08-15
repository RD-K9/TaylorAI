# Deploy lên GitHub & Production

## Tóm tắt nhanh

| Cách chạy | Docker? | GitHub? |
|-----------|---------|---------|
| Local dev | Không bắt buộc | Không |
| Docker local | `docker compose up` | — |
| GitHub Pages (frontend only) | Không | Có — **chỉ UI tĩnh** |
| Full app live | Khuyên dùng Render/Railway/Fly | Repo lưu code + CI |

**GitHub Pages không chạy được Flask backend.** Bạn cần deploy backend riêng, rồi trỏ frontend tới URL backend.

---

## 1. Chạy local (không Docker)

```bash
# Terminal 1 — Backend
cd fashion-app/backend
pip install -r requirements.txt
cp .env.example .env   # điền POLLINATIONS_API_KEY, HF_TOKEN
python server.py

# Terminal 2 — Frontend
cd fashion-app/frontend
npm install
cp .env.example .env
npm run dev
```

- Frontend: http://localhost:5173  
- Backend: http://localhost:3000  

---

## 2. Docker (khuyên dùng để test production)

```bash
cd fashion-app
cp backend/.env.example backend/.env
# Sửa backend/.env — điền API keys

docker compose up --build
```

- Frontend: http://localhost:8080 (nginx proxy `/api` → backend)  
- Backend trực tiếp: http://localhost:3000  

---

## 3. GitHub — lưu code + CI

Push repo lên GitHub. Workflow `ci.yml` tự:
- Build frontend
- Test backend `/api/health`

Không cần Docker trên GitHub Actions cho CI cơ bản.

---

## 4. GitHub Pages (chỉ frontend)

1. Vào **Settings → Pages → Source: GitHub Actions**
2. Deploy backend lên Render/Railway (miễn phí tier):
   - Root: `fashion-app/backend`
   - Start: `gunicorn --bind 0.0.0.0:$PORT --timeout 180 wsgi:app`
   - Env: `POLLINATIONS_API_KEY`, `HF_TOKEN`, `PUBLIC_BASE_URL=https://your-backend.onrender.com`
3. Trong GitHub repo → **Settings → Secrets and variables → Actions → Variables**:
   - `VITE_API_URL` = `https://your-backend.onrender.com`
4. Push lên `main` → workflow `deploy-pages.yml` deploy UI

User mở `https://username.github.io/repo/` → frontend gọi API backend đã deploy.

---

## 5. All-in-one (backend serve cả frontend)

Build frontend rồi bật Flask serve static:

```bash
cd fashion-app/frontend && npm run build
cd ../backend
export SERVE_FRONTEND=true
export PUBLIC_BASE_URL=https://your-domain.com
gunicorn --bind 0.0.0.0:3000 --timeout 180 wsgi:app
```

Một server phục vụ cả UI + `/api/*`.

---

## Biến môi trường production

| Biến | Bắt buộc | Ghi chú |
|------|----------|---------|
| `POLLINATIONS_API_KEY` | Có | `sk_...` từ enter.pollinations.ai |
| `HF_TOKEN` | Try-on | Hugging Face token |
| `PUBLIC_BASE_URL` | Generate | URL public backend (Pollinations fetch ảnh tạm) |
| `FRONTEND_ORIGIN` | CORS | URL frontend, nhiều origin cách nhau bởi dấu phẩy |
| `VITE_API_URL` | Frontend build | URL backend khi build riêng frontend |
