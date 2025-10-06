# WebSocket Environment Setup Script for PowerShell
# Run with: .\scripts\setup-websocket-env.ps1

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  WebSocket Environment Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js detected: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "  Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Get script directory and navigate to project root
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
Set-Location $projectRoot

Write-Host "Working directory: $projectRoot" -ForegroundColor Gray
Write-Host ""

# Run the Node.js setup script
Write-Host "Starting WebSocket environment setup..." -ForegroundColor Yellow
Write-Host ""

try {
    node scripts/setup-websocket-env.js
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  Setup completed successfully!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "1. Open a new terminal and navigate to server folder" -ForegroundColor White
        Write-Host "   cd server" -ForegroundColor Gray
        Write-Host "   npm run dev" -ForegroundColor Gray
        Write-Host ""
        Write-Host "2. Open another terminal and navigate to client folder" -ForegroundColor White
        Write-Host "   cd client" -ForegroundColor Gray
        Write-Host "   npm run dev" -ForegroundColor Gray
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Red
        Write-Host "  Setup failed! Please check the error above." -ForegroundColor Red
        Write-Host "========================================" -ForegroundColor Red
    }
} catch {
    Write-Host "Error running setup script: $_" -ForegroundColor Red
}

Read-Host "Press Enter to exit"
