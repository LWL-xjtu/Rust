# Test script for category CRUD operations with error cases
# First, login to get a token
$loginBody = @{
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "http://localhost:8082/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
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

    $categoryResponse = Invoke-WebRequest -Uri "http://localhost:8082/api/categories" -Method POST -Headers $headers -Body $categoryBody
    Write-Host "Category creation response status: $($categoryResponse.StatusCode)"
    $categoryData = $categoryResponse.Content | ConvertFrom-Json
    Write-Host "Created category: $($categoryResponse.Content)"
    
    $categoryId = $categoryData.id
    
    # Try to update a non-existent category
    $updateBody = @{
        name = "Updated Category"
        color = "#00FF00"
    } | ConvertTo-Json
    
    try {
        $updateResponse = Invoke-WebRequest -Uri "http://localhost:8082/api/categories/99999" -Method PUT -Headers $headers -Body $updateBody
        Write-Host "Non-existent category update response status: $($updateResponse.StatusCode)"
    } catch {
        Write-Host "Non-existent category update error: $($_.Exception.Message)"
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.value__
            Write-Host "Non-existent category update status code: $statusCode"
        }
    }
    
    # Try to delete a non-existent category
    try {
        $deleteResponse = Invoke-WebRequest -Uri "http://localhost:8082/api/categories/99999" -Method DELETE -Headers $headers
        Write-Host "Non-existent category delete response status: $($deleteResponse.StatusCode)"
    } catch {
        Write-Host "Non-existent category delete error: $($_.Exception.Message)"
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.value__
            Write-Host "Non-existent category delete status code: $statusCode"
        }
    }
    
    # Update the actual category
    $updateResponse = Invoke-WebRequest -Uri "http://localhost:8082/api/categories/$categoryId" -Method PUT -Headers $headers -Body $updateBody
    Write-Host "Category update response status: $($updateResponse.StatusCode)"
    Write-Host "Updated category: $($updateResponse.Content)"
    
    # Delete the actual category
    $deleteResponse = Invoke-WebRequest -Uri "http://localhost:8082/api/categories/$categoryId" -Method DELETE -Headers $headers
    Write-Host "Category delete response status: $($deleteResponse.StatusCode)"
    
    # Try to update the deleted category
    try {
        $updateDeletedResponse = Invoke-WebRequest -Uri "http://localhost:8082/api/categories/$categoryId" -Method PUT -Headers $headers -Body $updateBody
        Write-Host "Deleted category update response status: $($updateDeletedResponse.StatusCode)"
    } catch {
        Write-Host "Deleted category update error: $($_.Exception.Message)"
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.value__
            Write-Host "Deleted category update status code: $statusCode"
        }
    }
    
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $responseStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($responseStream)
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody"
    }
}