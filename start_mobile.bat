@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul
title OmniSalon Mobile App Launcher (Ket noi SQL Server & Hinh anh)

echo =========================================================================
echo    OMNISALON MOBILE APP — FLUTTER MULTI-PLATFORM
echo    Dong bo 100%% CSDL SQL Server QL_SALONTOC & Kho Hinh Anh voi Web
echo =========================================================================
echo.
echo Chon thiet bi khoi chay:
echo   [1] Google Chrome (Trinh duyet voi che do xem Mobile)
echo   [2] Windows Desktop (Ung dung may tinh Windows)
echo   [3] Android (Tu dong mo may ao Medium_Phone va chay App)
echo   [4] Chi bat may ao Android Emulator (Medium_Phone)
echo.
set /p choice="Nhap lua chon (1, 2, 3 hoac 4, mac dinh la 1): "

if "%choice%"=="2" (
    echo.
    echo [*] Dang khoi chay OmniSalon Mobile tren Windows Desktop...
    cd /d "%~dp0mobile"
    flutter run -d windows
) else if "%choice%"=="3" (
    echo.
    echo [*] Kiem tra va khoi dong may ao Android Emulator...
    start "" flutter emulators --launch Medium_Phone
    echo [*] Doi may ao khoi dong trong 10 giay...
    timeout /t 10 /nobreak >nul
    echo [*] Dang build va chay OmniSalon Mobile tren Android...
    cd /d "%~dp0mobile"
    flutter run -d android
) else if "%choice%"=="4" (
    echo.
    echo [*] Dang bat may ao Android Emulator (Medium_Phone)...
    flutter emulators --launch Medium_Phone
) else (
    echo.
    echo [*] Dang khoi chay OmniSalon Mobile tren Google Chrome...
    cd /d "%~dp0mobile"
    flutter run -d chrome
)

pause
