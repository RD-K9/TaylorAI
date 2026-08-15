FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PORT=3000
ENV PYTHONUNBUFFERED=1

EXPOSE 3000

# Render sets $PORT; Free tier: 1 worker to stay within 512MB RAM
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT:-3000} --workers 1 --timeout 180 wsgi:app"]
