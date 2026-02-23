import { useState, useEffect, useRef } from "react";
// Note: DnD is handled by the outer DndProvider in Layout.jsx — no nested DndContext needed
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { open as shellOpen } from "@tauri-apps/plugin-shell";
import {
  Plus,
  Trash2,
  ExternalLink,
  Settings,
  X,
  Eye,
  EyeOff,
  ShieldOff,
  Globe,
  Grid3X3,
  List,
  ArrowUpDown,
  Copy,
  Clock,
  GripVertical,
} from "lucide-react";
import { useVaultStore } from "../store/useVaultStore.js";
import { fetchMetadata } from "../lib/metadata.js";
import { timeAgo } from "../lib/timeAgo.js";
import { useToastStore } from "../store/useToastStore.js";
import Modal from "./ui/Modal.jsx";
import Dropdown from "./ui/Dropdown.jsx";

// ── Add bookmark modal ─────────────────────────────────────────────────────────
function AddVaultBookmark({ onClose }) {
  const { addBookmark, updateBookmark } = useVaultStore();
  const [url, setUrl] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    let finalUrl = trimmed;
    if (!/^https?:\/\//i.test(finalUrl)) finalUrl = "https://" + finalUrl;
    try {
      new URL(finalUrl);
    } catch {
      return;
    }

    // Add immediately with tags, then fetch metadata in background
    const id = await addBookmark({ url: finalUrl, tags });
    onClose();
    fetchMetadata(finalUrl)
      .then((meta) => {
        if (meta && id) updateBookmark(id, meta);
      })
      .catch(() => {});
  };

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase();
      if (tag && !tags.includes(tag)) setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const removeTag = (tag) => setTags(tags.filter((t) => t !== tag));

  return (
    <Modal title="Add to Vault" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste a URL..."
          autoFocus
          aria-label="Bookmark URL"
          className="w-full px-3 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 mb-3 focus:border-blue-500 dark:focus:border-blue-400 transition-colors duration-150"
        />
        <div className="mb-4">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs px-2 py-0.5 rounded-full"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  aria-label={`Remove tag ${tag}`}
                  className="hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="Add tags (press Enter)"
            aria-label="Add tags"
            className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-blue-500 dark:focus:border-blue-400 transition-colors duration-150"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors duration-150 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-black font-bold rounded-lg transition-colors duration-150 cursor-pointer flex items-center gap-1.5"
          >
            <Plus size={14} />
            Add
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Keyboard shortcut capture ──────────────────────────────────────────────────
function ShortcutCapture({ value, onChange }) {
  const [capturing, setCapturing] = useState(false);

  const getParts = (sc) => {
    if (!sc) return null;
    const parts = [];
    if (sc.modifiers.includes("Meta")) parts.push("⌘");
    if (sc.modifiers.includes("Control")) parts.push("Ctrl");
    if (sc.modifiers.includes("Alt")) parts.push("⌥");
    if (sc.modifiers.includes("Shift")) parts.push("⇧");
    parts.push(sc.key.toUpperCase());
    return parts;
  };

  const handleKeyDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.key === "Escape") {
      setCapturing(false);
      return;
    }
    const modifierKeys = ["Control", "Shift", "Alt", "Meta", "CapsLock", "Tab"];
    if (modifierKeys.includes(e.key)) return;
    const modifiers = [];
    if (e.metaKey) modifiers.push("Meta");
    if (e.ctrlKey) modifiers.push("Control");
    if (e.altKey) modifiers.push("Alt");
    if (e.shiftKey) modifiers.push("Shift");
    if (modifiers.length === 0) {
      setCapturing(false);
      return;
    }
    onChange({ key: e.key, modifiers });
    setCapturing(false);
  };

  const parts = getParts(value);

  return (
    <div className="flex items-center gap-2">
      {capturing ? (
        <input
          autoFocus
          readOnly
          onKeyDown={handleKeyDown}
          onBlur={() => setCapturing(false)}
          placeholder="Press a key combo…"
          className="flex-1 px-3 py-1.5 text-xs bg-blue-50 dark:bg-blue-500/10 border border-blue-300 dark:border-blue-500/50 rounded-lg text-zinc-500 dark:text-zinc-400 placeholder:text-zinc-400 outline-none"
        />
      ) : (
        <button
          onClick={() => setCapturing(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 rounded-lg transition-colors duration-150 cursor-pointer min-w-24"
        >
          {parts ? (
            parts.map((p, i) => (
              <kbd
                key={i}
                className="font-mono text-[11px] text-zinc-700 dark:text-zinc-300"
              >
                {p}
              </kbd>
            ))
          ) : (
            <span className="text-zinc-400 dark:text-zinc-500">Not set</span>
          )}
        </button>
      )}
      {value && (
        <button
          onClick={() => onChange(null)}
          className="text-xs text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors duration-150 cursor-pointer"
        >
          Clear
        </button>
      )}
    </div>
  );
}

// ── Settings modal ─────────────────────────────────────────────────────────────
function VaultSettings({ onClose }) {
  const {
    isSidebarVisible,
    toggleSidebarVisible,
    vaultShortcut,
    setVaultShortcut,
    changePassword,
    remove,
  } = useVaultStore();
  const [tab, setTab] = useState("general");
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [removePw, setRemovePw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showRemovePw, setShowRemovePw] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hideWarning, setHideWarning] = useState(false);

  const handleToggleSidebar = () => {
    // Prevent hiding the vault from the sidebar if no keyboard shortcut is set
    if (isSidebarVisible && !vaultShortcut) {
      setHideWarning(true);
      return;
    }
    setHideWarning(false);
    toggleSidebarVisible();
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");
    if (newPw !== confirmPw) {
      setError("New passwords do not match.");
      return;
    }
    if (newPw.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }
    setLoading(true);
    try {
      await changePassword(oldPw, newPw);
      setMsg("Password changed successfully.");
      setOldPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (err) {
      setError(
        String(err).includes("Invalid")
          ? "Old password is incorrect."
          : `Error: ${err}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");
    setLoading(true);
    try {
      const ok = await remove(removePw);
      if (!ok) {
        setError("Incorrect password.");
        setLoading(false);
        return;
      }
      onClose();
    } catch (err) {
      setError(`Error: ${err}`);
      setLoading(false);
    }
  };

  return (
    <Modal title="Vault Settings" onClose={onClose} className="max-w-sm">
      {/* Tab bar */}
      <div className="flex gap-0.5 mb-5 border-b border-zinc-100 dark:border-zinc-800">
        {[
          ["general", "General"],
          ["password", "Password"],
          ["remove", "Remove"],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => {
              setTab(id);
              setError("");
              setMsg("");
            }}
            className={`px-3 py-2 text-xs font-medium transition-colors duration-150 cursor-pointer border-b-2 -mb-px ${
              tab === id
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "general" && (
        <div>
          {/* Hide from sidebar */}
          <div className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <p className="text-sm text-zinc-900 dark:text-zinc-100">
                Hide from sidebar
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                Remove vault from sidebar navigation
              </p>
            </div>
            <button
              onClick={handleToggleSidebar}
              aria-pressed={!isSidebarVisible}
              className={`relative w-9 h-5 rounded-full transition-colors duration-200 cursor-pointer shrink-0 ml-4 ${
                !isSidebarVisible
                  ? "bg-blue-500"
                  : "bg-zinc-200 dark:bg-zinc-700"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                  !isSidebarVisible ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Keyboard shortcut */}
          <div className="py-3">
            <p className="text-sm text-zinc-900 dark:text-zinc-100 mb-0.5">
              Keyboard shortcut
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-2">
              Open vault when hidden from sidebar
            </p>
            <ShortcutCapture
              value={vaultShortcut}
              onChange={(sc) => {
                setVaultShortcut(sc);
                setHideWarning(false);
              }}
            />
          </div>

          {hideWarning && (
            <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-3 py-2 rounded-lg">
              Set a keyboard shortcut first — otherwise you won't be able to open the vault once it's hidden.
            </p>
          )}
        </div>
      )}

      {tab === "password" && (
        <form onSubmit={handleChangePassword} className="space-y-3">
          {[
            [oldPw, setOldPw, "Current password", "current-password"],
            [newPw, setNewPw, "New password", "new-password"],
            [confirmPw, setConfirmPw, "Confirm new password", "new-password"],
          ].map(([val, setter, placeholder, autocomplete]) => (
            <div key={placeholder} className="relative">
              <input
                type={showPw ? "text" : "password"}
                placeholder={placeholder}
                value={val}
                onChange={(e) => setter(e.target.value)}
                autoComplete={autocomplete}
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors duration-150"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer"
          >
            {showPw ? <EyeOff size={12} /> : <Eye size={12} />}
            {showPw ? "Hide" : "Show"} passwords
          </button>
          {error && <p className="text-xs text-red-500">{error}</p>}
          {msg && <p className="text-xs text-blue-500">{msg}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 text-sm font-semibold bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-black rounded-lg transition-colors duration-150 cursor-pointer"
          >
            {loading ? "Changing…" : "Change Password"}
          </button>
        </form>
      )}

      {tab === "remove" && (
        <form onSubmit={handleRemove} className="space-y-3">
          <div className="flex items-start gap-2.5 p-3 bg-red-50 dark:bg-red-500/10 rounded-lg">
            <ShieldOff size={14} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed">
              This will permanently delete all encrypted vault bookmarks. This
              cannot be undone.
            </p>
          </div>
          <div className="relative">
            <input
              type={showRemovePw ? "text" : "password"}
              placeholder="Enter password to confirm"
              value={removePw}
              onChange={(e) => setRemovePw(e.target.value)}
              className="w-full px-3 py-2 pr-10 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-red-500 transition-colors duration-150"
            />
            <button
              type="button"
              onClick={() => setShowRemovePw((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer"
            >
              {showRemovePw ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading || !removePw}
            className="w-full py-2 text-sm font-semibold bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg transition-colors duration-150 cursor-pointer"
          >
            {loading ? "Removing…" : "Remove Vault"}
          </button>
        </form>
      )}
    </Modal>
  );
}

// ── Vault bookmark card (grid) ─────────────────────────────────────────────────
function VaultBookmarkCard({ bookmark, isFocused, onSelect, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: bookmark.id,
    data: { type: "vault-bookmark", bookmark },
  });

  const domain = (() => {
    try {
      return new URL(bookmark.url).hostname.replace("www.", "");
    } catch {
      return bookmark.url;
    }
  })();

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
      className={`group relative bg-white dark:bg-zinc-900 border rounded-xl overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer ${
        isFocused
          ? "border-blue-400 dark:border-blue-500 ring-1 ring-blue-400/50 dark:ring-blue-500/40"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
      onClick={onSelect}
      {...attributes}
    >
      {/* Drag handle */}
      <div
        {...listeners}
        className="absolute top-2 left-2 z-10 p-1 rounded bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm text-zinc-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 hover:text-zinc-500 dark:hover:text-zinc-400 transition-opacity duration-150 cursor-grab active:cursor-grabbing"
        aria-label="Drag to reorder"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={12} aria-hidden="true" />
      </div>

      {bookmark.ogImage ? (
        <div className="h-36 overflow-hidden bg-zinc-50 dark:bg-zinc-800/50 relative">
          <Globe
            size={24}
            className="fallback-icon hidden absolute inset-0 m-auto text-zinc-300 dark:text-zinc-600"
            aria-hidden="true"
          />
          <img
            src={bookmark.ogImage}
            alt=""
            className="w-full h-full object-cover relative"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.parentElement
                .querySelector(".fallback-icon")
                ?.classList.remove("hidden");
            }}
          />
        </div>
      ) : (
        <div className="h-36 bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-center">
          {bookmark.favicon ? (
            <img
              src={bookmark.favicon}
              alt=""
              className="w-8 h-8 opacity-40"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          ) : (
            <Globe size={24} className="text-zinc-300 dark:text-zinc-600" />
          )}
        </div>
      )}

      <div className="p-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          {bookmark.favicon && (
            <img
              src={bookmark.favicon}
              alt=""
              className="w-4 h-4 rounded-sm shrink-0"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          )}
          <span className="text-xs text-zinc-400 dark:text-zinc-500 truncate">
            {domain}
          </span>
          {bookmark.readingTime > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-zinc-300 dark:text-zinc-600 shrink-0">
              <Clock size={9} />
              {bookmark.readingTime}m
            </span>
          )}
          <span className="text-xs text-zinc-300 dark:text-zinc-600 ml-auto shrink-0">
            {timeAgo(bookmark.createdAt)}
          </span>
        </div>

        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50 line-clamp-2 mb-1">
          {bookmark.title}
        </h3>

        {bookmark.description && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500 line-clamp-2 mb-2">
            {bookmark.description}
          </p>
        )}

        {bookmark.tags && bookmark.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {bookmark.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs px-2 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
            {bookmark.tags.length > 3 && (
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                +{bookmark.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="absolute bottom-2 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <button
          onClick={(e) => {
            e.stopPropagation();
            shellOpen(bookmark.url);
          }}
          className="p-1.5 rounded-md text-zinc-400 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm hover:bg-white dark:hover:bg-zinc-800 hover:text-zinc-600 transition-colors duration-150 cursor-pointer"
          aria-label="Open in browser"
        >
          <ExternalLink size={13} aria-hidden="true" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(bookmark.id);
          }}
          className="p-1.5 rounded-md text-zinc-400 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm hover:bg-white dark:hover:bg-zinc-800 hover:text-red-500 transition-colors duration-150 cursor-pointer"
          aria-label="Delete bookmark"
        >
          <Trash2 size={13} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

// ── Vault bookmark row (list) ──────────────────────────────────────────────────
function VaultBookmarkRow({ bookmark, isFocused, onSelect, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: bookmark.id,
    data: { type: "vault-bookmark", bookmark },
  });

  const domain = (() => {
    try {
      return new URL(bookmark.url).hostname.replace("www.", "");
    } catch {
      return bookmark.url;
    }
  })();

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
      className={`group flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-pointer transition-colors duration-150 ${
        isFocused
          ? "bg-zinc-100 dark:bg-zinc-800 ring-1 ring-blue-400/50 dark:ring-blue-500/40"
          : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
      }`}
      onClick={onSelect}
      {...attributes}
    >
      {/* Drag handle */}
      <div
        {...listeners}
        className="text-zinc-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 hover:text-zinc-500 dark:hover:text-zinc-400 cursor-grab active:cursor-grabbing shrink-0 transition-opacity duration-150"
        aria-label="Drag to reorder"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={14} aria-hidden="true" />
      </div>

      {bookmark.favicon ? (
        <img
          src={bookmark.favicon}
          alt=""
          className="w-4 h-4 rounded-sm shrink-0"
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
      ) : (
        <span className="w-4 h-4 shrink-0" />
      )}

      <span className="text-sm font-medium flex-1 truncate text-zinc-900 dark:text-zinc-50">
        {bookmark.title}
      </span>

      <span className="text-xs text-zinc-400 dark:text-zinc-500 w-32 truncate hidden sm:block">
        {domain}
      </span>

      <div className="hidden items-center gap-1 md:flex">
        {bookmark.tags?.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs px-2 py-0.5 rounded-full"
          >
            {tag}
          </span>
        ))}
        {bookmark.tags?.length > 2 && (
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            +{bookmark.tags.length - 2}
          </span>
        )}
      </div>

      {bookmark.readingTime > 0 && (
        <span className="hidden items-center gap-0.5 text-[10px] text-zinc-300 dark:text-zinc-600 shrink-0 lg:flex">
          <Clock size={9} />
          {bookmark.readingTime}m
        </span>
      )}

      <span className="text-xs text-zinc-400 dark:text-zinc-500 shrink-0 w-16 text-right">
        {timeAgo(bookmark.createdAt)}
      </span>

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <button
          onClick={(e) => {
            e.stopPropagation();
            shellOpen(bookmark.url);
          }}
          className="p-1 rounded-md text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600 transition-colors duration-150 cursor-pointer"
          aria-label="Open in browser"
        >
          <ExternalLink size={14} aria-hidden="true" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(bookmark.id);
          }}
          className="p-1 rounded-md text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-red-500 transition-colors duration-150 cursor-pointer"
          aria-label="Delete bookmark"
        >
          <Trash2 size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

// ── Vault bookmark detail panel ────────────────────────────────────────────────
function VaultBookmarkDetail({ bookmark, onClose, onDelete }) {
  const { updateBookmark } = useVaultStore();
  const [notes, setNotes] = useState(bookmark.notes || "");
  const notesTimeout = useRef(null);

  useEffect(() => {
    setNotes(bookmark.notes || "");
  }, [bookmark.id]);

  const domain = (() => {
    try {
      return new URL(bookmark.url).hostname.replace("www.", "");
    } catch {
      return bookmark.url;
    }
  })();

  const handleNotesChange = (e) => {
    const val = e.target.value;
    setNotes(val);
    clearTimeout(notesTimeout.current);
    notesTimeout.current = setTimeout(() => {
      updateBookmark(bookmark.id, { notes: val });
    }, 600);
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(bookmark.url);
    useToastStore.getState().success("URL copied to clipboard");
  };

  const handleDelete = () => {
    onDelete(bookmark.id);
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-30 bg-black/20 animate-fadeIn"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="vault-detail-title"
        className="fixed right-0 top-0 bottom-0 z-40 w-105 max-w-full bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 overflow-y-auto shadow-xl animate-slideInRight"
      >
        <div className="sticky top-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center justify-between z-10">
          <h2
            id="vault-detail-title"
            className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate"
          >
            Details
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer transition-colors duration-150"
            aria-label="Close details panel"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {bookmark.ogImage && (
            <img
              src={bookmark.ogImage}
              alt=""
              className="w-full h-48 object-cover rounded-xl"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          )}

          <div className="flex items-center gap-2">
            {bookmark.favicon && (
              <img
                src={bookmark.favicon}
                alt=""
                className="w-4 h-4 rounded-sm"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            )}
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              {domain}
            </span>
            {bookmark.readingTime > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-zinc-400 dark:text-zinc-500 ml-auto">
                <Clock size={11} />
                {bookmark.readingTime} min read
              </span>
            )}
          </div>

          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            {bookmark.title}
          </h3>

          {bookmark.description && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {bookmark.description}
            </p>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => shellOpen(bookmark.url)}
              className="inline-flex items-center gap-1.5 text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer"
            >
              <ExternalLink size={14} />
              Open original
            </button>
            <button
              onClick={copyUrl}
              className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer transition-colors duration-150"
            >
              <Copy size={13} />
              Copy URL
            </button>
          </div>

          {bookmark.tags && bookmark.tags.length > 0 && (
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
              <label className="text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2 block">
                Tags
              </label>
              <div className="flex flex-wrap gap-1">
                {bookmark.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs px-2 py-0.5 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
            <label className="text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2 block">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={handleNotesChange}
              placeholder="Add personal notes..."
              rows={3}
              className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-blue-500 dark:focus:border-blue-400 transition-colors duration-150 resize-none"
            />
          </div>

          <button
            onClick={handleDelete}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-red-500 bg-red-50 dark:bg-red-500/10 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors duration-150 cursor-pointer"
          >
            <Trash2 size={14} />
            Delete Bookmark
          </button>

          <div className="pt-2 text-xs text-zinc-400 dark:text-zinc-500 space-y-1">
            <p>
              Added {timeAgo(bookmark.createdAt)} (
              {new Date(bookmark.createdAt).toLocaleDateString()})
            </p>
            {bookmark.updatedAt &&
              bookmark.updatedAt !== bookmark.createdAt && (
                <p>Updated {timeAgo(bookmark.updatedAt)}</p>
              )}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Sort helpers ───────────────────────────────────────────────────────────────
const sortOptions = [
  { value: "manual", label: "Manual order" },
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "title-asc", label: "Title A-Z" },
  { value: "title-desc", label: "Title Z-A" },
  { value: "domain", label: "Domain" },
];

function sortBookmarks(bookmarks, sortBy) {
  const arr = [...bookmarks];
  if (sortBy === "manual") return arr;
  if (sortBy === "newest")
    return arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (sortBy === "oldest")
    return arr.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  if (sortBy === "title-asc")
    return arr.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
  if (sortBy === "title-desc")
    return arr.sort((a, b) => (b.title || "").localeCompare(a.title || ""));
  if (sortBy === "domain")
    return arr.sort((a, b) => {
      const da = (() => { try { return new URL(a.url).hostname; } catch { return a.url; } })();
      const db = (() => { try { return new URL(b.url).hostname; } catch { return b.url; } })();
      return da.localeCompare(db);
    });
  return arr;
}

// ── Main vault view ────────────────────────────────────────────────────────────
export default function VaultView() {
  const { bookmarks, deleteBookmark, sortBy, setSortBy } = useVaultStore();
  const [showAdd, setShowAdd] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [selectedId, setSelectedId] = useState(null);

  const sorted = sortBookmarks(bookmarks, sortBy);
  const sortedIds = sorted.map((b) => b.id);
  const selectedBookmark = sorted.find((b) => b.id === selectedId) || null;

  const handleDelete = (id) => {
    if (selectedId === id) setSelectedId(null);
    deleteBookmark(id);
  };

  const currentSort =
    sortOptions.find((o) => o.value === sortBy) || sortOptions[0];

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Sub-toolbar */}
      <div className="flex items-center gap-2 px-4 sm:px-6 py-2 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
        <span className="text-xs text-zinc-400 flex-1">
          {bookmarks.length} private bookmark{bookmarks.length !== 1 ? "s" : ""}
        </span>

        {/* Sort dropdown */}
        <Dropdown
          trigger={({ ref, toggle, ariaProps }) => (
            <button
              ref={ref}
              onClick={toggle}
              {...ariaProps}
              className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors duration-150 cursor-pointer"
              aria-label={`Sort by: ${currentSort.label}`}
            >
              <ArrowUpDown size={13} />
              <span className="hidden sm:inline">{currentSort.label}</span>
            </button>
          )}
        >
          {({ close }) =>
            sortOptions.map((opt) => (
              <Dropdown.Item
                key={opt.value}
                active={sortBy === opt.value}
                onClick={() => { setSortBy(opt.value); close(); }}
              >
                {opt.label}
              </Dropdown.Item>
            ))
          }
        </Dropdown>

        {/* View toggle */}
        <div
          className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5"
          role="group"
          aria-label="View mode"
        >
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-md transition-colors duration-150 cursor-pointer ${
              viewMode === "grid"
                ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-50"
                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            }`}
            aria-label="Grid view"
          >
            <Grid3X3 size={14} aria-hidden="true" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded-md transition-colors duration-150 cursor-pointer ${
              viewMode === "list"
                ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-50"
                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            }`}
            aria-label="List view"
          >
            <List size={14} aria-hidden="true" />
          </button>
        </div>

        {/* Settings */}
        <button
          onClick={() => setShowSettings(true)}
          className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors duration-150 cursor-pointer"
          title="Vault settings"
        >
          <Settings size={15} />
        </button>

        {/* Add */}
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-black font-bold rounded-lg transition-colors duration-150 cursor-pointer"
        >
          <Plus size={14} />
          <span className="hidden sm:inline">Add</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <p className="text-sm text-zinc-400 dark:text-zinc-500">
              No private bookmarks yet.
            </p>
            <button
              onClick={() => setShowAdd(true)}
              className="text-sm text-blue-500 hover:text-blue-600 cursor-pointer"
            >
              Add your first private bookmark
            </button>
          </div>
        ) : viewMode === "grid" ? (
          <SortableContext items={sortedIds} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sorted.map((bm) => (
                <VaultBookmarkCard
                  key={bm.id}
                  bookmark={bm}
                  isFocused={selectedId === bm.id}
                  onSelect={() => setSelectedId(bm.id)}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        ) : (
          <SortableContext
            items={sortedIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-1">
              {sorted.map((bm) => (
                <VaultBookmarkRow
                  key={bm.id}
                  bookmark={bm}
                  isFocused={selectedId === bm.id}
                  onSelect={() => setSelectedId(bm.id)}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        )}
      </div>

      {selectedBookmark && (
        <VaultBookmarkDetail
          bookmark={selectedBookmark}
          onClose={() => setSelectedId(null)}
          onDelete={handleDelete}
        />
      )}
      {showAdd && <AddVaultBookmark onClose={() => setShowAdd(false)} />}
      {showSettings && <VaultSettings onClose={() => setShowSettings(false)} />}
    </div>
  );
}
