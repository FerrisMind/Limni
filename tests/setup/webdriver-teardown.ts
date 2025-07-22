export default async function globalTeardown() {
  console.log('🛑 Завершение tauri-driver после тестирования...');

  const tauriDriverPid = process.env.TAURI_DRIVER_PID;

  if (tauriDriverPid) {
    try {
      // Завершаем процесс tauri-driver
      if (process.platform === 'win32') {
        // На Windows используем taskkill
        const { spawn } = await import('child_process');
        const killProcess = spawn('taskkill', ['/PID', tauriDriverPid, '/F'], {
          stdio: 'pipe',
        });

        await new Promise((resolve) => {
          killProcess.on('close', () => {
            console.log('✅ tauri-driver успешно завершен');
            resolve(void 0);
          });
        });
      } else {
        // На Unix-системах используем kill
        process.kill(parseInt(tauriDriverPid), 'SIGTERM');
        console.log('✅ tauri-driver успешно завершен');
      }
    } catch (error) {
      console.warn('⚠️  Ошибка при завершении tauri-driver:', error);
    }
  } else {
    console.log('ℹ️  PID tauri-driver не найден');
  }
}
