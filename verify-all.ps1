# InfraSight Verification Script
# This script verifies the complete implementation

$ErrorActionPreference = "Stop"
$workspaceRoot = "d:\PRJ"
$backendDir = "$workspaceRoot\infrasight-api"
$frontendDir = "$workspaceRoot\infrasight-web"
$backendPython = "$backendDir\.venv\Scripts\python.exe"
$apiBaseUrl = "http://localhost:8000"
$frontendPackage = "$frontendDir\package.json"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "InfraSight Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Track overall status
$allChecksPassed = $true

# Function to report check result
function Report-Check {
    param(
        [string]$Name,
        [bool]$Passed,
        [string]$Details = ""
    )
    
    if ($Passed) {
        Write-Host "[PASS] $Name" -ForegroundColor Green
        if ($Details) {
            Write-Host "      $Details" -ForegroundColor Gray
        }
    } else {
        Write-Host "[FAIL] $Name" -ForegroundColor Red
        if ($Details) {
            Write-Host "      $Details" -ForegroundColor Red
        }
        $script:allChecksPassed = $false
    }
    Write-Host ""
}

# 1. Verify core folders and critical files exist
Write-Host "Step 1: Verifying project structure..." -ForegroundColor Yellow
$foldersToCheck = @(
    "$workspaceRoot\docs",
    "$workspaceRoot\infrasight-api",
    "$workspaceRoot\infrasight-web"
)
$filesToCheck = @(
    "$workspaceRoot\README.md",
    "$workspaceRoot\.gitignore"
)

$foldersExist = $true
foreach ($folder in $foldersToCheck) {
    if (-not (Test-Path $folder)) {
        $foldersExist = $false
        break
    }
}
Report-Check "Core folders exist" $foldersExist

$filesExist = $true
foreach ($file in $filesToCheck) {
    if (-not (Test-Path $file)) {
        $filesExist = $false
        break
    }
}
Report-Check "Root files exist (README.md, .gitignore)" $filesExist

# 2. Verify frontend package files exist
Write-Host "Step 2: Verifying frontend structure..." -ForegroundColor Yellow
$frontendFiles = @(
    "$frontendDir\package.json",
    "$frontendDir\vite.config.js",
    "$frontendDir\index.html",
    "$frontendDir\src\main.jsx",
    "$frontendDir\src\App.jsx"
)
$frontendFilesExist = $true
foreach ($file in $frontendFiles) {
    if (-not (Test-Path $file)) {
        $frontendFilesExist = $false
        break
    }
}
Report-Check "Frontend package files exist" $frontendFilesExist

# 3. Verify backend package directories exist
Write-Host "Step 3: Verifying backend structure..." -ForegroundColor Yellow
$backendDirs = @(
    "$backendDir\app",
    "$backendDir\app\api",
    "$backendDir\app\core",
    "$backendDir\app\schemas",
    "$backendDir\app\services"
)
$backendDirsExist = $true
foreach ($dir in $backendDirs) {
    if (-not (Test-Path $dir)) {
        $backendDirsExist = $false
        break
    }
}
Report-Check "Backend package directories exist" $backendDirsExist

$backendFiles = @(
    "$backendDir\app\main.py",
    "$backendDir\requirements.txt",
    "$backendDir\.env.example"
)
$backendFilesExist = $true
foreach ($file in $backendFiles) {
    if (-not (Test-Path $file)) {
        $backendFilesExist = $false
        break
    }
}
Report-Check "Backend core files exist" $backendFilesExist

# 4. Verify Firebase configuration files and frontend production build
Write-Host "Step 4: Verifying Firebase config and frontend production build..." -ForegroundColor Yellow
try {
    if (-not (Test-Path $frontendPackage)) {
        Report-Check "Frontend production build succeeds" $false "package.json was not found"
    } else {
        Push-Location $frontendDir
        $previousErrorActionPreference = $ErrorActionPreference
        $ErrorActionPreference = "Continue"
        $buildOutput = & npm.cmd run build 2>&1
        $buildExitCode = $LASTEXITCODE
        $ErrorActionPreference = $previousErrorActionPreference
        Pop-Location
        if ($buildExitCode -eq 0) {
            Report-Check "Frontend production build succeeds" $true
        } else {
            Report-Check "Frontend production build succeeds" $false ($buildOutput -join "`n")
        }
    }
} catch {
    try { Pop-Location } catch {}
    Report-Check "Frontend production build succeeds" $false $_.Exception.Message
}

$frontendFirebaseConfigExists = Test-Path "$frontendDir\src\services\firebase.js"
$backendFirebaseServiceExists = Test-Path "$backendDir\app\services\firebase_service.py"
$gitignoreContent = Get-Content "$workspaceRoot\.gitignore" -Raw
$secretIgnoreOk = $gitignoreContent.Contains("service-account*.json") -and $gitignoreContent.Contains("*firebase-adminsdk*.json") -and $gitignoreContent.Contains(".env.local")
Report-Check "Firebase config modules exist" ($frontendFirebaseConfigExists -and $backendFirebaseServiceExists)
Report-Check "Secret file patterns are ignored" $secretIgnoreOk

# 5. Verify backend virtual environment exists
Write-Host "Step 5: Verifying backend virtual environment..." -ForegroundColor Yellow
$venvExists = Test-Path $backendPython
Report-Check "Backend virtual environment exists" $venvExists

if (-not $venvExists) {
    Write-Host "ERROR: Backend virtual environment not found at $backendPython" -ForegroundColor Red
    Write-Host "Please create it first by running: python -m venv $backendDir\.venv" -ForegroundColor Yellow
    exit 1
}

# 6. Verify backend import with explicit Python path
Write-Host "Step 6: Verifying backend imports..." -ForegroundColor Yellow
try {
    $env:PYTHONPATH = $backendDir
    Push-Location $backendDir
    $importOutput = & $backendPython -c "import app.main; print('Import successful')" 2>&1
    $importExitCode = $LASTEXITCODE
    Pop-Location
    if ($importExitCode -eq 0) {
        Report-Check "Backend imports successfully" $true
    } else {
        Report-Check "Backend imports successfully" $false $importOutput
    }
} catch {
    try { Pop-Location } catch {}
    Report-Check "Backend imports successfully" $false $_.Exception.Message
}

# 7. Start backend using explicit backend Python path
Write-Host "Step 7: Starting backend server..." -ForegroundColor Yellow
$backendProcess = $null
try {
    $env:PYTHONPATH = $backendDir
    $backendProcess = Start-Process -FilePath $backendPython -ArgumentList "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000" -WorkingDirectory $backendDir -PassThru -NoNewWindow -RedirectStandardOutput "$backendDir\backend.log" -RedirectStandardError "$backendDir\backend-error.log"
    
    # Wait for backend to start
    Write-Host "Waiting for backend to start..." -ForegroundColor Gray
    $backendReady = $false
    for ($i = 0; $i -lt 20; $i++) {
        Start-Sleep -Seconds 1
        try {
            $healthResponse = Invoke-WebRequest -Uri "$apiBaseUrl/health" -UseBasicParsing -TimeoutSec 3
            if ($healthResponse.StatusCode -eq 200) {
                $backendReady = $true
                break
            }
        } catch {}
    }
    
    # Check if process is still running
    if ($backendProcess.HasExited) {
        $errorLog = Get-Content "$backendDir\backend-error.log" -Raw -ErrorAction SilentlyContinue
        Report-Check "Backend server started" $false "Process exited. Error: $errorLog"
    } elseif (-not $backendReady) {
        Report-Check "Backend server started" $false "Timed out waiting for /health"
    } else {
        Report-Check "Backend server started" $true "PID: $($backendProcess.Id)"
    }
} catch {
    Report-Check "Backend server started" $false $_.Exception.Message
}

# 8. Check all required endpoints for HTTP 200
Write-Host "Step 8: Checking API endpoints..." -ForegroundColor Yellow

$endpoints = @(
    "/health",
    "/docs",
    "/",
    "/api/devices",
    "/api/alerts",
    "/api/predictions",
    "/api/predictions/model/info",
    "/api/scenarios",
    "/api/evaluation",
    "/api/evaluation/summary",
    "/api/evaluation/system-metrics",
    "/api/telemetry",
    "/api/scenarios/runs",
    "/api/telemetry/stream/srv-001",
    "/api/firebase/status",
    "/api/firebase/collections/settings"
)

$endpointResults = @()

foreach ($endpoint in $endpoints) {
    try {
        $url = "$apiBaseUrl$endpoint"
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 10
        $status = $response.StatusCode
        if ($status -eq 200) {
            $endpointResults += @{ Endpoint = $endpoint; Status = $status; Success = $true }
            Report-Check "GET $endpoint returns 200" $true
        } else {
            $endpointResults += @{ Endpoint = $endpoint; Status = $status; Success = $false }
            Report-Check "GET $endpoint returns 200" $false "Status: $status"
        }
    } catch {
        $endpointResults += @{ Endpoint = $endpoint; Status = "ERROR"; Success = $false }
        Report-Check "GET $endpoint returns 200" $false $_.Exception.Message
    }
}

try {
    $pollUrl = "$apiBaseUrl/api/telemetry/poll"
    $response = Invoke-WebRequest -Uri $pollUrl -Method POST -UseBasicParsing -TimeoutSec 90
    if ($response.StatusCode -eq 200) {
        Report-Check "POST /api/telemetry/poll returns 200" $true
    } else {
        Report-Check "POST /api/telemetry/poll returns 200" $false "Status: $($response.StatusCode)"
    }
} catch {
    Report-Check "POST /api/telemetry/poll returns 200" $false $_.Exception.Message
}

# 9. Stop backend process cleanly
Write-Host "Step 9: Stopping backend server..." -ForegroundColor Yellow
if ($backendProcess -and -not $backendProcess.HasExited) {
    try {
        Stop-Process -Id $backendProcess.Id -Force
        Start-Sleep -Seconds 2
        Report-Check "Backend server stopped" $true
    } catch {
        Report-Check "Backend server stopped" $false $_.Exception.Message
    }
} else {
    Report-Check "Backend server stopped" $true "Already stopped or not started"
}

# 10. Final summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verification Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($allChecksPassed) {
    Write-Host "ALL CHECKS PASSED" -ForegroundColor Green
    Write-Host ""
    Write-Host "InfraSight is successfully verified!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "VERIFICATION FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "Some checks failed. Please review the output above." -ForegroundColor Red
    exit 1
}
