$base = "http://localhost:4000/api/v1"
$loginBody = '{"email":"admin@platform.local","password":"SuperAdmin@123"}'
$resp = Invoke-RestMethod -Uri "$base/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
$at = $resp.data.accessToken
Write-Output "TOKEN_LEN: $($at.Length)"
$headers = @{ Authorization = "Bearer $at" }
$me = Invoke-RestMethod -Uri "$base/auth/me" -Headers $headers
Write-Output "ME_ROLE: $($me.data.role)"
$users = Invoke-RestMethod -Uri "$base/users?limit=3" -Headers $headers
Write-Output "USERS_TOTAL: $($users.data.meta.total)"
$courses = Invoke-RestMethod -Uri "$base/courses?limit=3" -Headers $headers
Write-Output "COURSES_TOTAL: $($courses.data.meta.total)"
$cats = Invoke-RestMethod -Uri "$base/categories?limit=3" -Headers $headers
Write-Output "CATEGORIES_TOTAL: $($cats.data.meta.total)"
$health = Invoke-RestMethod -Uri "$base/health"
Write-Output "HEALTH: $($health | ConvertTo-Json -Compress)"
