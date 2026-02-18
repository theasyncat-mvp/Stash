import { fetchUrl } from './http.js';

export async function fetchAndParseRSS(rssUrl) {
  const text = await fetchUrl(rssUrl);
  const doc = new DOMParser().parseFromString(text, 'application/xml');

  const parseError = doc.querySelector('parsererror');
  if (parseError) throw new Error('Invalid RSS/Atom feed');

  const isAtom = doc.documentElement.tagName === 'feed';

  if (isAtom) {
    return parseAtom(doc);
  }
  return parseRSS(doc);
}

function parseRSS(doc) {
  const channel = doc.querySelector('channel');
  const feedTitle = channel?.querySelector('title')?.textContent?.trim() || 'Untitled Feed';
  const feedLink = channel?.querySelector('link')?.textContent?.trim() || '';

  const items = Array.from(doc.querySelectorAll('item')).map((item) => {
    const title = item.querySelector('title')?.textContent?.trim() || 'Untitled';
    const link = item.querySelector('link')?.textContent?.trim() || '';
    const rawDesc = item.querySelector('description')?.textContent?.trim() || '';
    const description = stripHtml(rawDesc).slice(0, 300);
    const pubDate = item.querySelector('pubDate')?.textContent?.trim() || '';
    const guid = item.querySelector('guid')?.textContent?.trim() || link;
    const image = extractRSSImage(item, rawDesc);

    return {
      title,
      url: link,
      description,
      image,
      pubDate: pubDate ? new Date(pubDate).getTime() : Date.now(),
      guid,
    };
  });

  return {
    feed: { title: feedTitle, siteUrl: feedLink },
    items,
  };
}

function parseAtom(doc) {
  const feedTitle = doc.querySelector('feed > title')?.textContent?.trim() || 'Untitled Feed';
  const feedLinkEl =
    doc.querySelector('feed > link[rel="alternate"]') ||
    doc.querySelector('feed > link');
  const feedLink = feedLinkEl?.getAttribute('href') || '';

  const items = Array.from(doc.querySelectorAll('entry')).map((entry) => {
    const title = entry.querySelector('title')?.textContent?.trim() || 'Untitled';
    const linkEl =
      entry.querySelector('link[rel="alternate"]') ||
      entry.querySelector('link');
    const link = linkEl?.getAttribute('href') || '';
    const rawDesc =
      entry.querySelector('summary')?.textContent?.trim() ||
      entry.querySelector('content')?.textContent?.trim() ||
      '';
    const description = stripHtml(rawDesc).slice(0, 300);
    const pubDate =
      entry.querySelector('published')?.textContent?.trim() ||
      entry.querySelector('updated')?.textContent?.trim() ||
      '';
    const guid = entry.querySelector('id')?.textContent?.trim() || link;
    const rawContent =
      entry.querySelector('content')?.textContent?.trim() ||
      entry.querySelector('summary')?.textContent?.trim() || '';
    const image = extractRSSImage(entry, rawContent);

    return {
      title,
      url: link,
      description,
      image,
      pubDate: pubDate ? new Date(pubDate).getTime() : Date.now(),
      guid,
    };
  });

  return {
    feed: { title: feedTitle, siteUrl: feedLink },
    items,
  };
}

/**
 * Try to extract an image URL from a feed item using common conventions:
 * media:content, media:thumbnail, enclosure, or first <img> in the HTML body.
 */
function extractRSSImage(el, rawHtml) {
  // media:content with image type
  const mediaContent = el.querySelector('content');
  if (mediaContent) {
    const medium = mediaContent.getAttribute('medium');
    const type = mediaContent.getAttribute('type') || '';
    const url = mediaContent.getAttribute('url');
    if (url && (medium === 'image' || type.startsWith('image/'))) return url;
  }

  // media:thumbnail
  const mediaThumbnail = el.querySelector('thumbnail');
  if (mediaThumbnail) {
    const url = mediaThumbnail.getAttribute('url');
    if (url) return url;
  }

  // enclosure (podcasts / media feeds)
  const enclosure = el.querySelector('enclosure');
  if (enclosure) {
    const type = enclosure.getAttribute('type') || '';
    const url = enclosure.getAttribute('url');
    if (url && type.startsWith('image/')) return url;
  }

  // First <img> inside the raw HTML description/content
  if (rawHtml) {
    const htmlDoc = new DOMParser().parseFromString(rawHtml, 'text/html');
    const img = htmlDoc.querySelector('img[src]');
    if (img) {
      const src = img.getAttribute('src');
      if (src && src.startsWith('http')) return src;
    }
  }

  return null;
}

function stripHtml(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}
