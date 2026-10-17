@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul
title OmniSalon Mobile App Launcher

echo =========================================================================
echo    OMNISALON MOBILE APP - FLUTTER MULTI-PLATFORM
echo    Dong bo 100%% CSDL SQL Server QL_SALONTOC va Kho Hinh Anh
echo =========================================================================
echo.
echo Chon thiet bi khoi chay:
echo   [1] Google Chrome - Che do Mobile F12 (Khuyen Dung - Chay Ngay)
echo   [2] Windows Desktop (Ung dung may tinh Windows)
echo   [3] Android (Tu dong bat may ao va chay App)
echo   [4] Kiem tra danh sach may ao va thiet bi ket noi
echo.

set choice=1
set /p choice="Nhap lua chon [1, 2, 3, 4] (Mac dinh 1): "

REM Tu dong kiem tra va khoi dong Backend Server neu chua chay
netstat -aon | findstr :3000 | findstr LISTENING >nul 2>&1
if errorlevel 1 (
    echo [*] Phat hien Backend Server chua chay. Dang tu dong bat Node.js tren port 3000...
    start "OmniSalon Backend Server" cmd /c "cd /d "%~dp0" && start_server.bat"
    echo [*] Dang doi 4 giay de Backend ket noi SQL Server va nap CSDL...
    timeout /t 4 /nobreak >nul
)

if "%choice%"=="2" goto RUN_WINDOWS
if "%choice%"=="3" goto RUN_ANDROID
if "%choice%"=="4" goto CHECK_DEVICES
goto RUN_CHROME

:RUN_WINDOWS
echo.
echo [*] Dang kiem tra va khoi chay tren Windows Desktop...
cd /d "%~dp0mobile"
flutter run -d windows
if errorlevel 1 (
    echo.
    echo [!] Chu y: Neu gap loi Symlink hoac Developer Mode, vui long bat Developer Mode trong Windows Settings.
    echo [*] Dang mo Developer Settings...
    start ms-settings:developers
)
goto END

:RUN_ANDROID
echo.
echo [*] Dang kiem tra may ao Android tren he thong...
flutter emulators > "%temp%\flt_emulators.txt" 2>&1
findstr /i /c:"Unable to find any emulator" "%temp%\flt_emulators.txt" >nul
if not errorlevel 1 (
    echo =========================================================================
    echo [!] CHUA CO MAY AO ANDROID:
    echo     May tinh chua cai Android Studio hoac chua tao may ao AVD.
    echo [*] GIAI PHAP:
    echo     - Chon [1] de mo ngay tren Google Chrome Mobile (Khong can cai gi them)
    echo     - Hoac cai Android Studio tu: https://developer.android.com/studio
    echo =========================================================================
    echo.
    set runChrome=Y
    set /p runChrome="Ban co muon mo ngay tren Google Chrome khong? [Y/N] (Mac dinh Y): "
    if /i "!runChrome!"=="N" goto END
    goto RUN_CHROME
)
echo [*] Dang khoi dong may ao Android Emulator...
start "" flutter emulators --launch Medium_Phone
echo [*] Cho may ao khoi dong trong 10 giay...
timeout /t 10 /nobreak >nul
echo [*] Dang build va chay OmniSalon Mobile tren Android...
cd /d "%~dp0mobile"
flutter run -d android
goto END

:CHECK_DEVICES
echo.
echo [*] Danh sach may ao Android tren he thong:
flutter emulators
echo.
echo [*] Danh sach thiet bi dang ket noi:
flutter devices
goto END

:RUN_CHROME
echo.
echo [*] Dang khoi chay OmniSalon Mobile tren Google Chrome...
echo [*] MEO: Khi Chrome mo len, hay bam F12 -> Ctrl + Shift + M de xem dung ti le iPhone/Android!
echo.
cd /d "%~dp0mobile"
flutter run -d chrome
goto END

:END
echo.
pause
