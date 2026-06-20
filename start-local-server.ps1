$ErrorActionPreference = "Stop"

Set-Location -LiteralPath $PSScriptRoot

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error "Node.js is required to run the local web server. Install Node.js, then run this script again."
  exit 1
}

& node (Join-Path $PSScriptRoot "scripts/local-web-server.mjs") @args

exit $LASTEXITCODE
