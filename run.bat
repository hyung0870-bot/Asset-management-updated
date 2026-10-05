@echo off
chcp 65001 >nul
title AssetFlow 자산관리 앱 실행기

REM 1. Node.js 실행 경로 자동 감지 및 PATH 환경변수 등록
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" (
        set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"
    ) else if exist "C:\Program Files\nodejs\node.exe" (
        set "PATH=C:\Program Files\nodejs;%PATH%"
    )
)

echo ========================================================
echo   AssetFlow - 스마트 개인 자산관리 & AI 리밸런싱 앱
echo ========================================================
echo.
echo  [1] Vite 로컬 개발 서버를 실행합니다...
echo  [2] 잠시 후 기본 웹 브라우저(http://localhost:5173)가 자동으로 열립니다.
echo  [3] 종료하려면 이 콘솔 창에서 Ctrl + C 를 누르세요.
echo.
echo ========================================================
echo.

REM 2. 2초 후 브라우저 자동 오픈 (백그라운드 비동기 실행)
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:5173"

REM 3. Vite 개발 서버 실행
call npm run dev

pause
