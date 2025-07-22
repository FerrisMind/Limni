export default async function globalTeardown() {
  console.log('🛑 Завершение Tauri приложения после тестирования...');

  const tauriPid = process.env.TAURI_PID;

  if (tauriPid) {
    try {
      // Завершаем процесс Tauri приложения
      if (process.platform === 'win32') {
        // На Windows используем taskkill
        const { spawn } = await import('child_process');
        const killProcess = spawn('taskkill', ['/PID', tauriPid, '/F'], {
          stdio: 'pipe',
        });

        await new Promise((resolve) => {
          killProcess.on('close', () => {
            console.log('✅ Tauri приложение успешно завершено');
            resolve(void 0);
          });
        });
      } else {
        // На Unix-системах используем kill
        process.kill(parseInt(tauriPid), 'SIGTERM');
        console.log('✅ Tauri приложение успешно завершено');
      }
    } catch (error) {
      console.warn('⚠️  Ошибка при завершении Tauri приложения:', error);
    }
  } else {
    console.log('ℹ️  PID Tauri приложения не найден');
  }
}
