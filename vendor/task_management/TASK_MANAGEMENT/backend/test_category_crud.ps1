# Test script for full category CRUD operations
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
    
    # Create a category
    $categoryBody = @{
        name = "Test Category"
        color = "#FF0000"
    } | ConvertTo-Json

    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }

    $categoryResponse = Invoke-WebRequest -Uri "http://localhost:8084/api/categories" -Method POST -Headers $headers -Body $categoryBody
    Write-Host "Category creation response status: $($categoryResponse.StatusCode)"
    $categoryData = $categoryResponse.Content | ConvertFrom-Json
    Write-Host "Created category: $($categoryResponse.Content)"
    
    $categoryId = $categoryData.id
    
    # Update the category
    $updateBody = @{
        name = "Updated Category"
        color = "#00FF00"
    } | ConvertTo-Json
    
    $updateResponse = Invoke-WebRequest -Uri "http://localhost:8084/api/categories/$categoryId" -Method PUT -Headers $headers -Body $updateBody
    Write-Host "Category update response status: $($updateResponse.StatusCode)"
    Write-Host "Updated category: $($updateResponse.Content)"
    
    # Delete the category
    $deleteResponse = Invoke-WebRequest -Uri "http://localhost:8084/api/categories/$categoryId" -Method DELETE -Headers $headers
    Write-Host "Category delete response status: $($deleteResponse.StatusCode)"
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