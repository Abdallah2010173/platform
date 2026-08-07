$base = "http://localhost:4000/api/v1"
Write-Output "== Checking GET /auth/google =="
try {
  $r = Invoke-WebRequest -Uri "$base/auth/google" -MaximumRedirection 0 -ErrorAction SilentlyContinue
  Write-Output "STATUS=$($r.StatusCode)"
  Write-Output "LOCATION=$($r.Headers['Location'])"
} catch {
  $resp = $_.Exception.Response
  if ($resp) {
    Write-Output "STATUS=$([int]$resp.StatusCode)"
    Write-Output "LOCATION=$($resp.Headers['Location'])"
  } else {
    Write-Output "ERR=$($_.Exception.Message)"
  }
}
Write-Output "== Checking health =="
try {
  $h = Invoke-RestMethod -Uri "http://localhost:4000/health"
  Write-Output "HEALTH=$($h | ConvertTo-Json -Compress)"
} catch {
  Write-Output "HEALTH_ERR=$($_.Exception.Message)"
}
