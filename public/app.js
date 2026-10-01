import { store } from './store.js';
import { refreshEntitlement, purchase, isPro, hasFeature, onEntitlementChange } from './entitlements.js';
const $ = sel => document.querySelector(sel);
const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};

/* ---------- dropdown (custom suggestion list) ---------- */

function attachDropdown(input, onPick) {
  const wrap = input.closest('.dd-wrap') ?? input.parentElement;
  let list = null;
  let idx = -1;

  const close = () => { list?.remove(); list = null; idx = -1; };
  const open = items => {
    close();
    if (!items.length) return;
    list = el('ul', 'dropdown');
    for (const item of items) {
      const li = el('li', null, item);
      li.addEventListener('mousedown', e => { e.preventDefault(); onPick(item); close(); });
      list.append(li);
    }
    wrap.append(list);
  };

  input.addEventListener('keydown', e => {
    if (!list) return;
    const items = [...list.children];
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      idx = (idx + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items.forEach((li, i) => li.classList.toggle('sel', i === idx));
      items[idx].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter' && idx >= 0) {
      e.preventDefault();
      onPick(items[idx].textContent);
      close();
    } else if (e.key === 'Escape') {
      close();
    }
  });
  input.addEventListener('blur', () => setTimeout(close, 150));
  document.addEventListener('click', e => { if (!wrap.contains(e.target)) close(); });
  return { open, close };
}

/* ---------- routing ---------- */

const views = { search: $('#view-search'), saved: $('#view-saved'), review: $('#view-review'), history: $('#view-history') };
function route() {
  const rawName = { '': 'search', '#/': 'search', '#/saved': 'saved', '#/review': 'review', '#/history': 'history' }[location.hash] ?? 'search';
  const name = (rawName === 'history' && !hasFeature('review-history')) ? 'search' : rawName;
  if (rawName !== name) { location.replace('#/'); return; }
  for (const [k, v] of Object.entries(views)) v.hidden = k !== name;
  document.querySelectorAll('[data-nav]').forEach(a =>
    a.classList.toggle('active', a.dataset.nav === name));
  if (name === 'saved') renderSaved();
  if (name === 'review') startReview();
  if (name === 'history') renderHistory();
  if (name === 'search') refreshSaveState();
  updateHistoryNav();
}
addEventListener('hashchange', route);
function updateHistoryNav() {
  const nav = document.querySelector('nav');
  let historyLink = nav.querySelector('[data-nav="history"]');
  if (hasFeature('review-history')) {
    if (!historyLink) {
      historyLink = el('a', null, 'History');
      historyLink.href = '#/history';
      historyLink.dataset.nav = 'history';
      nav.append(historyLink);
    }
    historyLink.hidden = false;
  } else if (historyLink) {
    historyLink.hidden = true;
  }
}

/* ---------- search ---------- */

const input = $('#searchInput');
const searchDrop = attachDropdown(input, w => { input.blur(); go(w); });

function go(word) {
  cancelSuggest();
  input.value = word;
  location.hash = '#/';
  lookup(word);
}

let suggestTimer, suggestAbort;
const suggestCache = new Map();
const cancelSuggest = () => { clearTimeout(suggestTimer); suggestAbort?.abort(); searchDrop.close(); };
input.addEventListener('input', () => {
  clearTimeout(suggestTimer);
  const q = input.value.trim();
  if (q.length < 2) { searchDrop.close(); return; }
  if (suggestCache.has(q)) { searchDrop.open(suggestCache.get(q)); return; }
  suggestTimer = setTimeout(async () => {
    suggestAbort?.abort();
    const ac = suggestAbort = new AbortController();
    try {
      const words = await store.suggest(q, { signal: ac.signal });
      if (suggestCache.size > 200) suggestCache.clear();
      suggestCache.set(q, words);
      if (!ac.signal.aborted) searchDrop.open(words);
    } catch { /* aborted or failed — leave the dropdown alone */ }
  }, 300);
});

$('#searchForm').addEventListener('submit', e => {
  e.preventDefault();
  cancelSuggest();
  const w = input.value.trim();
  if (w) lookup(w);
});

async function lookup(word) {
  const box = $('#result');
  box.replaceChildren(el('div', 'empty', 'Looking up…'));
  try {
    const entry = await store.getWord(word);
    if (!entry) throw Object.assign(new Error('not found'), { status: 404 });
    renderCard(entry, box);
  } catch (e) {
    const card = el('div', 'error-card');
    if (e.status !== 404) {
      card.append(el('p', null, 'Couldn’t reach the dictionary — try again in a moment.'));
    } else {
      card.append(el('p', null, `No entry found for “${word}”.`));
      if (e.body?.suggestion) {
        const link = el('a', null, `Did you mean “${e.body.suggestion}”?`);
        link.href = '#/';
        link.addEventListener('click', () => go(e.body.suggestion));
        card.append(el('p', null), link);
      }
    }
    box.replaceChildren(card);
  }
}

/* ---------- word card ---------- */

// tracks the displayed card so Save state survives tab round-trips
const cardState = { word: null, saved: false, btn: null };

async function refreshSaveState() {
  if (!cardState.word || !cardState.btn) return;
  const rows = await store.listSaved().catch(() => []);
  const isSaved = rows.some(r => r.word === cardState.word);
  if (isSaved !== cardState.saved) {
    cardState.saved = isSaved;
    cardState.btn.textContent = isSaved ? 'Saved' : 'Save';
  }
}

function chipRow(label, words) {
  if (!words?.length) return null;
  const wrap = el('div');
  wrap.append(el('h2', null, label));
  const chips = el('div', 'chips');
  for (const w of words) {
    const c = el('button', 'chip', w);
    c.type = 'button';
    c.addEventListener('click', () => go(w));
    chips.append(c);
  }
  wrap.append(chips);
  return wrap;
}

function renderCard(entry, mount) {
  const card = el('article', 'card');

  const head = el('div', 'card-head');
  const titleWrap = el('div');
  titleWrap.append(el('h1', null, entry.word));
  if (entry.phonetic) titleWrap.append(el('div', 'phonetic', entry.phonetic));
  head.append(titleWrap);

  const actions = el('div', 'card-actions');
  if (entry.audioUrl) {
    const audio = el('button', null, '🔊');
    audio.type = 'button';
    audio.title = 'Pronunciation';
    audio.addEventListener('click', () => new Audio(entry.audioUrl).play());
    actions.append(audio);
  }

  const saveBtn = el('button', null, entry.saved ? 'Saved' : 'Save');
  saveBtn.type = 'button';
  cardState.word = entry.word;
  cardState.saved = !!entry.saved;
  cardState.btn = saveBtn;

  saveBtn.addEventListener('click', async () => {
    if (cardState.saved) {
      saveBtn.disabled = true;
      try {
        await store.unsaveWord(entry.word);
        cardState.saved = false;
        saveBtn.textContent = 'Save';
      } finally { saveBtn.disabled = false; }
      return;
    }
    const tags = await store.listTags().catch(() => []);
    const form = el('span', 'save-form');
    const tagWrap = el('span', 'dd-wrap');
    const tagIn = document.createElement('input');
    tagIn.type = 'text';
    tagIn.placeholder = 'tag (optional)';
    tagIn.maxLength = 60;
    tagWrap.append(tagIn);
    const tagDrop = attachDropdown(tagIn, t => { tagIn.value = t; tagIn.focus(); });
    const showTags = () => {
      const q = tagIn.value.trim().toLowerCase();
      tagDrop.open(tags.map(t => t.tag).filter(t => !q || t.toLowerCase().includes(q)));
    };
    tagIn.addEventListener('focus', showTags);
    tagIn.addEventListener('input', showTags);
    const ok = el('button', 'primary', 'Save');
    ok.type = 'button';
    const cancel = el('button', null, '✕');
    cancel.type = 'button';
    const submit = async () => {
      ok.disabled = true;
      tagDrop.close();
      try {
        await store.saveWord(entry.word, tagIn.value.trim() || undefined);
        cardState.saved = true;
        saveBtn.textContent = 'Saved';
        form.replaceWith(saveBtn);
      } finally { ok.disabled = false; }
    };
    ok.addEventListener('click', submit);
    tagIn.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
    cancel.addEventListener('click', () => { tagDrop.close(); form.replaceWith(saveBtn); });
    form.append(tagWrap, ok, cancel);
    saveBtn.replaceWith(form);
    tagIn.focus();
  });
  actions.append(saveBtn);
  if (entry.saved && hasFeature('review-history')) {
    const histBtn = el('button', null, 'History');
    histBtn.type = 'button';
    histBtn.addEventListener('click', () => showHistoryFor(entry.word));
    actions.append(histBtn);
  }
  head.append(actions);
  card.append(head);

  if (entry.formOf) {
    const banner = el('div', 'formof');
    banner.append(`${entry.formOf.kind} of `);
    const link = el('button', 'linkish', entry.formOf.word);
    link.type = 'button';
    link.addEventListener('click', () => go(entry.formOf.word));
    banner.append(link);
    card.append(banner);
  }

  const allDefs = entry.meanings.flatMap(m => m.definitions.map(d => ({ ...d, pos: m.partOfSpeech })));
  const first = allDefs[0];

  if (first) {
    const sec = el('section');
    sec.append(el('h2', null, 'Meaning'), el('p', 'lede', first.text));
    if (first.example) sec.append(el('p', 'example', `“${first.example}”`));
    card.append(sec);
  }

  const pos = [...new Set(entry.meanings.map(m => m.partOfSpeech))];
  const examples = allDefs.filter(d => d.example).slice(0, 2);
  const synonyms = [...new Set(allDefs.flatMap(d => d.synonyms))].slice(0, 10);
  const antonyms = [...new Set(allDefs.flatMap(d => d.antonyms))].slice(0, 10);
  if (pos.length || examples.length || synonyms.length || antonyms.length) {
    const sec = el('section');
    sec.append(el('h2', null, 'Purpose'));
    const posLine = el('p');
    posLine.append(...pos.map(p => el('span', 'pos-chip', p)));
    sec.append(posLine);
    for (const ex of examples) sec.append(el('p', 'example', `“${ex.example}”`));
    for (const row of [chipRow('Synonyms', synonyms), chipRow('Antonyms', antonyms)])
      if (row) sec.append(row);
    card.append(sec);
  }

  if (entry.origin) {
    const sec = el('section');
    sec.append(el('h2', null, 'History'), el('p', null, entry.origin));
    card.append(sec);
  }

  const rest = entry.meanings
    .map(m => ({ pos: m.partOfSpeech, defs: m.definitions.filter(d => d !== first || m.partOfSpeech !== first?.pos) }))
    .filter(m => m.defs.length);
  if (rest.length) {
    const sec = el('section');
    sec.append(el('h2', null, 'Alternative meanings'));
    for (const m of rest) {
      const det = el('details');
      det.open = true;
      det.append(el('summary', null, m.pos));
      const ol = el('ol', 'defs');
      for (const d of m.defs) {
        const li = el('li', null, d.text);
        if (d.example) li.append(el('p', 'example', `“${d.example}”`));
        ol.append(li);
      }
      det.append(ol);
      sec.append(det);
    }
    card.append(sec);
  }

  const related = (entry.related ?? []).filter(w => w !== entry.formOf?.word);
  if (related.length) {
    const sec = el('section');
    const row = chipRow('Related', related);
    if (row) sec.append(row);
    card.append(sec);
  }

  if (entry.sourceUrls?.length) {
    const src = el('div', 'src');
    for (const u of entry.sourceUrls.slice(0, 2)) {
      const a = el('a', null, new URL(u).hostname);
      a.href = u;
      a.rel = 'noopener';
      src.append(a, ' ');
    }
    card.append(src);
  }

  mount.replaceChildren(card);
}

/* ---------- saved list ---------- */

let activeTag = null;

async function renderSaved() {
  const box = $('#savedList');
  box.replaceChildren(el('div', 'empty', 'Loading…'));
  const [rows, tags] = await Promise.all([
    store.listSaved().catch(() => []),
    store.listTags().catch(() => []),
  ]);
  if (!rows.length) {
    box.replaceChildren(el('div', 'empty', 'No saved words yet. Search a word and hit Save.'));
    return;
  }
  if (activeTag && !tags.some(t => t.tag === activeTag)) activeTag = null;

  const frag = document.createDocumentFragment();
  if (tags.length) {
    const bar = el('div', 'chips tag-bar');
    for (const t of tags) {
      const c = el('button', 'chip' + (activeTag === t.tag ? ' active' : ''), `${t.tag} (${t.count})`);
      c.type = 'button';
      c.addEventListener('click', () => {
        activeTag = activeTag === t.tag ? null : t.tag;
        renderSaved();
      });
      bar.append(c);
    }
    frag.append(bar);
  }
  if (hasFeature('export-list')) {
    const exportBtn = el('button', 'primary', 'Export CSV');
    exportBtn.type = 'button';
    exportBtn.addEventListener('click', async () => {
      exportBtn.disabled = true;
      exportBtn.textContent = 'Exporting…';
      const rows = await store.listSaved().catch(() => []);
      const csv = ['word,saved_at,tag,review_count,known_count', ...rows.map(r =>
        [r.word, r.saved_at, r.saved_tag || '', r.review_count || 0, r.known_count || 0].join(',')
      )].join('\n');
      // Try download first (works in browser and modern WebView)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vocab-export-${new Date().toISOString().slice(0,10)}.csv`;
      document.body.append(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      // In Capacitor Android WebView the download attribute may not fire.
      // Fall back to copying CSV to clipboard so the user can paste it anywhere.
      if (globalThis.Capacitor?.isNativePlatform?.()) {
        try {
          await navigator.clipboard.writeText(csv);
          exportBtn.textContent = 'Copied!';
        } catch {
          exportBtn.textContent = 'Export CSV (copy failed)';
        }
      } else {
        exportBtn.textContent = 'Export CSV';
      }
      exportBtn.disabled = false;
      // Reset button text after a moment
      setTimeout(() => { if (!exportBtn.disabled) exportBtn.textContent = 'Export CSV'; }, 2000);
    });
    frag.append(el('div', 'export-bar', exportBtn));
  }
  const visible = activeTag ? rows.filter(r => r.saved_tag === activeTag) : rows;
  for (const r of visible) {
    const row = el('div', 'saved-row');
    const left = el('div');
    const w = el('button', 'word', r.word);
    w.type = 'button';
    w.addEventListener('click', () => go(r.word));
    const metaBits = [`saved ${r.saved_at.slice(0, 10)}`];
    if (r.saved_tag) metaBits.push(`tag: ${r.saved_tag}`);
    if (r.review_count) metaBits.push(`reviewed ${r.review_count}× (${r.known_count} known)`);
    left.append(w, el('div', 'meta', metaBits.join(' · ')));
    const del = el('button', null, 'Remove');
    del.type = 'button';
    del.addEventListener('click', async () => {
      await store.unsaveWord(r.word);
      renderSaved();
    });
    row.append(left, del);
    frag.append(row);
  }
  box.replaceChildren(frag);
}
/* ---------- history ---------- */

let historyWord = null;

async function renderHistory() {
  const box = $('#historyList');
  if (!hasFeature('review-history')) {
    const children = [el('div', 'empty', 'Review history is a Pro feature.')];
    if (globalThis.Capacitor?.isNativePlatform?.()) {
      const btn = el('button', 'primary', 'Upgrade');
      btn.type = 'button';
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        btn.textContent = 'Opening…';
        await purchase();
        btn.disabled = false;
        btn.textContent = 'Upgrade';
      });
      children.push(btn);
    }
    box.replaceChildren(...children);
    return;
  }
  if (!historyWord) {
    box.replaceChildren(el('div', 'empty', 'Search a word, then open History from its card.'));
    return;
  }
  box.replaceChildren(el('div', 'empty', 'Loading…'));
  try {
    const history = await store.listReviewHistory(historyWord).catch(() => []);
    if (!history.length) {
      box.replaceChildren(el('div', 'empty', `No review history for “${historyWord}” yet.`));
      return;
    }
    const frag = document.createDocumentFragment();
    frag.append(el('h2', null, `History for “${historyWord}”`));
    const list = el('ul', 'history-list');
    for (const h of history) {
      const li = el('li', 'history-item');
      const badge = el('span', 'history-badge ' + (h.known ? 'known' : 'again'), h.known ? 'Knew it' : 'Again');
      const time = el('time', null, new Date(h.reviewed_at).toLocaleString());
      li.append(badge, time);
      list.append(li);
    }
    frag.append(list);
    box.replaceChildren(frag);
  } catch (e) {
    box.replaceChildren(el('div', 'empty', 'Could not load history.'));
  }
}

function showHistoryFor(word) {
  if (!hasFeature('review-history')) return;
  historyWord = word;
  location.hash = '#/history';
}

/* ---------- review ---------- */

let queue = [];
let qi = 0;
let useSmartReview = false;

async function startReview(smart = false) {
  useSmartReview = smart;
  const box = $('#reviewCard');
  box.replaceChildren(el('div', 'empty', 'Loading…'));
  queue = smart
    ? await store.smartReviewQueue().catch(() => [])
    : await store.reviewQueue().catch(() => []);
  qi = 0;
  showReviewCard();
}

function showReviewCard() {
  const box = $('#reviewCard');
  if (!queue.length) {
    box.replaceChildren(el('div', 'empty', 'Nothing saved yet — save words while searching and they’ll show up here.'));
    return;
  }
  if (qi >= queue.length) {
    box.replaceChildren(el('div', 'empty', `Done — ${queue.length} word${queue.length === 1 ? '' : 's'} reviewed.`));
    return;
  }
  const entry = queue[qi];
  const card = el('article', 'card review-card');

  const top = el('div', 'card-head');
  const tw = el('div');
  tw.append(el('h1', null, entry.word));
  if (entry.phonetic) tw.append(el('div', 'phonetic', entry.phonetic));
  const meta = el('div', 'meta');
  meta.textContent = `${qi + 1} / ${queue.length}`;
  top.append(tw, meta);
  if (hasFeature('smart-review')) {
    const toggle = el('button', 'smart-toggle' + (useSmartReview ? ' active' : ''), useSmartReview ? 'Smart Review: ON' : 'Smart Review: OFF');
    toggle.type = 'button';
    toggle.title = 'Toggle Smart Review (prioritizes wrong answers + recency)';
    toggle.addEventListener('click', () => startReview(!useSmartReview));
    top.append(toggle);
  }
  card.append(top);

  const face = el('div', 'review-face');
  const revealBtn = el('button', 'primary', 'Reveal');
  revealBtn.type = 'button';
  revealBtn.addEventListener('click', () => {
    const first = entry.meanings?.[0]?.definitions?.[0];
    const body = el('div');
    body.append(el('p', 'lede', first?.text ?? '(no definition cached)'));
    if (entry.origin) body.append(el('p', 'example', entry.origin));
    face.replaceChildren(body);
    // Revealed text is usually taller than the face; centred content would
    // overflow upward and clip its first line under the card heading.
    face.classList.add('revealed');
    face.scrollTop = 0;
    const btns = el('div', 'review-buttons');
    for (const [label, known] of [['Again', false], ['Knew it', true]]) {
      const b = el('button', known ? 'primary' : null, label);
      b.type = 'button';
      b.addEventListener('click', async () => {
        await store.recordReview(entry.word, known).catch(() => {});
        qi++;
        showReviewCard();
      });
      btns.append(b);
    }
    card.append(btns);
  });
  face.append(revealBtn);
  card.append(face);
  box.replaceChildren(card);
}

/* ---------- upgrade (native only, hidden once unlocked) ---------- */


function mountUpgrade() {
  const btn = $('#upgradeBtn');
  if (!btn) return;
  // Billing only exists in the Android build; on web there is nothing to buy,
  // so the control is removed rather than left as a dead button.
  if (!globalThis.Capacitor?.isNativePlatform?.()) { btn.remove(); return; }
  const sync = () => { btn.hidden = isPro(); };
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    btn.textContent = 'Opening…';
    const bought = await purchase();
    if (!bought) { btn.textContent = 'Upgrade'; }
    btn.disabled = false;
    sync();
  });
  onEntitlementChange(sync);
  void refreshEntitlement().then(sync);
  sync();
}

mountUpgrade();

// Listen for entitlement changes and refresh relevant UI
onEntitlementChange(() => {
  // Refresh saved view if visible (Export button)
  if (!views.saved.hidden) renderSaved();
  // Refresh review view if visible (Smart Review toggle)
  if (!views.review.hidden) startReview(useSmartReview);
  // Refresh history view if visible
  if (!views.history.hidden) renderHistory();
  // Refresh current word card (History button)
  if (cardState.word && !views.search.hidden) refreshSaveState();
  // Update History nav link visibility
  updateHistoryNav();
});

route();
