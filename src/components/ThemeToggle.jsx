import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore } from '../store/useThemeStore.js';

export default function ThemeToggle() {
  const { theme, setTheme } = useThemeStore();

  const next = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  return (
    <button
      onClick={next}
      className="flex items-center gap-2 px-2 py-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors duration-150 cursor-pointer"
      aria-label={`Theme: ${theme}. Click to change.`}
    >
      {theme === 'light' && <Sun size={14} aria-hidden="true" />}
      {theme === 'dark' && <Moon size={14} aria-hidden="true" />}
      {theme === 'system' && <Monitor size={14} aria-hidden="true" />}
      <span className="capitalize">{theme}</span>
    </button>
  );
}
