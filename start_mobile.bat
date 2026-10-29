@echo off
chcp 65001 >nul
title OmniSalon Mobile App

echo ==================================================
echo   Khoi dong ung dung OmniSalon Mobile
echo ==================================================
echo.

REM Kiem tra thu vien Flutter SDK
where flutter >nul 2>nul
if %errorlevel% neq 0 (
    if exist "C:\src\flutter\bin\flutter.bat" (
        set "PATH=%PATH%;C:\src\flutter\bin"
    ) else (
        echo [LOI] Khong tim thay Flutter SDK tren may tinh!
        pause
        exit /b 1
    )
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
echo   [1] Windows Desktop (Ung dung may tinh - Khuyen dung)
echo   [2] Android (Dien thoai cam cap hoac may ao)
echo   [3] Google Chrome (Trinh duyet)
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
pause
