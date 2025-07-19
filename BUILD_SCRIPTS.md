# Скрипты сборки Zephyrox Browser

Набор batch скриптов для удобной сборки и запуска приложения.

## 📜 Доступные скрипты

### 🚀 `dev.bat` - Запуск в режиме разработки
Запускает приложение в режиме разработки с hot reload.

```batch
dev.bat
```

**Функции:**
- Автоматическая установка зависимостей
- Запуск `npm run tauri dev`
- Обработка ошибок

### ⚡ `quick-build.bat` - Быстрая сборка
Простая сборка только для Windows.

```batch
quick-build.bat
```

**Что делает:**
- Устанавливает зависимости
- Собирает фронтенд
- Собирает Tauri приложение для Windows

### 🏗️ `build-all.bat` - Полная сборка
Интерактивный скрипт с несколькими режимами сборки.

```batch
build-all.bat
```

**Режимы:**
1. **Быстрая сборка** - только для Windows
2. **Полная сборка** - с инструкциями для всех платформ
3. **GitHub Actions** - настройка автоматической сборки
4. **Отмена**

## 🖥️ Сборка для разных платформ

### Windows (текущая система)
```batch
quick-build.bat
```

### macOS
1. Перенесите проект на macOS
2. Установите зависимости:
   ```bash
   npm install
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```
3. Соберите:
   ```bash
   npm run tauri build
   ```

### Linux
1. Установите системные зависимости:
   ```bash
   sudo apt update
   sudo apt install libwebkit2gtk-4.0-dev build-essential curl wget libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev
   ```
2. Установите Rust:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```
3. Соберите проект:
   ```bash
   npm install && npm run tauri build
   ```

## 🤖 Автоматическая сборка (GitHub Actions)

Запустите `build-all.bat` и выберите опцию 3 для настройки GitHub Actions.

**Преимущества:**
- Автоматическая сборка для всех платформ
- Создание релизов при создании тегов
- Удобная загрузка артефактов

**Использование:**
1. Создайте тег: `git tag v1.0.0`
2. Отправьте в репозиторий: `git push origin v1.0.0`
3. GitHub соберет приложения для всех платформ

## 📁 Расположение файлов после сборки

Готовые файлы находятся в:
```
src-tauri/target/release/bundle/
├── msi/          # Windows Installer
├── nsis/         # Windows NSIS Installer  
└── (другие форматы в зависимости от платформы)
```

## ⚠️ Требования

- **Node.js** версии 18+
- **Rust** (устанавливается автоматически Tauri CLI)
- **npm** или **yarn**

## 🔧 Устранение неполадок

### Ошибка установки зависимостей
```batch
npm cache clean --force
npm install
```

### Ошибка сборки Rust
```batch
rustup update
```

### Ошибка сборки Tauri
Убедитесь что установлены все системные зависимости для вашей платформы.

## 📝 Примечания

- Кросс-платформенная сборка напрямую невозможна в Tauri
- Каждая платформа требует собственной среды сборки
- Рекомендуется использовать GitHub Actions для автоматизации 