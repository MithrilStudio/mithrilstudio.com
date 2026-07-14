@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required to run the Astro development server.
  echo Install Node.js 24, then run this script again.
  exit /b 1
)

where pnpm >nul 2>nul
if errorlevel 1 (
  echo pnpm is required to run the Astro development server.
  echo Install pnpm 11, then run this script again.
  exit /b 1
)

rem Astro 7 otherwise auto-backgrounds when it detects an agent environment.
set "ASTRO_DEV_BACKGROUND=0"
pnpm dev %*
