@echo off
cd /d "%~dp0"
echo Starting Apex Workspace at http://localhost:4310
echo Keep this window open while using the portal. Press Ctrl+C to stop.
call npm.cmd start
pause
