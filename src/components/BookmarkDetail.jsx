import { useState, useEffect, useRef } from 'react';
import { X, Star, Archive, Trash2, ExternalLink, Eye, BookmarkCheck, Copy, Clock } from 'lucide-react';
import { open as shellOpen } from '@tauri-apps/plugin-shell';
import { useBookmarkStore } from '../store/useBookmarkStore.js';
import { useToastStore } from '../store/useToastStore.js';
import { timeAgo } from '../lib/timeAgo.js';
import TagManager from './TagManager.jsx';
import ReaderView from './ReaderView.jsx';

export default function BookmarkDetail() {
  const {
    bookmarks, selectedBookmarkId, setSelectedBookmark,
    toggleFavorite, toggleArchive, toggleRead, deleteBookmark,
    moveToCollection, updateBookmark, collections,
  } = useBookmarkStore();

  const [showReader, setShowReader] = useState(false);
  const [notes, setNotes] = useState('');
  const notesTimeout = useRef(null);

  const bookmark = bookmarks.find((b) => b.id === selectedBookmarkId);

  useEffect(() => {
    if (bookmark) {
      setNotes(bookmark.notes || '');
    }
  }, [bookmark?.id]);

  useEffect(() => {
    setShowReader(false);
  }, [selectedBookmarkId]);

  if (!bookmark) return null;

  if (showReader) {
    return <ReaderView bookmark={bookmark} onClose={() => setShowReader(false)} />;
  }

  const domain = (() => {
    try { return new URL(bookmark.url).hostname.replace('www.', ''); }
    catch { return bookmark.url; }
  })();

  const handleNotesChange = (e) => {
    const val = e.target.value;
    setNotes(val);
    clearTimeout(notesTimeout.current);
    notesTimeout.current = setTimeout(() => {
      updateBookmark(bookmark.id, { notes: val });
    }, 500);
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(bookmark.url);
    useToastStore.getState().success('URL copied to clipboard');
  };

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/20 animate-fadeIn" onClick={() => setSelectedBookmark(null)} />
      <div className="fixed right-0 top-0 bottom-0 z-40 w-[420px] max-w-full bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 overflow-y-auto shadow-xl animate-slideInRight">
        <div className="sticky top-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center justify-between z-10">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate">Details</h2>
          <button
            onClick={() => setSelectedBookmark(null)}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer transition-colors duration-150"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {bookmark.ogImage && (
            <img
              src={bookmark.ogImage}
              alt=""
              className="w-full h-48 object-cover rounded-xl"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}

          <div className="flex items-center gap-2">
            {bookmark.favicon && (
              <img src={bookmark.favicon} alt="" className="w-4 h-4 rounded-sm" onError={(e) => { e.target.style.display = 'none'; }} />
            )}
            <span className="text-xs text-zinc-400 dark:text-zinc-500">{domain}</span>
            {bookmark.readingTime > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-zinc-400 dark:text-zinc-500 ml-auto">
                <Clock size={11} />{bookmark.readingTime} min read
              </span>
            )}
          </div>

          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{bookmark.title}</h3>

          {bookmark.description && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{bookmark.description}</p>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => shellOpen(bookmark.url)}
              className="inline-flex items-center gap-1.5 text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer"
            >
              <ExternalLink size={14} />
              Open original
            </button>
            <button
              onClick={copyUrl}
              className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer transition-colors duration-150"
            >
              <Copy size={13} />
              Copy URL
            </button>
          </div>

          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
            <label className="text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2 block">Notes</label>
            <textarea
              value={notes}
              onChange={handleNotesChange}
              placeholder="Add personal notes..."
              rows={3}
              className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-blue-500 dark:focus:border-blue-400 transition-colors duration-150 resize-none"
            />
          </div>

          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
            <label className="text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2 block">Tags</label>
            <TagManager bookmarkId={bookmark.id} tags={bookmark.tags || []} />
          </div>

          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
            <label className="text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2 block">Collection</label>
            <select
              value={bookmark.collectionId || ''}
              onChange={(e) => moveToCollection(bookmark.id, e.target.value || null)}
              className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 outline-none cursor-pointer"
            >
              <option value="">No collection</option>
              {collections.map((col) => (
                <option key={col.id} value={col.id}>{col.name}</option>
              ))}
            </select>
          </div>

          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => setShowReader(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors duration-150 cursor-pointer"
            >
              <Eye size={14} />
              Reader
            </button>
            <button
              onClick={() => toggleFavorite(bookmark.id)}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors duration-150 cursor-pointer ${
                bookmark.isFavorite
                  ? 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              <Star size={14} fill={bookmark.isFavorite ? 'currentColor' : 'none'} />
              {bookmark.isFavorite ? 'Favorited' : 'Favorite'}
            </button>
            <button
              onClick={() => toggleRead(bookmark.id)}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors duration-150 cursor-pointer ${
                bookmark.isRead
                  ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              <BookmarkCheck size={14} />
              {bookmark.isRead ? 'Read' : 'Mark Read'}
            </button>
            <button
              onClick={() => toggleArchive(bookmark.id)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors duration-150 cursor-pointer"
            >
              <Archive size={14} />
              {bookmark.isArchived ? 'Unarchive' : 'Archive'}
            </button>
          </div>

          <button
            onClick={() => { deleteBookmark(bookmark.id); }}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-red-500 bg-red-50 dark:bg-red-500/10 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors duration-150 cursor-pointer"
          >
            <Trash2 size={14} />
            Delete Bookmark
          </button>

          <div className="pt-2 text-xs text-zinc-400 dark:text-zinc-500 space-y-1">
            <p>Added {timeAgo(bookmark.createdAt)} ({new Date(bookmark.createdAt).toLocaleDateString()})</p>
            {bookmark.updatedAt !== bookmark.createdAt && (
              <p>Updated {timeAgo(bookmark.updatedAt)}</p>
            )}
            {bookmark.source === 'feed' && <p>Source: RSS Feed</p>}
          </div>
        </div>
      </div>
    </>
  );
}
