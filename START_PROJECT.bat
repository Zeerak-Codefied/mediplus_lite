@echo off
echo ========================================
echo Starting MediPlus Lite Project
echo ========================================
echo.

echo Checking XAMPP Apache status...
netstat -an | findstr ":80" >nul
if %errorlevel% equ 0 (
    echo [OK] Apache is already running on port 80
) else (
    echo [INFO] Apache is not running
    echo.
    echo Please start XAMPP Control Panel and start Apache manually
    echo Or run: C:\xampp\apache_start.bat
)

echo.
echo ========================================
echo Project Information
echo ========================================
echo.
echo Project URL: http://localhost/mediplus-lite/
echo API Proxy: http://localhost/mediplus-lite/api/meezan-bank-proxy.php
echo.
echo ========================================
echo Opening project in browser...
echo ========================================
echo.

timeout /t 2 >nul
start http://localhost/mediplus-lite/

echo.
echo Project should open in your default browser
echo If it doesn't, manually open: http://localhost/mediplus-lite/
echo.
pause

