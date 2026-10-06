@echo off
echo ============================================================
echo Starting The Source Company - Industrial Energy Platform
echo ============================================================
echo.
echo 1. REST API Backend:        http://localhost:8000
echo 2. Public Marketing Site:   http://localhost:8002
echo 3. Operations Portal:       http://localhost:3001
echo.

cd /d "%~dp0"

start "The Source - API Server (Port 8000)" cmd /k "cd server && node src/index.js"
start "The Source - Marketing Site (Port 8002)" cmd /k "python -m http.server 8002 --directory static-site"
start "The Source - Operations Portal (Port 3001)" cmd /k "cd frontend && npm.cmd run start -- -p 3001"

echo All services launched in dedicated terminal windows!
echo Opening sites in browser...
timeout /t 3 /nobreak >nul
start http://localhost:8002
start http://localhost:3001
