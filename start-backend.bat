@echo off
echo Starting Backend Server...
echo ========================
echo.
cd server
echo Clearing node cache...
rmdir /s /q node_modules\.cache 2>nul
echo.
echo Starting server on port 3001...
npm run dev
