@echo off
chcp 65001 >nul
title 感應光寓 · B 區 機位設定工具
cd /d "%~dp0"

echo ============================================
echo   機位設定工具（設定 3D 室內運鏡機位）
echo ============================================
echo.

REM ── 檢查 Node.js ───────────────────────────────────────────────
where node >nul 2>nul
if errorlevel 1 (
  echo [錯誤] 找不到 Node.js。請先到 https://nodejs.org/ 安裝 LTS 版,再重開此檔。
  pause & exit /b 1
)

if not exist node_modules (
  echo 第一次執行,安裝套件中（需網路,約 1-2 分鐘）...
  call npm install || ( echo [錯誤] 套件安裝失敗。 & pause & exit /b 1 )
)
if not exist dist (
  echo 尚未建置,建置中...
  call npm run build || ( echo [錯誤] 建置失敗。 & pause & exit /b 1 )
)

REM ── 啟動伺服器（若 5284 還沒開才啟動）──────────────────────────
netstat -ano | findstr ":5284" | findstr "LISTENING" >nul
if errorlevel 1 (
  echo 啟動伺服器 http://localhost:5284 ...
  start "感應光寓-TV-server" /min cmd /c "npm run preview"
  echo 等待伺服器就緒...
  timeout /t 4 /nobreak >nul
) else (
  echo 伺服器已在執行,沿用。
)

REM ── Chrome 視窗（非全螢幕,要操作工具 UI；同一專用 profile → 機位存得到、主畫面讀得到）──
set "PROFILE=%~dp0.chrome-profile"
set "CHROME="
for %%P in (
  "%ProgramFiles%\Google\Chrome\Application\chrome.exe"
  "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
  "%LocalAppData%\Google\Chrome\Application\chrome.exe"
) do if exist %%~P set "CHROME=%%~P"

if defined CHROME (
  start "" "%CHROME%" --new-window --start-maximized --user-data-dir="%PROFILE%" --no-first-run --no-default-browser-check "http://localhost:5284/camera-tool.html"
) else (
  echo 找不到 Chrome,改用預設瀏覽器。
  start "" "http://localhost:5284/camera-tool.html"
)

echo.
echo  機位設定工具已開啟。設好機位按「儲存」→ 機位存到此 profile;
echo  之後開 b-livingroom\啟動.bat(一鍵啟動桌面+電視)就會用你設定的機位跑運鏡。
timeout /t 5 >nul
exit /b 0
