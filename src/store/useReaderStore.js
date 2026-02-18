import { create } from 'zustand';
import { loadReaderPrefs, saveReaderPrefs } from '../lib/storage.js';

/**
 * Reader view preferences store.
 *
 * Persisted to stash-data.json via Tauri plugin-store.
 */

const DEFAULTS = {
  fontSize: 18,       // px  (range 14–28)
  fontFamily: 'serif', // serif | sans | mono
  lineHeight: 1.8,    // unitless  (range 1.2–2.4)
  maxWidth: 672,      // px  (range 480–960, step 48 ≈ 3rem)
};

const FONT_STACKS = {
  serif: 'Georgia, "Times New Roman", serif',
  sans: '"Inter", ui-sans-serif, system-ui, -apple-system, sans-serif',
  mono: '"JetBrains Mono", "Fira Code", ui-monospace, monospace',
};

export const READER_FONTS = FONT_STACKS;

export const useReaderStore = create((set, get) => ({
  ...DEFAULTS,
  loaded: false,

  init: async () => {
    const saved = await loadReaderPrefs();
    if (saved) {
      set({ ...DEFAULTS, ...saved, loaded: true });
    } else {
      set({ loaded: true });
    }
  },

  setFontSize: (fontSize) => {
    set({ fontSize });
    saveReaderPrefs(getPrefs(get()));
  },

  setFontFamily: (fontFamily) => {
    set({ fontFamily });
    saveReaderPrefs(getPrefs(get()));
  },

  setLineHeight: (lineHeight) => {
    set({ lineHeight });
    saveReaderPrefs(getPrefs(get()));
  },

  setMaxWidth: (maxWidth) => {
    set({ maxWidth });
    saveReaderPrefs(getPrefs(get()));
  },

  resetDefaults: () => {
    set({ ...DEFAULTS });
    saveReaderPrefs(DEFAULTS);
  },
}));

function getPrefs(state) {
  return {
    fontSize: state.fontSize,
    fontFamily: state.fontFamily,
    lineHeight: state.lineHeight,
    maxWidth: state.maxWidth,
  };
}
