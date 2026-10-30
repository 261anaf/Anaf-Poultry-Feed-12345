@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 goto missingNode

where npm >nul 2>nul
if errorlevel 1 goto missingNpm

if not exist "node_modules\" (
  echo Installing project dependencies...
  call npm install
  if errorlevel 1 goto installFailed
)

echo Starting Anaf Poultry Feed...
call npm start
if errorlevel 1 echo The application stopped with an error.
pause
exit /b

:missingNode
echo Node.js is required. Install Node.js 20 or later, then try again.
pause
exit /b 1

:missingNpm
echo npm was not found. Reinstall Node.js with npm included, then try again.
pause
exit /b 1

:installFailed
echo Dependency installation failed. Check your internet connection and try again.
pause
exit /b 1
