import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Star, Archive, ExternalLink, Trash2, Clock, GripVertical } from 'lucide-react';
import { open as shellOpen } from '@tauri-apps/plugin-shell';
import { useBookmarkStore } from '../store/useBookmarkStore.js';
import { timeAgo } from '../lib/timeAgo.js';
import ContextMenu from './ContextMenu.jsx';

export default function BookmarkRow({ bookmark, isFocused }) {
  const { setSelectedBookmark, toggleFavorite, toggleArchive, deleteBookmark, bulkMode, selectedIds, toggleSelected } = useBookmarkStore();
  const [contextMenu, setContextMenu] = useState(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: bookmark.id,
    data: { type: 'bookmark', bookmark },
  });

  const domain = (() => {
    try { return new URL(bookmark.url).hostname.replace('www.', ''); }
    catch { return bookmark.url; }
  })();

  const isSelected = selectedIds.has(bookmark.id);

  const handleClick = () => {
    if (bulkMode) {
      toggleSelected(bookmark.id);
    } else {
      setSelectedBookmark(bookmark.id);
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    if (!bulkMode) setContextMenu({ x: e.clientX, y: e.clientY });
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
          opacity: isDragging ? 0.4 : 1,
        }}
        className={`group flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-pointer transition-colors duration-150 ${
          isSelected
            ? 'bg-blue-50 dark:bg-blue-500/10'
            : isFocused
              ? 'bg-zinc-100 dark:bg-zinc-800 ring-1 ring-blue-400/50 dark:ring-blue-500/40'
              : 'hover:bg-zinc-50 dark:hover:bg-zinc-900'
        }`}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        {...attributes}
      >
        {/* Drag handle */}
        {!bulkMode && (
          <div
            {...listeners}
            className="text-zinc-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 hover:text-zinc-500 dark:hover:text-zinc-400 cursor-grab active:cursor-grabbing shrink-0 transition-opacity duration-150"
            aria-label="Drag to reorder"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical size={14} aria-hidden="true" />
          </div>
        )}
        {bulkMode && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleSelected(bookmark.id)}
            className="checkbox-custom shrink-0"
            aria-label={`Select ${bookmark.title || bookmark.url}`}
            onClick={(e) => e.stopPropagation()}
          />
        )}

        {!bulkMode && !bookmark.isRead && (
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
        )}
        {!bulkMode && bookmark.isRead && <span className="w-1.5 shrink-0" />}

        {bookmark.favicon ? (
          <img src={bookmark.favicon} alt="" className="w-4 h-4 rounded-sm shrink-0" onError={(e) => { e.target.style.display = 'none'; }} />
        ) : (
          <span className="w-4 h-4 shrink-0" />
        )}

        {bookmark.isFavorite && (
          <Star size={12} className="text-yellow-500 shrink-0" fill="currentColor" />
        )}

        <span className={`text-sm flex-1 truncate ${bookmark.isRead ? 'font-medium text-zinc-700 dark:text-zinc-300' : 'font-semibold text-zinc-900 dark:text-zinc-50'}`}>
          {bookmark._loading ? (
            <span className="inline-block w-48 h-4 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse align-middle" />
          ) : bookmark.title}
        </span>

        <span className="text-xs text-zinc-400 dark:text-zinc-500 w-32 truncate hidden sm:block">{domain}</span>

        <div className="hidden items-center gap-1 md:flex">
          {bookmark.tags?.slice(0, 2).map((tag) => (
            <span key={tag} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs px-2 py-0.5 rounded-full">{tag}</span>
          ))}
          {bookmark.tags?.length > 2 && (
            <span className="text-xs text-zinc-400 dark:text-zinc-500">+{bookmark.tags.length - 2}</span>
          )}
        </div>

        {bookmark.readingTime > 0 && (
          <span className="hidden items-center gap-0.5 text-[10px] text-zinc-300 dark:text-zinc-600 shrink-0 lg:flex">
            <Clock size={9} />{bookmark.readingTime}m
          </span>
        )}

        <span className="text-xs text-zinc-400 dark:text-zinc-500 shrink-0 w-16 text-right">{timeAgo(bookmark.createdAt)}</span>

        {!bulkMode && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <button
              onClick={(e) => { e.stopPropagation(); toggleFavorite(bookmark.id); }}
              className={`p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-150 cursor-pointer ${bookmark.isFavorite ? 'text-yellow-500' : 'text-zinc-400'}`}
              aria-label={bookmark.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star size={14} fill={bookmark.isFavorite ? 'currentColor' : 'none'} aria-hidden="true" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); toggleArchive(bookmark.id); }}
              className="p-1 rounded-md text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600 transition-colors duration-150 cursor-pointer"
              aria-label={bookmark.isArchived ? 'Unarchive' : 'Archive'}
            >
              <Archive size={14} aria-hidden="true" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); shellOpen(bookmark.url); }}
              className="p-1 rounded-md text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600 transition-colors duration-150 cursor-pointer"
              aria-label="Open in browser"
            >
              <ExternalLink size={14} aria-hidden="true" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); deleteBookmark(bookmark.id); }}
              className="p-1 rounded-md text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-red-500 transition-colors duration-150 cursor-pointer"
              aria-label="Delete bookmark"
            >
              <Trash2 size={14} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {contextMenu && (
        <ContextMenu bookmark={bookmark} position={contextMenu} onClose={() => setContextMenu(null)} />
      )}
    </>
  );
}
