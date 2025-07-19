@echo off
echo ====================================
echo   Быстрая сборка для Windows
echo ====================================

cd /d "%~dp0"

echo Установка зависимостей...
npm install

echo Сборка фронтенда...
npm run build

echo Сборка Tauri приложения...
npm run tauri build

echo.
echo ✅ Сборка завершена!
echo 📁 Файлы: src-tauri\target\release\bundle\
echo.
pause 