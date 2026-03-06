@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"

echo [Dr. Ai Prompt Enhance Run] Preparing to start project...

if not exist "backend\.env" (
  echo backend\.env not found. Running setup first...
  call setup.bat
  if errorlevel 1 (
    echo ERROR: setup.bat failed.
    exit /b 1
  )
)

echo Starting Dr. Ai Prompt Enhance (backend + frontend)...
echo Press Ctrl+C to stop.
call npm run dev
if errorlevel 1 (
  echo.
  echo ERROR: npm run dev failed.
  echo If port 5000 or 5173 is busy, close the other process and run again.
  exit /b 1
)

exit /b 0
