import { useState, useRef, useEffect } from 'react';
import { Rss, RefreshCw, Plus, Trash2, Settings, FolderPlus, ChevronRight, ChevronDown, Pencil, FolderMinus, MoreHorizontal } from 'lucide-react';
import { useFeedStore } from '../store/useFeedStore.js';
import { useBookmarkStore } from '../store/useBookmarkStore.js';
import { useConfirmStore } from '../store/useConfirmStore.js';

const refreshOptions = [
  { value: 0, label: 'Manual only' },
  { value: 15, label: 'Every 15 min' },
  { value: 30, label: 'Every 30 min' },
  { value: 60, label: 'Every hour' },
  { value: 360, label: 'Every 6 hours' },
];

export default function FeedList({ onAddFeed }) {
  const {
    feeds, feedCategories, refreshAllFeeds, removeFeed, refreshing,
    autoRefreshMinutes, setAutoRefresh, addFeedCategory, renameFeedCategory,
    removeFeedCategory, setFeedCategory,
  } = useFeedStore();
  const { bookmarks, activeView, setActiveView } = useBookmarkStore();
  const [showSettings, setShowSettings] = useState(false);
  const [collapsedCats, setCollapsedCats] = useState({});
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState(null);
  const [editCatName, setEditCatName] = useState('');
  const [feedMenuId, setFeedMenuId] = useState(null);
  const settingsRef = useRef(null);
  const feedMenuRef = useRef(null);
  const addCatRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setShowSettings(false);
      if (feedMenuRef.current && !feedMenuRef.current.contains(e.target)) setFeedMenuId(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getUnreadCount = (feedId) => {
    return bookmarks.filter((b) => b.feedId === feedId && !b.isRead).length;
  };

  const handleRemoveFeed = async (e, feedId) => {
    e.stopPropagation();
    setFeedMenuId(null);
    const confirmed = await useConfirmStore.getState().confirm({
      title: 'Remove feed?',
      message: 'This will remove the feed and all its articles.',
      confirmLabel: 'Remove',
      confirmVariant: 'danger',
    });
    if (confirmed) {
      removeFeed(feedId);
      if (activeView === `feed:${feedId}`) {
        setActiveView('all');
      }
    }
  };

  const handleAddCategory = async () => {
    const name = newCatName.trim();
    if (name) {
      await addFeedCategory(name);
    }
    setNewCatName('');
    setAddingCategory(false);
  };

  const handleRenameCategory = async (catId) => {
    const name = editCatName.trim();
    if (name) {
      await renameFeedCategory(catId, name);
    }
    setEditingCatId(null);
    setEditCatName('');
  };

  const handleDeleteCategory = async (catId) => {
    const confirmed = await useConfirmStore.getState().confirm({
      title: 'Delete category?',
      message: 'Feeds in this category will become uncategorized.',
      confirmLabel: 'Delete',
      confirmVariant: 'danger',
    });
    if (confirmed) await removeFeedCategory(catId);
  };

  const toggleCat = (catId) => {
    setCollapsedCats((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  // Group feeds by category
  const uncategorized = feeds.filter((f) => !f.categoryId);
  const categorized = feedCategories.map((cat) => ({
    ...cat,
    feeds: feeds.filter((f) => f.categoryId === cat.id),
  }));

  const renderFeed = (feed) => {
    const unread = getUnreadCount(feed.id);
    const isActive = activeView === `feed:${feed.id}`;
    return (
      <div key={feed.id} className="relative group">
        <button
          onClick={() => setActiveView(`feed:${feed.id}`)}
          className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-left transition-colors duration-150 cursor-pointer ${
            isActive
              ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
              : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800'
          }`}
        >
          {feed.favicon ? (
            <img src={feed.favicon} alt="" className="w-4 h-4 rounded-sm shrink-0" onError={(e) => { e.target.style.display = 'none'; }} />
          ) : (
            <Rss size={14} className="shrink-0" />
          )}
          <span className="text-sm truncate flex-1">{feed.title}</span>
          {feed.errorCount > 2 && (
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" title="Feed has errors" />
          )}
          {unread > 0 && (
            <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded-full min-w-20px text-center font-medium">
              {unread}
            </span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setFeedMenuId(feedMenuId === feed.id ? null : feed.id); }}
            className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-150 cursor-pointer"
          >
            <MoreHorizontal size={12} />
          </button>
        </button>

        {/* Feed context menu (move to category / delete) */}
        {feedMenuId === feed.id && (
          <div
            ref={feedMenuRef}
            className="absolute right-2 top-full mt-0.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg py-1 min-w-40 z-30 animate-scaleIn"
          >
            <div className="px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-zinc-400">Move to category</div>
            <button
              onClick={() => { setFeedCategory(feed.id, null); setFeedMenuId(null); }}
              className={`w-full text-left px-3 py-1.5 text-xs transition-colors duration-150 cursor-pointer ${
                !feed.categoryId
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              Uncategorized
            </button>
            {feedCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setFeedCategory(feed.id, cat.id); setFeedMenuId(null); }}
                className={`w-full text-left px-3 py-1.5 text-xs transition-colors duration-150 cursor-pointer ${
                  feed.categoryId === cat.id
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {cat.name}
              </button>
            ))}
            <div className="border-t border-zinc-100 dark:border-zinc-800 my-1" />
            <button
              onClick={(e) => handleRemoveFeed(e, feed.id)}
              className="w-full text-left px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors duration-150 cursor-pointer"
            >
              Remove feed
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between px-3 mb-2">
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
          Feeds
          <span className="text-[10px] text-zinc-300 dark:text-zinc-600 ml-1 normal-case">{feeds.length}</span>
        </span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setAddingCategory(true)}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-md transition-colors duration-150 cursor-pointer"
            title="Add feed category"
          >
            <FolderPlus size={12} />
          </button>
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-md transition-colors duration-150 cursor-pointer"
              title="Feed settings"
            >
              <Settings size={12} />
            </button>
            {showSettings && (
              <div className="absolute left-1/2 -translate-x-2/3 top-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg py-1 w-48 z-20 animate-scaleIn">
                <div className="px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-zinc-400">Auto-refresh</div>
                {refreshOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setAutoRefresh(opt.value); setShowSettings(false); }}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors duration-150 cursor-pointer ${
                      autoRefreshMinutes === opt.value
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => refreshAllFeeds()}
            disabled={refreshing}
            className={`p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-md transition-colors duration-150 cursor-pointer ${refreshing ? 'animate-spin' : ''}`}
            title="Refresh all feeds"
          >
            <RefreshCw size={12} />
          </button>
          <button
            onClick={onAddFeed}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-md transition-colors duration-150 cursor-pointer"
            title="Add feed"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>

      {/* Add category inline input */}
      {addingCategory && (
        <div className="px-3 mb-2" ref={addCatRef}>
          <input
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddCategory();
              if (e.key === 'Escape') { setAddingCategory(false); setNewCatName(''); }
            }}
            onBlur={handleAddCategory}
            placeholder="Category name..."
            autoFocus
            className="w-full px-2 py-1 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-blue-500 dark:focus:border-blue-400 transition-colors duration-150"
          />
        </div>
      )}

      {/* Categorized feeds */}
      {categorized.map((cat) => (
        <div key={cat.id} className="mb-1">
          <div className="group flex items-center gap-1 px-3 py-1">
            <button onClick={() => toggleCat(cat.id)} className="flex items-center gap-1 flex-1 cursor-pointer min-w-0">
              {collapsedCats[cat.id] ? <ChevronRight size={10} className="text-zinc-400 shrink-0" /> : <ChevronDown size={10} className="text-zinc-400 shrink-0" />}
              {editingCatId === cat.id ? (
                <input
                  type="text"
                  value={editCatName}
                  onChange={(e) => setEditCatName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameCategory(cat.id);
                    if (e.key === 'Escape') setEditingCatId(null);
                  }}
                  onBlur={() => handleRenameCategory(cat.id)}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 px-1 py-0 text-[11px] font-medium bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded outline-none text-zinc-700 dark:text-zinc-300 min-w-0"
                />
              ) : (
                <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 truncate">{cat.name}</span>
              )}
              <span className="text-[10px] text-zinc-300 dark:text-zinc-600 shrink-0">{cat.feeds.length}</span>
            </button>
            <button
              onClick={() => { setEditingCatId(cat.id); setEditCatName(cat.name); }}
              className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer transition-all duration-150"
              title="Rename category"
            >
              <Pencil size={10} />
            </button>
            <button
              onClick={() => handleDeleteCategory(cat.id)}
              className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-400 hover:text-red-500 cursor-pointer transition-all duration-150"
              title="Delete category"
            >
              <FolderMinus size={10} />
            </button>
          </div>
          {!collapsedCats[cat.id] && (
            <div className="ml-2">
              {cat.feeds.map(renderFeed)}
              {cat.feeds.length === 0 && (
                <p className="px-3 py-1 text-[10px] text-zinc-400 dark:text-zinc-500 italic">No feeds</p>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Uncategorized feeds */}
      {uncategorized.length > 0 && (
        <div className={feedCategories.length > 0 ? 'mt-1' : ''}>
          {feedCategories.length > 0 && (
            <div className="flex items-center gap-1 px-3 py-1">
              <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-300 dark:text-zinc-600">Uncategorized</span>
            </div>
          )}
          {uncategorized.map(renderFeed)}
        </div>
      )}

      {feeds.length === 0 && (
        <p className="px-3 text-xs text-zinc-400 dark:text-zinc-500">No feeds yet</p>
      )}
    </div>
  );
}
