# Simple test script for task creation
# First, login to get a token
$loginBody = @{
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "http://localhost:8084/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
    $loginData = $loginResponse.Content | ConvertFrom-Json
    $token = $loginData.token
    
    Write-Host "Login successful. Token: $token"
    
    # Create a task
    $taskBody = @{
        title = "Test Task"
        description = "This is a test task"
        status = "pending"
        priority = "medium"
    } | ConvertTo-Json

    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }

    Write-Host "Sending task body: $taskBody"
    
    $taskResponse = Invoke-WebRequest -Uri "http://localhost:8084/api/task" -Method POST -Headers $headers -Body $taskBody
    Write-Host "Task creation response status: $($taskResponse.StatusCode)"
    Write-Host "Task creation response content: $($taskResponse.Content)"
    
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $responseStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($responseStream)
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody"
    }
}