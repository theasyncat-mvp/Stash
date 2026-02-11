<p align="center">
  <img src="public/favicon.svg" width="80" height="80" alt="Stash logo" />
</p>

<h1 align="center">Stash</h1>

<p align="center">
  A clean, local-only bookmark manager + read-later + RSS reader.<br/>
  No cloud, no accounts — your data stays in your browser.
</p>

<p align="center">
  <strong>Bookmarks</strong> &middot; <strong>Read Later</strong> &middot; <strong>RSS Reader</strong> &middot; <strong>Reader Mode</strong>
</p>

---

## Why Stash?

Raindrop.io is paid. Pocket is dead. Feedly wants your money. Stash gives you all three — **bookmarks, read-later, and RSS** — in one free, open-source, local-first app that runs entirely in your browser.

**Zero data leaves your machine.** Everything is stored in IndexedDB.

## Features

### Bookmarks
- Save any URL — metadata (title, description, favicon, og:image) fetched automatically
- Tag bookmarks for organization
- Create collections (folders) to group bookmarks
- Favorite, archive, and mark as read
- Grid and list views with sorting
- Personal notes on each bookmark
- Estimated reading time
- Duplicate URL detection

### RSS Reader
- Subscribe to any RSS 2.0 or Atom feed
- Articles imported as bookmarks automatically
- Unread count badges in sidebar
- Configurable auto-refresh (15min / 30min / 1hr / 6hr)
- OPML import/export for feed subscriptions
- Error tracking for broken feeds

### Reader Mode
- Clean, distraction-free article view
- Serif typography optimized for long-form reading
- Strips navigation, ads, sidebars, and clutter
- Content cached for offline re-reading

### Search & Sort
- Full-text search across titles, descriptions, URLs, and tags
- Sort by: newest, oldest, title A-Z/Z-A, domain
- Filter by: inbox, all, favorites, archive, tag, collection, feed

### Bulk Actions
- Multi-select with checkboxes (`Ctrl+B`)
- Bulk delete, archive, tag, or move to collection
- Select all / deselect all
- Undo support for destructive actions

### Import & Export
- **Export** bookmarks as JSON or HTML (Netscape Bookmark format)
- **Import** from JSON or browser bookmark exports (Chrome, Firefox, Safari, Edge)
- **OPML** import/export for RSS feed subscriptions

### Command Palette
- `Ctrl+K` opens a Spotlight-style command palette
- Search bookmarks, navigate views, run actions instantly

### Dark Mode
- Light / Dark / System theme
- Persisted across sessions

### PWA Ready
- Installable as a standalone desktop/mobile app
- Custom SVG favicon
- Fully responsive — mobile, tablet, and desktop

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Command palette |
| `Ctrl+N` | Add bookmark |
| `Ctrl+B` | Bulk select mode |
| `1` | Inbox |
| `2` | All Bookmarks |
| `3` | Favorites |
| `4` | Archive |
| `G` | Grid view |
| `L` | List view |
| `Esc` | Close panel / modal |
| `?` | Keyboard shortcuts help |

## Tech Stack

| | |
|---|---|
| **Framework** | React 19 |
| **Build** | Vite 7 |
| **Styling** | Tailwind CSS 4 |
| **State** | Zustand |
| **Storage** | IndexedDB (idb-keyval) |
| **Icons** | Lucide React |
| **Sanitization** | DOMPurify |
| **Font** | Inter |

No TypeScript. No component libraries. No backend.

## Getting Started

### Prerequisites

- Node.js 18+

### Install & Run

```bash
git clone https://github.com/asyncat/stash.git
cd stash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Build for Production

```bash
npm run build
npm run preview
```

### Deploy

Stash is a static site — deploy anywhere:

- **Vercel** / **Netlify** / **Cloudflare Pages** — connect the repo or drop the `dist/` folder
- **GitHub Pages** — push `dist/` to `gh-pages`
- **Any static host** — upload `dist/`

## Project Structure

```
src/
├── main.jsx                    Entry point
├── index.css                   Tailwind + global styles
├── App.jsx                     Root component
├── store/
│   ├── useBookmarkStore.js     Bookmarks, collections, bulk actions, sorting
│   ├── useFeedStore.js         RSS feeds, auto-refresh, OPML
│   ├── useThemeStore.js        Theme (light/dark/system)
│   └── useToastStore.js        Toast notifications
├── lib/
│   ├── storage.js              IndexedDB persistence
│   ├── metadata.js             URL metadata extraction via CORS proxy
│   ├── rss.js                  RSS/Atom parsing
│   ├── reader.js               Article content extraction
│   ├── search.js               Full-text search
│   ├── export.js               JSON/HTML/bookmark import & export
│   └── timeAgo.js              Relative timestamps
└── components/
    ├── Layout.jsx              Main layout + keyboard shortcuts
    ├── Sidebar.jsx             Navigation sidebar
    ├── SearchBar.jsx           Search input
    ├── BookmarkCard.jsx        Grid card
    ├── BookmarkRow.jsx         List row
    ├── BookmarkList.jsx        View renderer
    ├── BookmarkDetail.jsx      Detail panel (notes, tags, actions)
    ├── ReaderView.jsx          Reader mode
    ├── CommandPalette.jsx      Ctrl+K command palette
    ├── BulkActionBar.jsx       Bulk selection toolbar
    ├── SortDropdown.jsx        Sort menu
    ├── AddBookmark.jsx         Add bookmark modal
    ├── AddFeed.jsx             Subscribe to feed modal
    ├── AddCollection.jsx       New collection modal
    ├── TagManager.jsx          Tag editor
    ├── FeedList.jsx            Feed sidebar + auto-refresh settings
    ├── CollectionList.jsx      Collections sidebar
    ├── ContextMenu.jsx         Right-click menu
    ├── ViewToggle.jsx          Grid/list switch
    ├── ThemeToggle.jsx         Theme switch
    ├── ImportExport.jsx        Import/export menu
    ├── KeyboardShortcuts.jsx   Shortcuts help
    ├── EmptyState.jsx          Empty views
    └── Toast.jsx               Toast notifications
```

## Data & Privacy

All data lives in your browser's IndexedDB. **Nothing is sent to any server.** The only external requests are:

1. **CORS proxy** ([allorigins.win](https://allorigins.win/)) — used to fetch page metadata and RSS feeds, since browsers block cross-origin requests. Only the URL you're saving/subscribing to is sent. You can self-host a proxy by replacing the `PROXY` constant in `src/lib/metadata.js`, `src/lib/rss.js`, and `src/lib/reader.js`.

2. **Google Fonts** — Inter font loaded from Google Fonts CDN.

**To back up your data:** Use the export feature in the sidebar (JSON, HTML, or OPML).

## Browser Support

- Chrome / Edge 90+
- Firefox 90+
- Safari 15+

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes and verify: `npm run build`
4. Open a Pull Request

## License

MIT

---

<p align="center">Made with care by <strong>Asyncat</strong></p>
