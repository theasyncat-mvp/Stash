import { FolderOpen, Plus, Trash2 } from 'lucide-react';
import { useBookmarkStore } from '../store/useBookmarkStore.js';

export default function CollectionList({ onAddCollection }) {
  const { collections, bookmarks, activeView, setActiveView, deleteCollection } = useBookmarkStore();

  const getCount = (collectionId) => {
    return bookmarks.filter((b) => b.collectionId === collectionId).length;
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (confirm('Delete this collection? Bookmarks will become uncollected.')) {
      deleteCollection(id);
      if (activeView === `collection:${id}`) {
        setActiveView('all');
      }
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between px-3 mb-2">
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Collections</span>
        <button
          onClick={onAddCollection}
          className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-md transition-colors duration-150 cursor-pointer"
          title="New collection"
        >
          <Plus size={12} />
        </button>
      </div>
      {collections.map((col) => {
        const count = getCount(col.id);
        const isActive = activeView === `collection:${col.id}`;
        return (
          <button
            key={col.id}
            onClick={() => setActiveView(`collection:${col.id}`)}
            className={`group w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-left transition-colors duration-150 cursor-pointer ${
              isActive
                ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800'
            }`}
          >
            <FolderOpen size={14} className="shrink-0" />
            <span className="text-sm truncate flex-1">{col.name}</span>
            <span className="text-xs text-zinc-400 dark:text-zinc-500">{count}</span>
            <button
              onClick={(e) => handleDelete(e, col.id)}
              className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-400 hover:text-red-500 transition-all duration-150 cursor-pointer"
            >
              <Trash2 size={12} />
            </button>
          </button>
        );
      })}
      {collections.length === 0 && (
        <p className="px-3 text-xs text-zinc-400 dark:text-zinc-500">No collections yet</p>
      )}
    </div>
  );
}
