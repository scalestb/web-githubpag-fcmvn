@echo off
setlocal
cd /d "%~dp0"

set PORT=5502

echo Starting local static server for Panini card lookup...
echo.
echo Open this URL in your browser:
echo http://127.0.0.1:%PORT%/
echo.
echo Do not add /src or /web-githubpag-fcmvn to the URL.
echo If the browser shows 404, open:
echo http://127.0.0.1:%PORT%/index.html
echo.
echo Press Ctrl+C in this window to stop the server.
echo.

python -m http.server %PORT% --directory "%~dp0"
