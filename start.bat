@echo off
chcp 65001 >nul
title OmniSalon — Trình Khởi Chạy Hệ Thống

REM Kiểm tra tham số dòng lệnh nếu có (ví dụ: start.bat web hoặc start.bat mobile)
if /i "%1"=="web" goto RUN_WEB
if /i "%1"=="mobile" goto RUN_MOBILE
if /i "%1"=="all" goto RUN_ALL

:MENU
cls
echo ==================================================
echo        HỆ THỐNG OMNISALON - KHỞI CHẠY 1-CLICK
echo ==================================================
echo.
echo   [1] Khởi chạy Web App (Khách hàng ^& Admin Hub) - Mặc định
echo   [2] Khởi chạy Mobile App (Ứng dụng Flutter)
echo   [3] Khởi chạy Cả hai (Web Server ^& Mobile App)
echo   [0] Thoát
echo.
echo ==================================================
set "choice=1"
set /p choice="Nhập lựa chọn của bạn [1, 2, 3, 0] (Mặc định: 1): "
if "%choice%"=="" set "choice=1"
if "%choice%"=="1" goto RUN_WEB
if "%choice%"=="2" goto RUN_MOBILE
if "%choice%"=="3" goto RUN_ALL
if "%choice%"=="0" exit /b 0
goto MENU

REM ===================================================
REM 1. KHỞI CHẠY PHÂN HỆ WEB
REM ===================================================
:RUN_WEB
cls
echo ==================================================
echo   Đang khởi động hệ thống OmniSalon Web App
echo ==================================================
echo.

REM Kiểm tra Node.js
where node >nul 2>nul
if errorlevel 1 (
    echo [LỖI] Chưa cài đặt Node.js trên máy tính!
    echo Vui lòng cài đặt Node.js tại: https://nodejs.org
    echo.
    pause
    exit /b 1
)

REM Kiểm tra dependencies
if not exist "%~dp0node_modules\msnodesqlv8" (
    echo [*] Phát hiện chưa có node_modules hoặc thiếu thư viện.
    echo [*] Đang tự động chạy npm install, vui lòng chờ...
    cd /d "%~dp0"
    call npm install --no-audit --no-fund
)

REM Bật dịch vụ SQL Server nếu có
net start MSSQL$SQLEXPRESS >nul 2>&1
net start MSSQLSERVER >nul 2>&1

REM Giải phóng cổng 3000 nếu đang bị chiếm
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1

REM Kiểm tra và nạp CSDL
echo [*] Đang kiểm tra kết nối cơ sở dữ liệu...
if "%2"=="--reset" (
    node "%~dp0web\backend\database\setup_db.js" --reset
) else (
    node "%~dp0web\backend\database\setup_db.js"
)

echo.
echo ==================================================
echo [*] Mở giao diện web tại: http://localhost:3000
echo [*] Nhấn Ctrl + C để dừng máy chủ
echo ==================================================
echo.

start http://localhost:3000
node "%~dp0web\backend\server.js"
goto EXIT_SCRIPT

REM ===================================================
REM 2. KHỞI CHẠY PHÂN HỆ MOBILE (FLUTTER)
REM ===================================================
:RUN_MOBILE
cls
echo ==================================================
echo   Đang khởi động ứng dụng OmniSalon Mobile
echo ==================================================
echo.

REM Tự động cấu hình Git vào PATH nếu thiếu
where git >nul 2>nul
if errorlevel 1 (
    for /d %%D in ("%LOCALAPPDATA%\GitHubDesktop\app-*") do (
        if exist "%%D\resources\app\git\cmd\git.exe" (
            set "PATH=%%D\resources\app\git\cmd;%PATH%"
        )
    )
    if exist "C:\Program Files\Git\cmd\git.exe" set "PATH=C:\Program Files\Git\cmd;%PATH%"
    if exist "C:\Program Files\Git\bin\git.exe" set "PATH=C:\Program Files\Git\bin;%PATH%"
    if exist "%LOCALAPPDATA%\Programs\Git\cmd\git.exe" set "PATH=%LOCALAPPDATA%\Programs\Git\cmd;%PATH%"
)

REM Tự động thêm Android SDK platform-tools & emulator vào PATH nếu có
if exist "%LOCALAPPDATA%\Android\Sdk\platform-tools" (
    set "PATH=%LOCALAPPDATA%\Android\Sdk\platform-tools;%LOCALAPPDATA%\Android\Sdk\emulator;%PATH%"
)

REM Kiểm tra Flutter SDK
where flutter >nul 2>nul
if errorlevel 1 (
    if exist "C:\src\flutter\bin\flutter.bat" (
        set "PATH=C:\src\flutter\bin;%PATH%"
    ) else if exist "C:\flutter\bin\flutter.bat" (
        set "PATH=C:\flutter\bin;%PATH%"
    ) else if exist "%LOCALAPPDATA%\flutter\bin\flutter.bat" (
        set "PATH=%LOCALAPPDATA%\flutter\bin;%PATH%"
    ) else (
        echo [LỖI] Không tìm thấy Flutter SDK trên máy tính!
        echo Vui lòng cài đặt Flutter tại: https://docs.flutter.dev/get-started/install/windows
        echo.
        pause
        exit /b 1
    )
)

REM Kiểm tra thư viện Backend
if not exist "%~dp0node_modules\msnodesqlv8" (
    echo [*] Đang cài đặt thư viện Backend qua npm install...
    cd /d "%~dp0"
    call npm install --no-audit --no-fund
)

REM Tải thư viện Flutter pub get
if not exist "%~dp0mobile\.dart_tool" (
    echo [*] Đang tải thư viện Flutter pub get...
    cd /d "%~dp0mobile"
    call flutter pub get
)

REM Đảm bảo Backend Server đang chạy trên cổng 3000
netstat -aon | findstr :3000 | findstr LISTENING >nul 2>&1
if errorlevel 1 (
    echo [*] Đang khởi động Backend Server ngầm trên cổng 3000...
    net start MSSQL$SQLEXPRESS >nul 2>&1
    net start MSSQLSERVER >nul 2>&1
    start "OmniSalon API" /min cmd /c node "%~dp0web\backend\server.js"
    timeout /t 2 /nobreak >nul
) else (
    echo [*] Máy chủ API Backend đang sẵn sàng trên cổng 3000.
)

echo.
echo ==================================================
echo Chọn thiết bị chạy ứng dụng Mobile:
echo   [1] Google Chrome (Khuyên dùng - Nhanh và ổn định nhất)
echo   [2] Windows Desktop (Yêu cầu Developer Mode)
echo   [3] Android (Thiết bị thật hoặc máy ảo)
echo ==================================================
echo.

set "dev_choice=1"
set /p dev_choice="Nhập lựa chọn thiết bị [1, 2, 3] (Mặc định: 1): "
if "%dev_choice%"=="" set "dev_choice=1"

cd /d "%~dp0mobile"

if "%dev_choice%"=="3" goto RUN_DEV_ANDROID
if "%dev_choice%"=="2" goto RUN_DEV_WINDOWS
goto RUN_DEV_CHROME

:RUN_DEV_ANDROID
echo [*] Đang tìm kiếm thiết bị Android hoặc máy ảo kết nối...
set "ANDROID_DEV_ID="
if exist "%~dp0mobile\get_device.js" (
    for /f "usebackq delims=" %%i in (`node "%~dp0mobile\get_device.js"`) do set "ANDROID_DEV_ID=%%i"
)

if "%ANDROID_DEV_ID%"=="" (
    goto ANDROID_FALLBACK
)

echo [*] Đã kết nối với thiết bị: %ANDROID_DEV_ID%
where adb >nul 2>nul
if not errorlevel 1 (
    adb -s %ANDROID_DEV_ID% reverse tcp:3000 tcp:3000 >nul 2>&1
)
echo [*] Đang khởi chạy ứng dụng lên thiết bị %ANDROID_DEV_ID%...
call flutter run -d %ANDROID_DEV_ID%
if errorlevel 1 goto ANDROID_FALLBACK
goto EXIT_SCRIPT

:ANDROID_FALLBACK
echo.
echo ==================================================
echo [CẢNH BÁO] Không tìm thấy thiết bị Android hoặc máy ảo đang chạy!
echo.
echo Để chạy ứng dụng trên Android:
echo   - Cách 1: Mở Android Studio và bật máy ảo (AVD Pixel) lên trước.
echo   - Cách 2: Cắm điện thoại Android vào máy tính qua cáp USB và BẬT "Gỡ lỗi USB" (USB Debugging).
echo   - Cách 3: Chạy trên Google Chrome (Lựa chọn [1] - Khuyên dùng vì nhanh, nhẹ và trực quan).
echo ==================================================
echo.
set "fb_choice=1"
set /p fb_choice="Bạn có muốn tự động mở trên Google Chrome (Khuyên dùng) không? [1: Có, 0: Thoát] (Mặc định: 1): "
if "%fb_choice%"=="" set "fb_choice=1"
if "%fb_choice%"=="1" goto RUN_DEV_CHROME
goto EXIT_SCRIPT

:RUN_DEV_WINDOWS
echo [*] Đang khởi chạy trên Windows Desktop...
call flutter run -d windows
if errorlevel 1 (
    echo.
    echo [CẢNH BÁO] Không thể chạy Windows Desktop - Cần bật Developer Mode.
    echo [*] Đang tự động chuyển sang Google Chrome...
    call flutter run -d chrome
)
goto EXIT_SCRIPT

:RUN_DEV_CHROME
echo [*] Đang khởi chạy trên Google Chrome...
call flutter run -d chrome
goto EXIT_SCRIPT

REM ===================================================
REM 3. KHỞI CHẠY CẢ HAI (WEB + MOBILE)
REM ===================================================
:RUN_ALL
cls
echo ==================================================
echo   Khởi chạy đồng thời Web Server ^& Mobile App
echo ==================================================
echo.

REM Mở Web Server trong một cửa sổ riêng
start "OmniSalon Web Server" cmd /c "%~f0 web"
timeout /t 3 /nobreak >nul

REM Khởi động tiếp Mobile App
goto RUN_MOBILE

:EXIT_SCRIPT
echo.
echo ==================================================
echo [THÔNG BÁO] Phiên làm việc đã kết thúc.
echo ==================================================
pause
exit /b 0
