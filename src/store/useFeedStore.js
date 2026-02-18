import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { loadFeeds, saveFeeds, saveBookmarks, loadFeedRefresh, saveFeedRefresh } from '../lib/storage.js';
import { fetchAndParseRSS } from '../lib/rss.js';
import { useToastStore } from './useToastStore.js';
import { useBookmarkStore } from './useBookmarkStore.js';

let refreshInterval = null;

export const useFeedStore = create((set, get) => ({
  feeds: [],
  loaded: false,
  refreshing: false,
  autoRefreshMinutes: 0,

  loadFeeds: async () => {
    const [feeds, mins] = await Promise.all([loadFeeds(), loadFeedRefresh()]);
    set({ feeds, loaded: true, autoRefreshMinutes: mins });
    if (mins > 0) {
      get().startAutoRefresh(mins);
    }
  },

  setAutoRefresh: async (minutes) => {
    await saveFeedRefresh(minutes);
    set({ autoRefreshMinutes: minutes });
    if (minutes > 0) {
      get().startAutoRefresh(minutes);
    } else {
      get().stopAutoRefresh();
    }
  },

  startAutoRefresh: (minutes) => {
    get().stopAutoRefresh();
    refreshInterval = setInterval(() => {
      get().refreshAllFeeds();
    }, minutes * 60 * 1000);
  },

  stopAutoRefresh: () => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
  },

  addFeed: async (rssUrl) => {
    const existingFeed = get().feeds.find((f) => f.url === rssUrl);
    if (existingFeed) {
      useToastStore.getState().info('Feed already subscribed');
      return existingFeed;
    }

    const { feed, items } = await fetchAndParseRSS(rssUrl);

    const feedId = uuidv4();
    let favicon = null;
    if (feed.siteUrl) {
      try {
        favicon = `${new URL(feed.siteUrl).origin}/favicon.ico`;
      } catch {}
    }

    const newFeed = {
      id: feedId,
      title: feed.title,
      url: rssUrl,
      siteUrl: feed.siteUrl,
      favicon,
      lastFetchedAt: Date.now(),
      createdAt: Date.now(),
      errorCount: 0,
    };

    const feeds = [...get().feeds, newFeed];
    set({ feeds });
    await saveFeeds(feeds);

    const bookmarkStore = useBookmarkStore.getState();
    const existingUrls = new Set(bookmarkStore.bookmarks.map((b) => b.url));
    const newBookmarks = items
      .filter((item) => item.url && !existingUrls.has(item.url))
      .map((item) => ({
        id: uuidv4(),
        url: item.url,
        title: item.title,
        description: item.description,
        favicon,
        ogImage: null,
        tags: [],
        collectionId: null,
        isFavorite: false,
        isArchived: false,
        isRead: false,
        readableContent: null,
        notes: '',
        readingTime: 0,
        source: 'feed',
        feedId,
        createdAt: item.pubDate || Date.now(),
        updatedAt: Date.now(),
      }));

    if (newBookmarks.length > 0) {
      await bookmarkStore.importBookmarksData(newBookmarks);
    }

    useToastStore.getState().success(`Subscribed to "${feed.title}" (${newBookmarks.length} articles)`);
    return newFeed;
  },

  removeFeed: async (feedId) => {
    const feed = get().feeds.find((f) => f.id === feedId);
    const feeds = get().feeds.filter((f) => f.id !== feedId);
    set({ feeds });
    await saveFeeds(feeds);

    const bookmarkStore = useBookmarkStore.getState();
    const bookmarks = bookmarkStore.bookmarks.filter((b) => b.feedId !== feedId);
    set({}, false);
    await bookmarkStore.importBookmarksData([]);
    const state = useBookmarkStore.getState();
    useBookmarkStore.setState({ bookmarks });
    await saveBookmarks(bookmarks);

    if (feed) useToastStore.getState().success(`Unsubscribed from "${feed.title}"`);
  },

  refreshFeed: async (feedId) => {
    const feed = get().feeds.find((f) => f.id === feedId);
    if (!feed) return 0;

    try {
      const { items } = await fetchAndParseRSS(feed.url);
      const bookmarkStore = useBookmarkStore.getState();
      const existingUrls = new Set(bookmarkStore.bookmarks.map((b) => b.url));

      const newBookmarks = items
        .filter((item) => item.url && !existingUrls.has(item.url))
        .map((item) => ({
          id: uuidv4(),
          url: item.url,
          title: item.title,
          description: item.description,
          favicon: feed.favicon,
          ogImage: null,
          tags: [],
          collectionId: null,
          isFavorite: false,
          isArchived: false,
          isRead: false,
          readableContent: null,
          notes: '',
          readingTime: 0,
          source: 'feed',
          feedId,
          createdAt: item.pubDate || Date.now(),
          updatedAt: Date.now(),
        }));

      if (newBookmarks.length > 0) {
        await bookmarkStore.importBookmarksData(newBookmarks);
      }

      const feeds = get().feeds.map((f) =>
        f.id === feedId ? { ...f, lastFetchedAt: Date.now(), errorCount: 0 } : f
      );
      set({ feeds });
      await saveFeeds(feeds);
      return newBookmarks.length;
    } catch (e) {
      const feeds = get().feeds.map((f) =>
        f.id === feedId ? { ...f, errorCount: (f.errorCount || 0) + 1 } : f
      );
      set({ feeds });
      await saveFeeds(feeds);
      return 0;
    }
  },

  refreshAllFeeds: async () => {
    if (get().refreshing) return;
    set({ refreshing: true });
    const { feeds, refreshFeed } = get();
    let totalNew = 0;
    for (const feed of feeds) {
      const count = await refreshFeed(feed.id);
      totalNew += count;
    }
    set({ refreshing: false });
    if (totalNew > 0) {
      useToastStore.getState().success(`${totalNew} new articles from feeds`);
    } else {
      useToastStore.getState().info('All feeds up to date');
    }
  },

  exportOPML: async () => {
    const { feeds } = get();
    const outlines = feeds.map((f) =>
      `      <outline text="${escapeXml(f.title)}" title="${escapeXml(f.title)}" type="rss" xmlUrl="${escapeXml(f.url)}" htmlUrl="${escapeXml(f.siteUrl || '')}" />`
    ).join('\n');
    const opml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>Stash Feed Subscriptions</title>
    <dateCreated>${new Date().toISOString()}</dateCreated>
  </head>
  <body>
    <outline text="Stash Feeds" title="Stash Feeds">
${outlines}
    </outline>
  </body>
</opml>`;
    try {
      const filePath = await save({
        defaultPath: `stash-feeds-${new Date().toISOString().slice(0, 10)}.opml`,
        filters: [{ name: 'OPML', extensions: ['opml'] }],
      });
      if (!filePath) return;
      await writeTextFile(filePath, opml);
      useToastStore.getState().success('Feeds exported as OPML');
    } catch {
      useToastStore.getState().error('OPML export failed');
    }
  },

  importOPML: async (xmlString) => {
    const doc = new DOMParser().parseFromString(xmlString, 'text/xml');
    const outlines = doc.querySelectorAll('outline[xmlUrl]');
    let imported = 0;
    let skipped = 0;

    for (const outline of outlines) {
      const xmlUrl = outline.getAttribute('xmlUrl');
      if (!xmlUrl) { skipped++; continue; }
      const existing = get().feeds.find((f) => f.url === xmlUrl);
      if (existing) { skipped++; continue; }

      try {
        await get().addFeed(xmlUrl);
        imported++;
      } catch {
        skipped++;
      }
    }

    useToastStore.getState().success(`Imported ${imported} feeds, skipped ${skipped}`);
    return { imported, skipped };
  },
}));

function escapeXml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
