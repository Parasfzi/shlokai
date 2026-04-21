# ShlokAI Local Launcher
# Manual run: .\start_local.ps1

Write-Host "--- Starting ShlokAI Local Setup ---" -ForegroundColor Cyan

# 1. Setup Backend
if (-not (Test-Path "venv")) {
    Write-Host "[1/3] Creating Python Virtual Environment..." -ForegroundColor Yellow
    python -m venv venv
}

Write-Host "[2/3] Activating Venv and Installing Python Dependencies..." -ForegroundColor Yellow
# Using full path to avoid activation issues
& ".\venv\Scripts\pip.exe" install -r backend/requirements.txt

# 2. Setup Frontend
Write-Host "[3/3] Installing Frontend Dependencies..." -ForegroundColor Yellow
Set-Location frontend
npm install
Set-Location ..

# 3. Launch both in new windows
Write-Host "Lauchpad: Starting Servers in new windows..." -ForegroundColor Green

# Start Backend: Use the python executable from venv directly
$backendCmd = "cd backend; `$env:PORT=8000; ..\venv\Scripts\python.exe run_deploy.py"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd

# Start Frontend
$frontendCmd = "cd frontend; npm run dev -- --host"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd

Write-Host ""
Write-Host "SUCCESS: ShlokAI is launching!" -ForegroundColor Cyan
Write-Host "Backend API: http://localhost:8000"
Write-Host "Frontend App: http://localhost:5173"
Write-Host "--- Enjoy coding! ---" -ForegroundColor Magenta
