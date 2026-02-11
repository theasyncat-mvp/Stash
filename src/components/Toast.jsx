import { Check, X, AlertCircle, Info, Undo2 } from 'lucide-react';
import { useToastStore } from '../store/useToastStore.js';

const icons = {
  success: Check,
  error: AlertCircle,
  info: Info,
};

const colors = {
  success: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  error: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
  info: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => {
        const Icon = icons[toast.type] || Info;
        return (
          <div
            key={toast.id}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg text-sm animate-[slideUp_0.2s_ease-out] ${colors[toast.type] || colors.info}`}
          >
            <Icon size={16} className="shrink-0" />
            <span className="flex-1">{toast.message}</span>
            {toast.undoAction && (
              <button
                onClick={() => { toast.undoAction(); removeToast(toast.id); }}
                className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-150 cursor-pointer shrink-0"
              >
                <Undo2 size={12} />
                Undo
              </button>
            )}
            <button
              onClick={() => removeToast(toast.id)}
              className="p-0.5 hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors duration-150 cursor-pointer shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
