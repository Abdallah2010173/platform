# Start the API server in a detached process
$log = "c:/platform/api-boot.log"
Start-Process -FilePath "cmd.exe" -ArgumentList '/c','cd c:/platform/apps/api && node dist/main.js > c:/platform/api-boot.log 2>&1' -WindowStyle Hidden
Start-Sleep -Seconds 10
Write-Output "API start attempted. Log contents:"
if (Test-Path $log) { Get-Content $log } else { Write-Output "(no log file)" }
