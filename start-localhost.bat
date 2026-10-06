@echo off
echo ===================================================
echo Starting The Source Company - Localhost Deployment
echo ===================================================
echo.
echo 1. Marketing Site: http://localhost:8002
echo 2. Portal App:     http://localhost:3001
echo.

cd /d "%~dp0"

start "The Source - Marketing Site (Port 8002)" cmd /k "python -m http.server 8002 --directory static-site"
start "The Source - Portal (Port 3001)" cmd /k "cd frontend && npm.cmd run start -- -p 3001"

echo Both services launched in background terminal windows!
echo Opening sites in browser...
timeout /t 2 /nobreak >nul
start http://localhost:8002
start http://localhost:3001
