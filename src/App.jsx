import { useEffect } from 'react';
import { useBookmarkStore } from './store/useBookmarkStore.js';
import { useFeedStore } from './store/useFeedStore.js';
import { useThemeStore } from './store/useThemeStore.js';
import Layout from './components/Layout.jsx';

export default function App() {
  const loadAll = useBookmarkStore((s) => s.loadAll);
  const loaded = useBookmarkStore((s) => s.loaded);
  const loadFeeds = useFeedStore((s) => s.loadFeeds);
  const initTheme = useThemeStore((s) => s.initTheme);

  useEffect(() => {
    loadAll();
    loadFeeds();
    initTheme();
  }, [loadAll, loadFeeds, initTheme]);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#FAFAFA] dark:bg-zinc-950">
        <div className="text-sm text-zinc-400 dark:text-zinc-500">Loading...</div>
      </div>
    );
  }

  return <Layout />;
}
