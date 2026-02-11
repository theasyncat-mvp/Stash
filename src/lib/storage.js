import { get, set } from 'idb-keyval';

const KEYS = {
  bookmarks: 'stash-bookmarks',
  collections: 'stash-collections',
  feeds: 'stash-feeds',
};

export async function loadBookmarks() {
  const data = await get(KEYS.bookmarks);
  return data || [];
}

export async function saveBookmarks(bookmarks) {
  await set(KEYS.bookmarks, bookmarks);
}

export async function loadCollections() {
  const data = await get(KEYS.collections);
  return data || [];
}

export async function saveCollections(collections) {
  await set(KEYS.collections, collections);
}

export async function loadFeeds() {
  const data = await get(KEYS.feeds);
  return data || [];
}

export async function saveFeeds(feeds) {
  await set(KEYS.feeds, feeds);
}
