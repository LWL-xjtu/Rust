# Test script for tag CRUD operations
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
    
    # Create a tag
    $tagBody = @{
        name = "Test Tag"
        color = "#0000FF"
    } | ConvertTo-Json

    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }

    $tagResponse = Invoke-WebRequest -Uri "http://localhost:8084/api/tags" -Method POST -Headers $headers -Body $tagBody
    Write-Host "Tag creation response status: $($tagResponse.StatusCode)"
    $tagData = $tagResponse.Content | ConvertFrom-Json
    Write-Host "Created tag: $($tagResponse.Content)"
    
    $tagId = $tagData.id
    
    # Update the tag
    $updateBody = @{
        name = "Updated Tag"
        color = "#FFFF00"
    } | ConvertTo-Json
    
    $updateResponse = Invoke-WebRequest -Uri "http://localhost:8084/api/tags/$tagId" -Method PUT -Headers $headers -Body $updateBody
    Write-Host "Tag update response status: $($updateResponse.StatusCode)"
    Write-Host "Updated tag: $($updateResponse.Content)"
    
    # Delete the tag
    $deleteResponse = Invoke-WebRequest -Uri "http://localhost:8084/api/tags/$tagId" -Method DELETE -Headers $headers
    Write-Host "Tag delete response status: $($deleteResponse.StatusCode)"
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