import { useState, useRef, useEffect } from 'react';
import { Rss, RefreshCw, Plus, Trash2, Settings } from 'lucide-react';
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
  const { feeds, refreshAllFeeds, removeFeed, refreshing, autoRefreshMinutes, setAutoRefresh } = useFeedStore();
  const { bookmarks, activeView, setActiveView } = useBookmarkStore();
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setShowSettings(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getUnreadCount = (feedId) => {
    return bookmarks.filter((b) => b.feedId === feedId && !b.isRead).length;
  };

  const handleRemoveFeed = async (e, feedId) => {
    e.stopPropagation();
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

  return (
    <div>
      <div className="flex items-center justify-between px-3 mb-2">
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
          Feeds
          <span className="text-[10px] text-zinc-300 dark:text-zinc-600 ml-1 normal-case">{feeds.length}</span>
        </span>
        <div className="flex items-center gap-0.5">
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-md transition-colors duration-150 cursor-pointer"
              title="Feed settings"
            >
              <Settings size={12} />
            </button>
            {showSettings && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg py-1 min-w-160px z-20 animate-scaleIn">
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
      {feeds.map((feed) => {
        const unread = getUnreadCount(feed.id);
        const isActive = activeView === `feed:${feed.id}`;
        return (
          <button
            key={feed.id}
            onClick={() => setActiveView(`feed:${feed.id}`)}
            className={`group w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-left transition-colors duration-150 cursor-pointer ${
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
              onClick={(e) => handleRemoveFeed(e, feed.id)}
              className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-400 hover:text-red-500 transition-all duration-150 cursor-pointer"
            >
              <Trash2 size={12} />
            </button>
          </button>
        );
      })}
      {feeds.length === 0 && (
        <p className="px-3 text-xs text-zinc-400 dark:text-zinc-500">No feeds yet</p>
      )}
    </div>
  );
}
