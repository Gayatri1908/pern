@echo off
echo ============================================================
echo Starting The Source Company - PERN Technical Case Study
echo ============================================================
echo.
echo 1. REST API Backend:        http://localhost:8000
echo 2. PERN Workflow Portal:    http://localhost:3001
echo.
echo Credentials:
echo   - ADMIN:       admin@thesource.com / Admin@123
echo   - SALES USER:  sales@thesource.com / Sales@123
echo.

cd /d "%~dp0"

start "The Source - API Server (Port 8000)" cmd /k "cd server && node src/index.js"
start "The Source - PERN Portal (Port 3001)" cmd /k "cd frontend && npm.cmd run start -- -p 3001"

echo All services launched in dedicated terminal windows!
echo Opening PERN Portal in browser...
timeout /t 3 /nobreak >nul
start http://localhost:3001/login
