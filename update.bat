@echo off
REM Quick update launcher - shortcut to git-tools

echo.
echo 🚀 UPDATE COMMANDS
echo =================
echo.
echo 📋 Available commands:
echo    update status  - Check git status
echo    update start   - Start new update session  
echo    update commit  - Commit changes
echo    update push    - Push to remote
echo    update quick   - All-in-one update
echo    update sync    - Sync develop to main
echo.

if "%1"=="" (
    echo ❌ Please specify a command
    echo.
    echo 💡 Example:
    echo    update status
    echo    update quick "fix bug login"
    echo.
    exit /b 1
)

if "%1"=="status" (
    call git-tools\update-status.bat %2 %3 %4 %5
) else if "%1"=="start" (
    call git-tools\update-start.bat %2 %3 %4 %5
) else if "%1"=="commit" (
    call git-tools\update-commit.bat %2 %3 %4 %5
) else if "%1"=="push" (
    call git-tools\update-push.bat %2 %3 %4 %5
) else if "%1"=="quick" (
    call git-tools\update-quick.bat %2 %3 %4 %5
) else if "%1"=="sync" (
    call git-tools\update-sync.bat %2 %3 %4 %5
) else (
    echo ❌ Unknown command: %1
    echo.
    echo Available: status, start, commit, push, quick, sync
)
