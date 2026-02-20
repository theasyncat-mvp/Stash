import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, CheckSquare, Bookmark, Shield, Lock } from 'lucide-react';
import { useBookmarkStore, useFilteredBookmarks } from '../store/useBookmarkStore.js';
import { useFeedStore } from '../store/useFeedStore.js';
import { useVaultStore } from '../store/useVaultStore.js';
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
import DuplicateScanner from './DuplicateScanner.jsx';
import ToastContainer from './Toast.jsx';
import DndProvider from './DndProvider.jsx';
import VaultSetup from './VaultSetup.jsx';
import VaultUnlock from './VaultUnlock.jsx';
import VaultView from './VaultView.jsx';

export default function Layout() {
  const { activeView, selectedBookmarkId, collections, setActiveView, setSelectedBookmark, toggleBulkMode, bulkMode, setViewMode } = useBookmarkStore();
  const { feeds } = useFeedStore();
  const filteredBookmarks = useFilteredBookmarks();
  const { isEnabled, isUnlocked, lock: vaultLock } = useVaultStore();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showAddBookmark, setShowAddBookmark] = useState(false);
  const [showAddFeed, setShowAddFeed] = useState(false);
  const [showAddCollection, setShowAddCollection] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showDuplicateScanner, setShowDuplicateScanner] = useState(false);
  const [showVaultSetup, setShowVaultSetup] = useState(false);

  const bookmarkCount = filteredBookmarks.length;
  const prevActiveViewRef = useRef(activeView);

  // Lock vault when navigating away from vault view
  useEffect(() => {
    const prev = prevActiveViewRef.current;
    prevActiveViewRef.current = activeView;
    if (prev === 'vault' && activeView !== 'vault') {
      vaultLock();
    }
  }, [activeView, vaultLock]);

  // Auto-show vault setup when navigating to vault while it's not yet enabled
  useEffect(() => {
    if (activeView === 'vault' && !isEnabled) {
      setShowVaultSetup(true);
    }
  }, [activeView, isEnabled]);

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
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'v') {
      e.preventDefault();
      setActiveView('vault');
      return;
    }

    if (e.key === 'Escape') {
      if (showCommandPalette) { setShowCommandPalette(false); return; }
      if (showShortcuts) { setShowShortcuts(false); return; }
      if (showAddBookmark) { setShowAddBookmark(false); return; }
      if (showAddFeed) { setShowAddFeed(false); return; }
      if (showAddCollection) { setShowAddCollection(false); return; }
      if (showDuplicateScanner) { setShowDuplicateScanner(false); return; }
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
  }, [showCommandPalette, showShortcuts, showAddBookmark, showAddFeed, showAddCollection, showDuplicateScanner, selectedBookmarkId, bulkMode, setActiveView, setSelectedBookmark, toggleBulkMode, setViewMode]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const getViewTitle = () => {
    if (activeView === 'vault') return 'Private Vault';
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
    <DndProvider>
    <div className="flex flex-1 min-h-0 bg-[#FAFAFA] dark:bg-zinc-950">
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
            {activeView !== 'vault' && (
              <span className="text-xs text-zinc-400 dark:text-zinc-500">{bookmarkCount} item{bookmarkCount !== 1 ? 's' : ''}</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {activeView === 'vault' ? (
              isUnlocked && (
                <button
                  onClick={vaultLock}
                  title="Lock vault"
                  className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors duration-150 cursor-pointer"
                >
                  <Lock size={16} />
                </button>
              )
            ) : (
              <>
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
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-black font-bold rounded-lg transition-colors duration-150 cursor-pointer"
                >
                  <Plus size={14} />
                  <span className="hidden sm:inline">Add</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Bulk action bar — hidden on vault view */}
        {activeView !== 'vault' && <BulkActionBar />}

        {/* Content */}
        {activeView === 'vault' ? (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {isEnabled && isUnlocked ? (
              <VaultView />
            ) : isEnabled && !isUnlocked ? (
              <VaultUnlock />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
                <div className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  <Shield size={24} className="text-zinc-400 dark:text-zinc-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Private Vault</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Encrypt your private bookmarks with AES-256.</p>
                </div>
                <button
                  onClick={() => setShowVaultSetup(true)}
                  className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-black font-bold rounded-lg transition-colors duration-150 cursor-pointer"
                >
                  Create Vault
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-hidden px-4 sm:px-6 py-4 sm:py-6">
            <BookmarkList />
          </div>
        )}
      </main>

      {selectedBookmarkId && <BookmarkDetail />}

      {showVaultSetup && <VaultSetup onClose={() => setShowVaultSetup(false)} />}
      {showAddBookmark && <AddBookmark onClose={() => setShowAddBookmark(false)} />}
      {showAddFeed && <AddFeed onClose={() => setShowAddFeed(false)} />}
      {showAddCollection && <AddCollection onClose={() => setShowAddCollection(false)} />}
      {showCommandPalette && (
        <CommandPalette
          onClose={() => setShowCommandPalette(false)}
          onAddBookmark={() => setShowAddBookmark(true)}
          onAddFeed={() => setShowAddFeed(true)}
          onAddCollection={() => setShowAddCollection(true)}
          onFindDuplicates={() => setShowDuplicateScanner(true)}
        />
      )}
      {showShortcuts && <KeyboardShortcuts onClose={() => setShowShortcuts(false)} />}
      {showDuplicateScanner && <DuplicateScanner onClose={() => setShowDuplicateScanner(false)} />}

      <ToastContainer />
    </div>
    </DndProvider>
  );
}
