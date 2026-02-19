import { v4 as uuidv4 } from 'uuid';
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';

export async function exportBookmarks(bookmarks) {
  const clean = bookmarks
    .filter((b) => b.source !== 'feed')
    .map(({ _loading, ...b }) => b);
  const data = JSON.stringify(clean, null, 2);
  const date = new Date().toISOString().slice(0, 10);
  const filePath = await save({
    defaultPath: `stash-export-${date}.json`,
    filters: [{ name: 'JSON', extensions: ['json'] }],
  });
  if (!filePath) return;
  await writeTextFile(filePath, data);
}

export function importBookmarks(jsonString, existingBookmarks) {
  const parsed = JSON.parse(jsonString);
  if (!Array.isArray(parsed)) throw new Error('Invalid format: expected an array');

  const existingUrls = new Set(existingBookmarks.map((b) => b.url));
  let imported = 0;
  let skipped = 0;
  const newBookmarks = [];

  for (const item of parsed) {
    if (!item.url) { skipped++; continue; }
    if (existingUrls.has(item.url)) { skipped++; continue; }
    if (!item.id) item.id = uuidv4();
    if (!item.createdAt) item.createdAt = Date.now();
    if (!item.updatedAt) item.updatedAt = Date.now();
    if (!item.tags) item.tags = [];
    if (item.notes === undefined) item.notes = '';
    newBookmarks.push(item);
    existingUrls.add(item.url);
    imported++;
  }

  return { imported, skipped, bookmarks: newBookmarks };
}

export async function exportBookmarksAsHTML(bookmarks) {
  bookmarks = bookmarks.filter((b) => b.source !== 'feed');
  const lines = ['<!DOCTYPE NETSCAPE-Bookmark-file-1>', '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">', '<TITLE>Stash Bookmarks</TITLE>', '<H1>Stash Bookmarks</H1>', '<DL><p>'];

  const tagGroups = {};
  const untagged = [];

  bookmarks.forEach((b) => {
    if (b.tags && b.tags.length > 0) {
      b.tags.forEach((tag) => {
        if (!tagGroups[tag]) tagGroups[tag] = [];
        tagGroups[tag].push(b);
      });
    } else {
      untagged.push(b);
    }
  });

  Object.entries(tagGroups).forEach(([tag, items]) => {
    lines.push(`  <DT><H3>${escapeHtml(tag)}</H3>`);
    lines.push('  <DL><p>');
    items.forEach((b) => {
      const addDate = Math.floor(b.createdAt / 1000);
      lines.push(`    <DT><A HREF="${escapeHtml(b.url)}" ADD_DATE="${addDate}">${escapeHtml(b.title)}</A>`);
      if (b.description) lines.push(`    <DD>${escapeHtml(b.description)}`);
    });
    lines.push('  </DL><p>');
  });

  untagged.forEach((b) => {
    const addDate = Math.floor(b.createdAt / 1000);
    lines.push(`  <DT><A HREF="${escapeHtml(b.url)}" ADD_DATE="${addDate}">${escapeHtml(b.title)}</A>`);
    if (b.description) lines.push(`  <DD>${escapeHtml(b.description)}`);
  });

  lines.push('</DL><p>');

  const html = lines.join('\n');
  const filePath = await save({
    defaultPath: `stash-bookmarks-${new Date().toISOString().slice(0, 10)}.html`,
    filters: [{ name: 'HTML', extensions: ['html'] }],
  });
  if (!filePath) return;
  await writeTextFile(filePath, html);
}

export function importBookmarksFromHTML(htmlString, existingBookmarks) {
  const doc = new DOMParser().parseFromString(htmlString, 'text/html');
  const links = doc.querySelectorAll('a');
  const existingUrls = new Set(existingBookmarks.map((b) => b.url));

  let imported = 0;
  let skipped = 0;
  const newBookmarks = [];

  let currentFolder = null;
  const allH3s = doc.querySelectorAll('h3');
  const folderMap = new Map();
  allH3s.forEach((h3) => {
    const dl = h3.nextElementSibling;
    if (dl && dl.tagName === 'DL') {
      const anchors = dl.querySelectorAll(':scope > dt > a');
      anchors.forEach((a) => {
        folderMap.set(a, h3.textContent.trim().toLowerCase());
      });
    }
  });

  links.forEach((link) => {
    const url = link.getAttribute('href');
    if (!url || !url.startsWith('http')) { skipped++; return; }
    if (existingUrls.has(url)) { skipped++; return; }

    const title = link.textContent.trim() || url;
    const addDate = link.getAttribute('ADD_DATE');
    const tag = folderMap.get(link);

    const bookmark = {
      id: uuidv4(),
      url,
      title,
      description: '',
      favicon: null,
      ogImage: null,
      tags: tag ? [tag] : [],
      collectionId: null,
      isFavorite: false,
      isArchived: false,
      isRead: false,
      readableContent: null,
      notes: '',
      readingTime: 0,
      source: 'manual',
      feedId: null,
      createdAt: addDate ? parseInt(addDate) * 1000 : Date.now(),
      updatedAt: Date.now(),
    };

    newBookmarks.push(bookmark);
    existingUrls.add(url);
    imported++;
  });

  return { imported, skipped, bookmarks: newBookmarks };
}

function escapeHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
