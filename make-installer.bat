@echo off
title Hive installer
cd /d "%~dp0"
echo.
echo Installing npm packages (first time takes a while)...
call npm install
if errorlevel 1 (
  echo npm install failed. Install Node.js from https://nodejs.org then try again.
  pause
  exit /b 1
)
echo.
echo Building Hive Setup.exe ...
call npm run dist:win
if errorlevel 1 (
  echo Build failed. Scroll up for the error.
  pause
  exit /b 1
)
echo.
echo Done. Opening the release folder.
if exist release (
  explorer release
) else (
  echo release folder was not created. The build did not finish.
)
pause
