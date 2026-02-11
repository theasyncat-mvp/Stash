import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { loadBookmarks, saveBookmarks, loadCollections, saveCollections } from '../lib/storage.js';
import { fetchMetadata } from '../lib/metadata.js';
import { searchBookmarks } from '../lib/search.js';
import { useToastStore } from './useToastStore.js';

function normalizeUrl(url) {
  try {
    const u = new URL(url);
    let normalized = u.origin + u.pathname.replace(/\/+$/, '') + u.search;
    return normalized.toLowerCase();
  } catch {
    return url.toLowerCase().trim();
  }
}

function estimateReadingTime(text) {
  if (!text) return 0;
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export const useBookmarkStore = create((set, get) => ({
  bookmarks: [],
  collections: [],
  activeView: 'inbox',
  searchQuery: '',
  viewMode: 'grid',
  sortBy: 'newest',
  selectedBookmarkId: null,
  selectedIds: new Set(),
  bulkMode: false,
  loaded: false,

  loadAll: async () => {
    const [bookmarks, collections] = await Promise.all([
      loadBookmarks(),
      loadCollections(),
    ]);
    set({ bookmarks, collections, loaded: true });
  },

  addBookmark: async (url, tags = []) => {
    let finalUrl = url.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }

    const normalized = normalizeUrl(finalUrl);
    const existing = get().bookmarks.find((b) => normalizeUrl(b.url) === normalized);
    if (existing) {
      useToastStore.getState().info('Bookmark already exists');
      set({ selectedBookmarkId: existing.id });
      return existing.id;
    }

    const id = uuidv4();
    const now = Date.now();
    const bookmark = {
      id,
      url: finalUrl,
      title: (() => { try { return new URL(finalUrl).hostname; } catch { return finalUrl; } })(),
      description: '',
      favicon: null,
      ogImage: null,
      tags,
      collectionId: null,
      isFavorite: false,
      isArchived: false,
      isRead: false,
      readableContent: null,
      notes: '',
      readingTime: 0,
      source: 'manual',
      feedId: null,
      createdAt: now,
      updatedAt: now,
      _loading: true,
    };
    const bookmarks = [bookmark, ...get().bookmarks];
    set({ bookmarks });
    await saveBookmarks(bookmarks);
    useToastStore.getState().success('Bookmark added');

    fetchMetadata(finalUrl).then(async (meta) => {
      const readingTime = estimateReadingTime(meta.description);
      const updated = get().bookmarks.map((b) =>
        b.id === id
          ? { ...b, ...meta, readingTime, _loading: false, updatedAt: Date.now() }
          : b
      );
      set({ bookmarks: updated });
      await saveBookmarks(updated);
    });

    return id;
  },

  updateBookmark: async (id, changes) => {
    const bookmarks = get().bookmarks.map((b) =>
      b.id === id ? { ...b, ...changes, updatedAt: Date.now() } : b
    );
    set({ bookmarks });
    await saveBookmarks(bookmarks);
  },

  deleteBookmark: async (id) => {
    const bookmark = get().bookmarks.find((b) => b.id === id);
    if (!bookmark) return;

    const bookmarks = get().bookmarks.filter((b) => b.id !== id);
    const selected = get().selectedIds;
    selected.delete(id);
    set({
      bookmarks,
      selectedBookmarkId: get().selectedBookmarkId === id ? null : get().selectedBookmarkId,
      selectedIds: new Set(selected),
    });
    await saveBookmarks(bookmarks);

    useToastStore.getState().success('Bookmark deleted', {
      undoAction: async () => {
        const restored = [bookmark, ...get().bookmarks];
        set({ bookmarks: restored });
        await saveBookmarks(restored);
        useToastStore.getState().success('Bookmark restored');
      },
    });
  },

  toggleFavorite: async (id) => {
    const bookmark = get().bookmarks.find((b) => b.id === id);
    const bookmarks = get().bookmarks.map((b) =>
      b.id === id ? { ...b, isFavorite: !b.isFavorite, updatedAt: Date.now() } : b
    );
    set({ bookmarks });
    await saveBookmarks(bookmarks);
    if (bookmark) {
      useToastStore.getState().success(bookmark.isFavorite ? 'Removed from favorites' : 'Added to favorites');
    }
  },

  toggleArchive: async (id) => {
    const bookmark = get().bookmarks.find((b) => b.id === id);
    const bookmarks = get().bookmarks.map((b) =>
      b.id === id ? { ...b, isArchived: !b.isArchived, updatedAt: Date.now() } : b
    );
    set({ bookmarks });
    await saveBookmarks(bookmarks);
    if (bookmark) {
      useToastStore.getState().success(bookmark.isArchived ? 'Unarchived' : 'Archived');
    }
  },

  toggleRead: async (id) => {
    const bookmarks = get().bookmarks.map((b) =>
      b.id === id ? { ...b, isRead: !b.isRead, updatedAt: Date.now() } : b
    );
    set({ bookmarks });
    await saveBookmarks(bookmarks);
  },

  addTag: async (bookmarkId, tag) => {
    const bookmarks = get().bookmarks.map((b) => {
      if (b.id !== bookmarkId) return b;
      if (b.tags.includes(tag)) return b;
      return { ...b, tags: [...b.tags, tag], updatedAt: Date.now() };
    });
    set({ bookmarks });
    await saveBookmarks(bookmarks);
  },

  removeTag: async (bookmarkId, tag) => {
    const bookmarks = get().bookmarks.map((b) => {
      if (b.id !== bookmarkId) return b;
      return { ...b, tags: b.tags.filter((t) => t !== tag), updatedAt: Date.now() };
    });
    set({ bookmarks });
    await saveBookmarks(bookmarks);
  },

  setActiveView: (view) => set({ activeView: view, selectedBookmarkId: null, bulkMode: false, selectedIds: new Set() }),
  setSearchQuery: (query) => {
    if (query) {
      set({ searchQuery: query, activeView: 'search' });
    } else {
      const { activeView } = get();
      set({ searchQuery: '', activeView: activeView === 'search' ? 'inbox' : activeView });
    }
  },
  setViewMode: (mode) => set({ viewMode: mode }),
  setSortBy: (sortBy) => set({ sortBy }),
  setSelectedBookmark: (id) => set({ selectedBookmarkId: id }),

  // Bulk actions
  toggleBulkMode: () => {
    const bulkMode = !get().bulkMode;
    set({ bulkMode, selectedIds: bulkMode ? get().selectedIds : new Set() });
  },

  toggleSelected: (id) => {
    const selected = new Set(get().selectedIds);
    if (selected.has(id)) {
      selected.delete(id);
    } else {
      selected.add(id);
    }
    set({ selectedIds: selected });
  },

  selectAll: () => {
    const filtered = get().getFilteredBookmarks();
    set({ selectedIds: new Set(filtered.map((b) => b.id)) });
  },

  deselectAll: () => set({ selectedIds: new Set() }),

  bulkDelete: async () => {
    const ids = get().selectedIds;
    if (ids.size === 0) return;
    const deletedBookmarks = get().bookmarks.filter((b) => ids.has(b.id));
    const bookmarks = get().bookmarks.filter((b) => !ids.has(b.id));
    set({ bookmarks, selectedIds: new Set(), bulkMode: false });
    await saveBookmarks(bookmarks);
    useToastStore.getState().success(`Deleted ${deletedBookmarks.length} bookmarks`, {
      undoAction: async () => {
        const restored = [...deletedBookmarks, ...get().bookmarks];
        set({ bookmarks: restored });
        await saveBookmarks(restored);
        useToastStore.getState().success('Bookmarks restored');
      },
    });
  },

  bulkArchive: async () => {
    const ids = get().selectedIds;
    if (ids.size === 0) return;
    const bookmarks = get().bookmarks.map((b) =>
      ids.has(b.id) ? { ...b, isArchived: true, updatedAt: Date.now() } : b
    );
    set({ bookmarks, selectedIds: new Set(), bulkMode: false });
    await saveBookmarks(bookmarks);
    useToastStore.getState().success(`Archived ${ids.size} bookmarks`);
  },

  bulkTag: async (tag) => {
    const ids = get().selectedIds;
    if (ids.size === 0) return;
    const bookmarks = get().bookmarks.map((b) => {
      if (!ids.has(b.id)) return b;
      if (b.tags.includes(tag)) return b;
      return { ...b, tags: [...b.tags, tag], updatedAt: Date.now() };
    });
    set({ bookmarks, selectedIds: new Set(), bulkMode: false });
    await saveBookmarks(bookmarks);
    useToastStore.getState().success(`Tagged ${ids.size} bookmarks with "${tag}"`);
  },

  bulkMoveToCollection: async (collectionId) => {
    const ids = get().selectedIds;
    if (ids.size === 0) return;
    const bookmarks = get().bookmarks.map((b) =>
      ids.has(b.id) ? { ...b, collectionId, updatedAt: Date.now() } : b
    );
    set({ bookmarks, selectedIds: new Set(), bulkMode: false });
    await saveBookmarks(bookmarks);
    const col = get().collections.find((c) => c.id === collectionId);
    useToastStore.getState().success(`Moved ${ids.size} bookmarks to "${col?.name || 'collection'}"`);
  },

  // Collections
  createCollection: async (name) => {
    const collection = {
      id: uuidv4(),
      name,
      icon: 'FolderOpen',
      createdAt: Date.now(),
    };
    const collections = [...get().collections, collection];
    set({ collections });
    await saveCollections(collections);
    useToastStore.getState().success(`Collection "${name}" created`);
    return collection;
  },

  updateCollection: async (id, changes) => {
    const collections = get().collections.map((c) =>
      c.id === id ? { ...c, ...changes } : c
    );
    set({ collections });
    await saveCollections(collections);
  },

  deleteCollection: async (id) => {
    const col = get().collections.find((c) => c.id === id);
    const collections = get().collections.filter((c) => c.id !== id);
    const bookmarks = get().bookmarks.map((b) =>
      b.collectionId === id ? { ...b, collectionId: null, updatedAt: Date.now() } : b
    );
    set({ collections, bookmarks });
    await Promise.all([saveCollections(collections), saveBookmarks(bookmarks)]);
    if (col) useToastStore.getState().success(`Collection "${col.name}" deleted`);
  },

  moveToCollection: async (bookmarkId, collectionId) => {
    const bookmarks = get().bookmarks.map((b) =>
      b.id === bookmarkId ? { ...b, collectionId, updatedAt: Date.now() } : b
    );
    set({ bookmarks });
    await saveBookmarks(bookmarks);
  },

  // Import
  importBookmarksData: async (newBookmarks) => {
    const bookmarks = [...get().bookmarks, ...newBookmarks];
    set({ bookmarks });
    await saveBookmarks(bookmarks);
  },

  // Computed
  getFilteredBookmarks: () => {
    const { bookmarks, activeView, searchQuery, sortBy } = get();

    let filtered;
    if (activeView === 'inbox') {
      filtered = bookmarks.filter((b) => !b.isArchived && !b.isRead && b.source === 'manual');
    } else if (activeView === 'all') {
      filtered = bookmarks.filter((b) => !b.isArchived);
    } else if (activeView === 'favorites') {
      filtered = bookmarks.filter((b) => b.isFavorite);
    } else if (activeView === 'archive') {
      filtered = bookmarks.filter((b) => b.isArchived);
    } else if (activeView.startsWith('tag:')) {
      const tagName = activeView.slice(4);
      filtered = bookmarks.filter((b) => b.tags.includes(tagName));
    } else if (activeView.startsWith('collection:')) {
      const colId = activeView.slice(11);
      filtered = bookmarks.filter((b) => b.collectionId === colId);
    } else if (activeView.startsWith('feed:')) {
      const feedId = activeView.slice(5);
      filtered = bookmarks.filter((b) => b.feedId === feedId);
    } else if (activeView === 'search') {
      filtered = searchBookmarks(bookmarks, searchQuery);
    } else {
      filtered = bookmarks;
    }

    return sortBookmarks(filtered, sortBy);
  },

  getAllTags: () => {
    const { bookmarks } = get();
    const tagMap = {};
    bookmarks.forEach((b) => {
      (b.tags || []).forEach((t) => {
        tagMap[t] = (tagMap[t] || 0) + 1;
      });
    });
    return Object.entries(tagMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  },

  getStats: () => {
    const { bookmarks, collections, feeds } = get();
    return {
      total: bookmarks.length,
      unread: bookmarks.filter((b) => !b.isRead && !b.isArchived).length,
      favorites: bookmarks.filter((b) => b.isFavorite).length,
      archived: bookmarks.filter((b) => b.isArchived).length,
      tags: new Set(bookmarks.flatMap((b) => b.tags || [])).size,
      collections: collections?.length || 0,
      fromFeeds: bookmarks.filter((b) => b.source === 'feed').length,
    };
  },
}));

function sortBookmarks(bookmarks, sortBy) {
  const sorted = [...bookmarks];
  switch (sortBy) {
    case 'newest':
      return sorted.sort((a, b) => b.createdAt - a.createdAt);
    case 'oldest':
      return sorted.sort((a, b) => a.createdAt - b.createdAt);
    case 'title-asc':
      return sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    case 'title-desc':
      return sorted.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
    case 'domain':
      return sorted.sort((a, b) => {
        try {
          return new URL(a.url).hostname.localeCompare(new URL(b.url).hostname);
        } catch {
          return 0;
        }
      });
    default:
      return sorted.sort((a, b) => b.createdAt - a.createdAt);
  }
}
