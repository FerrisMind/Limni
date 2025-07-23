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
    expect(addressBarContent).toMatch(/margin:\s*var\(--spacing-4px\)\s*0/);
    expect(addressBarContent).toMatch(/padding:\s*var\(--spacing-8px\)\s*var\(--spacing-4px\)/);
    expect(addressBarContent).toMatch(/padding:\s*0\s*var\(--spacing-8px\)/);
    expect(addressBarContent).toMatch(/padding:\s*var\(--spacing-8px\)/);
    expect(addressBarContent).toMatch(/margin-right:\s*var\(--spacing-4px\)/);
  });

  it('должен использовать стандартные CSS переменные для border-radius', () => {
    const addressBarPath = join(__dirname, '../AddressBar.svelte');
    const addressBarContent = readFileSync(addressBarPath, 'utf-8');

    // Проверяем использование стандартной переменной для border-radius
    expect(addressBarContent).toMatch(/border-radius:\s*var\(--input-border-radius-4px\)/);
    expect(addressBarContent).toMatch(/border-radius:\s*var\(--button-border-radius-8px\)/);
  });

  it('должен иметь правильные отступы согласно 4px сетке', () => {
    const rootPagePath = join(__dirname, '../../../routes/+page.svelte');
    const rootPageContent = readFileSync(rootPagePath, 'utf-8');

    // Проверяем определение CSS переменных для 4px сетки
    expect(rootPageContent).toMatch(/--spacing-4px:\s*4px/);
    expect(rootPageContent).toMatch(/--spacing-8px:\s*8px/);
    expect(rootPageContent).toMatch(/--spacing-12px:\s*12px/);
  });

  it('должен иметь корректную структуру отступов в контейнере', () => {
    const addressBarPath = join(__dirname, '../AddressBar.svelte');
    const addressBarContent = readFileSync(addressBarPath, 'utf-8');

    // Проверяем структуру отступов в address-input-container
    expect(addressBarContent).toMatch(
      /\.address-input-container[\s\S]*?margin:\s*var\(--spacing-4px\)\s*0;/
    );
  });

  it('должен иметь корректные отступы в input элементе', () => {
    const addressBarPath = join(__dirname, '../AddressBar.svelte');
    const addressBarContent = readFileSync(addressBarPath, 'utf-8');

    // Проверяем отступы в input элементе
    expect(addressBarContent).toMatch(
      /\.address-input[\s\S]*?padding:\s*var\(--spacing-8px\)\s*var\(--spacing-4px\);/
    );
  });
});
