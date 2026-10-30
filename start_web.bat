@echo off
chcp 65001 >nul
title OmniSalon Web Server

echo ==================================================
echo   Khoi dong he thong OmniSalon Web
echo ==================================================
echo.

REM 1. Kiem tra Node.js
where node >nul 2>nul
if errorlevel 1 (
    echo [LOI] Chua cai dat Node.js tren may tinh!
    echo Vui long cai dat Node.js tai: https://nodejs.org
    echo.
    echo Nhan phim bat ky de thoat...
    pause >nul
    exit /b 1
)

REM 2. Kiem tra va tu dong cai dat thu vien Node.js neu chua co
if not exist "%~dp0node_modules\msnodesqlv8" (
    echo [*] Phat hien chua co thu muc node_modules hoac thieu thu vien.
    echo [*] Dang tu dong chay npm install, vui long cho trong giay lat...
    cd /d "%~dp0"
    call npm install --no-audit --no-fund
    if errorlevel 1 (
        echo.
        echo [CANH BAO] Cai dat thu vien qua npm chua hoan tat.
        echo Ban co the thu mo CMD va chay lenh: npm install
        echo.
    ) else (
        echo [*] Cai dat thu vien thanh cong!
        echo.
    )
)

REM 3. Bat dich vu SQL Server neu co tren may
net start MSSQL$SQLEXPRESS >nul 2>&1
net start MSSQLSERVER >nul 2>&1

REM 4. Giai phong cong 3000 neu dang bi chiem
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1

REM 5. Kiem tra va khoi tao co so du lieu
echo [*] Dang kiem tra ket noi co so du lieu...
if "%1"=="--reset" (
    node "%~dp0web\backend\database\setup_db.js" --reset
) else (
    node "%~dp0web\backend\database\setup_db.js"
)

echo.
echo ==================================================
echo [*] Dang mo giao dien web tai: http://localhost:3000
echo [*] Nhan Ctrl + C de dung he thong
echo ==================================================
echo.

start http://localhost:3000
node "%~dp0web\backend\server.js"

echo.
echo ==================================================
echo [THONG BAO] He thong da dung hoat dong.
echo Nhan phim bat ky de dong cua so nay...
echo ==================================================
pause >nul
