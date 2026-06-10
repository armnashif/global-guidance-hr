@echo off
echo.
echo  Global Guidance HR System v4.0
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
echo  Starting server...
node server.js
pause
