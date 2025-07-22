import { spawn, ChildProcess } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

let tauriDriverProcess: ChildProcess | null = null;

export default async function globalSetup() {
  console.log('🚀 Запуск tauri-driver для WebDriver тестирования...');

  // Проверяем, установлен ли tauri-driver
  try {
    const { execSync } = await import('child_process');
    execSync('tauri-driver --version', { stdio: 'pipe' });
    console.log('✅ tauri-driver найден');
  } catch {
    console.error('❌ tauri-driver не найден. Установите его командой:');
    console.error('cargo install tauri-driver');
    process.exit(1);
  }

  // Путь к собранному приложению
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
    const { execSync } = await import('child_process');
    execSync('npm run tauri:build', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..', '..'),
    });

    console.log('✅ Tauri приложение успешно собрано');
  }

  // Запускаем tauri-driver
  tauriDriverProcess = spawn(
    'tauri-driver',
    [
      '--port',
      '4444',
      '--native-driver',
      'msedgedriver.exe', // Для Windows
      tauriExePath,
    ],
    {
      stdio: 'pipe',
    }
  );

  if (tauriDriverProcess.stdout) {
    tauriDriverProcess.stdout.on('data', (data) => {
      console.log(`tauri-driver stdout: ${data}`);
    });
  }

  if (tauriDriverProcess.stderr) {
    tauriDriverProcess.stderr.on('data', (data) => {
      console.log(`tauri-driver stderr: ${data}`);
    });
  }

  // Ждем, пока tauri-driver запустится
  console.log('⏳ Ожидание запуска tauri-driver...');

  let attempts = 0;
  const maxAttempts = 30; // 30 секунд

  while (attempts < maxAttempts) {
    try {
      const http = await import('http');
      await new Promise((resolve, reject) => {
        const req = http.get('http://localhost:4444/status', (res) => {
          resolve(res);
        });
        req.on('error', reject);
        req.setTimeout(1000, () => {
          req.destroy();
          reject(new Error('Timeout'));
        });
      });

      console.log('✅ tauri-driver запущен и готов к тестированию');
      break;
    } catch {
      // Продолжаем ожидание
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
    attempts++;
  }

  if (attempts >= maxAttempts) {
    throw new Error('Не удалось подключиться к tauri-driver');
  }

  // Сохраняем PID процесса для teardown
  if (tauriDriverProcess && tauriDriverProcess.pid) {
    process.env.TAURI_DRIVER_PID = tauriDriverProcess.pid.toString();
  }
}
