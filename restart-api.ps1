# Find and stop any process listening on port 4000
$conn = Get-NetTCPConnection -LocalPort 4000 -State Listen -ErrorAction SilentlyContinue
foreach ($c in $conn) {
    $p = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue
    if ($p) {
        Write-Output ("Stopping PID=" + $p.Id + " NAME=" + $p.ProcessName)
        Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
    }
}
Start-Sleep -Seconds 2
Write-Output "Port 4000 cleared"
