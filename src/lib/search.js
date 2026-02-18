import Fuse from 'fuse.js';

/** Default Fuse options tuned for bookmarks. */
const BOOKMARK_FUSE_OPTIONS = {
  keys: [
    { name: 'title', weight: 0.4 },
    { name: 'description', weight: 0.2 },
    { name: 'url', weight: 0.2 },
    { name: 'tags', weight: 0.15 },
    { name: 'notes', weight: 0.05 },
  ],
  threshold: 0.35,       // 0 = exact, 1 = match anything
  distance: 200,         // how far from the expected location to search
  ignoreLocation: true,  // don't bias toward the start of the string
  minMatchCharLength: 2,
  includeScore: true,
  useExtendedSearch: false,
};

/**
 * Fuzzy-search bookmarks with relevance ranking.
 *
 * Returns results sorted best-match-first.
 * Falls back to the full list when the query is empty.
 *
 * @param {Array} bookmarks – full bookmark array
 * @param {string} query
 * @returns {Array} matched bookmarks, relevance-sorted
 */
export function searchBookmarks(bookmarks, query) {
  if (!query || !query.trim()) return bookmarks;

  const fuse = new Fuse(bookmarks, BOOKMARK_FUSE_OPTIONS);
  return fuse.search(query.trim()).map((r) => r.item);
}

/**
 * Generic fuzzy search helper for arbitrary item lists (e.g. commands).
 *
 * @param {Array} items – objects to search through
 * @param {string} query
 * @param {string[]} keys – which properties to search
 * @param {object} [opts] – optional Fuse overrides
 * @returns {Array} matched items, relevance-sorted
 */
export function fuzzySearch(items, query, keys, opts = {}) {
  if (!query || !query.trim()) return items;

  const fuse = new Fuse(items, {
    keys,
    threshold: 0.4,
    ignoreLocation: true,
    minMatchCharLength: 1,
    includeScore: true,
    ...opts,
  });
  return fuse.search(query.trim()).map((r) => r.item);
}
