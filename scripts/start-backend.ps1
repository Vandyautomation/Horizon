## start-backend.ps1
# Loads environment variables from the project's .env (non-recursively)
# and starts the backend server (api/index.ts). Intended for local development only.

$envPath = Join-Path $PSScriptRoot '..\.env'
if (-not (Test-Path $envPath)) {
  Write-Host ".env not found at $envPath" -ForegroundColor Yellow
  exit 1
}

Write-Host "Loading environment variables from $envPath"
Get-Content $envPath | ForEach-Object {
  $line = $_.Trim()
  if ($line -eq '' -or $line.StartsWith('#')) { return }
  if ($line -match '^[\s]*([^=]+)=(.*)$') {
    $name = $matches[1].Trim()
    $value = $matches[2].Trim().Trim('"')
    $env:$name = $value
    Write-Host "Set $name"
  }
}

Write-Host "Starting backend (api/index.ts) with environment variables loaded..." -ForegroundColor Green
try {
  bun run api/index.ts
} catch {
  Write-Host "Failed to start backend: $_" -ForegroundColor Red
  exit 1
}
