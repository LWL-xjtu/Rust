# PowerShell script to run migrations

# Get the DATABASE_URL from .env file
$envContent = Get-Content -Path "../.env" -ErrorAction SilentlyContinue
$databaseUrl = $envContent | Where-Object { $_ -match "DATABASE_URL=(.*)" } | ForEach-Object { $matches[1] }

if (-not $databaseUrl) {
    Write-Error "DATABASE_URL not found in .env file"
    exit 1
}

# Run the migration SQL file
Write-Host "Running migrations..."
$migrationFiles = Get-ChildItem -Path "." -Filter "*.sql" | Sort-Object Name

foreach ($file in $migrationFiles) {
    Write-Host "Applying migration: $($file.Name)"
    $content = Get-Content -Path $file.FullName -Raw
    
    # Use psql to execute the SQL
    $env:PGPASSWORD = $databaseUrl -replace ".*:([^:]+)@.*", "$1"
    $dbName = $databaseUrl -replace ".*\/([^\?]+).*", "$1"
    $dbHost = $databaseUrl -replace ".*@([^:]+):.*", "$1"
    $port = $databaseUrl -replace ".*:([^/]+)\/.*", "$1"
    $user = $databaseUrl -replace ".*\/\/([^:]+):.*", "$1"
    
    # Execute the SQL file
    psql -h $dbHost -p $port -U $user -d $dbName -f $file.FullName
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Migration failed: $($file.Name)"
        exit 1
    }
}

Write-Host "Migrations completed successfully!"