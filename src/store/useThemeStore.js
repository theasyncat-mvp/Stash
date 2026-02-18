import { create } from 'zustand';
import { loadTheme, saveTheme } from '../lib/storage.js';

const THEME_LS_KEY = 'stash-theme';

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
  // Keep localStorage in sync so the inline <script> in index.html
  // can read it on next load to prevent flash of wrong theme.
  try { localStorage.setItem(THEME_LS_KEY, theme); } catch { /* ignore */ }
}

// Apply system default immediately to avoid flash
applyTheme('system');

// Listen for OS-level theme changes so 'system' reacts in real-time
const mql = window.matchMedia('(prefers-color-scheme: dark)');
mql.addEventListener('change', () => {
  const current = useThemeStore.getState().theme;
  if (current === 'system') applyTheme('system');
});

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
