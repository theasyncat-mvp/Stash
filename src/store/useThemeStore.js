import { create } from 'zustand';
import { loadTheme, saveTheme } from '../lib/storage.js';

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else if (theme === 'light') {
    root.classList.remove('dark');
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  }
}

// Apply system default immediately to avoid flash
applyTheme('system');

export const useThemeStore = create((set) => ({
  theme: 'system',
  initTheme: async () => {
    const theme = await loadTheme();
    applyTheme(theme);
    set({ theme });
  },
  setTheme: async (theme) => {
    await saveTheme(theme);
    applyTheme(theme);
    set({ theme });
  },
}));
