$ErrorActionPreference = "Stop"

Set-Location -LiteralPath $PSScriptRoot

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error "Node.js is required to run the Astro development server. Install Node.js 24, then run this script again."
  exit 1
}

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
  Write-Error "pnpm is required to run the Astro development server. Install pnpm 11, then run this script again."
  exit 1
}

$previousAstroDevBackground = $env:ASTRO_DEV_BACKGROUND

try {
  # Astro 7 otherwise auto-backgrounds when it detects an agent environment.
  $env:ASTRO_DEV_BACKGROUND = "0"
  & pnpm dev @args
  $exitCode = $LASTEXITCODE
}
finally {
  if ($null -eq $previousAstroDevBackground) {
    Remove-Item Env:ASTRO_DEV_BACKGROUND -ErrorAction SilentlyContinue
  }
  else {
    $env:ASTRO_DEV_BACKGROUND = $previousAstroDevBackground
  }
}

exit $exitCode
