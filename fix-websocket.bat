@echo off
echo Fixing WebSocket Connection Issues...
echo =====================================
echo.

echo Step 1: Killing all Node processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak > nul

echo.
echo Step 2: Starting Backend Server...
start cmd /k "cd server && npm run dev"
echo Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo.
echo Step 3: Starting Frontend Server...
start cmd /k "cd client && npm run dev"
echo Waiting for frontend to start...
timeout /t 5 /nobreak > nul

echo.
echo =====================================
echo ✅ Services Started!
echo.
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo Please open http://localhost:3000 in your browser
echo WebSocket should connect automatically (green indicator)
echo.
pause
