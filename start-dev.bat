@echo off
echo.
echo 🚀 STARTING DEVELOPMENT SERVERS
echo ===============================
echo.
echo 📊 Starting services...
echo    - Backend API (Port 3001)
echo    - Frontend Next.js (Port 3000)
echo    - WhatsApp Bot
echo.

REM Start Backend Server
echo 🔷 Starting Backend Server...
start cmd /k "cd server && npm run dev"
timeout /t 3 /nobreak > nul

REM Start Frontend Server
echo 🔷 Starting Frontend Server...
start cmd /k "cd client && npm run dev"
timeout /t 3 /nobreak > nul

REM Start WhatsApp Bot
echo 🔷 Starting WhatsApp Bot...
start cmd /k "node scripts/whatsapp-bot-integrated.js"

echo.
echo ✅ All services starting...
echo.
echo 📋 Access Points:
echo    Frontend:     http://localhost:3000
echo    Backend API:  http://localhost:3001
echo    WhatsApp:     Check terminal for QR Code
echo.
echo 💡 Tips:
echo    - First time? Scan WhatsApp QR code in bot terminal
echo    - Stop all: Close all terminal windows
echo    - Logs: Check terminal windows for output
echo.
pause
