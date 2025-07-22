@echo off
echo ====================================
echo   Запуск Limni (DEV)
echo ====================================

cd /d "%~dp0"

echo Проверка зависимостей...
if not exist node_modules (
    echo Установка зависимостей...
    npm install
    if errorlevel 1 (
        echo Ошибка при установке зависимостей!
        pause
        exit /b 1
    )
)

echo Запуск приложения в режиме разработки...
npm run tauri dev

if errorlevel 1 (
    echo Ошибка при запуске приложения!
    pause
    exit /b 1
)

echo Приложение закрыто.
pause 