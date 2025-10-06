@echo off
echo.
echo 🚀 STARTING DEVELOPMENT SERVER (Simple Mode)
echo ============================================
echo.
echo 📋 Pilih service yang mau dijalankan:
echo.
echo    [1] Backend Only (Port 3001)
echo    [2] Frontend Only (Port 3000)
echo    [3] WhatsApp Bot Only
echo    [4] Backend + Frontend
echo    [5] All Services
echo.
set /p choice="Pilih (1-5): "

if "%choice%"=="1" (
    echo.
    echo 🔷 Starting Backend...
    cd server && npm run dev
) else if "%choice%"=="2" (
    echo.
    echo 🔷 Starting Frontend...
    cd client && npm run dev
) else if "%choice%"=="3" (
    echo.
    echo 🔷 Starting WhatsApp Bot...
    node scripts/whatsapp-bot-integrated.js
) else if "%choice%"=="4" (
    echo.
    echo 🔷 Starting Backend + Frontend...
    echo 💡 Buka terminal baru untuk frontend!
    echo.
    cd server && npm run dev
) else if "%choice%"=="5" (
    echo.
    echo 🔷 Starting All Services...
    echo 💡 Buka 2 terminal lagi untuk frontend dan WhatsApp!
    echo.
    cd server && npm run dev
) else (
    echo ❌ Pilihan tidak valid!
    pause
    exit /b 1
)
