@echo off
REM Git Branch Helper untuk Windows
REM Usage: git-branch.bat <type> <name>

if "%1"=="" (
    echo.
    echo ❌ Usage: git-branch.bat [type] [name]
    echo.
    echo 🌿 Tipe branch yang tersedia:
    echo    feature  - Fitur baru
    echo    bugfix   - Perbaikan bug
    echo    hotfix   - Perbaikan urgent
    echo    release  - Release version
    echo    chore    - Maintenance
    echo    docs     - Dokumentasi
    echo    test     - Testing
    echo    refactor - Refaktor kode
    echo.
    echo 💡 Contoh:
    echo    git-branch.bat feature dashboard-pelanggan
    echo    git-branch.bat bugfix validasi-form
    echo    git-branch.bat hotfix crash-login
    echo.
    exit /b 1
)

node scripts\git-helper.js branch %*
