@echo off
REM Quick Update Push - Push update ke remote
REM Auto push ke develop branch

echo.
echo 📤 PUSH UPDATE KE REMOTE
echo ========================
echo.

REM Check current branch
for /f "tokens=*" %%i in ('git branch --show-current') do set CURRENT_BRANCH=%%i

if not "%CURRENT_BRANCH%"=="develop" (
    echo ⚠️ Warning: Anda tidak di branch develop!
    echo 📍 Branch saat ini: %CURRENT_BRANCH%
    echo.
    choice /C YN /M "Tetap push branch %CURRENT_BRANCH%?"
    if errorlevel 2 exit /b 1
)

echo 🌿 Pushing branch: %CURRENT_BRANCH%
echo.

REM Show last 3 commits
echo 📜 3 Commit terakhir:
git log --oneline -3
echo.

REM Push to remote
echo 📤 Pushing ke remote...
git push origin %CURRENT_BRANCH%

if %errorlevel%==0 (
    echo.
    echo ✅ Push berhasil!
    echo.
    
    REM Auto merge to main if on develop
    if "%CURRENT_BRANCH%"=="develop" (
        echo 🔀 Auto-merging ke main...
        git checkout main
        git pull origin main
        git merge develop --no-ff -m "🔀 auto-merge: develop -> main"
        git push origin main
        git checkout develop
        echo ✅ Merged ke main!
    )
    
    echo.
    echo 💡 Lanjut kerja:
    echo    update-start.bat - Mulai update baru
) else (
    echo.
    echo ❌ Push gagal!
    echo.
    echo Coba:
    echo    git push -u origin %CURRENT_BRANCH%
)

echo.
pause
