$ErrorActionPreference = "Stop"

$repos = @(
  @{ url = "https://github.com/sheroz/axum-rest-api-sample"; dir = "vendor/axum-rest-api-sample" },
  @{ url = "https://github.com/hmanzoni/rust-axum-postgres"; dir = "vendor/rust-axum-postgres" },
  @{ url = "https://github.com/wpcodevo/rust-axum-postgres-api"; dir = "vendor/rust-axum-postgres-api" },
  @{ url = "https://github.com/yuxuetr/axum-template"; dir = "vendor/axum-template" },
  @{ url = "https://github.com/imadegun/task_management"; dir = "vendor/task_management" }
)

foreach ($repo in $repos) {
  if (Test-Path $repo.dir) {
    Write-Host "[update] $($repo.dir)"
    git -C $repo.dir fetch --all --prune
    git -C $repo.dir pull --ff-only
  } else {
    Write-Host "[clone]  $($repo.url) -> $($repo.dir)"
    git clone --depth 1 $repo.url $repo.dir
  }
}

Write-Host "done"
