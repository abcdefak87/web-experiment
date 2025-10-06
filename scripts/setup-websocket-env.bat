@echo off
echo.
echo ========================================
echo   WebSocket Environment Setup for Windows
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Navigate to project root
cd /d "%~dp0\.."

REM Run the setup script
echo Starting WebSocket environment setup...
echo.
node scripts/setup-websocket-env.js

REM Check if the script ran successfully
if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   Setup completed successfully!
    echo ========================================
    echo.
    echo Next steps:
    echo 1. Open a new terminal and navigate to server folder
    echo    cd server
    echo    npm run dev
    echo.
    echo 2. Open another terminal and navigate to client folder
    echo    cd client
    echo    npm run dev
    echo.
) else (
    echo.
    echo ========================================
    echo   Setup failed! Please check the error above.
    echo ========================================
)

pause
