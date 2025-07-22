import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
  plugins: [
    svelte({
      hot: !process.env.VITEST,
      compilerOptions: {
        css: 'injected'
      }
    })
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/lib/test-setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/lib/test-setup.ts',
        '**/*.d.ts',
        '**/*.config.*',
        'src-tauri/**'
      ]
    }
  },
  resolve: {
    alias: {
      '$lib': path.resolve('./src/lib'),
      '$app': path.resolve('./node_modules/@sveltejs/kit/src/runtime/app')
    }
  }
});