# Contributing to Stash

Thanks for your interest in contributing! This guide covers everything you need to get set up, the code style we follow, and how to submit changes.

---

## Table of Contents

- [Development Setup](#development-setup)
- [Project Architecture](#project-architecture)
- [Code Style](#code-style)
- [Making Changes](#making-changes)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)

---

## Development Setup

### Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 18+ | [nodejs.org](https://nodejs.org/) |
| Rust | stable | Install via [rustup.rs](https://rustup.rs/) |
| Tauri CLI | v2 | Installed via npm (no global install needed) |
| OS deps | — | [Tauri prerequisites](https://tauri.app/start/prerequisites/) — WebView2 on Windows, webkit2gtk on Linux |

### First-time setup

```bash
# Clone
git clone https://github.com/asyncat/stash.git
cd stash

# Install JS dependencies
npm install

# Verify Rust toolchain
rustup show
```

### Running in development

```bash
npx tauri dev
```

This starts the Vite dev server and the Tauri window simultaneously. The frontend hot-reloads on save; Rust changes trigger a recompile.

### Building for production

```bash
npx tauri build
```

Installer output → `src-tauri/target/release/bundle/`

### Loading the browser extension

1. `chrome://extensions` → enable **Developer mode**
2. **Load unpacked** → select the `browser-extension/` folder
3. Stash must be running for the extension to communicate

---

## Project Architecture

Stash is a **Tauri v2** app — a Rust backend hosting a React 19 frontend in a WebView.

```
┌─────────────────────────────────────┐
│  WebView (React + Vite)             │
│  • UI, state (Zustand)              │
│  • Calls Tauri commands via invoke  │
├─────────────────────────────────────┤
│  Rust (src-tauri/src/lib.rs)        │
│  • fetch_url — bypasses WebView CORS│
│  • Extension HTTP server (port 21890│
│  • Tray icon + minimize-to-tray     │
│  • Tauri event bus                  │
└─────────────────────────────────────┘
```

### Key files

| File | Responsibility |
|------|---------------|
| `src/App.jsx` | Root, theme init, extension event listener |
| `src/store/useBookmarkStore.js` | All bookmark state + filtering + undo |
| `src/store/useFeedStore.js` | Feed state, categories, auto-refresh, OPML |
| `src/lib/storage.js` | All Tauri plugin-store read/write |
| `src/lib/rss.js` | RSS 2.0 + Atom parser, image extraction |
| `src/lib/reader.js` | Article extraction + HTML sanitization |
| `src-tauri/src/lib.rs` | Rust commands + extension HTTP server |
| `src-tauri/capabilities/default.json` | Tauri permission grants |

### Data flow

- **Persistence** — `src/lib/storage.js` wraps all reads/writes. State is loaded on startup via `loadAll()` / `loadFeeds()` and saved after every mutation.
- **HTTP** — All outbound requests go through the Rust `fetch_url` command to avoid CORS issues in the WebView.
- **Extension → App** — The Rust axum server on port 21890 receives POSTs from the browser extension and emits a `extension-save-bookmark` Tauri event. `App.jsx` listens and calls `addBookmark()`.

---

## Code Style

### General

- **No TypeScript** — plain JavaScript (`.js` / `.jsx`)
- **No component libraries** — custom UI built with Tailwind
- Prefer small, focused components over large monoliths
- Co-locate logic close to where it's used

### JavaScript / React

- **Functional components only** — no class components
- Use `useCallback` and `useMemo` for expensive operations or stable references passed as props
- State lives in Zustand stores (`src/store/`), not local component state, unless it's purely UI state (open/close, hover)
- Zustand stores use a flat action structure — actions are methods on the store object
- Always clean up `useEffect` subscriptions (event listeners, Tauri event listeners)

```js
// Good — cleanup returned
useEffect(() => {
  const unlisten = listen('some-event', handler);
  return () => { unlisten.then(fn => fn()); };
}, []);
```

### Tailwind CSS

- Use Tailwind utility classes directly — no custom CSS unless unavoidable
- Dark mode via `dark:` variants — always provide both light and dark styles
- Avoid arbitrary values where a standard scale value works (prefer `w-48` over `w-[192px]`)
- Animation classes defined in `index.css` (`animate-fadeIn`, `animate-slideInRight`, etc.)

### Rust

- Follow standard `rustfmt` formatting — run `cargo fmt` before committing
- All Tauri commands must be `async` and return `Result<T, String>`
- Log with `log::info!` / `log::warn!` / `log::error!` (the `tauri-plugin-log` is active)
- Keep `lib.rs` focused on Tauri glue — complex logic belongs in separate modules

### Naming conventions

| Thing | Convention |
|-------|-----------|
| Components | `PascalCase.jsx` |
| Stores | `useCamelCase.js` |
| Lib utilities | `camelCase.js` |
| CSS classes | Tailwind utilities only |
| Rust functions | `snake_case` |
| Tauri commands | `snake_case` (invoked as `snake_case` from JS) |

---

## Making Changes

### Branch naming

```
feature/short-description
fix/what-was-broken
chore/what-was-cleaned-up
```

### Workflow

```bash
# Create a branch from main
git checkout -b feature/my-feature

# Make changes, verify the app builds
npx tauri build

# Check Rust compiles cleanly
cargo check --manifest-path src-tauri/Cargo.toml

# Commit with a clear message
git commit -m "feat: add X that does Y"

# Push and open a PR
git push origin feature/my-feature
```

### Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add reader view font size setting
fix: feed items no longer appear in All Bookmarks view
chore: remove unused imports in BookmarkCard
docs: update README with Tauri setup steps
```

---

## Pull Request Process

1. **Open a PR against `main`**
2. Fill in the PR description — what changed and why
3. Include a screenshot or recording if the change is visual
4. Ensure `npx tauri build` passes with no errors
5. Keep PRs focused — one feature or fix per PR makes review easier
6. A maintainer will review and may request changes before merging

### What makes a good PR

- Minimal diff — don't reformat unrelated code
- No new external dependencies without discussion (open an issue first)
- Accessibility considered — keyboard navigation, ARIA labels where appropriate
- Dark mode tested for any UI changes

---

## Reporting Bugs

Open an issue with:

1. **Steps to reproduce** — exact sequence to trigger the bug
2. **Expected behaviour** — what should happen
3. **Actual behaviour** — what actually happens
4. **Environment** — OS, Stash version
5. **Logs** — open the Tauri dev console (`Ctrl+Shift+I` in dev mode) and paste relevant errors

---

## Questions?

Open a [GitHub Discussion](https://github.com/asyncat/stash/discussions) for anything that isn't a bug or feature request.
