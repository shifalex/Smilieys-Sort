@echo off
setlocal
cd /d "%~dp0"

where py >nul 2>nul
if %errorlevel%==0 (
  start "Smileys local server" /min py -m http.server 8000 --bind 127.0.0.1
) else (
  start "Smileys local server" /min python -m http.server 8000 --bind 127.0.0.1
)

timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:8000/index.html"
endlocal
