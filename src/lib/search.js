export function searchBookmarks(bookmarks, query) {
  if (!query || !query.trim()) return bookmarks;
  const q = query.toLowerCase().trim();
  return bookmarks.filter((b) => {
    return (
      (b.title && b.title.toLowerCase().includes(q)) ||
      (b.description && b.description.toLowerCase().includes(q)) ||
      (b.url && b.url.toLowerCase().includes(q)) ||
      (b.tags && b.tags.some((t) => t.toLowerCase().includes(q)))
    );
  });
}
