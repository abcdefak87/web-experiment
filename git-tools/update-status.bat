@echo off
REM Check Update Status - Lihat status update

echo.
echo 📊 UPDATE STATUS CHECK
echo ======================
echo.

REM Current branch
for /f "tokens=*" %%i in ('git branch --show-current') do set CURRENT_BRANCH=%%i
echo 🌿 Branch aktif: %CURRENT_BRANCH%
echo.

REM Check uncommitted changes
echo 📝 Perubahan yang belum di-commit:
git status --short
if %errorlevel%==1 (
    echo    ✅ Working directory clean!
)
echo.

REM Show recent commits
echo 📜 5 Commit terakhir:
git log --oneline --graph --decorate -5
echo.

REM Check remote status
echo 🔄 Status dengan remote:
git fetch origin --quiet
git status -sb
echo.

REM Check unpushed commits
for /f "tokens=*" %%i in ('git cherry -v origin/%CURRENT_BRANCH% 2^>nul') do (
    if not defined UNPUSHED (
        echo 📤 Commit yang belum di-push:
        set UNPUSHED=1
    )
    echo    %%i
)
if not defined UNPUSHED (
    echo ✅ Semua commit sudah di-push!
)
echo.

REM Show branches
echo 🌿 Branch yang tersedia:
git branch
echo.

echo 💡 COMMAND YANG TERSEDIA:
echo -------------------------
echo   update-start.bat    - Mulai session update baru
echo   update-commit.bat   - Commit perubahan
echo   update-push.bat     - Push ke remote
echo   update-quick.bat    - All-in-one update
echo.
pause
