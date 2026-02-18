import { useState } from 'react';
import {
  Settings2, Type, ALargeSmall, MoveHorizontal, AlignJustify,
  Minus, Plus, RotateCcw,
} from 'lucide-react';
import { useReaderStore } from '../store/useReaderStore.js';

const FONT_OPTIONS = [
  { value: 'serif', label: 'Serif' },
  { value: 'sans', label: 'Sans' },
  { value: 'mono', label: 'Mono' },
];

const FONT_MIN = 14;
const FONT_MAX = 28;
const FONT_STEP = 1;

const LH_MIN = 1.2;
const LH_MAX = 2.4;
const LH_STEP = 0.1;

const WIDTH_MIN = 480;
const WIDTH_MAX = 960;
const WIDTH_STEP = 48;

export default function ReaderPreferences() {
  const [open, setOpen] = useState(false);
  const {
    fontSize, fontFamily, lineHeight, maxWidth,
    setFontSize, setFontFamily, setLineHeight, setMaxWidth,
    resetDefaults,
  } = useReaderStore();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`p-1.5 rounded-lg transition-colors duration-150 cursor-pointer ${
          open
            ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200'
            : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-300'
        }`}
        aria-label="Reader preferences"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Settings2 size={16} />
      </button>

      {open && (
        <>
          {/* Click-away backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />

          <div
            role="dialog"
            aria-label="Reader preferences"
            className="absolute right-0 top-full mt-2 z-20 w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl p-4 space-y-4 animate-scaleIn"
          >
            {/* Font family */}
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-400 mb-2">
                <Type size={12} />
                Font
              </label>
              <div className="flex gap-1">
                {FONT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFontFamily(opt.value)}
                    className={`flex-1 px-2 py-1.5 text-xs rounded-lg border transition-colors duration-150 cursor-pointer ${
                      fontFamily === opt.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium'
                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                    style={{
                      fontFamily:
                        opt.value === 'serif'
                          ? 'Georgia, serif'
                          : opt.value === 'mono'
                            ? 'ui-monospace, monospace'
                            : 'Inter, system-ui, sans-serif',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Font size */}
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-400 mb-2">
                <ALargeSmall size={12} />
                Size
                <span className="ml-auto text-[10px] font-normal normal-case tabular-nums">{fontSize}px</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFontSize(Math.max(FONT_MIN, fontSize - FONT_STEP))}
                  disabled={fontSize <= FONT_MIN}
                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 disabled:opacity-30 cursor-pointer rounded transition-colors duration-150"
                  aria-label="Decrease font size"
                >
                  <Minus size={14} />
                </button>
                <input
                  type="range"
                  min={FONT_MIN}
                  max={FONT_MAX}
                  step={FONT_STEP}
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="flex-1 accent-blue-500 cursor-pointer"
                  aria-label="Font size"
                />
                <button
                  onClick={() => setFontSize(Math.min(FONT_MAX, fontSize + FONT_STEP))}
                  disabled={fontSize >= FONT_MAX}
                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 disabled:opacity-30 cursor-pointer rounded transition-colors duration-150"
                  aria-label="Increase font size"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Line height */}
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-400 mb-2">
                <AlignJustify size={12} />
                Line Height
                <span className="ml-auto text-[10px] font-normal normal-case tabular-nums">{lineHeight.toFixed(1)}</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLineHeight(Math.max(LH_MIN, +(lineHeight - LH_STEP).toFixed(1)))}
                  disabled={lineHeight <= LH_MIN}
                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 disabled:opacity-30 cursor-pointer rounded transition-colors duration-150"
                  aria-label="Decrease line height"
                >
                  <Minus size={14} />
                </button>
                <input
                  type="range"
                  min={LH_MIN}
                  max={LH_MAX}
                  step={LH_STEP}
                  value={lineHeight}
                  onChange={(e) => setLineHeight(Number(e.target.value))}
                  className="flex-1 accent-blue-500 cursor-pointer"
                  aria-label="Line height"
                />
                <button
                  onClick={() => setLineHeight(Math.min(LH_MAX, +(lineHeight + LH_STEP).toFixed(1)))}
                  disabled={lineHeight >= LH_MAX}
                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 disabled:opacity-30 cursor-pointer rounded transition-colors duration-150"
                  aria-label="Increase line height"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Content width */}
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-400 mb-2">
                <MoveHorizontal size={12} />
                Width
                <span className="ml-auto text-[10px] font-normal normal-case tabular-nums">{maxWidth}px</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMaxWidth(Math.max(WIDTH_MIN, maxWidth - WIDTH_STEP))}
                  disabled={maxWidth <= WIDTH_MIN}
                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 disabled:opacity-30 cursor-pointer rounded transition-colors duration-150"
                  aria-label="Decrease content width"
                >
                  <Minus size={14} />
                </button>
                <input
                  type="range"
                  min={WIDTH_MIN}
                  max={WIDTH_MAX}
                  step={WIDTH_STEP}
                  value={maxWidth}
                  onChange={(e) => setMaxWidth(Number(e.target.value))}
                  className="flex-1 accent-blue-500 cursor-pointer"
                  aria-label="Content width"
                />
                <button
                  onClick={() => setMaxWidth(Math.min(WIDTH_MAX, maxWidth + WIDTH_STEP))}
                  disabled={maxWidth >= WIDTH_MAX}
                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 disabled:opacity-30 cursor-pointer rounded transition-colors duration-150"
                  aria-label="Increase content width"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Reset */}
            <button
              onClick={resetDefaults}
              className="flex items-center gap-1.5 w-full px-3 py-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg transition-colors duration-150 cursor-pointer"
            >
              <RotateCcw size={12} />
              Reset to defaults
            </button>
          </div>
        </>
      )}
    </div>
  );
}
