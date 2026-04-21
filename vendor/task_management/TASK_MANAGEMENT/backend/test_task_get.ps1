# Test script for getting tasks
# First, login to get a token
$loginBody = @{
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "http://localhost:8083/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
    $loginData = $loginResponse.Content | ConvertFrom-Json
    $token = $loginData.token
    
    Write-Host "Login successful. Token: $token"
    
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }

    # Get all tasks
    $tasksResponse = Invoke-WebRequest -Uri "http://localhost:8083/api/task" -Method GET -Headers $headers
    Write-Host "Tasks response status: $($tasksResponse.StatusCode)"
    Write-Host "Tasks: $($tasksResponse.Content)"
    
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $responseStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($responseStream)
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody"
    }
}