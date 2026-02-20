import { useState } from 'react';
import { Shield, Eye, EyeOff } from 'lucide-react';
import Modal from './ui/Modal.jsx';
import { useVaultStore } from '../store/useVaultStore.js';

export default function VaultSetup({ onClose }) {
  const setup = useVaultStore((s) => s.setup);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await setup(password);
      onClose();
    } catch (err) {
      setError(`Setup failed: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Set Up Private Vault" onClose={onClose} className="max-w-sm">
      <div className="flex flex-col items-center gap-3 mb-5">
        <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
          <Shield size={22} className="text-blue-500" />
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
          Your private bookmarks will be encrypted with AES-256. Choose a strong password — it cannot be recovered if lost.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <input
            type={showPw ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 pr-10 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors duration-150"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer"
          >
            {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>

        <input
          type={showPw ? 'text' : 'password'}
          placeholder="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors duration-150"
          autoComplete="new-password"
        />

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading || !password || !confirm}
          className="w-full py-2 text-sm font-semibold bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-black rounded-lg transition-colors duration-150 cursor-pointer"
        >
          {loading ? 'Setting up…' : 'Create Vault'}
        </button>
      </form>
    </Modal>
  );
}
