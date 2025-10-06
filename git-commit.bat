@echo off
REM Git Commit Helper untuk Windows
REM Usage: git-commit.bat <type> "<message>"

if "%1"=="" (
    echo.
    echo ❌ Usage: git-commit.bat [type] "[message]"
    echo.
    echo 📋 Tipe commit yang tersedia:
    echo    feat     - ✨ Fitur baru
    echo    fix      - 🐛 Perbaikan bug
    echo    docs     - 📝 Update dokumentasi
    echo    style    - 🎨 Format kode
    echo    refactor - ♻️ Refaktor kode
    echo    perf     - ⚡ Peningkatan performa
    echo    test     - ✅ Menambah test
    echo    chore    - 🔧 Maintenance
    echo    hotfix   - 🔥 Hotfix critical
    echo    deps     - 📦 Update dependencies
    echo    ui       - 💄 Update UI/UX
    echo.
    echo 💡 Contoh:
    echo    git-commit.bat feat "tambah halaman dashboard"
    echo    git-commit.bat fix "perbaiki validasi form"
    echo.
    exit /b 1
)

node scripts\git-helper.js commit %*
