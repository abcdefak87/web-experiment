@echo off
echo ========================================
echo   PRODUCTION BUILD WITH AUTO-REBUILD
echo ========================================
echo.

REM Start server with nodemon in one window
start "Server (Nodemon)" cmd /k "cd server && npm run dev"

REM Start client with build watch in another window
start "Client (Auto-Build)" cmd /k "cd client && npm install && npm run build:watch"

REM Start client server in another window
start "Client (Server)" cmd /k "cd client && timeout /t 30 && npm start"

echo.
echo ========================================
echo   Services Started:
echo ========================================
echo.
echo 1. Server with Nodemon (auto-restart)
echo 2. Client Build Watch (auto-rebuild)
echo 3. Client Server (production mode)
echo.
echo Client: http://localhost:3000
echo Server: http://localhost:3001
echo.
echo Close all windows to stop services
echo ========================================
pause
