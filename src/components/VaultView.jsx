import { useState } from 'react';
import { open as shellOpen } from '@tauri-apps/plugin-shell';
import { Plus, Trash2, ExternalLink, Settings, X, Eye, EyeOff, ShieldOff } from 'lucide-react';
import { useVaultStore } from '../store/useVaultStore.js';
import { fetchMetadata } from '../lib/metadata.js';
import { timeAgo } from '../lib/timeAgo.js';
import Modal from './ui/Modal.jsx';

// ── Add bookmark modal ────────────────────────────────────────────────────────
function AddVaultBookmark({ onClose }) {
  const addBookmark = useVaultStore((s) => s.addBookmark);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    let finalUrl = url.trim();
    if (!finalUrl) return;
    if (!/^https?:\/\//i.test(finalUrl)) finalUrl = 'https://' + finalUrl;
    setLoading(true);
    setError('');
    try {
      const meta = await fetchMetadata(finalUrl).catch(() => ({}));
      await addBookmark({ url: finalUrl, ...meta });
      onClose();
    } catch (err) {
      setError(`Failed to add: ${err}`);
      setLoading(false);
    }
  };

  return (
    <Modal title="Add to Vault" onClose={onClose} className="max-w-sm">
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="url"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors duration-150"
          autoFocus
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading || !url}
          className="w-full py-2 text-sm font-semibold bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-black rounded-lg transition-colors duration-150 cursor-pointer"
        >
          {loading ? 'Adding…' : 'Add to Vault'}
        </button>
      </form>
    </Modal>
  );
}

// ── Settings modal ────────────────────────────────────────────────────────────
function VaultSettings({ onClose }) {
  const { isSidebarVisible, toggleSidebarVisible, changePassword, remove } = useVaultStore();
  const [tab, setTab] = useState('general'); // 'general' | 'password' | 'remove'
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [removePw, setRemovePw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError(''); setMsg('');
    if (newPw !== confirmPw) { setError('New passwords do not match.'); return; }
    if (newPw.length < 4) { setError('Password must be at least 4 characters.'); return; }
    setLoading(true);
    try {
      await changePassword(oldPw, newPw);
      setMsg('Password changed successfully.');
      setOldPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      setError(String(err).includes('Invalid') ? 'Old password is incorrect.' : `Error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (e) => {
    e.preventDefault();
    setError(''); setMsg('');
    setLoading(true);
    try {
      const ok = await remove(removePw);
      if (!ok) { setError('Incorrect password.'); setLoading(false); return; }
      onClose();
    } catch (err) {
      setError(`Error: ${err}`);
      setLoading(false);
    }
  };

  return (
    <Modal title="Vault Settings" onClose={onClose} className="max-w-sm">
      <div className="flex gap-1 mb-4 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
        {[['general', 'General'], ['password', 'Change Password'], ['remove', 'Remove Vault']].map(([id, label]) => (
          <button
            key={id}
            onClick={() => { setTab(id); setError(''); setMsg(''); }}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors duration-150 cursor-pointer ${
              tab === id
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'general' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm text-zinc-900 dark:text-zinc-100">Show in sidebar</p>
              <p className="text-xs text-zinc-400">Access vault from sidebar navigation</p>
            </div>
            <button
              onClick={toggleSidebarVisible}
              className={`relative w-10 h-5.5 rounded-full transition-colors duration-200 cursor-pointer ${
                isSidebarVisible ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'
              }`}
            >
              <span className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform duration-200 ${
                isSidebarVisible ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            When hidden, use <kbd className="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-[10px]">Ctrl+Shift+V</kbd> to open the vault.
          </p>
        </div>
      )}

      {tab === 'password' && (
        <form onSubmit={handleChangePassword} className="space-y-3">
          {[
            [oldPw, setOldPw, 'Current password', 'current-password'],
            [newPw, setNewPw, 'New password', 'new-password'],
            [confirmPw, setConfirmPw, 'Confirm new password', 'new-password'],
          ].map(([val, setter, placeholder, autocomplete]) => (
            <div key={placeholder} className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                placeholder={placeholder}
                value={val}
                onChange={(e) => setter(e.target.value)}
                autoComplete={autocomplete}
                className="w-full px-3 py-2 pr-9 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors duration-150"
              />
            </div>
          ))}
          <button type="button" onClick={() => setShowPw((v) => !v)} className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600 cursor-pointer">
            {showPw ? <EyeOff size={12} /> : <Eye size={12} />}
            {showPw ? 'Hide' : 'Show'} passwords
          </button>
          {error && <p className="text-xs text-red-500">{error}</p>}
          {msg && <p className="text-xs text-blue-500">{msg}</p>}
          <button type="submit" disabled={loading} className="w-full py-2 text-sm font-semibold bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-black rounded-lg transition-colors duration-150 cursor-pointer">
            {loading ? 'Changing…' : 'Change Password'}
          </button>
        </form>
      )}

      {tab === 'remove' && (
        <form onSubmit={handleRemove} className="space-y-3">
          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-500/10 rounded-lg">
            <ShieldOff size={14} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-600 dark:text-red-400">
              This will permanently delete all encrypted vault bookmarks. This cannot be undone.
            </p>
          </div>
          <input
            type="password"
            placeholder="Enter password to confirm"
            value={removePw}
            onChange={(e) => setRemovePw(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-red-500 transition-colors duration-150"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button type="submit" disabled={loading || !removePw} className="w-full py-2 text-sm font-semibold bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg transition-colors duration-150 cursor-pointer">
            {loading ? 'Removing…' : 'Remove Vault'}
          </button>
        </form>
      )}
    </Modal>
  );
}

// ── Vault bookmark card ───────────────────────────────────────────────────────
function VaultCard({ bookmark, onDelete }) {
  const domain = (() => {
    try { return new URL(bookmark.url).hostname.replace('www.', ''); }
    catch { return bookmark.url; }
  })();

  return (
    <div className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col gap-2 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors duration-150">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {bookmark.favicon && (
            <img src={bookmark.favicon} alt="" className="w-4 h-4 rounded-sm shrink-0" onError={(e) => { e.target.style.display = 'none'; }} />
          )}
          <span className="text-xs text-zinc-400 truncate">{domain}</span>
        </div>
        <button
          onClick={() => onDelete(bookmark.id)}
          className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-500 transition-all duration-150 cursor-pointer shrink-0"
        >
          <Trash2 size={13} />
        </button>
      </div>

      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug">{bookmark.title}</p>

      {bookmark.description && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">{bookmark.description}</p>
      )}

      <div className="flex items-center justify-between mt-auto pt-1">
        <span className="text-[10px] text-zinc-400">{timeAgo(bookmark.createdAt)}</span>
        <button
          onClick={() => shellOpen(bookmark.url)}
          className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 cursor-pointer"
        >
          <ExternalLink size={11} />
          Open
        </button>
      </div>
    </div>
  );
}

// ── Main vault view ───────────────────────────────────────────────────────────
export default function VaultView() {
  const { bookmarks, deleteBookmark } = useVaultStore();
  const [showAdd, setShowAdd] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Sub-toolbar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-2 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
        <span className="text-xs text-zinc-400">{bookmarks.length} private bookmark{bookmarks.length !== 1 ? 's' : ''}</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowSettings(true)}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors duration-150 cursor-pointer"
            title="Vault settings"
          >
            <Settings size={15} />
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-black font-bold rounded-lg transition-colors duration-150 cursor-pointer"
          >
            <Plus size={14} />
            Add
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
        {bookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <p className="text-sm text-zinc-400 dark:text-zinc-500">No private bookmarks yet.</p>
            <button
              onClick={() => setShowAdd(true)}
              className="text-sm text-blue-500 hover:text-blue-600 cursor-pointer"
            >
              Add your first private bookmark
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {bookmarks.map((bm) => (
              <VaultCard key={bm.id} bookmark={bm} onDelete={deleteBookmark} />
            ))}
          </div>
        )}
      </div>

      {showAdd && <AddVaultBookmark onClose={() => setShowAdd(false)} />}
      {showSettings && <VaultSettings onClose={() => setShowSettings(false)} />}
    </div>
  );
}
