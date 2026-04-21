# Test script for register endpoint
$body = @{
    username = "testuser"
    email = "test$(Get-Date -Format "yyyyMMddHHmmss")@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8082/api/auth/register" -Method POST -ContentType "application/json" -Body $body
    Write-Host "Response Status: $($response.StatusCode)"
    Write-Host "Response Content: $($response.Content)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $responseStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($responseStream)
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody"
    }
}