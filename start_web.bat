@echo off
chcp 65001 >nul
title OmniSalon Web

echo ==================================================
echo   Khoi dong he thong OmniSalon Web
echo ==================================================
echo.

REM Kiem tra Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [LOI] Chua cai dat Node.js tren may tinh!
    echo Vui long cai dat tai: https://nodejs.org
    pause
    exit /b 1
)

REM Bat dich vu SQL Server neu chua chay
net start MSSQL$SQLEXPRESS >nul 2>&1
net start MSSQLSERVER >nul 2>&1

REM Kiem tra va nap co so du lieu
if "%1"=="--reset" (
    echo [*] Dang tao lai co so du lieu tu dau...
    node "%~dp0web\backend\database\setup_db.js" --reset
) else (
    node "%~dp0web\backend\database\setup_db.js"
)

REM Giai phong cong 3000 neu dang bi chiem
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING 2^>nul') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo.
echo [*] Dang mo giao dien web tai: http://localhost:3000
echo [*] Nhan Ctrl + C de dung he thong
echo ==================================================
echo.

start http://localhost:3000
node "%~dp0web\backend\server.js"
pause

