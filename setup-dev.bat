@echo off
echo.
echo 🚀 SETUP DEVELOPMENT ENVIRONMENT
echo =================================
echo.

echo 📦 Installing Server Dependencies...
cd server
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install server dependencies
    pause
    exit /b 1
)

echo.
echo 🗄️ Setting up Database (SQLite)...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ❌ Failed to generate Prisma client
    pause
    exit /b 1
)

call npx prisma db push
if %errorlevel% neq 0 (
    echo ❌ Failed to setup database
    pause
    exit /b 1
)

echo.
echo 👤 Creating default users...
call npx prisma db seed
cd ..

echo.
echo 📦 Installing Client Dependencies...
cd client
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install client dependencies
    pause
    exit /b 1
)
cd ..

echo.
echo 📁 Creating required directories...
if not exist "server\logs" mkdir "server\logs"
if not exist "server\uploads" mkdir "server\uploads"
if not exist "server\qr-codes" mkdir "server\qr-codes"

echo.
echo ✅ SETUP COMPLETED!
echo.
echo 📋 Default Users Created:
echo    Username: superadmin / Password: super123
echo    Username: admin / Password: admin123
echo    Username: gudang / Password: gudang123
echo    Username: teknisi / Password: teknisi123
echo.
echo 🚀 To start development:
echo    Run: start-dev.bat
echo.
pause
