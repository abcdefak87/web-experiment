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
    echo 🔗 Next steps:
    echo    1. Buka GitHub
    echo    2. Buat Pull Request dari develop ke main
    echo    3. Review dan merge
    echo.
    echo 💡 Atau lanjut kerja:
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
