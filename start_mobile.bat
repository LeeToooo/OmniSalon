@echo off
chcp 65001 >nul
title OmniSalon Mobile App

echo ==================================================
echo   Khoi dong ung dung OmniSalon Mobile
echo ==================================================
echo.

REM Kiem tra thu vien Flutter SDK
where flutter >nul 2>nul
if errorlevel 1 (
    if exist "C:\src\flutter\bin\flutter.bat" (
        set "PATH=%PATH%;C:\src\flutter\bin"
    ) else (
        echo [LOI] Khong tim thay Flutter SDK tren may tinh!
        echo Nhan phim bat ky de thoat...
        pause >nul
        exit /b 1
    )
)

REM Kiem tra va tu dong cai dat thu vien Node.js neu chua co
if not exist "%~dp0node_modules\msnodesqlv8" (
    echo [*] Dang tu dong chay npm install de cai thu vien Backend...
    cd /d "%~dp0"
    call npm install --no-audit --no-fund
)

REM Kiem tra thu vien Flutter pub get
if not exist "%~dp0mobile\.dart_tool" (
    echo [*] Dang tai thu vien Flutter pub get...
    cd /d "%~dp0mobile"
    call flutter pub get
)

REM Kiem tra may chu backend tren cong 3000
netstat -aon | findstr :3000 | findstr LISTENING >nul 2>&1
if errorlevel 1 (
    echo [*] Dang khoi dong may chu API chay ngam...
    net start MSSQL$SQLEXPRESS >nul 2>&1
    net start MSSQLSERVER >nul 2>&1
    start "OmniSalon API" /min cmd /c "node "%~dp0web\backend\server.js""
    timeout /t 2 /nobreak >nul
)

echo Chon thiet bi chay ung dung:
echo   [1] Windows Desktop - Ung dung may tinh (Khuyen dung)
echo   [2] Android - Dien thoai hoac may ao
echo   [3] Google Chrome - Trinh duyet
echo.

set "choice=1"
set /p choice="Nhap lua chon [1, 2, 3] (Mac dinh 1): "
if "%choice%"=="" set "choice=1"

cd /d "%~dp0mobile"

if "%choice%"=="2" (
    echo [*] Dang chay tren Android...
    flutter run -d android
    goto DONE
)

if "%choice%"=="3" (
    echo [*] Dang chay tren Google Chrome...
    flutter run -d chrome
    goto DONE
)

echo [*] Dang chay tren Windows Desktop...
flutter run -d windows

:DONE
echo.
echo Nhan phim bat ky de thoat...
pause >nul
