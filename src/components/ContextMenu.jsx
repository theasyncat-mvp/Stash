import { useEffect, useRef, useCallback } from 'react';
import { ExternalLink, Eye, Star, Archive, Trash2, FolderOpen } from 'lucide-react';
import { open as shellOpen } from '@tauri-apps/plugin-shell';
import { useBookmarkStore } from '../store/useBookmarkStore.js';

export default function ContextMenu({ bookmark, position, onClose }) {
  const { toggleFavorite, toggleArchive, deleteBookmark, moveToCollection, setSelectedBookmark, collections } = useBookmarkStore();
  const menuRef = useRef(null);

  const handleAction = useCallback((fn) => {
    fn();
    onClose();
  }, [onClose]);

  // Focus first menu item on mount
  useEffect(() => {
    const firstItem = menuRef.current?.querySelector('[role="menuitem"]');
    if (firstItem) firstItem.focus();
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const menu = menuRef.current;
    const handler = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const items = Array.from(menu?.querySelectorAll('[role="menuitem"]') ?? []);
        const idx = items.indexOf(document.activeElement);
        if (e.key === 'ArrowDown') items[(idx + 1) % items.length]?.focus();
        else items[(idx - 1 + items.length) % items.length]?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Clamp position to viewport
  const style = {
    top: Math.min(position.y, window.innerHeight - 260),
    left: Math.min(position.x, window.innerWidth - 200),
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        ref={menuRef}
        role="menu"
        aria-label="Bookmark actions"
        className="fixed z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg py-1min-w-[180px]"
        style={style}
      >
        <button
          role="menuitem"
          tabIndex={-1}
          onClick={() => handleAction(() => shellOpen(bookmark.url))}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:bg-zinc-100 dark:focus:bg-zinc-800 focus:outline-none transition-colors duration-150 cursor-pointer"
        >
          <ExternalLink size={14} aria-hidden="true" />
          Open in New Tab
        </button>
        <button
          role="menuitem"
          tabIndex={-1}
          onClick={() => handleAction(() => setSelectedBookmark(bookmark.id))}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:bg-zinc-100 dark:focus:bg-zinc-800 focus:outline-none transition-colors duration-150 cursor-pointer"
        >
          <Eye size={14} aria-hidden="true" />
          View Details
        </button>
        <button
          role="menuitem"
          tabIndex={-1}
          onClick={() => handleAction(() => toggleFavorite(bookmark.id))}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:bg-zinc-100 dark:focus:bg-zinc-800 focus:outline-none transition-colors duration-150 cursor-pointer"
        >
          <Star size={14} aria-hidden="true" />
          {bookmark.isFavorite ? 'Unfavorite' : 'Favorite'}
        </button>
        {collections.length > 0 && (
          <div className="border-t border-zinc-100 dark:border-zinc-800 my-1" role="separator" />
        )}
        {collections.map((col) => (
          <button
            key={col.id}
            role="menuitem"
            tabIndex={-1}
            onClick={() => handleAction(() => moveToCollection(bookmark.id, col.id))}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:bg-zinc-100 dark:focus:bg-zinc-800 focus:outline-none transition-colors duration-150 cursor-pointer"
          >
            <FolderOpen size={14} aria-hidden="true" />
            {col.name}
          </button>
        ))}
        <div className="border-t border-zinc-100 dark:border-zinc-800 my-1" role="separator" />
        <button
          role="menuitem"
          tabIndex={-1}
          onClick={() => handleAction(() => toggleArchive(bookmark.id))}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:bg-zinc-100 dark:focus:bg-zinc-800 focus:outline-none transition-colors duration-150 cursor-pointer"
        >
          <Archive size={14} aria-hidden="true" />
          {bookmark.isArchived ? 'Unarchive' : 'Archive'}
        </button>
        <button
          role="menuitem"
          tabIndex={-1}
          onClick={() => handleAction(() => deleteBookmark(bookmark.id))}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:bg-zinc-100 dark:focus:bg-zinc-800 focus:outline-none transition-colors duration-150 cursor-pointer"
        >
          <Trash2 size={14} aria-hidden="true" />
          Delete
        </button>
      </div>
    </>
  );
}
