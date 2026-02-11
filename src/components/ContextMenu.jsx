import { ExternalLink, Eye, Star, Archive, Trash2, FolderOpen } from 'lucide-react';
import { useBookmarkStore } from '../store/useBookmarkStore.js';

export default function ContextMenu({ bookmark, position, onClose }) {
  const { toggleFavorite, toggleArchive, deleteBookmark, moveToCollection, setSelectedBookmark, collections } = useBookmarkStore();

  const handleAction = (fn) => {
    fn();
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg py-1 min-w-[180px]"
        style={{ top: position.y, left: position.x }}
      >
        <button
          onClick={() => handleAction(() => window.open(bookmark.url, '_blank'))}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-150 cursor-pointer"
        >
          <ExternalLink size={14} />
          Open in New Tab
        </button>
        <button
          onClick={() => handleAction(() => setSelectedBookmark(bookmark.id))}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-150 cursor-pointer"
        >
          <Eye size={14} />
          View Details
        </button>
        <button
          onClick={() => handleAction(() => toggleFavorite(bookmark.id))}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-150 cursor-pointer"
        >
          <Star size={14} />
          {bookmark.isFavorite ? 'Unfavorite' : 'Favorite'}
        </button>
        {collections.length > 0 && (
          <div className="border-t border-zinc-100 dark:border-zinc-800 my-1" />
        )}
        {collections.map((col) => (
          <button
            key={col.id}
            onClick={() => handleAction(() => moveToCollection(bookmark.id, col.id))}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-150 cursor-pointer"
          >
            <FolderOpen size={14} />
            {col.name}
          </button>
        ))}
        <div className="border-t border-zinc-100 dark:border-zinc-800 my-1" />
        <button
          onClick={() => handleAction(() => toggleArchive(bookmark.id))}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-150 cursor-pointer"
        >
          <Archive size={14} />
          {bookmark.isArchived ? 'Unarchive' : 'Archive'}
        </button>
        <button
          onClick={() => handleAction(() => deleteBookmark(bookmark.id))}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-150 cursor-pointer"
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>
    </>
  );
}
