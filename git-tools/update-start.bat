@echo off
REM Quick Update Starter - Mulai update dengan mudah
REM Otomatis switch ke develop branch dan sync dengan main

echo.
echo 🚀 MEMULAI UPDATE SESSION
echo ========================
echo.

REM Check current branch
for /f "tokens=*" %%i in ('git branch --show-current') do set CURRENT_BRANCH=%%i
echo 📍 Branch saat ini: %CURRENT_BRANCH%

REM Stash any uncommitted changes
echo.
echo 💾 Menyimpan perubahan yang belum di-commit...
git stash

REM Switch to develop
echo.
echo 🔄 Switch ke branch develop...
git checkout develop

REM Pull latest from origin
echo.
echo 📥 Pull update terbaru dari remote...
git pull origin develop

REM Sync with main
echo.
echo 🔄 Sync dengan main branch...
git fetch origin main
git merge origin/main --no-edit

REM Show status
echo.
echo ✅ SIAP UNTUK UPDATE!
echo ====================
echo.
echo 📊 Status:
git status --short --branch

echo.
echo 🛠️ CARA KERJA UPDATE:
echo ---------------------
echo 1. Edit file yang diperlukan
echo 2. Gunakan: update-commit.bat "deskripsi update"
echo 3. Atau manual: git-commit.bat [type] "[message]"
echo.
echo 💡 Tips: Untuk update kecil, langsung pakai update-commit.bat
echo.
pause
