@echo off
setlocal
cd /d "%~dp0"

set PORT=5501

echo Starting local static server for Panini card lookup...
echo.
echo Open this URL in your browser:
echo http://127.0.0.1:%PORT%
echo.
echo Press Ctrl+C in this window to stop the server.
echo.

python -m http.server %PORT% --directory "%~dp0"
