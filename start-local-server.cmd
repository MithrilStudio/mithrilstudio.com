@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required to run the local web server.
  echo Install Node.js, then run this script again.
  exit /b 1
)

node ".\scripts\local-web-server.mjs" %*
