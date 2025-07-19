@echo off
echo ====================================
echo    Сборка Zephyrox Browser
echo ====================================

cd /d "%~dp0"

echo Текущая платформа: Windows
echo.

:menu
echo Выберите режим сборки:
echo 1. Быстрая сборка (только Windows)
echo 2. Полная сборка с подготовкой для всех платформ
echo 3. Сборка с GitHub Actions
echo 4. Отмена
echo.
set /p choice="Ваш выбор (1-4): "

if "%choice%"=="1" goto windows_build
if "%choice%"=="2" goto full_build
if "%choice%"=="3" goto github_setup
if "%choice%"=="4" goto end
echo Неверный выбор!
goto menu

:windows_build
echo.
echo ====================================
echo     Сборка для Windows
echo ====================================

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

echo Сборка фронтенда...
npm run build
if errorlevel 1 (
    echo Ошибка при сборке фронтенда!
    pause
    exit /b 1
)

echo Сборка Tauri приложения для Windows...
npm run tauri build
if errorlevel 1 (
    echo Ошибка при сборке Tauri приложения!
    pause
    exit /b 1
)

echo.
echo ✅ Сборка для Windows завершена!
echo Файлы находятся в: src-tauri\target\release\bundle\
goto end

:full_build
echo.
echo ====================================
echo   Подготовка для всех платформ
echo ====================================

echo 📋 Сборка для всех платформ требует:
echo.
echo 🖥️  Windows: текущая система
echo 🍎  macOS: требуется macOS система
echo 🐧  Linux: требуется Linux система или Docker
echo.

echo Сначала собираем для Windows...
call :windows_build_silent

echo.
echo 📦 Для сборки на других платформах:
echo.
echo === macOS ===
echo 1. Перенесите проект на macOS
echo 2. Установите: npm install
echo 3. Установите Rust: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
echo 4. Выполните: npm run tauri build
echo.
echo === Linux ===
echo 1. Перенесите проект на Linux
echo 2. Установите зависимости: sudo apt update ^&^& sudo apt install libwebkit2gtk-4.0-dev build-essential curl wget libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev
echo 3. Установите Rust: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
echo 4. Выполните: npm install ^&^& npm run tauri build
echo.
echo 💡 Рекомендуется использовать GitHub Actions для автоматической сборки!
goto end

:github_setup
echo.
echo ====================================
echo     GitHub Actions Setup
echo ====================================

if not exist .github mkdir .github
if not exist .github\workflows mkdir .github\workflows

echo Создание конфигурации GitHub Actions...
(
echo name: Build and Release
echo.
echo on:
echo   push:
echo     tags:
echo       - 'v*'
echo   workflow_dispatch:
echo.
echo jobs:
echo   build:
echo     strategy:
echo       matrix:
echo         platform: [windows-latest, ubuntu-20.04, macos-latest]
echo.
echo     runs-on: ${{ matrix.platform }}
echo.
echo     steps:
echo       - uses: actions/checkout@v4
echo.
echo       - name: Setup Node.js
echo         uses: actions/setup-node@v4
echo         with:
echo           node-version: '20'
echo           cache: 'npm'
echo           cache-dependency-path: browser/package-lock.json
echo.
echo       - name: Install Rust
echo         uses: dtolnay/rust-toolchain@stable
echo.
echo       - name: Install dependencies (Ubuntu)
echo         if: matrix.platform == 'ubuntu-20.04'
echo         run: ^|
echo           sudo apt update
echo           sudo apt install libwebkit2gtk-4.0-dev build-essential curl wget libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev
echo.
echo       - name: Install frontend dependencies
echo         working-directory: ./browser
echo         run: npm ci
echo.
echo       - name: Build frontend
echo         working-directory: ./browser
echo         run: npm run build
echo.
echo       - name: Build Tauri app
echo         working-directory: ./browser
echo         run: npm run tauri build
echo.
echo       - name: Upload artifacts
echo         uses: actions/upload-artifact@v4
echo         with:
echo           name: app-${{ matrix.platform }}
echo           path: ^|
echo             browser/src-tauri/target/release/bundle/
) > .github\workflows\build.yml

echo.
echo ✅ GitHub Actions конфигурация создана!
echo.
echo 📋 Следующие шаги:
echo 1. Закоммитьте файл .github/workflows/build.yml
echo 2. Создайте тег версии: git tag v1.0.0
echo 3. Отправьте в репозиторий: git push origin v1.0.0
echo 4. GitHub автоматически соберет для всех платформ!
goto end

:windows_build_silent
echo Установка зависимостей...
npm install >nul 2>&1
echo Сборка фронтенда...
npm run build >nul 2>&1
echo Сборка Tauri приложения...
npm run tauri build >nul 2>&1
echo ✅ Windows сборка завершена
exit /b 0

:end
echo.
pause 