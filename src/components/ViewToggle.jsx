import { Grid3X3, List } from 'lucide-react';
import { useBookmarkStore } from '../store/useBookmarkStore.js';

export default function ViewToggle() {
  const { viewMode, setViewMode } = useBookmarkStore();

  return (
    <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
      <button
        onClick={() => setViewMode('grid')}
        className={`p-1.5 rounded-md transition-colors duration-150 cursor-pointer ${
          viewMode === 'grid'
            ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-50'
            : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
        }`}
        title="Grid view"
      >
        <Grid3X3 size={14} />
      </button>
      <button
        onClick={() => setViewMode('list')}
        className={`p-1.5 rounded-md transition-colors duration-150 cursor-pointer ${
          viewMode === 'list'
            ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-50'
            : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
        }`}
        title="List view"
      >
        <List size={14} />
      </button>
    </div>
  );
}
