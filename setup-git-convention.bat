@echo off
echo.
echo 🚀 Setup Git Convention untuk ISP Management System
echo ===================================================
echo.

REM Set commit template untuk project ini
echo 📝 Setting commit template...
git config commit.template .gitmessage
echo ✅ Commit template berhasil di-set!

echo.
echo 📋 Konfigurasi Git Selesai!
echo.
echo 🛠️ Helper Commands yang Tersedia:
echo.
echo 1. Membuat Branch Baru:
echo    git-branch.bat [type] [name]
echo    Contoh: git-branch.bat feature dashboard-baru
echo.
echo 2. Membuat Commit:
echo    git-commit.bat [type] "[message]"
echo    Contoh: git-commit.bat feat "tambah fitur login"
echo.
echo 3. Git Helper Lengkap:
echo    node scripts\git-helper.js help
echo.
echo 📖 Baca GIT_CONVENTION.md untuk panduan lengkap!
echo.

REM Tampilkan status git saat ini
echo 📊 Git Status Saat Ini:
echo -----------------------
git status --short --branch

echo.
pause
