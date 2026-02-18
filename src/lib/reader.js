import DOMPurify from 'dompurify';
import { fetchUrl } from './http.js';

const REMOVE_SELECTORS = [
  'script', 'style', 'nav', 'header', 'footer', 'aside', 'iframe', 'form',
  '[role="navigation"]', '[role="banner"]', '.sidebar', '.nav', '.footer',
  '.header', '.ads', '.advertisement', '.social-share', '.comments',
  '.related', '.share', '.newsletter',
];

export async function fetchReadableContent(url) {
  try {
    const html = await fetchUrl(url);
    return extractReadableContent(html, url);
  } catch {
    return null;
  }
}

export function extractReadableContent(htmlString, baseUrl) {
  const doc = new DOMParser().parseFromString(htmlString, 'text/html');

  // Resolve relative image/link URLs to absolute before any cleaning
  if (baseUrl) {
    try {
      const base = new URL(baseUrl);
      doc.querySelectorAll('img[src]').forEach((img) => {
        try {
          img.setAttribute('src', new URL(img.getAttribute('src'), base).href);
        } catch {}
      });
      doc.querySelectorAll('a[href]').forEach((a) => {
        try {
          a.setAttribute('href', new URL(a.getAttribute('href'), base).href);
        } catch {}
      });
    } catch {}
  }

  REMOVE_SELECTORS.forEach((sel) => {
    doc.querySelectorAll(sel).forEach((el) => el.remove());
  });

  const mainContent =
    doc.querySelector('article') ||
    doc.querySelector('main') ||
    doc.querySelector('[role="main"]') ||
    findLargestContentBlock(doc);

  if (!mainContent) return null;

  const cleaned = DOMPurify.sanitize(mainContent.innerHTML, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'img', 'ul', 'ol', 'li',
      'blockquote', 'pre', 'code', 'em', 'strong', 'br', 'figure', 'figcaption',
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'sup', 'sub', 'hr', 'span',
      'details', 'summary', 'dl', 'dt', 'dd', 'mark', 'abbr', 'time',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'datetime', 'loading'],
    // Add loading="lazy" to all images automatically
    FORBID_ATTR: [],
  });

  // Post-process: add loading=lazy to images
  const result = cleaned?.replace(/<img /g, '<img loading="lazy" ') || null;
  return result;
}

function findLargestContentBlock(doc) {
  let best = null;
  let bestCount = 0;
  const candidates = doc.querySelectorAll('div, section');
  candidates.forEach((el) => {
    const pCount = el.querySelectorAll('p').length;
    if (pCount > bestCount) {
      bestCount = pCount;
      best = el;
    }
  });
  return bestCount >= 2 ? best : doc.body;
}
