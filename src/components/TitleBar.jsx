import { Minus, Square, X, Bookmark } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';

export default function TitleBar() {
  const minimize = () => getCurrentWindow().minimize();
  const maximize = () => getCurrentWindow().toggleMaximize();
  const close    = () => getCurrentWindow().close();
  return (
    <div
      data-tauri-drag-region
      className="h-9 shrink-0 flex items-center justify-between bg-zinc-900 border-b border-zinc-800 select-none z-50"
    >
        <div data-tauri-drag-region className="flex items-center gap-2 px-4 text-zinc-400 pointer-events-none">
          <img src="/favicon.svg" alt="Stash" className="w-5 h-5" />
          <span className="text-[13px] font-medium tracking-wide text-zinc-300">Stash</span>
        </div>

        {/* Spacer drag region */}
      <div data-tauri-drag-region className="flex-1 h-full" />

      {/* Window controls */}
      <div className="flex items-center h-full">
        <button
          onClick={minimize}
          className="h-full px-4 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700/60 transition-colors duration-100 cursor-pointer"
          aria-label="Minimize"
        >
          <Minus size={12} strokeWidth={2.5} />
        </button>
        <button
          onClick={maximize}
          className="h-full px-4 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700/60 transition-colors duration-100 cursor-pointer"
          aria-label="Maximize"
        >
          <Square size={11} strokeWidth={2} />
        </button>
        <button
          onClick={close}
          className="h-full px-4 text-zinc-500 hover:text-white hover:bg-red-600 transition-colors duration-100 cursor-pointer rounded-none"
          aria-label="Close"
        >
          <X size={13} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
