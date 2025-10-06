@echo off
echo 🔄 Rebuilding frontend...

REM Navigate to client directory
cd client

REM Install dependencies if needed
echo 📦 Installing dependencies...
npm install

REM Build the frontend
echo 🏗️ Building frontend...
npm run build

REM Check if build was successful
if %errorlevel% equ 0 (
    echo ✅ Frontend build successful!
) else (
    echo ❌ Frontend build failed!
    exit /b 1
)

echo 🚀 Frontend rebuild completed!
