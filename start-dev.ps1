# Set working directory to the script location
Set-Location $PSScriptRoot

# Start the frontend
$frontendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -PassThru

# Start the backend
$backendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location server; npm run dev" -PassThru

Write-Host "Both servers are starting..."
Write-Host "Frontend will be at: http://localhost:5173"
Write-Host "Backend will be at: http://localhost:3001"
Write-Host "Press Ctrl+C in respective windows to stop servers"

# Keep the script running
try {
    Wait-Process -Id $frontendProcess.Id, $backendProcess.Id
} catch {
    Write-Host "Servers stopped"
} 