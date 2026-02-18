import { useState, useEffect, useCallback } from 'react';
import { Plus, CheckSquare, Bookmark } from 'lucide-react';
import { useBookmarkStore, useFilteredBookmarks } from '../store/useBookmarkStore.js';
import { useFeedStore } from '../store/useFeedStore.js';
import Sidebar from './Sidebar.jsx';
import BookmarkList from './BookmarkList.jsx';
import BookmarkDetail from './BookmarkDetail.jsx';
import BulkActionBar from './BulkActionBar.jsx';
import ViewToggle from './ViewToggle.jsx';
import SortDropdown from './SortDropdown.jsx';
import AddBookmark from './AddBookmark.jsx';
import AddFeed from './AddFeed.jsx';
import AddCollection from './AddCollection.jsx';
import CommandPalette from './CommandPalette.jsx';
import KeyboardShortcuts from './KeyboardShortcuts.jsx';
import ToastContainer from './Toast.jsx';

export default function Layout() {
  const { activeView, selectedBookmarkId, collections, setActiveView, setSelectedBookmark, toggleBulkMode, bulkMode, setViewMode } = useBookmarkStore();
  const { feeds } = useFeedStore();
  const filteredBookmarks = useFilteredBookmarks();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showAddBookmark, setShowAddBookmark] = useState(false);
  const [showAddFeed, setShowAddFeed] = useState(false);
  const [showAddCollection, setShowAddCollection] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const bookmarkCount = filteredBookmarks.length;

  const handleKeyDown = useCallback((e) => {
    const target = e.target;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';

    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      setShowCommandPalette(true);
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      setShowAddBookmark(true);
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      toggleBulkMode();
      return;
    }

    if (e.key === 'Escape') {
      if (showCommandPalette) { setShowCommandPalette(false); return; }
      if (showShortcuts) { setShowShortcuts(false); return; }
      if (showAddBookmark) { setShowAddBookmark(false); return; }
      if (showAddFeed) { setShowAddFeed(false); return; }
      if (showAddCollection) { setShowAddCollection(false); return; }
      if (selectedBookmarkId) { setSelectedBookmark(null); return; }
      if (bulkMode) { toggleBulkMode(); return; }
    }

    if (isInput) return;

    if (e.key === '?') { setShowShortcuts(true); return; }
    if (e.key === '1') { setActiveView('inbox'); return; }
    if (e.key === '2') { setActiveView('all'); return; }
    if (e.key === '3') { setActiveView('favorites'); return; }
    if (e.key === '4') { setActiveView('archive'); return; }
    if (e.key.toLowerCase() === 'g') { setViewMode('grid'); return; }
    if (e.key.toLowerCase() === 'l') { setViewMode('list'); return; }
  }, [showCommandPalette, showShortcuts, showAddBookmark, showAddFeed, showAddCollection, selectedBookmarkId, bulkMode, setActiveView, setSelectedBookmark, toggleBulkMode, setViewMode]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const getViewTitle = () => {
    if (activeView === 'inbox') return 'Inbox';
    if (activeView === 'all') return 'All Bookmarks';
    if (activeView === 'favorites') return 'Favorites';
    if (activeView === 'archive') return 'Archive';
    if (activeView === 'search') return 'Search Results';
    if (activeView.startsWith('tag:')) return `#${activeView.slice(4)}`;
    if (activeView.startsWith('collection:')) {
      const col = collections.find((c) => c.id === activeView.slice(11));
      return col ? col.name : 'Collection';
    }
    if (activeView.startsWith('feed:')) {
      const feed = feeds.find((f) => f.id === activeView.slice(5));
      return feed ? feed.title : 'Feed';
    }
    return 'Bookmarks';
  };

  return (
    <div className="flex h-screen bg-[#FAFAFA] dark:bg-zinc-950">
      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden animate-fadeIn" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`${mobileOpen ? 'fixed inset-y-0 left-0 z-50' : 'hidden'} lg:relative lg:flex`}>
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
          onAddFeed={() => setShowAddFeed(true)}
          onAddCollection={() => setShowAddCollection(true)}
          onMobileClose={() => setMobileOpen(false)}
        />
      </div>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer"
          >
            <Bookmark size={18} />
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-zinc-50 truncate">
              {getViewTitle()}
            </h1>
            <span className="text-xs text-zinc-400 dark:text-zinc-500">{bookmarkCount} item{bookmarkCount !== 1 ? 's' : ''}</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <SortDropdown />
            <ViewToggle />
            <button
              onClick={() => toggleBulkMode()}
              className={`p-1.5 rounded-lg transition-colors duration-150 cursor-pointer hidden sm:flex ${
                bulkMode
                  ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-500'
                  : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600'
              }`}
              title="Bulk select (Ctrl+B)"
            >
              <CheckSquare size={16} />
            </button>
            <button
              onClick={() => setShowAddBookmark(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-150 cursor-pointer"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">Add</span>
            </button>
          </div>
        </div>

        {/* Bulk action bar */}
        <BulkActionBar />

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
          <BookmarkList />
        </div>
      </main>

      {selectedBookmarkId && <BookmarkDetail />}

      {showAddBookmark && <AddBookmark onClose={() => setShowAddBookmark(false)} />}
      {showAddFeed && <AddFeed onClose={() => setShowAddFeed(false)} />}
      {showAddCollection && <AddCollection onClose={() => setShowAddCollection(false)} />}
      {showCommandPalette && (
        <CommandPalette
          onClose={() => setShowCommandPalette(false)}
          onAddBookmark={() => setShowAddBookmark(true)}
          onAddFeed={() => setShowAddFeed(true)}
          onAddCollection={() => setShowAddCollection(true)}
        />
      )}
      {showShortcuts && <KeyboardShortcuts onClose={() => setShowShortcuts(false)} />}

      <ToastContainer />
    </div>
  );
}
