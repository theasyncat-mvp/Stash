const PROXY = 'https://api.allorigins.win/raw?url=';

export async function fetchMetadata(url) {
  try {
    const res = await fetch(`${PROXY}${encodeURIComponent(url)}`);
    if (!res.ok) throw new Error('Fetch failed');
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    const getMeta = (property) => {
      const el =
        doc.querySelector(`meta[property="${property}"]`) ||
        doc.querySelector(`meta[name="${property}"]`);
      return el ? el.getAttribute('content') : null;
    };

    const title =
      getMeta('og:title') ||
      doc.querySelector('title')?.textContent?.trim() ||
      url;

    const description =
      getMeta('og:description') ||
      getMeta('description') ||
      '';

    const ogImage = getMeta('og:image') || null;

    let favicon = null;
    const iconLink =
      doc.querySelector('link[rel="icon"]') ||
      doc.querySelector('link[rel="shortcut icon"]');
    if (iconLink) {
      const href = iconLink.getAttribute('href');
      if (href) {
        if (href.startsWith('http')) {
          favicon = href;
        } else {
          const origin = new URL(url).origin;
          favicon = href.startsWith('/')
            ? `${origin}${href}`
            : `${origin}/${href}`;
        }
      }
    }
    if (!favicon) {
      try {
        favicon = `${new URL(url).origin}/favicon.ico`;
      } catch {
        favicon = null;
      }
    }

    return { title, description, favicon, ogImage };
  } catch {
    return { title: url, description: '', favicon: null, ogImage: null };
  }
}
