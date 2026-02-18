const API = 'http://127.0.0.1:21890/api';
const $ = (sel) => document.querySelector(sel);

// ── Elements ──
const offlineBanner  = $('#offline-banner');
const successView    = $('#success-view');
const mainForm       = $('#main-view');
const pageFavicon    = $('#page-favicon');
const pageTitle      = $('#page-title');
const pageUrl        = $('#page-url');
const tagsList       = $('#tags-list');
const tagInput       = $('#tag-input');
const saveBtn        = $('#save-btn');
const openStashBtn   = $('#open-stash-btn');

let tags = [];
let currentTab = null;

// ── Init ──
document.addEventListener('DOMContentLoaded', async () => {
  // Get active tab info
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;

  if (tab) {
    pageTitle.textContent = tab.title || 'Untitled';
    pageUrl.textContent = tab.url || '';
    if (tab.favIconUrl) {
      pageFavicon.src = tab.favIconUrl;
      pageFavicon.onerror = () => {
        pageFavicon.style.display = 'none';
      };
    } else {
      pageFavicon.style.display = 'none';
    }
  }

  // Check if Stash is running
  try {
    const res = await fetch(`${API}/ping`, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) throw new Error();
  } catch {
    offlineBanner.classList.remove('hidden');
    saveBtn.disabled = true;
    return;
  }

  tagInput.focus();
});

// ── Tag input handling ──
tagInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    addTag(tagInput.value);
  }
  if (e.key === 'Backspace' && !tagInput.value && tags.length) {
    removeTag(tags.length - 1);
  }
});

tagInput.addEventListener('blur', () => {
  if (tagInput.value.trim()) addTag(tagInput.value);
});

$('.tags-container').addEventListener('click', () => tagInput.focus());

function addTag(raw) {
  const value = raw.replace(/,/g, '').trim().toLowerCase();
  if (!value || tags.includes(value)) {
    tagInput.value = '';
    return;
  }
  tags.push(value);
  tagInput.value = '';
  renderTags();
}

function removeTag(index) {
  tags.splice(index, 1);
  renderTags();
}

function renderTags() {
  tagsList.innerHTML = tags
    .map(
      (t, i) =>
        `<span class="tag-chip">${esc(t)}<button class="tag-chip-remove" data-i="${i}" aria-label="Remove tag">&times;</button></span>`
    )
    .join('');

  tagsList.querySelectorAll('.tag-chip-remove').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeTag(Number(btn.dataset.i));
    });
  });
}

// ── Save ──
saveBtn.addEventListener('click', async () => {
  if (!currentTab?.url) return;

  saveBtn.classList.add('loading');
  saveBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="2" stroke-dasharray="28" stroke-dashoffset="8" stroke-linecap="round"/></svg> Saving…`;
  saveBtn.disabled = true;

  try {
    const res = await fetch(`${API}/bookmark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: currentTab.url,
        title: currentTab.title || '',
        description: '',
        tags: tags,
      }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    // Show success
    mainForm.classList.add('hidden');
    successView.classList.remove('hidden');
  } catch (err) {
    saveBtn.classList.remove('loading');
    saveBtn.disabled = false;
    saveBtn.textContent = 'Error — Retry';
    saveBtn.style.background = '#ef4444';
    setTimeout(() => {
      saveBtn.textContent = 'Save to Stash';
      saveBtn.style.background = '';
    }, 2000);
  }
});

// ── Open Stash ──
openStashBtn.addEventListener('click', async () => {
  try {
    await fetch(`${API}/show`, { method: 'POST' });
  } catch {
    // Stash might not be running anymore, ignore
  }
  window.close();
});

// ── Helpers ──
function esc(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}
