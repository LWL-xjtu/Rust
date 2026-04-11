$ErrorActionPreference = "Stop"

$baseUrl = "http://127.0.0.1:8080"
$username = "test1"
$password = "123456"

Write-Host "[health] GET /health"
Invoke-RestMethod -Method GET -Uri "$baseUrl/health" | ConvertTo-Json -Depth 6

Write-Host "[register] POST /api/auth/register"
$registerBody = @{ username = $username; password = $password } | ConvertTo-Json
try {
  Invoke-RestMethod -Method POST -Uri "$baseUrl/api/auth/register" -ContentType "application/json" -Body $registerBody | ConvertTo-Json -Depth 6
} catch {
  Write-Host "Register may already exist, continue to login..."
}

Write-Host "[login] POST /api/auth/login"
$loginBody = @{ username = $username; password = $password } | ConvertTo-Json
$loginResp = Invoke-RestMethod -Method POST -Uri "$baseUrl/api/auth/login" -ContentType "application/json" -Body $loginBody
$loginResp | ConvertTo-Json -Depth 8

$token = $loginResp.data.token
if (-not $token) {
  throw "No token found in login response."
}

Write-Host "[me] GET /api/users/me"
$headers = @{ Authorization = "Bearer $token" }
Invoke-RestMethod -Method GET -Uri "$baseUrl/api/users/me" -Headers $headers | ConvertTo-Json -Depth 6

Write-Host "Auth flow completed."
