@echo off
REM Start Autonomous System - Windows Batch Script
REM This script starts both the Next.js dev server and the local scheduler

echo ========================================
echo   SIM-OPS Autonomous System Starter
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

REM Check if .env.local exists
if not exist .env.local (
    echo [WARNING] .env.local not found
    echo Creating from .env.example...
    copy .env.example .env.local
    echo.
    echo [ACTION REQUIRED] Please edit .env.local with your configuration
    echo Then run this script again.
    pause
    exit /b 1
)

echo [1/3] Checking dependencies...
if not exist node_modules (
    echo Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
)

echo [2/3] Starting Next.js dev server...
start "Next.js Dev Server" cmd /k "npm run dev"

REM Wait for server to start
echo Waiting for server to start...
timeout /t 10 /nobreak >nul

echo [3/3] Starting autonomous scheduler...
echo.
echo ========================================
echo   System is now running autonomously!
echo ========================================
echo.
echo - Next.js: http://localhost:3000
echo - Scheduler: Running in this window
echo.
echo Press Ctrl+C to stop the scheduler
echo Close the other window to stop Next.js
echo.

REM Start scheduler (this will block)
node local-scheduler.js

pause
