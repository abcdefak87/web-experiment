@echo off
REM Quick Update Commit - Commit update dengan mudah
REM Usage: update-commit.bat "deskripsi update"

if "%~1"=="" (
    echo.
    echo ❌ Usage: update-commit.bat "deskripsi update"
    echo.
    echo 💡 Contoh:
    echo    update-commit.bat "update dashboard UI"
    echo    update-commit.bat "perbaiki bug login"
    echo    update-commit.bat "tambah fitur export PDF"
    echo.
    exit /b 1
)

echo.
echo 💬 COMMIT UPDATE
echo ================
echo.

REM Auto detect type based on keywords
set MESSAGE=%~1
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

echo %MESSAGE% | findstr /i "tambah add new baru feature fitur" >nul
if %errorlevel%==0 (
    set TYPE=feat
    set EMOJI=✨
)

echo %MESSAGE% | findstr /i "hapus delete remove buang" >nul
if %errorlevel%==0 (
    set TYPE=remove
    set EMOJI=🗑️
)

echo %MESSAGE% | findstr /i "style css ui design layout" >nul
if %errorlevel%==0 (
    set TYPE=style
    set EMOJI=🎨
)

echo %MESSAGE% | findstr /i "docs dokumentasi readme guide panduan" >nul
if %errorlevel%==0 (
    set TYPE=docs
    set EMOJI=📝
)

REM Show what will be committed
echo 📝 Type: %TYPE% %EMOJI%
echo 💬 Message: %MESSAGE%
echo.

REM Check for changes
git status --porcelain >nul 2>&1
if %errorlevel%==1 (
    echo ⚠️ Tidak ada perubahan untuk di-commit!
    exit /b 1
)

REM Show changes
echo 📊 Perubahan yang akan di-commit:
git status --short
echo.

REM Stage all changes
echo 📦 Staging semua perubahan...
git add .

REM Commit with auto-detected type
set COMMIT_MSG=%EMOJI% %TYPE%: %MESSAGE%
echo.
echo 💾 Committing: %COMMIT_MSG%
git commit -m "%COMMIT_MSG%"

if %errorlevel%==0 (
    echo.
    echo ✅ Commit berhasil!
    echo.
    echo 📤 Untuk push ke remote:
    echo    update-push.bat
    echo.
    echo Atau manual:
    echo    git push origin develop
) else (
    echo.
    echo ❌ Commit gagal!
)

echo.
pause
