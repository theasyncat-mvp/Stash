import { useState } from 'react';
import { Trash2, Archive, Tag, FolderOpen, X, CheckSquare, Square } from 'lucide-react';
import { useBookmarkStore } from '../store/useBookmarkStore.js';

export default function BulkActionBar() {
  const {
    selectedIds, bulkMode, toggleBulkMode, selectAll, deselectAll,
    bulkDelete, bulkArchive, bulkTag, bulkMoveToCollection, collections,
  } = useBookmarkStore();
  const [tagInput, setTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [showCollections, setShowCollections] = useState(false);

  if (!bulkMode) return null;

  const count = selectedIds.size;

  const handleTagSubmit = (e) => {
    e.preventDefault();
    const tag = tagInput.trim().toLowerCase();
    if (tag) {
      bulkTag(tag);
      setTagInput('');
      setShowTagInput(false);
    }
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-500/10 border-b border-blue-100 dark:border-blue-900 animate-fadeIn">
      <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
        {count} selected
      </span>
      <div className="flex-1" />

      <button onClick={selectAll} className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
        Select all
      </button>
      <button onClick={deselectAll} className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
        Deselect
      </button>

      <div className="w-px h-4 bg-blue-200 dark:bg-blue-800 mx-1" />

      <button
        onClick={() => bulkArchive()}
        disabled={count === 0}
        className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-white/50 dark:hover:bg-zinc-800 rounded-md transition-colors duration-150 cursor-pointer disabled:opacity-30"
        title="Archive selected"
      >
        <Archive size={13} />
        Archive
      </button>

      <div className="relative">
        <button
          onClick={() => { setShowTagInput(!showTagInput); setShowCollections(false); }}
          disabled={count === 0}
          className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-white/50 dark:hover:bg-zinc-800 rounded-md transition-colors duration-150 cursor-pointer disabled:opacity-30"
        >
          <Tag size={13} />
          Tag
        </button>
        {showTagInput && (
          <form onSubmit={handleTagSubmit} className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg p-2 w-48">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Tag name..."
              autoFocus
              className="w-full px-2 py-1 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded outline-none text-zinc-900 dark:text-zinc-100"
            />
          </form>
        )}
      </div>

      <div className="relative">
        <button
          onClick={() => { setShowCollections(!showCollections); setShowTagInput(false); }}
          disabled={count === 0}
          className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-white/50 dark:hover:bg-zinc-800 rounded-md transition-colors duration-150 cursor-pointer disabled:opacity-30"
        >
          <FolderOpen size={13} />
          Move
        </button>
        {showCollections && collections.length > 0 && (
          <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg py-1 w-48">
            {collections.map((col) => (
              <button
                key={col.id}
                onClick={() => { bulkMoveToCollection(col.id); setShowCollections(false); }}
                className="w-full text-left px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                {col.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => bulkDelete()}
        disabled={count === 0}
        className="flex items-center gap-1 px-2 py-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors duration-150 cursor-pointer disabled:opacity-30"
        title="Delete selected"
      >
        <Trash2 size={13} />
        Delete
      </button>

      <div className="w-px h-4 bg-blue-200 dark:bg-blue-800 mx-1" />

      <button
        onClick={toggleBulkMode}
        className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer"
        title="Exit bulk mode"
      >
        <X size={14} />
      </button>
    </div>
  );
}
