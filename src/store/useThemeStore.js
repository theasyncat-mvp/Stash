import { create } from 'zustand';

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

const saved = typeof window !== 'undefined' ? localStorage.getItem('stash-theme') || 'system' : 'system';
applyTheme(saved);

export const useThemeStore = create((set) => ({
  theme: saved,
  setTheme: (theme) => {
    localStorage.setItem('stash-theme', theme);
    applyTheme(theme);
    set({ theme });
  },
}));
