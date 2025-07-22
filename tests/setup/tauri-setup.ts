import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { chromium } from '@playwright/test';
import { fileURLToPath } from 'url';

let tauriProcess: ChildProcess | null = null;

export default async function globalSetup() {
  console.log('🚀 Запуск Tauri приложения для E2E тестирования...');

  // Путь к собранному Tauri приложению
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const tauriExePath = path.join(
    __dirname,
    '..',
    '..',
    'src-tauri',
    'target',
    'x86_64-pc-windows-msvc',
    'release',
    'Limni.exe'
  );

  // Проверяем, существует ли файл
  const { existsSync } = await import('fs');
  if (!existsSync(tauriExePath)) {
    console.log('⚠️  Исполняемый файл Tauri не найден. Собираем приложение...');

    // Собираем приложение
    const buildProcess = spawn('npm', ['run', 'tauri', 'build'], {
      stdio: 'inherit',
      shell: true,
      cwd: path.join(__dirname, '..', '..'),
    });

    await new Promise((resolve, reject) => {
      buildProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Tauri приложение успешно собрано');
          resolve(void 0);
        } else {
          reject(new Error(`Сборка завершилась с кодом ${code}`));
        }
      });
    });
  }

  // Запускаем Tauri приложение с remote debugging
  tauriProcess = spawn(tauriExePath, [], {
    env: {
      ...process.env,
      WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: '--remote-debugging-port=9222',
    },
    stdio: 'pipe',
  });

  if (tauriProcess.stdout) {
    tauriProcess.stdout.on('data', (data) => {
      console.log(`Tauri stdout: ${data}`);
    });
  }

  if (tauriProcess.stderr) {
    tauriProcess.stderr.on('data', (data) => {
      console.log(`Tauri stderr: ${data}`);
    });
  }

  // Ждем, пока приложение запустится и remote debugging станет доступен
  console.log('⏳ Ожидание запуска remote debugging порта...');

  let attempts = 0;
  const maxAttempts = 30; // 30 секунд

  while (attempts < maxAttempts) {
    try {
      const browser = await chromium.connectOverCDP('http://localhost:9222');
      const contexts = browser.contexts();
      if (contexts.length > 0) {
        await browser.close();
        console.log('✅ Tauri приложение запущено и готово к тестированию');
        break;
      }
      await browser.close();
    } catch {
      // Продолжаем ожидание
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
    attempts++;
  }

  if (attempts >= maxAttempts) {
    throw new Error('Не удалось подключиться к Tauri приложению через remote debugging');
  }

  // Сохраняем PID процесса для teardown
  if (tauriProcess && tauriProcess.pid) {
    process.env.TAURI_PID = tauriProcess.pid.toString();
  }
}
