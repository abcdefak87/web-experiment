@echo off
REM Sync develop to main - Auto merge develop ke main
REM Useful untuk sync manual jika ada yang tertinggal

echo.
echo 🔀 SYNC DEVELOP TO MAIN
echo =======================
echo.

REM Get current branch
for /f "tokens=*" %%i in ('git branch --show-current') do set CURRENT_BRANCH=%%i

REM Save current work
echo 💾 Saving current state...
git stash

REM Switch to main
echo.
echo 📍 Switch to main...
git checkout main

REM Pull latest main
echo 📥 Pull latest main...
git pull origin main

REM Merge develop
echo.
echo 🔀 Merging develop to main...
git merge develop --no-ff -m "🔀 sync: develop -> main"

if %errorlevel%==0 (
    echo ✅ Merge berhasil!
    echo.
    
    REM Push to remote
    echo 📤 Pushing main...
    git push origin main
    
    if %errorlevel%==0 (
        echo ✅ Push berhasil!
    ) else (
        echo ⚠️ Push gagal, coba manual: git push origin main
    )
) else (
    echo ❌ Merge gagal! Mungkin ada conflict.
    echo.
    echo Resolve conflict manual, lalu:
    echo    git add .
    echo    git commit
    echo    git push origin main
)

REM Return to original branch
echo.
echo 🔄 Kembali ke branch %CURRENT_BRANCH%...
git checkout %CURRENT_BRANCH%

REM Restore stash if any
git stash pop 2>nul

echo.
echo 📊 Status:
git log --oneline --graph --all -5

echo.
pause
