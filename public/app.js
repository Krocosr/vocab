const $ = sel => document.querySelector(sel);
const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};

async function api(path, opts) {
  const res = await fetch(path, opts);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(body.error || 'request failed'), { body });
  return body;
}

/* ---------- routing ---------- */

const views = { search: $('#view-search'), saved: $('#view-saved'), review: $('#view-review') };

function route() {
  const name = { '': 'search', '#/': 'search', '#/saved': 'saved', '#/review': 'review' }[location.hash] ?? 'search';
  for (const [k, v] of Object.entries(views)) v.hidden = k !== name;
  document.querySelectorAll('[data-nav]').forEach(a =>
    a.classList.toggle('active', a.dataset.nav === name));
  if (name === 'saved') renderSaved();
  if (name === 'review') startReview();
}
addEventListener('hashchange', route);

/* ---------- search ---------- */

const input = $('#searchInput');
const datalist = $('#suggest');

let suggestTimer;
input.addEventListener('input', () => {
  clearTimeout(suggestTimer);
  const q = input.value.trim();
  if (q.length < 2) { datalist.replaceChildren(); return; }
  suggestTimer = setTimeout(async () => {
    const words = await api(`/api/suggest?q=${encodeURIComponent(q)}`).catch(() => []);
    datalist.replaceChildren(...words.map(w => {
      const o = document.createElement('option');
      o.value = w;
      return o;
    }));
  }, 250);
});

$('#searchForm').addEventListener('submit', e => {
  e.preventDefault();
  const w = input.value.trim();
  if (w) lookup(w);
});

async function lookup(word) {
  const box = $('#result');
  box.replaceChildren(el('div', 'empty', 'Looking up…'));
  try {
    renderCard(await api(`/api/word/${encodeURIComponent(word)}`), box);
  } catch (e) {
    const card = el('div', 'error-card');
    card.append(el('p', null, `No entry found for “${word}”.`));
    if (e.body?.suggestion) {
      const link = el('a', null, `Did you mean “${e.body.suggestion}”?`);
      link.href = '#/';
      link.addEventListener('click', () => { input.value = e.body.suggestion; lookup(e.body.suggestion); });
      card.append(el('p', null), link);
    }
    box.replaceChildren(card);
  }
}

/* ---------- word card ---------- */

function chipRow(label, words) {
  if (!words?.length) return null;
  const wrap = el('div');
  wrap.append(el('h2', null, label));
  const chips = el('div', 'chips');
  for (const w of words) chips.append(el('span', null, w));
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
  const saveBtn = el('button', null, 'Save');
  saveBtn.type = 'button';
  let saved = false;
  saveBtn.addEventListener('click', async () => {
    saveBtn.disabled = true;
    try {
      await api(`/api/words/${encodeURIComponent(entry.word)}`, { method: saved ? 'DELETE' : 'PUT' });
      saved = !saved;
      saveBtn.textContent = saved ? 'Saved' : 'Save';
    } finally { saveBtn.disabled = false; }
  });
  actions.append(saveBtn);
  head.append(actions);
  card.append(head);

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

async function renderSaved() {
  const box = $('#savedList');
  box.replaceChildren(el('div', 'empty', 'Loading…'));
  const rows = await api('/api/words').catch(() => []);
  if (!rows.length) {
    box.replaceChildren(el('div', 'empty', 'No saved words yet. Search a word and hit Save.'));
    return;
  }
  box.replaceChildren(...rows.map(r => {
    const row = el('div', 'saved-row');
    const left = el('div');
    const w = el('button', 'word', r.word);
    w.type = 'button';
    w.addEventListener('click', () => { location.hash = '#/'; input.value = r.word; lookup(r.word); });
    const metaBits = [`saved ${r.saved_at.slice(0, 10)}`];
    if (r.review_count) metaBits.push(`reviewed ${r.review_count}× (${r.known_count} known)`);
    left.append(w, el('div', 'meta', metaBits.join(' · ')));
    const del = el('button', null, 'Remove');
    del.type = 'button';
    del.addEventListener('click', async () => {
      await api(`/api/words/${encodeURIComponent(r.word)}`, { method: 'DELETE' });
      row.remove();
      if (!box.children.length) renderSaved();
    });
    row.append(left, del);
    return row;
  }));
}

/* ---------- review ---------- */

let queue = [];
let qi = 0;

async function startReview() {
  const box = $('#reviewCard');
  box.replaceChildren(el('div', 'empty', 'Loading…'));
  queue = await api('/api/review').catch(() => []);
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
  const card = el('article', 'card');
  card.append(el('h1', null, entry.word));
  if (entry.phonetic) card.append(el('div', 'phonetic', entry.phonetic));

  const face = el('div', 'review-face');
  const revealBtn = el('button', 'primary', 'Reveal');
  revealBtn.type = 'button';
  revealBtn.addEventListener('click', () => {
    const first = entry.meanings?.[0]?.definitions?.[0];
    face.replaceChildren(
      el('p', 'lede', first?.text ?? '(no definition cached)'),
      ...(entry.origin ? [el('p', 'example', entry.origin)] : []));
    revealBtn.remove();
    const btns = el('div', 'review-buttons');
    for (const [label, known] of [['Again', false], ['Knew it', true]]) {
      const b = el('button', known ? 'primary' : null, label);
      b.type = 'button';
      b.addEventListener('click', async () => {
        await api(`/api/words/${encodeURIComponent(entry.word)}/review`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ known }),
        }).catch(() => {});
        qi++;
        showReviewCard();
      });
      btns.append(b);
    }
    face.append(btns);
  });
  face.append(revealBtn);
  card.append(face, el('p', 'meta', `${qi + 1} / ${queue.length}`));
  box.replaceChildren(card);
}

route();
