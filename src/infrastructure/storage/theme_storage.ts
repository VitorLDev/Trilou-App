import Storage from 'expo-sqlite/kv-store';
import type { ThemeMode } from '@/theme/theme';

const themeKey = 'trilou-theme-mode';

export function readStoredThemeMode(): ThemeMode {
  try {
    const stored = Storage.getItemSync(themeKey);
    return stored === 'light' || stored === 'dark' ? stored : 'dark';
  } catch {
    return 'dark';
  }
}

export function storeThemeMode(mode: ThemeMode): void {
  try {
    Storage.setItemSync(themeKey, mode);
  } catch {
    // O tema continua alternável mesmo se a persistência local falhar.
  }
}