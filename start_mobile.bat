@echo off
chcp 65001 >nul
title OmniSalon Mobile App

echo ==================================================
echo   Khoi dong ung dung OmniSalon Mobile
echo ==================================================
echo.

REM 1. Kiem tra va tu dong cau hinh Git vao PATH
where git >nul 2>nul
if errorlevel 1 (
    for /d %%D in ("%LOCALAPPDATA%\GitHubDesktop\app-*") do (
        if exist "%%D\resources\app\git\cmd\git.exe" (
            set "PATH=%%D\resources\app\git\cmd;%PATH%"
        )
    )
    if exist "C:\Program Files\Git\cmd\git.exe" (
        set "PATH=C:\Program Files\Git\cmd;%PATH%"
    )
    if exist "C:\Program Files\Git\bin\git.exe" (
        set "PATH=C:\Program Files\Git\bin;%PATH%"
    )
    if exist "%LOCALAPPDATA%\Programs\Git\cmd\git.exe" (
        set "PATH=%LOCALAPPDATA%\Programs\Git\cmd;%PATH%"
    )
)

where git >nul 2>nul
if errorlevel 1 (
    echo [CANH BAO] Khong tim thay Git trong PATH, se co the anh huong den Flutter.
)

REM 2. Kiem tra va tu dong cau hinh Flutter SDK vao PATH
where flutter >nul 2>nul
if errorlevel 1 (
    if exist "C:\src\flutter\bin\flutter.bat" (
        set "PATH=C:\src\flutter\bin;%PATH%"
    ) else if exist "C:\flutter\bin\flutter.bat" (
        set "PATH=C:\flutter\bin;%PATH%"
    ) else if exist "%LOCALAPPDATA%\flutter\bin\flutter.bat" (
        set "PATH=%LOCALAPPDATA%\flutter\bin;%PATH%"
    ) else (
        echo [LOI] Khong tim thay Flutter SDK tren may tinh!
        echo Vui long cai dat Flutter tai: https://docs.flutter.dev/get-started/install/windows
        echo.
        echo Nhan phim bat ky de thoat...
        pause >nul
        exit /b 1
    )
)

REM 3. Kiem tra thu vien Node.js va Backend
if not exist "%~dp0node_modules\msnodesqlv8" (
    echo [*] Dang tu dong chay npm install de cai thu vien Backend...
    cd /d "%~dp0"
    call npm install --no-audit --no-fund
)

REM 4. Kiem tra va tai thu vien Flutter pub get neu chua co
if not exist "%~dp0mobile\.dart_tool" (
    echo [*] Dang tai thu vien Flutter pub get...
    cd /d "%~dp0mobile"
    call flutter pub get
)

REM 5. Kiem tra may chu Backend tren cong 3000
netstat -aon | findstr :3000 | findstr LISTENING >nul 2>&1
if errorlevel 1 (
    echo [*] Dang khoi dong may chu API chay ngam tren cong 3000...
    net start MSSQL$SQLEXPRESS >nul 2>&1
    net start MSSQLSERVER >nul 2>&1
    start "OmniSalon API" /min cmd /c "node "%~dp0web\backend\server.js""
    timeout /t 2 /nobreak >nul
) else (
    echo [*] May chu API dang hoat dong tren cong 3000.
)

echo.
echo ==================================================
echo Chon thiet bi chay ung dung OmniSalon Mobile:
echo   [1] Google Chrome (Khuyen dung - Chay nhanh va on dinh nhat)
echo   [2] Windows Desktop (Ung dung may tinh - Yeu cau Developer Mode)
echo   [3] Android (Dien thoai hoac may ao)
echo ==================================================
echo.

set "choice=1"
set /p choice="Nhap lua chon [1, 2, 3] (Mac dinh 1): "
if "%choice%"=="" set "choice=1"

cd /d "%~dp0mobile"

if "%choice%"=="3" goto RUN_ANDROID
if "%choice%"=="2" goto RUN_WINDOWS
goto RUN_CHROME

:RUN_ANDROID
echo [*] Dang khoi chay tren Android...
flutter run -d android
goto DONE

:RUN_WINDOWS
echo [*] Dang khoi chay tren Windows Desktop...
flutter run -d windows
if errorlevel 1 (
    echo.
    echo ==================================================
    echo [CANH BAO] Khong the chay tren Windows Desktop.
    echo Nguyen nhan: Windows 11 yeu cau bat Developer Mode de tao symlink.
    echo Ban co the bat tai: Settings -^> System -^> For developers -^> Developer Mode: ON
    echo ==================================================
    echo.
    echo [*] Dang tu dong chuyen sang chay tren Google Chrome...
    flutter run -d chrome
)
goto DONE

:RUN_CHROME
echo [*] Dang khoi chay tren Google Chrome...
flutter run -d chrome
goto DONE

:DONE
echo.
echo ==================================================
echo Nhan phim bat ky de thoat...
pause >nul
