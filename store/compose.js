/* Hallmark · macrostructure: Marquee Hero · tone: declarative · anchor hue: cool-blue
 * Reads every value from tokens.css via getComputedStyle — no raw colour or size
 * is written here. Load store/compose.html (it links tokens.css) or import this
 * from a page that does.
 *
 * Renders the five Play listing cards. Each card is a saturated field with the
 * device as proof and the type as the subject. Layouts vary deliberately across
 * the set so the carousel does not read as one template repeated.
 */

const TOKENS = {};

export function loadTokens() {
  const cs = getComputedStyle(document.documentElement);
  const names = [
    'card-hero','card-second','card-third','card-fourth','card-fifth',
    'wash-hero','wash-second','wash-third','wash-fourth','wash-fifth',
    'ink-card','ink-card-soft','device-body','device-screen','device-shadow',
    'type-hero','type-display','type-title','type-sub-hero','type-sub',
    'weight-display','weight-sub',
    'track-hero','track-display','track-sub',
    'leading-hero','leading-display',
    'card-w','card-h','pad-card','radius-device','radius-screen','bezel',
    'device-shadow-blur','device-shadow-y',
    'ghost-ink','ghost-size','glow-ink','glow-radius',
  ];
  for (const n of names) {
    const v = cs.getPropertyValue(`--${n}`).trim();
    // A token missing from this list reads as undefined and reaches canvas as
    // NaN, which fails deep inside a drawing call with an opaque message.
    if (!v) throw new Error(`token --${n} is missing from tokens.css`);
    TOKENS[n] = v;
  }
  return TOKENS;
}

const px = v => parseFloat(v);
const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/* ── the set ──────────────────────────────────────────────────────────────
   card   paper token  wash token  layout   title                     sub
   ------------------------------------------------------------------------ */
/* `texture` fills the field the device leaves empty. The ghost word is the word
   that device is actually displaying, so the composition carries real content
   instead of filler.
   Placement rule: every ghost sits in genuinely empty card — not behind the
   device. The first pass put them at x≈850 with devices spanning x=430..1120,
   so they were hidden and the cards still read as empty. */
export const CARDS = [
  { file: '01-lookup',          paper: 'card-hero',   wash: 'wash-hero',   layout: 'hero',
    title: 'Look it up instantly',  sub: 'Meaning, examples, word origins',
    texture: { glow: { x: 880, y: 1700 } } },

  { file: '02-etymology',       paper: 'card-second', wash: 'wash-second', layout: 'bottom',
    title: 'See where words come from', sub: 'The real origin of every word',
    texture: { glow: { x: 540, y: 760 } } },

  { file: '03-saved',           paper: 'card-third',  wash: 'wash-third',  layout: 'split',
    title: 'Tag every word',        sub: 'By the book it came from',
    // free field is the left strip beside the device; the word runs vertically
    // down it, which a horizontal ghost could never fit
    texture: {
      glow: { x: 150, y: 1480 },
      ghost: { word: 'balustrade', x: 118, y: 1500, rot: -1.5708 },
    } },

  { file: '04-review',          paper: 'card-fourth', wash: 'wash-fourth', layout: 'tilt',
    title: 'Review what you forgot', sub: 'Not what you already know',
    // the tilted device left a dead wedge in the bottom-right. Bigger device
    // fills it, and its top edge still laps over the sub line — the overlap
    // between headline and device is the point of this card, so keep it.
    texture: {
      glow: { x: 880, y: 1560 },
    } },

  { file: '05-review-revealed', paper: 'card-fifth',  wash: 'wash-fifth',  layout: 'zoom',
    title: 'Grade yourself',        sub: 'Again, or knew it',
    // no ghost: at 800px the device fills the lower two-thirds and a ghost
    // only survives as a sliver clipped by the canvas edge
    texture: {
      glow: { x: 540, y: 240 },
    } },
];

/* ── helpers ──────────────────────────────────────────────────────────── */

function wrap(x, text, maxW, font) {
  x.font = font;
  const lines = [];
  let cur = '';
  for (const w of text.split(' ')) {
    const t = cur ? `${cur} ${w}` : w;
    if (x.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
  }
  lines.push(cur);
  return lines;
}

/* ── surface texture ────────────────────────────────────────────────────
   Cards 03 and 04 left large flat fields that read as unfinished at carousel
   size. The field gets a soft glow for depth plus a giant ghost of the word
   that device is actually showing, so the composition carries real content
   rather than filler. Deliberately not a re-drawn status bar or any other
   fabricated UI chrome. */
function paintTexture(x, card, W, H) {
  const t = card.texture;
  if (!t) return;

  if (t.glow) {
    const r = px(TOKENS['glow-radius']);
    const g = x.createRadialGradient(t.glow.x, t.glow.y, 0, t.glow.x, t.glow.y, r);
    g.addColorStop(0, TOKENS['glow-ink']);
    g.addColorStop(1, 'oklch(99% 0 0 / 0)');
    x.fillStyle = g;
    x.fillRect(0, 0, W, H);
  }

  if (t.ghost) {
    const gh = t.ghost;
    x.save();
    x.translate(gh.x, gh.y);
    if (gh.rot) x.rotate(gh.rot);
    x.textAlign = 'center';
    x.fillStyle = TOKENS['ghost-ink'];
    x.font = `${TOKENS['weight-display']} ${px(TOKENS['ghost-size'])}px ${FONT}`;
    x.fillText(gh.word, 0, 0);
    x.restore();
  }
}

function device(x, img, bx, by, bw, rot = 0) {
  const bh = Math.round(bw * (px(TOKENS['card-h']) / px(TOKENS['card-w'])));
  const spin = fn => {
    x.save();
    x.translate(bx + bw / 2, by + bh / 2);
    if (rot) x.rotate(rot);
    x.translate(-(bx + bw / 2), -(by + bh / 2));
    fn();
    x.restore();
  };
  spin(() => {
    x.shadowColor = TOKENS['device-shadow'];
    x.shadowBlur = px(TOKENS['device-shadow-blur']);
    x.shadowOffsetY = px(TOKENS['device-shadow-y']);
    x.beginPath();
    x.roundRect(bx, by, bw, bh, px(TOKENS['radius-device']));
    x.fillStyle = TOKENS['device-body'];
    x.fill();
  });
  const b = px(TOKENS.bezel);
  spin(() => {
    x.beginPath();
    x.roundRect(bx + b, by + b, bw - b * 2, bh - b * 2, px(TOKENS['radius-screen']));
    x.clip();
    x.drawImage(img, bx + b, by + b, bw - b * 2, bh - b * 2);
  });
  return by + bh;
}

/* ── card renderer ─────────────────────────────────────────────────────── */

export function buildCard(card, img) {
  loadTokens();
  const W = px(TOKENS['card-w']), H = px(TOKENS['card-h']);
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d');

  const g = x.createLinearGradient(0, 0, W * 0.7, H);
  g.addColorStop(0, TOKENS[card.paper]);
  g.addColorStop(1, TOKENS[card.wash]);
  x.fillStyle = g;
  x.fillRect(0, 0, W, H);
  paintTexture(x, card, W, H);

  const pad = px(TOKENS['pad-card']);
  const maxW = W - pad * 2;
  // Text-ink extent, tracked per layout. See the note above renderAll.
  let inkBottom = 0;

  if (card.layout === 'hero') {
    // The statement owns the card. Type is ~3x the size it was.
    const tFont = `${TOKENS['weight-display']} ${TOKENS['type-hero']} ${FONT}`;
    const sFont = `${TOKENS['weight-sub']} ${TOKENS['type-sub-hero']} ${FONT}`;
    x.textAlign = 'left';
    x.fillStyle = TOKENS['ink-card'];
    x.font = `${TOKENS['weight-display']} ${TOKENS['type-hero']} ${FONT}`;
    let y = 168;
    x.letterSpacing = TOKENS['track-hero'];
    for (const ln of wrap(x, card.title, maxW, tFont)) { x.fillText(ln, pad, y); y += px(TOKENS['type-hero']) * px(TOKENS['leading-hero']); }
    x.letterSpacing = TOKENS['track-sub'];
    x.font = sFont;
    x.fillStyle = TOKENS['ink-card-soft'];
    x.fillText(card.sub, pad, y + 6);
    inkBottom = y + 6;
    x.letterSpacing = '0px';
    device(x, img, 140, 458, 800);
  }

  if (card.layout === 'bottom') {
    // device capped so a 2-line 112px headline + sub still clears the card
    const end = device(x, img, 150, 52, 780);
    const tFont = `${TOKENS['weight-display']} ${TOKENS['type-hero']} ${FONT}`;
    const sFont = `${TOKENS['weight-sub']} ${TOKENS['type-sub']} ${FONT}`;
    x.textAlign = 'left';
    x.fillStyle = TOKENS['ink-card'];
    x.letterSpacing = TOKENS['track-display'];
    x.font = tFont;
    let y = end + 118;
    for (const ln of wrap(x, card.title, maxW, tFont)) { x.fillText(ln, pad, y); y += px(TOKENS['type-hero']) * px(TOKENS['leading-hero']); }
    x.letterSpacing = TOKENS['track-sub'];
    x.font = sFont;
    x.fillStyle = TOKENS['ink-card-soft'];
    x.fillText(card.sub, pad, y + 2);
    inkBottom = y + 2;
    x.letterSpacing = '0px';
  }

  if (card.layout === 'split') {
    // was a 470px column, which forced 72px type; full width lets it go hero size
    const tFont = `${TOKENS['weight-display']} ${TOKENS['type-hero']} ${FONT}`;
    const sFont = `${TOKENS['weight-sub']} ${TOKENS['type-sub-hero']} ${FONT}`;
    // pulled into frame: bleeding the right edge sliced the Remove buttons
    // mid-word, which reads as a layout bug rather than a deliberate crop
    device(x, img, 180, 520, 860);
    x.textAlign = 'left';
    x.fillStyle = TOKENS['ink-card'];
    x.letterSpacing = TOKENS['track-display'];
    x.font = tFont;
    let y = 176;
    for (const ln of wrap(x, card.title, maxW, tFont)) { x.fillText(ln, pad, y); y += px(TOKENS['type-hero']) * px(TOKENS['leading-hero']); }
    x.letterSpacing = TOKENS['track-sub'];
    x.font = sFont;
    x.fillStyle = TOKENS['ink-card-soft'];
    for (const ln of wrap(x, card.sub, maxW, sFont)) { x.fillText(ln, pad, y + 18); y += px(TOKENS['type-sub-hero']) * 1.3; }
    inkBottom = y;
    x.letterSpacing = '0px';
  }

  if (card.layout === 'tilt') {
    const tFont = `${TOKENS['weight-display']} ${TOKENS['type-hero']} ${FONT}`;
    const sFont = `${TOKENS['weight-sub']} ${TOKENS['type-sub-hero']} ${FONT}`;
    x.textAlign = 'center';
    x.fillStyle = TOKENS['ink-card'];
    x.letterSpacing = TOKENS['track-display'];
    x.font = tFont;
    let y = 176;
    // fillText needs (text, x, y) — dropping `ln` renders no headline at all
    for (const ln of wrap(x, card.title, maxW - 40, tFont)) { x.fillText(ln, W / 2, y); y += px(TOKENS['type-hero']) * px(TOKENS['leading-hero']); }
    x.letterSpacing = TOKENS['track-sub'];
    x.font = sFont;
    x.fillStyle = TOKENS['ink-card-soft'];
    x.fillText(card.sub, W / 2, y - 2);
    inkBottom = y - 2;
    x.letterSpacing = '0px';
    device(x, img, 160, 419, 860, -9 * Math.PI / 180);
  }

  if (card.layout === 'zoom') {
    const tFont = `${TOKENS['weight-display']} ${TOKENS['type-hero']} ${FONT}`;
    const sFont = `${TOKENS['weight-sub']} ${TOKENS['type-sub-hero']} ${FONT}`;
    // text sits lower here than on the other cards so the caption does not
    // crowd the top edge against the oversized device beneath it
    device(x, img, 140, 420, 800);
    x.textAlign = 'left';
    x.fillStyle = TOKENS['ink-card'];
    x.letterSpacing = TOKENS['track-hero'];
    x.font = tFont;
    let y = 258;
    for (const ln of wrap(x, card.title, maxW, tFont)) { x.fillText(ln, pad, y); y += px(TOKENS['type-hero']) * px(TOKENS['leading-hero']); }
    x.letterSpacing = TOKENS['track-sub'];
    x.font = sFont;
    x.fillStyle = TOKENS['ink-card-soft'];
    x.fillText(card.sub, pad, y + 4);
    inkBottom = y + 4;
    x.letterSpacing = '0px';
  }

  return { canvas: c, bottom: inkBottom };
}


/* `bottom` is the text-ink extent, not a canvas pixel scan: the card background
   always reaches the last row and two layouts crop the device off-canvas on
   purpose, so neither is a fit signal. The type scale moved ~1.9x in one pass
   and three cards silently overflowed or lost a headline — hence the number. */
export async function renderAll(rawDir) {
  loadTokens();
  const out = [];
  for (const card of CARDS) {
    const img = new Image();
    img.src = `${rawDir}/${card.file}.png`;
    await img.decode();
    const { canvas, bottom } = buildCard(card, img);
    out.push({
      file: card.file,
      dataUrl: canvas.toDataURL('image/png'),
      bottom,
      h: canvas.height,
      overflow: bottom >= canvas.height - 2,
    });
  }
  return out;
}
