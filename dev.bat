@echo off
echo.
echo 🚀 DEVELOPMENT MODE - Simple
echo ============================
echo.
echo Starting Backend Server...
echo.
echo 📋 Info:
echo    Backend: http://localhost:3001 (Starting...)
echo    Frontend: http://localhost:3000 (Run dev-frontend.bat)
echo    WhatsApp: Run dev-whatsapp.bat
echo.
echo 💡 Buka terminal baru untuk service lain:
echo    - dev-frontend.bat untuk Frontend
echo    - dev-whatsapp.bat untuk WhatsApp Bot
echo.
echo ========================================
echo.
cd server && npm run dev
