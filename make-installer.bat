@echo off
title Hive installer
cd /d "%~dp0"
set CSC_IDENTITY_AUTO_DISCOVERY=false
set ELECTRON_BUILDER_BINARIES_MIRROR=https://github.com/electron-userland/electron-builder-binaries/releases/download/
echo.
echo Invalid macro definition = ignore that. It is npm on Windows. Harmless.
echo.
echo Installing npm packages...
call npm install
if errorlevel 1 (
  echo npm install failed. Install Node.js from https://nodejs.org then try again.
  pause
  exit /b 1
)
echo.
echo Building the app, then the Setup.exe.
echo You will see a folder named win-unpacked FIRST. That is NOT the installer.
echo KEEP THIS WINDOW OPEN. The installer is created AFTER that.
echo This can take 5 to 15 minutes. Do not close.
echo.
call npm run dist:win
if errorlevel 1 (
  echo.
  echo Build failed. Scroll up for the error.
  echo If it stopped at "searching for node modules", run it again and wait longer.
  pause
  exit /b 1
)
echo.
echo Looking for the Setup.exe ...
if exist "release\Hive-Setup-0.0.1.2.exe" (
  echo Found: release\Hive-Setup-0.0.1.2.exe
  explorer /select,"%~dp0release\Hive-Setup-0.0.1.2.exe"
) else if exist "release\Hive-Setup-0.0.1.1.exe" (
  echo Found: release\Hive-Setup-0.0.1.1.exe
  explorer /select,"%~dp0release\Hive-Setup-0.0.1.1.exe"
) else if exist "release\Hive-Setup-0.0.1.exe" (
  echo Found: release\Hive-Setup-0.0.1.exe
  explorer /select,"%~dp0release\Hive-Setup-0.0.1.exe"
) else if exist "release\Hive Desktop-Setup-0.0.1.exe" (
  echo Found: release\Hive Desktop-Setup-0.0.1.exe
  explorer /select,"%~dp0release\Hive Desktop-Setup-0.0.1.exe"
) else if exist "release\Hive-Desktop-Setup-0.0.1.exe" (
  echo Found: release\Hive-Desktop-Setup-0.0.1.exe
  explorer /select,"%~dp0release\Hive-Desktop-Setup-0.0.1.exe"
) else (
  echo No Setup.exe yet. Opening the release folder.
  echo If you only see win-unpacked, the NSIS step did not finish. Run this bat again and wait.
  if exist release explorer release
)
echo.
pause
