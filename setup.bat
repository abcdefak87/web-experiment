@echo off
echo 🚀 Setting up ISP Management System...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

echo ✅ Node.js detected
node --version

REM Install root dependencies
echo 📦 Installing root dependencies...
call npm install

REM Install client dependencies
echo 📦 Installing client dependencies...
cd client
call npm install
cd ..

REM Install server dependencies
echo 📦 Installing server dependencies...
cd server
call npm install
cd ..

REM Create environment files if they don't exist
echo 🔧 Setting up environment files...

if not exist "client\.env.local" (
    copy "client\env.example" "client\.env.local"
    echo ✅ Created client\.env.local from example
) else (
    echo ⚠️  client\.env.local already exists
)

if not exist "server\.env" (
    copy "server\env.example" "server\.env"
    echo ✅ Created server\.env from example
) else (
    echo ⚠️  server\.env already exists
)

REM Setup database
echo 🗄️  Setting up database...
cd server
call npx prisma generate
call npx prisma db push
cd ..

REM Create necessary directories
echo 📁 Creating necessary directories...
if not exist "server\logs" mkdir "server\logs"
if not exist "server\uploads" mkdir "server\uploads"
if not exist "qr-codes" mkdir "qr-codes"
if not exist "auth_info_baileys" mkdir "auth_info_baileys"

echo ✅ Setup completed successfully!
echo.
echo 📋 Next steps:
echo 1. Edit client\.env.local and server\.env with your configuration
echo 2. Run 'npm run dev' to start development servers
echo 3. Open http://localhost:3000 in your browser
echo 4. Scan QR code at http://localhost:3001/qr/whatsapp-qr.png for WhatsApp bot
echo.
echo 🔧 Available commands:
echo   npm run dev          - Start development servers
echo   npm run build        - Build for production
echo   npm run start        - Start production servers
echo   npm run db:migrate   - Run database migrations
echo   npm run db:seed      - Seed database
echo   npm run db:studio    - Open Prisma Studio
echo.
echo 📚 For more information, see README.md
pause
