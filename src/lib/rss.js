const PROXY = 'https://api.allorigins.win/raw?url=';

export async function fetchAndParseRSS(rssUrl) {
  const res = await fetch(`${PROXY}${encodeURIComponent(rssUrl)}`);
  if (!res.ok) throw new Error('Failed to fetch feed');
  const text = await res.text();
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

    return {
      title,
      url: link,
      description,
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

    return {
      title,
      url: link,
      description,
      pubDate: pubDate ? new Date(pubDate).getTime() : Date.now(),
      guid,
    };
  });

  return {
    feed: { title: feedTitle, siteUrl: feedLink },
    items,
  };
}

function stripHtml(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}
