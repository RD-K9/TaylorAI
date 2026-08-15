# Chay backend Flask + frontend Lovable (magic-markdown-fe)
$backend = Join-Path $PSScriptRoot "backend"
$frontend = Join-Path (Split-Path $PSScriptRoot -Parent) "magic-markdown-fe"

Write-Host "Backend:  $backend"
Write-Host "Frontend: $frontend"
Write-Host ""
Write-Host "Backend  -> http://localhost:3000"
Write-Host "Frontend -> http://localhost:8080 (Lovable/Vite — xem terminal neu khac port)"
Write-Host ""

if (-not (Test-Path (Join-Path $backend ".env"))) {
  Copy-Item (Join-Path $backend ".env.example") (Join-Path $backend ".env")
  Write-Host "Da tao backend\.env tu .env.example — hay dien POLLINATIONS_API_KEY"
}

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backend'; python server.py"
Start-Sleep -Seconds 2

if (Test-Path (Join-Path $frontend "bun.lock")) {
  Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontend'; bun install; bun dev"
} else {
  Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontend'; npm install; npm run dev"
}
