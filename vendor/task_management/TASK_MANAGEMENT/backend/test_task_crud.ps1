# Test script for task CRUD operations
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

    $taskResponse = Invoke-WebRequest -Uri "http://localhost:8084/api/task" -Method POST -Headers $headers -Body $taskBody
    Write-Host "Task creation response status: $($taskResponse.StatusCode)"
    $taskData = $taskResponse.Content | ConvertFrom-Json
    Write-Host "Created task: $($taskResponse.Content)"
    
    $taskId = $taskData.id
    
    # Update the task
    $updateBody = @{
        title = "Updated Task"
        description = "This is an updated test task"
        status = "completed"
    } | ConvertTo-Json
    
    $updateResponse = Invoke-WebRequest -Uri "http://localhost:8084/api/task/$taskId" -Method PUT -Headers $headers -Body $updateBody
    Write-Host "Task update response status: $($updateResponse.StatusCode)"
    Write-Host "Updated task: $($updateResponse.Content)"
    
    # Delete the task
    $deleteResponse = Invoke-WebRequest -Uri "http://localhost:8084/api/task/$taskId" -Method DELETE -Headers $headers
    Write-Host "Task delete response status: $($deleteResponse.StatusCode)"
    Write-Host "Delete response content: $($deleteResponse.Content)"
    
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $responseStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($responseStream)
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody"
    }
}