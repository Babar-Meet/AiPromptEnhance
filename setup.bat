@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"

echo [Dr. Ai Prompt Enhance Setup] Starting setup...

echo [1/5] Checking Node.js and npm...
where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js is not installed or not in PATH.
  echo Install Node.js 18+ and rerun this script.
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo ERROR: npm is not available.
  exit /b 1
)

echo [2/5] Installing root dependencies...
call npm install
if errorlevel 1 (
  echo ERROR: Root npm install failed.
  exit /b 1
)

echo [3/5] Installing backend dependencies...
call npm install --prefix backend
if errorlevel 1 (
  echo ERROR: Backend npm install failed.
  exit /b 1
)

echo [4/5] Installing frontend dependencies...
call npm install --prefix frontend
if errorlevel 1 (
  echo ERROR: Frontend npm install failed.
  exit /b 1
)

echo [5/5] Creating backend .env if missing...
if not exist "backend\.env" (
  copy /y "backend\.env.example" "backend\.env" >nul
  if errorlevel 1 (
    echo ERROR: Could not create backend\.env
    exit /b 1
  )
  echo Created backend\.env from backend\.env.example
) else (
  echo backend\.env already exists.
)

echo.
echo Setup complete.
echo Next step: run run.bat
exit /b 0
