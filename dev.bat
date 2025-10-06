@echo off
cls
echo.
echo ============================================
echo      ISP MANAGEMENT SYSTEM - DEV TOOLS
echo              All-in-One Developer Tool
echo ============================================
echo.
echo [1] Setup Development (First Time)
echo [2] Start Backend Server
echo [3] Start Frontend Server  
echo [4] Start WhatsApp Bot
echo [5] Start All Services
echo [6] Backend + Frontend
echo [7] Database Operations
echo [8] Git Commands
echo [9] Exit
echo.
set /p choice="Select option (1-9): "

if "%choice%"=="1" goto :setup
if "%choice%"=="2" goto :backend
if "%choice%"=="3" goto :frontend
if "%choice%"=="4" goto :whatsapp
if "%choice%"=="5" goto :all
if "%choice%"=="6" goto :web
if "%choice%"=="7" goto :database
if "%choice%"=="8" goto :git
if "%choice%"=="9" exit /b 0

echo Invalid choice!
pause
goto :menu

:setup
echo.
echo ===== SETUP DEVELOPMENT ENVIRONMENT =====
echo.
echo Installing Server Dependencies...
cd server
call npm install
echo.
echo Setting up Database...
call npx prisma generate
call npx prisma db push
call npx prisma db seed
cd ..
echo.
echo Installing Client Dependencies...
cd client
call npm install
cd ..
echo.
echo Creating directories...
if not exist "server\logs" mkdir "server\logs"
if not exist "server\uploads" mkdir "server\uploads"
if not exist "server\qr-codes" mkdir "server\qr-codes"
echo.
echo ✅ Setup Complete!
echo.
echo Default Users:
echo   superadmin / super123
echo   admin / admin123
echo   gudang / gudang123
echo   teknisi / teknisi123
echo.
pause
dev.bat
exit /b 0

:backend
echo.
echo Starting Backend Server...
echo Port: http://localhost:3001
echo Press Ctrl+C to stop
echo.
cd server && npm run dev
exit /b 0

:frontend
echo.
echo Starting Frontend Server...
echo Port: http://localhost:3000
echo Press Ctrl+C to stop
echo.
cd client && npm run dev
exit /b 0

:whatsapp
echo.
echo Starting WhatsApp Bot...
echo Scan QR code when appears
echo Press Ctrl+C to stop
echo.
node scripts/whatsapp-bot-integrated.js
exit /b 0

:all
echo.
echo Starting All Services...
echo This will open 3 terminal windows
echo.
start cmd /k "cd server && npm run dev"
timeout /t 2 /nobreak > nul
start cmd /k "cd client && npm run dev"
timeout /t 2 /nobreak > nul
start cmd /k "node scripts/whatsapp-bot-integrated.js"
echo.
echo ✅ All services started in separate windows!
echo.
echo Access Points:
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:3001
echo.
pause
exit /b 0

:web
echo.
echo Starting Backend + Frontend...
echo This will open 2 terminal windows
echo.
start cmd /k "cd server && npm run dev"
timeout /t 2 /nobreak > nul
start cmd /k "cd client && npm run dev"
echo.
echo ✅ Web services started!
echo.
echo Access Points:
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:3001
echo.
pause
exit /b 0

:database
echo.
echo ===== DATABASE OPERATIONS =====
echo.
echo [1] Open Prisma Studio
echo [2] Reset Database
echo [3] Run Migrations
echo [4] Seed Database
echo [5] Generate Prisma Client
echo [6] Back to Main Menu
echo.
set /p dbchoice="Select option (1-6): "

if "%dbchoice%"=="1" (
    echo Opening Prisma Studio...
    cd server && npx prisma studio
) else if "%dbchoice%"=="2" (
    echo Resetting Database...
    cd server && npx prisma migrate reset
) else if "%dbchoice%"=="3" (
    echo Running Migrations...
    cd server && npx prisma migrate dev
) else if "%dbchoice%"=="4" (
    echo Seeding Database...
    cd server && npx prisma db seed
) else if "%dbchoice%"=="5" (
    echo Generating Prisma Client...
    cd server && npx prisma generate
) else if "%dbchoice%"=="6" (
    dev.bat
    exit /b 0
)
pause
goto :database

:git
echo.
echo ===== GIT COMMANDS =====
echo.
echo [1] Git Status
echo [2] Git Add All
echo [3] Git Commit
echo [4] Git Push
echo [5] Git Pull
echo [6] Git Log
echo [7] Back to Main Menu
echo.
set /p gitchoice="Select option (1-7): "

if "%gitchoice%"=="1" (
    git status
    pause
    goto :git
) else if "%gitchoice%"=="2" (
    git add -A
    echo Files added!
    pause
    goto :git
) else if "%gitchoice%"=="3" (
    set /p msg="Enter commit message: "
    git commit -m "%msg%"
    pause
    goto :git
) else if "%gitchoice%"=="4" (
    git push
    pause
    goto :git
) else if "%gitchoice%"=="5" (
    git pull
    pause
    goto :git
) else if "%gitchoice%"=="6" (
    git log --oneline -10
    pause
    goto :git
) else if "%gitchoice%"=="7" (
    dev.bat
    exit /b 0
)
