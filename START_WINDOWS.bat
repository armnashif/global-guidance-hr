@echo off
echo.
echo  Global Guidance Operations Portal v16z
echo  ================================
echo.
node --version >nul 2>&1
if errorlevel 1 (
  echo  ERROR: Node.js not installed!
  echo  Download from: https://nodejs.org
  echo  Install it then run this file again.
  pause
  exit
)
if not exist node_modules\ (
  echo  Installing dependencies ^(first run only^)...
  call npm ci
  if errorlevel 1 exit /b 1
)
echo  Starting portal at http://localhost:3000 ...
call npm start
pause
