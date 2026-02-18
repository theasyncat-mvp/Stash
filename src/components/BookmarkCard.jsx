import { useState } from 'react';
import { Globe, Star, Archive, ExternalLink, Trash2, Clock } from 'lucide-react';
import { open as shellOpen } from '@tauri-apps/plugin-shell';
import { useBookmarkStore } from '../store/useBookmarkStore.js';
import { timeAgo } from '../lib/timeAgo.js';
import ContextMenu from './ContextMenu.jsx';

export default function BookmarkCard({ bookmark }) {
  const { setSelectedBookmark, toggleFavorite, toggleArchive, deleteBookmark, bulkMode, selectedIds, toggleSelected } = useBookmarkStore();
  const [contextMenu, setContextMenu] = useState(null);

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
        className={`group relative bg-white dark:bg-zinc-900 border rounded-xl overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer ${
          isSelected
            ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/20'
            : 'border-zinc-200 dark:border-zinc-800'
        }`}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {bulkMode && (
          <div className="absolute top-2 left-2 z-10">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleSelected(bookmark.id)}
              className="checkbox-custom"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {bookmark.ogImage ? (
          <div className="h-36 overflow-hidden bg-zinc-50 dark:bg-zinc-800/50">
            <img
              src={bookmark.ogImage}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => { e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-zinc-300 dark:text-zinc-600"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg></div>'; }}
            />
          </div>
        ) : (
          <div className="h-36 bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-center">
            {bookmark.favicon ? (
              <img src={bookmark.favicon} alt="" className="w-8 h-8 opacity-40" onError={(e) => { e.target.replaceWith(Object.assign(document.createElement('span'), { innerHTML: '' })); }} />
            ) : (
              <Globe size={24} className="text-zinc-300 dark:text-zinc-600" />
            )}
          </div>
        )}

        <div className="p-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            {bookmark.favicon && (
              <img src={bookmark.favicon} alt="" className="w-4 h-4 rounded-sm shrink-0" onError={(e) => { e.target.style.display = 'none'; }} />
            )}
            <span className="text-xs text-zinc-400 dark:text-zinc-500 truncate">{domain}</span>
            {bookmark.readingTime > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-zinc-300 dark:text-zinc-600 shrink-0">
                <Clock size={9} />{bookmark.readingTime}m
              </span>
            )}
            <span className="text-xs text-zinc-300 dark:text-zinc-600 ml-auto shrink-0">{timeAgo(bookmark.createdAt)}</span>
          </div>

          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50 line-clamp-2 mb-1">
            {bookmark._loading ? (
              <span className="inline-block w-3/4 h-4 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
            ) : bookmark.title}
          </h3>

          {bookmark.description && !bookmark._loading && (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 line-clamp-2 mb-2">{bookmark.description}</p>
          )}
          {bookmark._loading && (
            <div className="space-y-1 mb-2">
              <span className="inline-block w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
              <span className="inline-block w-2/3 h-3 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
            </div>
          )}

          {bookmark.tags && bookmark.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {bookmark.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs px-2 py-0.5 rounded-full">{tag}</span>
              ))}
              {bookmark.tags.length > 3 && (
                <span className="text-xs text-zinc-400 dark:text-zinc-500">+{bookmark.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>

        {!bulkMode && (
          <div className="absolute bottom-2 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <button
              onClick={(e) => { e.stopPropagation(); toggleFavorite(bookmark.id); }}
              className={`p-1.5 rounded-md bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm hover:bg-white dark:hover:bg-zinc-800 transition-colors duration-150 cursor-pointer ${bookmark.isFavorite ? 'text-yellow-500' : 'text-zinc-400'}`}
            >
              <Star size={13} fill={bookmark.isFavorite ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); toggleArchive(bookmark.id); }}
              className="p-1.5 rounded-md text-zinc-400 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm hover:bg-white dark:hover:bg-zinc-800 hover:text-zinc-600 transition-colors duration-150 cursor-pointer"
            >
              <Archive size={13} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); shellOpen(bookmark.url); }}
              className="p-1.5 rounded-md text-zinc-400 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm hover:bg-white dark:hover:bg-zinc-800 hover:text-zinc-600 transition-colors duration-150 cursor-pointer"
            >
              <ExternalLink size={13} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); deleteBookmark(bookmark.id); }}
              className="p-1.5 rounded-md text-zinc-400 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm hover:bg-white dark:hover:bg-zinc-800 hover:text-red-500 transition-colors duration-150 cursor-pointer"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}

        {bookmark.isFavorite && !bulkMode && (
          <div className="absolute top-2 right-2">
            <Star size={12} className="text-yellow-500" fill="currentColor" />
          </div>
        )}
      </div>

      {contextMenu && (
        <ContextMenu bookmark={bookmark} position={contextMenu} onClose={() => setContextMenu(null)} />
      )}
    </>
  );
}
