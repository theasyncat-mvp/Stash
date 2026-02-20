import { useState, useEffect, useRef } from 'react';
import { X, Star, Archive, Trash2, ExternalLink, Eye, BookmarkCheck, Copy, Clock, ChevronDown, Check } from 'lucide-react';
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
  const [collectionOpen, setCollectionOpen] = useState(false);
  const notesTimeout = useRef(null);
  const collectionRef = useRef(null);

  const bookmark = bookmarks.find((b) => b.id === selectedBookmarkId);

  useEffect(() => {
    if (bookmark) {
      setNotes(bookmark.notes || '');
    }
  }, [bookmark?.id]);

  useEffect(() => {
    setShowReader(false);
    setCollectionOpen(false);
  }, [selectedBookmarkId]);

  useEffect(() => {
    if (!collectionOpen) return;
    const handler = (e) => {
      if (collectionRef.current && !collectionRef.current.contains(e.target)) {
        setCollectionOpen(false);
      }
    };
    const onKey = (e) => { if (e.key === 'Escape') setCollectionOpen(false); };
    document.addEventListener('mousedown', handler);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', handler);
      window.removeEventListener('keydown', onKey);
    };
  }, [collectionOpen]);

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
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bookmark-detail-title"
        className="fixed right-0 top-0 bottom-0 z-40 w-105 max-w-full bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 overflow-y-auto shadow-xl animate-slideInRight"
      >
        <div className="sticky top-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center justify-between z-10">
          <h2 id="bookmark-detail-title" className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate">Details</h2>
          <button
            onClick={() => setSelectedBookmark(null)}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer transition-colors duration-150"
            aria-label="Close details panel"
          >
            <X size={16} aria-hidden="true" />
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
            <div ref={collectionRef} className="relative">
              <button
                onClick={() => setCollectionOpen((o) => !o)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors duration-150 ${collectionOpen ? 'rounded-t-lg' : 'rounded-lg'}`}
              >
                <span>{collections.find((c) => c.id === bookmark.collectionId)?.name ?? 'No collection'}</span>
                <ChevronDown size={14} className={`text-zinc-400 transition-transform duration-150 ${collectionOpen ? 'rotate-180' : ''}`} />
              </button>
              {collectionOpen && (
                <div className="absolute left-0 right-0 top-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-b-lg shadow-lg py-1 z-20">
                  <button
                    onClick={() => { moveToCollection(bookmark.id, null); setCollectionOpen(false); }}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-150"
                  >
                    <span>No collection</span>
                    {!bookmark.collectionId && <Check size={14} className="text-blue-500" />}
                  </button>
                  {collections.map((col) => (
                    <button
                      key={col.id}
                      onClick={() => { moveToCollection(bookmark.id, col.id); setCollectionOpen(false); }}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-150"
                    >
                      <span>{col.name}</span>
                      {bookmark.collectionId === col.id && <Check size={14} className="text-blue-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
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
