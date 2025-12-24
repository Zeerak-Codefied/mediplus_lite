@echo off
echo ========================================
echo MediPlus Lite - Build Process
echo ========================================
echo.

REM Check if PowerShell is available
where powershell >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] PowerShell is not available on this system.
    echo Please install PowerShell or run build.ps1 manually.
    pause
    exit /b 1
)

echo Running build script...
echo.

REM Run the PowerShell build script
powershell.exe -ExecutionPolicy Bypass -File "%~dp0build.ps1"

echo.
pause

