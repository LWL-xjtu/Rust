$ErrorActionPreference = "Stop"

$composeFile = Join-Path $PSScriptRoot "docker-compose.postgres.yml"
if (-not (Test-Path $composeFile)) {
  throw "compose file not found: $composeFile"
}

Write-Host "[1/2] Starting postgres container..."
docker compose -f $composeFile up -d

Write-Host "[2/2] Waiting for health status..."
$maxTry = 30
for ($i = 1; $i -le $maxTry; $i++) {
  $status = docker inspect -f "{{.State.Health.Status}}" campus_collab_postgres 2>$null
  if ($status -eq "healthy") {
    Write-Host "Postgres is healthy."
    exit 0
  }
  Start-Sleep -Seconds 2
}

Write-Warning "Postgres is not healthy yet. Check logs:"
docker logs campus_collab_postgres --tail 50
exit 1
