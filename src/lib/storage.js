import { LazyStore } from '@tauri-apps/plugin-store';

const store = new LazyStore('stash-data.json', { autoSave: true });

const KEYS = {
  bookmarks: 'stash-bookmarks',
  collections: 'stash-collections',
  feeds: 'stash-feeds',
  feedCategories: 'stash-feed-categories',
  theme: 'stash-theme',
  feedRefresh: 'stash-feed-refresh',
  readerPrefs: 'stash-reader-prefs',
};

export async function loadBookmarks() {
  return (await store.get(KEYS.bookmarks)) ?? [];
}

export async function saveBookmarks(bookmarks) {
  await store.set(KEYS.bookmarks, bookmarks);
}

export async function loadCollections() {
  return (await store.get(KEYS.collections)) ?? [];
}

export async function saveCollections(collections) {
  await store.set(KEYS.collections, collections);
}

export async function loadFeeds() {
  return (await store.get(KEYS.feeds)) ?? [];
}

export async function saveFeeds(feeds) {
  await store.set(KEYS.feeds, feeds);
}

export async function loadFeedCategories() {
  return (await store.get(KEYS.feedCategories)) ?? [];
}

export async function saveFeedCategories(categories) {
  await store.set(KEYS.feedCategories, categories);
}

export async function loadTheme() {
  return (await store.get(KEYS.theme)) ?? 'system';
}

export async function saveTheme(theme) {
  await store.set(KEYS.theme, theme);
}

export async function loadFeedRefresh() {
  return (await store.get(KEYS.feedRefresh)) ?? 0;
}

export async function saveFeedRefresh(minutes) {
  await store.set(KEYS.feedRefresh, minutes);
}

export async function loadReaderPrefs() {
  return (await store.get(KEYS.readerPrefs)) ?? null;
}

export async function saveReaderPrefs(prefs) {
  await store.set(KEYS.readerPrefs, prefs);
}

export async function exportAllData() {
  return {
    bookmarks: await store.get(KEYS.bookmarks),
    collections: await store.get(KEYS.collections),
    feeds: await store.get(KEYS.feeds),
    feedCategories: await store.get(KEYS.feedCategories),
  };
}

export async function importAllData(data) {
  if (data.bookmarks !== undefined) await store.set(KEYS.bookmarks, data.bookmarks);
  if (data.collections !== undefined) await store.set(KEYS.collections, data.collections);
  if (data.feeds !== undefined) await store.set(KEYS.feeds, data.feeds);
  if (data.feedCategories !== undefined) await store.set(KEYS.feedCategories, data.feedCategories);
}
