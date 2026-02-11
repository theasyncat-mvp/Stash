import { useEffect } from 'react';
import { useBookmarkStore } from './store/useBookmarkStore.js';
import { useFeedStore } from './store/useFeedStore.js';
import Layout from './components/Layout.jsx';

export default function App() {
  const loadAll = useBookmarkStore((s) => s.loadAll);
  const loaded = useBookmarkStore((s) => s.loaded);
  const loadFeeds = useFeedStore((s) => s.loadFeeds);

  useEffect(() => {
    loadAll();
    loadFeeds();
  }, [loadAll, loadFeeds]);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#FAFAFA] dark:bg-zinc-950">
        <div className="text-sm text-zinc-400 dark:text-zinc-500">Loading...</div>
      </div>
    );
  }

  return <Layout />;
}
