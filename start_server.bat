@echo off
chcp 65001 >nul
title OmniSalon - Node.js SQL Backend Server (Port 8080)

echo =========================================================================
echo    OMNISALON NODE.JS DIRECT SQL BACKEND SERVER (PORT 8080)
echo    Ket noi 100%% Truc Tiep: QL_SALON.sql ^<--^> Web Portal ^<--^> Mobile App
echo =========================================================================
echo.

set "NODE_BIN=node"
where node >nul 2>nul
if %errorlevel% neq 0 (
    if exist "C:\Program Files\nodejs\node.exe" (
        set "NODE_BIN=C:\Program Files\nodejs\node.exe"
    ) else (
        echo [CANH BAO] May tinh chua cai dat Node.js!
        echo Vui long cai dat Node.js (tai tu https://nodejs.org hoac chay: winget install OpenJS.NodeJS.LTS)
        echo de khoi chay server.js ket noi truc tiep database QL_SALON.sql.
        echo.
        pause
        exit /b 1
    )
)

echo [RUNNER] Tim thay Node.js. Dang khoi chay qua server.js...
echo Dang lang nghe tai http://localhost:8080 ...
echo.
"%NODE_BIN%" "%~dp0server.js"

pause
