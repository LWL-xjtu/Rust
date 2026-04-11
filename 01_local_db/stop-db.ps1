$ErrorActionPreference = "Stop"

$composeFile = Join-Path $PSScriptRoot "docker-compose.postgres.yml"
docker compose -f $composeFile down
Write-Host "Postgres stopped."
