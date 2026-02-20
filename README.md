<p align="center">
  <img src="public/favicon.svg" width="80" height="80" alt="Stash logo" />
</p>

<h1 align="center">Stash</h1>

<p align="center">
  A clean, local-first desktop app for bookmarks, read-later, and RSS.<br/>
  No cloud, no accounts — your data never leaves your machine.
</p>

<p align="center">
  <strong>Bookmarks</strong> &middot; <strong>Read Later</strong> &middot; <strong>RSS Reader</strong> &middot; <strong>Reader Mode</strong> &middot; <strong>Browser Extension</strong>
</p>

---

## Why Stash?

Raindrop.io is paid. Pocket is dead. Feedly wants your money. Stash gives you all three — **bookmarks, read-later, and RSS** — in one free, open-source, local-first **desktop app** that runs entirely on your machine.

**Zero data leaves your machine.** Everything is stored locally via Tauri's plugin-store. HTTP requests (metadata, RSS, reader mode) go directly from the Rust backend — no CORS proxies, no third parties.

## Features

### Bookmarks
- Save any URL — title, description, favicon, og:image fetched automatically from Rust
- Tag bookmarks for organization with autocomplete
- Create collections (folders) to group bookmarks
- Favorite, archive, and mark as read
- Grid and list views with sorting
- Personal notes on each bookmark
- Estimated reading time
- Duplicate URL detection & scanner
- Drag & drop reordering and between collections/tags
- Bulk actions: delete, archive, tag, move (multi-select with `Ctrl+B`)
- Full undo support for destructive actions

### RSS Reader
- Subscribe to any RSS 2.0 or Atom feed
- Articles imported as bookmarks automatically, with images extracted from `media:content`, `media:thumbnail`, enclosures, or inline HTML
- Feed categories with collapsible groups in sidebar
- Unread count badges
- Configurable auto-refresh (manual / 15min / 30min / 1hr / 6hr)
- OPML import/export with category support
- Error tracking for broken feeds

### Reader Mode
- Clean, distraction-free article view with full typography
- Reading progress bar and estimated read time
- Hero image, favicon, domain, and article metadata in header
- Auto mark-as-read after 3 seconds
- Scroll-to-top button
- Content cached for offline re-reading
- Configurable font size, font family, and line width (persisted)

### Browser Extension
- Companion Chrome/Firefox extension for one-click save-to-Stash
- Stash runs a local HTTP server (port 21890) — extension POSTs directly to it
- Shows page preview (favicon, title, URL) with tag input before saving
- Offline detection — shows banner if Stash isn't running
- Manifest V3, no external permissions

### Search & Sort
- Fuzzy full-text search (Fuse.js) across titles, descriptions, URLs, and tags
- Sort by: newest, oldest, title A–Z/Z–A, domain
- Filter by: inbox, all, favorites, archive, tag, collection, feed

### Import & Export
- Export bookmarks as JSON or HTML (Netscape Bookmark format)
- Import from JSON or browser bookmark exports (Chrome, Firefox, Safari, Edge)
- OPML import/export for RSS feed subscriptions

### Command Palette
- `Ctrl+K` opens a Spotlight-style command palette
- Search bookmarks, navigate views, run actions instantly

### UI & UX
- Custom frameless title bar with native window controls (minimize, maximize, close)
- Light / Dark / System theme, persisted across sessions
- Right-click context menus on bookmarks and feeds
- Keyboard shortcut reference accessible from sidebar
- Toast notifications with undo
- Custom confirmation dialogs

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
| `↓ / J` | Next bookmark |
| `↑ / K` | Previous bookmark |
| `Enter` | Open focused bookmark |
| `O` | Open in browser |
| `Esc` | Close panel / modal |
| `?` | Keyboard shortcuts help |

## Tech Stack

| Layer | Technology |
|---|---|
| **Desktop shell** | Tauri v2 |
| **Backend** | Rust (reqwest, axum, tokio) |
| **Frontend** | React 19 |
| **Build** | Vite 7 |
| **Styling** | Tailwind CSS v4 |
| **State** | Zustand |
| **Storage** | Tauri plugin-store (JSON) |
| **Search** | Fuse.js |
| **Drag & drop** | @dnd-kit |
| **Icons** | Lucide React |
| **Sanitization** | DOMPurify |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://rustup.rs/) (stable toolchain)
- [Tauri prerequisites](https://tauri.app/start/prerequisites/) for your OS (WebView2 on Windows, etc.)

### Install & Run (Development)

```bash
git clone https://github.com/asyncat/stash.git
cd stash
npm install
npx tauri dev
```

### Build for Production

```bash
npx tauri build
```

The installer is output to `src-tauri/target/release/bundle/`.

### Browser Extension (optional)

1. Open `chrome://extensions` (Chrome) or `about:debugging` (Firefox)
2. Enable **Developer mode**
3. Click **Load unpacked** → select the `browser-extension/` folder
4. Launch Stash, then click the extension icon on any page to save

## Project Structure

```
stash/
├── src/                        Frontend (React)
│   ├── main.jsx
│   ├── index.css               Tailwind + global typography
│   ├── App.jsx                 Root component + extension event listener
│   ├── store/
│   │   ├── useBookmarkStore.js Bookmarks, collections, bulk, undo
│   │   ├── useFeedStore.js     RSS feeds, categories, auto-refresh
│   │   ├── useThemeStore.js    Theme (light / dark / system)
│   │   └── useToastStore.js    Toasts
│   ├── lib/
│   │   ├── storage.js          Tauri plugin-store persistence
│   │   ├── metadata.js         URL metadata extraction
│   │   ├── rss.js              RSS 2.0 / Atom parser
│   │   ├── reader.js           Article extraction + sanitization
│   │   ├── search.js           Fuse.js search
│   │   ├── export.js           JSON / HTML / OPML import & export
│   │   └── timeAgo.js          Relative timestamps
│   └── components/
│       ├── Layout.jsx          Main layout + keyboard shortcuts
│       ├── Sidebar.jsx         Navigation sidebar
│       ├── BookmarkCard.jsx    Grid card
│       ├── BookmarkRow.jsx     List row
│       ├── BookmarkList.jsx    Virtualised list/grid
│       ├── BookmarkDetail.jsx  Detail panel
│       ├── ReaderView.jsx      Reader mode
│       ├── FeedList.jsx        Feed sidebar with categories
│       ├── CollectionList.jsx  Collections sidebar
│       ├── CommandPalette.jsx  Ctrl+K palette
│       ├── BulkActionBar.jsx   Bulk selection toolbar
│       └── ...                 Modals, toasts, context menus
├── src-tauri/                  Rust backend
│   ├── src/
│   │   ├── main.rs
│   │   └── lib.rs              Commands, extension HTTP server, tray
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── capabilities/
│       └── default.json        Tauri permission grants
└── browser-extension/          Companion browser extension
    ├── manifest.json           MV3
    ├── popup.html / .css / .js
    └── icons/
```

## Data & Privacy

All data is stored in a single JSON file on your machine via Tauri's plugin-store (`stash-data.json` in your OS app data directory). **Nothing is sent to any external server.**

Outbound HTTP requests (metadata fetching, RSS, reader mode) originate **directly from the Rust process** using `reqwest` — not from the WebView — so there is no CORS exposure.

**To back up your data:** Use the export feature (JSON, HTML, or OPML).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT

---

<p align="center">Made with care by <strong>Asyncat</strong></p>