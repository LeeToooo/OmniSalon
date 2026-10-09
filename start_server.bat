@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul
title OmniSalon - He Thong Quan Ly Salon Toc (SSMS va SQL Express)

echo =========================================================================
echo    OMNISALON - HE THONG QUAN LY SALON TOC (SSMS 20 va SQL EXPRESS)
echo    Tu Dong 100%%: Khoi tao CSDL QL_SALONTOC - Web Portal - REST API
echo =========================================================================
echo.

REM 1. Kiem tra Node.js
set "NODE_BIN=node"
where node >nul 2>nul
if %errorlevel% neq 0 (
    if exist "C:\Program Files\nodejs\node.exe" (
        set "NODE_BIN=C:\Program Files\nodejs\node.exe"
    ) else (
        echo [1/4] [CANH BAO] May tinh chua cai dat Node.js!
        echo Vui long cai dat Node.js tai https://nodejs.org hoac chay:
        echo winget install OpenJS.NodeJS.LTS
        echo.
        pause
        exit /b 1
    )
)
echo [1/4] [OK] Tim thay Node.js.

REM 2. Kiem tra thu vien dependencies
if not exist "%~dp0node_modules\msnodesqlv8" (
    echo [2/4] [NPM] Dang cai dat cac thu vien Node.js tu package.json...
    cd /d "%~dp0"
    call npm.cmd install --no-audit
) else (
    echo [2/4] [OK] Thu vien Node.js da san sang.
)

REM 3. Kiem tra dich vu SQL Server
echo [3/4] [SQL] Kiem tra dich vu SQL Server (SQLEXPRESS)...
net start MSSQL$SQLEXPRESS >nul 2>nul
echo [3/4] [OK] SQL Server da san sang.

REM 4. Kiem tra va tu dong khoi tao CSDL qua setup_db.js
echo [4/4] [CSDL] Kiem tra va nap co so du lieu QL_SALONTOC...
"%NODE_BIN%" "%~dp0web\backend\setup_db.js"
if %errorlevel% neq 0 (
    echo.
    echo [LOI] Khong the khoi tao CSDL QL_SALONTOC!
    echo Vui long kiem tra SQL Server Express da duoc cai dat.
    echo.
    pause
    exit /b 1
)

REM 5. Tu dong giai phong cong 8080 neu co tien trinh dang chiem dung
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080 ^| findstr LISTENING 2^>nul') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo.
echo =========================================================================
echo    KHOI CHAY THANH CONG!
echo    Web Portal:  http://localhost:8080
echo    Database:    QL_SALONTOC (Ket noi truc tiep SSMS 20 va SQL Express)
echo =========================================================================
echo.

start http://localhost:8080

"%NODE_BIN%" "%~dp0web\backend\server.js"

pause

