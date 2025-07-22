import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('AddressBar 4px Grid Compliance', () => {
  it('должен использовать CSS переменные согласно 4px сетке', () => {
    const addressBarPath = join(__dirname, '../AddressBar.svelte');
    const addressBarContent = readFileSync(addressBarPath, 'utf-8');

    // Проверяем, что используются CSS переменные для отступов
    expect(addressBarContent).toMatch(/margin:\s*var\(--spacing-xs\)\s*0/);
    expect(addressBarContent).toMatch(/padding:\s*var\(--spacing-sm\)\s*var\(--spacing-xs\)/);
    expect(addressBarContent).toMatch(/padding:\s*0\s*var\(--spacing-sm\)/);
    expect(addressBarContent).toMatch(/padding:\s*var\(--spacing-sm\)/);
    expect(addressBarContent).toMatch(/margin-right:\s*var\(--spacing-xs\)/);
  });

  it('должен использовать стандартные CSS переменные для border-radius', () => {
    const addressBarPath = join(__dirname, '../AddressBar.svelte');
    const addressBarContent = readFileSync(addressBarPath, 'utf-8');

    // Проверяем использование стандартной переменной для border-radius
    expect(addressBarContent).toMatch(/border-radius:\s*var\(--btn-border-radius\)/);
  });

  it('должен иметь правильные отступы согласно 4px сетке', () => {
    const rootPagePath = join(__dirname, '../../../routes/+page.svelte');
    const rootPageContent = readFileSync(rootPagePath, 'utf-8');

    // Проверяем определение CSS переменных для 4px сетки
    expect(rootPageContent).toMatch(/--spacing-xs:\s*4px/);
    expect(rootPageContent).toMatch(/--spacing-sm:\s*8px/);
    expect(rootPageContent).toMatch(/--spacing-md:\s*12px/);
    expect(rootPageContent).toMatch(/--btn-border-radius:\s*8px/);
  });

  it('должен иметь корректную структуру отступов в контейнере', () => {
    const addressBarPath = join(__dirname, '../AddressBar.svelte');
    const addressBarContent = readFileSync(addressBarPath, 'utf-8');

    // Проверяем структуру отступов в address-input-container
    expect(addressBarContent).toMatch(
      /\.address-input-container[\s\S]*?margin:\s*var\(--spacing-xs\)\s*0/
    );

    // Проверяем отступы в input элементе
    expect(addressBarContent).toMatch(
      /\.address-input[\s\S]*?padding:\s*var\(--spacing-sm\)\s*var\(--spacing-xs\)/
    );

    // Проверяем отступы в кнопке
    expect(addressBarContent).toMatch(/\.go-btn[\s\S]*?margin-right:\s*var\(--spacing-xs\)/);
  });
});
