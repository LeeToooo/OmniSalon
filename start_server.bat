@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul
title OmniSalon - He Thong Quan Ly Salon Toc (SSMS va SQL Express)

REM -----------------------------------------------------------------------------
REM Trich xuat ky tu ESC ho tro mau sac ANSI tren Windows 10 / 11 / Terminal
REM -----------------------------------------------------------------------------
for /F "tokens=1,2 delims=#" %%a in ('"prompt #$H#$E# & echo on & for %%b in (1) do rem"') do set "ESC=%%b"

set "C_RST=%ESC%[0m"
set "C_BOLD=%ESC%[1m"
set "C_DIM=%ESC%[2m"
set "C_CYAN=%ESC%[96m"
set "C_BLUE=%ESC%[94m"
set "C_GREEN=%ESC%[92m"
set "C_YELLOW=%ESC%[93m"
set "C_RED=%ESC%[91m"
set "C_WHITE=%ESC%[97m"
set "C_GRAY=%ESC%[90m"
set "C_MAGENTA=%ESC%[95m"

set "TAG_OK=%ESC%[42;30m  OK  %C_RST%"
set "TAG_INFO=%ESC%[44;97m INFO %C_RST%"
set "TAG_WAIT=%ESC%[43;30m WAIT %C_RST%"
set "TAG_ERR=%ESC%[41;97m FAIL %C_RST%"
set "TAG_STEP=%ESC%[46;30m STEP %C_RST%"

REM -----------------------------------------------------------------------------
REM Kiem tra tham so dong lenh (--menu, -m, --reset, -r, --help, -h)
REM -----------------------------------------------------------------------------
if /i "%~1"=="--menu" goto MENU
if /i "%~1"=="-m" goto MENU
if /i "%~1"=="--reset" goto SET_RESET
if /i "%~1"=="-r" goto SET_RESET
if /i "%~1"=="--help" goto HELP
if /i "%~1"=="-h" goto HELP
goto MAIN_LAUNCH

:SET_RESET
set "RESET_FLAG=--reset"
goto MAIN_LAUNCH

:HELP
cls
echo %C_CYAN%===============================================================================%C_RST%
echo %C_BOLD%%C_WHITE%  [ OMNISALON ] - HUONG DAN SU DUNG DONG LENH%C_RST%
echo %C_CYAN%===============================================================================%C_RST%
echo.
echo %C_WHITE%  Cac tham so ho tro:%C_RST%
echo    %C_CYAN%start_server.bat%C_RST%             Khoi dong he thong tieu chuan [tu dong kiem tra va chay]
echo    %C_CYAN%start_server.bat --menu%C_RST%      Mo menu quan tri va tien ich tuong tac
echo    %C_CYAN%start_server.bat --reset%C_RST%     Xoa va nap lai CSDL QL_SALONTOC tu file QL_SALON.sql
echo    %C_CYAN%start_server.bat --help%C_RST%      Hien thi huong dan nay
echo.
echo %C_CYAN%===============================================================================%C_RST%
exit /b 0

:MENU
cls
echo %C_CYAN%===============================================================================%C_RST%
echo   %ESC%[44;97m  OMNISALON  %C_RST%  %C_BOLD%%C_WHITE%BANG DIEU KHIEN VA MENU TIEN ICH%C_RST%
echo   %C_GRAY%Direct MS SQL Server (SSMS 20 ^& SQL Express) * Node.js REST API Server%C_RST%
echo %C_CYAN%===============================================================================%C_RST%
echo.
echo %C_WHITE%  Chon thao tac ban muon thuc hien:%C_RST%
echo.
echo    %C_CYAN%[1]%C_RST% %C_WHITE%Khoi dong Server Backend ngay [Port 3000]%C_RST%
echo    %C_CYAN%[2]%C_RST% %C_WHITE%Khoi dong Server kem Flutter Mobile App%C_RST%
echo    %C_CYAN%[3]%C_RST% %C_WHITE%Nap lai CSDL sach tu dau [Reset Database QL_SALON.sql]%C_RST%
echo    %C_CYAN%[4]%C_RST% %C_WHITE%Mo Web Portal tren trinh duyet [http://localhost:3000]%C_RST%
echo    %C_CYAN%[5]%C_RST% %C_WHITE%Kiem tra chan doan he thong [Node.js, SQL Services, Ports]%C_RST%
echo    %C_CYAN%[6]%C_RST% %C_WHITE%Mo thu muc du an trong Windows Explorer%C_RST%
echo    %C_GRAY%[0] Thoat%C_RST%
echo.
set /p "MENU_CHOICE=  Nhap lua chon [1, 2, 3, 4, 5, 6, 0]: "

if "%MENU_CHOICE%"=="1" goto MAIN_LAUNCH
if "%MENU_CHOICE%"=="2" (
    start "OmniSalon Mobile Launcher" cmd /c "cd /d "%~dp0" && start_mobile.bat"
    goto MAIN_LAUNCH
)
if "%MENU_CHOICE%"=="3" (
    set "RESET_FLAG=--reset"
    goto MAIN_LAUNCH
)
if "%MENU_CHOICE%"=="4" (
    start http://localhost:3000
    goto MENU
)
if "%MENU_CHOICE%"=="5" goto DIAGNOSTICS
if "%MENU_CHOICE%"=="6" (
    start explorer "%~dp0"
    goto MENU
)
if "%MENU_CHOICE%"=="0" exit /b 0
goto MENU

:DIAGNOSTICS
cls
echo %C_CYAN%===============================================================================%C_RST%
echo %C_BOLD%%C_WHITE%  [ CHAN DOAN HE THONG OMNISALON ]%C_RST%
echo %C_CYAN%===============================================================================%C_RST%
echo.
echo  * Kiem tra Node.js Runtime:
where node >nul 2>nul && (node -v) || echo    [!] Chua tim thay Node.js
echo.
echo  * Kiem tra dich vu SQL Server tren Windows:
sc query MSSQL$SQLEXPRESS 2>nul | findstr "STATE" || echo    [-] MSSQL$SQLEXPRESS: Khong ton tai hoac chua chay
sc query MSSQLSERVER 2>nul | findstr "STATE" || echo    [-] MSSQLSERVER: Khong ton tai hoac chua chay
echo.
echo  * Kiem tra cong mang 3000:
netstat -aon | findstr :3000 | findstr LISTENING || echo    [+] Cong 3000 dang trong [San sang].
echo.
echo  Nhan phim bat ky de quay lai menu...
pause >nul
goto MENU

:MAIN_LAUNCH
cls
echo %C_CYAN%===============================================================================%C_RST%
echo   %ESC%[44;97m  OMNISALON  %C_RST%  %C_BOLD%%C_WHITE%HE THONG QUAN LY SALON TOC CHUYEN NGHIEP%C_RST%
echo   %C_GRAY%Direct MS SQL Server (SSMS 20 ^& SQL Express) * Node.js REST API Server%C_RST%
echo   %C_GRAY%Website: %C_CYAN%http://localhost:3000%C_RST%%C_GRAY%  *  Database: %C_GREEN%QL_SALONTOC%C_RST%
echo %C_CYAN%===============================================================================%C_RST%
echo.

REM -----------------------------------------------------------------------------
REM 1. Kiem tra Node.js Runtime
REM -----------------------------------------------------------------------------
echo  %C_CYAN%[1/5]%C_RST% %C_WHITE%Kiem tra moi truong Node.js Runtime...%C_RST%
set "NODE_BIN=node"
where node >nul 2>nul
if %errorlevel% neq 0 (
    if exist "C:\Program Files\nodejs\node.exe" (
        set "NODE_BIN=C:\Program Files\nodejs\node.exe"
    ) else (
        echo.
        echo  %TAG_ERR% %C_RED%%C_BOLD%Khong tim thay Node.js tren may tinh!%C_RST%
        echo  %C_YELLOW%=================================================================%C_RST%
        echo  %C_WHITE%  He thong can Node.js phien ban LTS 18+ hoac 20+ de hoat dong.%C_RST%
        echo.
        echo  %C_WHITE%  Cach cai dat nhanh qua PowerShell [Quyen Administrator]:%C_RST%
        echo  %C_CYAN%    winget install OpenJS.NodeJS.LTS%C_RST%
        echo.
        echo  %C_WHITE%  Hoac tai bo cai truc tiep tai: https://nodejs.org%C_RST%
        echo  %C_YELLOW%=================================================================%C_RST%
        echo.
        pause
        exit /b 1
    )
)
for /f "tokens=*" %%v in ('%NODE_BIN% -v 2^>nul') do set "NODE_VER=%%v"
echo        %TAG_OK% %C_GREEN%Tim thay Node.js %C_BOLD%!NODE_VER!%C_RST%%C_GREEN% tai: %C_GRAY%!NODE_BIN!%C_RST%
echo.

REM -----------------------------------------------------------------------------
REM 2. Kiem tra thu vien dependencies (NPM)
REM -----------------------------------------------------------------------------
echo  %C_CYAN%[2/5]%C_RST% %C_WHITE%Kiem tra thu vien dependencies [NPM]...%C_RST%
if not exist "%~dp0node_modules\msnodesqlv8" (
    echo        %TAG_INFO% %C_YELLOW%Dang tu dong cai dat thu vien Node.js tu package.json...%C_RST%
    cd /d "%~dp0"
    call npm.cmd install --no-audit
    if %errorlevel% neq 0 (
        echo.
        echo  %TAG_ERR% %C_RED%Cai dat dependencies that bai! Vui long kiem tra ket noi Internet.%C_RST%
        echo.
        pause
        exit /b 1
    )
    echo        %TAG_OK% %C_GREEN%Da cai dat thanh cong cac goi thu vien Node.js%C_RST%
) else (
    echo        %TAG_OK% %C_GREEN%Thu vien %C_BOLD%msnodesqlv8%C_RST%%C_GREEN% va cac module NPM da san sang%C_RST%
)
echo.

REM -----------------------------------------------------------------------------
REM 3. Kiem tra dich vu Microsoft SQL Server
REM -----------------------------------------------------------------------------
echo  %C_CYAN%[3/5]%C_RST% %C_WHITE%Kiem tra dich vu Microsoft SQL Server [SQLEXPRESS / MSSQLSERVER]...%C_RST%
net start MSSQL$SQLEXPRESS >nul 2>nul
net start MSSQLSERVER >nul 2>nul
echo        %TAG_OK% %C_GREEN%Dich vu SQL Server da san sang ket noi%C_RST%
echo.

REM -----------------------------------------------------------------------------
REM 4. Kiem tra va tu dong khoi tao CSDL qua setup_db.js
REM -----------------------------------------------------------------------------
echo  %C_CYAN%[4/5]%C_RST% %C_WHITE%Kiem tra va nap co so du lieu %C_BOLD%QL_SALONTOC%C_RST%...
"%NODE_BIN%" "%~dp0web\backend\setup_db.js" %RESET_FLAG%
if %errorlevel% neq 0 (
    echo.
    echo  %TAG_ERR% %C_RED%%C_BOLD%Khong the khoi tao CSDL QL_SALONTOC!%C_RST%
    echo  %C_YELLOW%=================================================================%C_RST%
    echo  %C_WHITE%  Huong xu ly:%C_RST%
    echo  %C_WHITE%  1. Kiem tra dich vu SQL Server Express da duoc bat:%C_RST%
    echo  %C_CYAN%     net start MSSQL$SQLEXPRESS%C_RST%
    echo  %C_WHITE%  2. Mo SSMS de xac nhan ket noi SQL Server hoat dong binh thuong.%C_RST%
    echo  %C_YELLOW%=================================================================%C_RST%
    echo.
    pause
    exit /b 1
)
echo        %TAG_OK% %C_GREEN%Co so du lieu %C_BOLD%QL_SALONTOC%C_RST%%C_GREEN% da duoc xac thuc va san sang%C_RST%
echo.

REM -----------------------------------------------------------------------------
REM 5. Tu dong giai phong cong 3000 neu co tien trinh dang chiem dung
REM -----------------------------------------------------------------------------
echo  %C_CYAN%[5/5]%C_RST% %C_WHITE%Kiem tra va chuan bi cong mang %C_BOLD%3000%C_RST%...
set "KILLED_PROCESS=0"
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING 2^>nul') do (
    set "KILLED_PROCESS=1"
    taskkill /f /pid %%a >nul 2>&1
)
if "!KILLED_PROCESS!"=="1" (
    echo        %TAG_INFO% %C_YELLOW%Da giai phong tien trinh cu dang chiem dung cong 3000%C_RST%
) else (
    echo        %TAG_OK% %C_GREEN%Cong 3000 dang trong va san sang hoat dong%C_RST%
)
echo.

REM -----------------------------------------------------------------------------
REM Bang Thong Tin Dashboard Server Khoi Chay
REM -----------------------------------------------------------------------------
echo %C_CYAN%===============================================================================%C_RST%
echo %C_BOLD%%C_GREEN%   >> OMNISALON BACKEND ENGINE DANG HOAT DONG TREN CONG 3000%C_RST%
echo %C_CYAN%===============================================================================%C_RST%
echo  %C_WHITE%  * Web Portal:       %C_BOLD%%C_CYAN%http://localhost:3000%C_RST%
echo  %C_WHITE%  * REST API Health:  %C_CYAN%http://localhost:3000/api/health%C_RST%
echo  %C_WHITE%  * Co so du lieu:    %C_BOLD%%C_GREEN%QL_SALONTOC%C_RST% %C_GRAY%[Ket noi truc tiep SSMS 20 ^& SQL Express]%C_RST%
echo  %C_WHITE%  * Ung dung Mobile:  %C_YELLOW%start_mobile.bat%C_RST% %C_GRAY%[Chay de ket noi Flutter Client]%C_RST%
echo  %C_WHITE%  * Trinh duyet:      %C_GREEN%Tu dong mo website tren trinh duyet mac dinh...%C_RST%
echo %C_CYAN%-------------------------------------------------------------------------------%C_RST%
echo  %C_GRAY%  [ Nhan Ctrl + C bat ky luc nao de dung Backend Server ]%C_RST%
echo %C_CYAN%===============================================================================%C_RST%
echo.

REM -----------------------------------------------------------------------------
REM Khoi chay HTTP Server qua server.js
REM -----------------------------------------------------------------------------
"%NODE_BIN%" "%~dp0web\backend\server.js"

pause
