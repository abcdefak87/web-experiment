@echo off
REM Quick Update All-in-One
REM Commit dan push update dengan satu command
REM Usage: update-quick.bat "deskripsi update"

if "%~1"=="" (
    echo.
    echo 🚀 QUICK UPDATE - All in One
    echo ============================
    echo.
    echo ❌ Usage: update-quick.bat "deskripsi update"
    echo.
    echo 💡 Contoh:
    echo    update-quick.bat "update dashboard dan fix bug login"
    echo    update-quick.bat "tambah fitur export laporan"
    echo    update-quick.bat "perbaiki tampilan mobile"
    echo.
    echo Ini akan otomatis:
    echo    1. Switch ke develop
    echo    2. Stage semua perubahan
    echo    3. Commit dengan format yang benar
    echo    4. Push ke remote
    echo.
    exit /b 1
)

echo.
echo ⚡ QUICK UPDATE MODE
echo ====================
echo.

REM Save the message safely
set "MESSAGE=%~1"
if "%MESSAGE%"=="" (
    echo ❌ Error: Empty message!
    exit /b 1
)

REM Check current branch
for /f "tokens=*" %%i in ('git branch --show-current') do set CURRENT_BRANCH=%%i

REM If not on develop, switch to it
if not "%CURRENT_BRANCH%"=="develop" (
    echo 🔄 Switch ke develop branch...
    git checkout develop
    echo.
)

REM Auto detect type
set TYPE=feat
set EMOJI=✨

echo %MESSAGE% | findstr /i "fix perbaiki bug error crash" >nul
if %errorlevel%==0 (
    set TYPE=fix
    set EMOJI=🐛
)

echo %MESSAGE% | findstr /i "update ubah ganti modif" >nul
if %errorlevel%==0 (
    set TYPE=chore
    set EMOJI=🔧
)

REM Check for changes
git status --porcelain >nul 2>&1
if %errorlevel%==1 (
    echo ⚠️ Tidak ada perubahan untuk di-commit!
    exit /b 1
)

REM Show changes
echo 📊 Perubahan:
git status --short
echo.

REM Stage all
echo 📦 Stage semua perubahan...
git add .

REM Commit with proper escaping
set "COMMIT_MSG=%EMOJI% %TYPE%: %MESSAGE%"
echo 💾 Commit: %COMMIT_MSG%
git commit -m "%EMOJI% %TYPE%: %MESSAGE%"

if %errorlevel%==0 (
    echo ✅ Commit berhasil!
    echo.
    
    REM Push
    echo 📤 Push ke remote...
    git push origin develop
    
    if %errorlevel%==0 (
        echo ✅ Push berhasil!
        echo.
        echo 🎉 UPDATE SELESAI!
        echo.
        echo 📊 Summary:
        git log --oneline -1
        echo.
        echo 💡 Next: Buat Pull Request di GitHub untuk merge ke main
    ) else (
        echo ⚠️ Push gagal, coba manual:
        echo    git push origin develop
    )
) else (
    echo ❌ Commit gagal!
)

echo.
pause
