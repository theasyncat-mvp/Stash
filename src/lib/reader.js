import DOMPurify from 'dompurify';

const PROXY = 'https://api.allorigins.win/raw?url=';

const REMOVE_SELECTORS = [
  'script', 'style', 'nav', 'header', 'footer', 'aside', 'iframe', 'form',
  '[role="navigation"]', '[role="banner"]', '.sidebar', '.nav', '.footer',
  '.header', '.ads', '.advertisement', '.social-share', '.comments',
  '.related', '.share', '.newsletter',
];

export async function fetchReadableContent(url) {
  try {
    const res = await fetch(`${PROXY}${encodeURIComponent(url)}`);
    if (!res.ok) throw new Error('Fetch failed');
    const html = await res.text();
    return extractReadableContent(html);
  } catch {
    return null;
  }
}

export function extractReadableContent(htmlString) {
  const doc = new DOMParser().parseFromString(htmlString, 'text/html');

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
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title'],
  });

  return cleaned || null;
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
