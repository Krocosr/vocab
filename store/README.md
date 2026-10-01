# Store card composer

Generates the five Play Store listing cards in `screenshots/`.

```
store/
├── tokens.css     the locked system — palette, type scale, geometry
├── compose.js     the renderer. Reads every value from tokens.css
├── compose.html   preview harness: renders all five, in-page
├── raw/           uncaptioned 360x640 device captures (the source)
└── screenshots/   the composed 1080x1920 cards (the output)
```

## Regenerate

```sh
cd store
python -m http.server 8960     # or any static server
# open http://127.0.0.1:8960/compose.html
```

The page renders all five and leaves them on `globalThis.__cards`. To write
them to disk, pull the data URLs and decode, or screenshot the preview grid.

## The type scale is the point

The first pass rendered headlines at 60px on a 1080px canvas — 5.5% of width.
Play shows these in a horizontal carousel at roughly 200px wide, so a 60px
headline renders at ~11px and reads as an aside. `--type-hero` is now 112px
(10.4%), which renders at ~20px in the carousel and is legible at a glance.

Never hardcode a colour or size in `compose.js`. Add it to `tokens.css` and
reference it. The composer reads tokens via `getComputedStyle`, so the CSS file
is the only place a value lives.

## `bottom` is a fit signal, not a pixel scan

`buildCard()` returns `{ canvas, bottom }` where `bottom` is where the text ink
ends. Check it against the card height after any type-scale change.

It is deliberately *not* a canvas alpha scan: the card background always reaches
the last row, and the `split` and `zoom` layouts crop the device off-canvas on
purpose, so neither is evidence of overflow. An earlier version of this file
scanned pixels and reported all five cards as overflowing when none were.

## Layouts

Deliberately varied so the carousel does not read as one template repeated.

| Card | Layout | Headline | Device |
|---|---|---|---|
| `01-lookup` | hero — type owns the top, device below | 112px | 864px centred |
| `02-etymology` | visual first — device on top, caption beneath | 112px | 780px high |
| `03-saved` | diagonal split — headline full-width, device beside it | 112px | 850px, right |
| `04-review` | tilted −9°, caption centred above | 112px | 720px rotated |
| `05-review-revealed` | zoomed, cropped by the bottom edge | 112px | 1000px |

`canvas.fillText` takes `(text, x, y)`. Dropping the text argument renders
nothing at all and fails silently — it cost this set one headline twice. The
`wrap()` helper exists so every headline goes through the same three-arg call.

## Surface texture

Cards 03 and 04 left large flat fields that read as unfinished at carousel
size. Each card can carry a `texture` block:

```js
texture: {
  glow:  { x, y },                    // soft radial, depth
  ghost: { word, x, y, rot },         // 260px word at 19% white
}
```

The ghost word is **the word that device is actually displaying** — `balustrade`
on the saved-list card, `clamber` on the review card. That keeps the treatment
content-honest instead of decorative, and it ties the composition to the app.
It is deliberately *not* a status bar or any other re-drawn UI chrome.

### The placement rule that matters

Every ghost must sit in **genuinely empty card** — never behind the device.
Both earlier passes got this wrong: the ghosts were placed at x≈850 while the
devices spanned x=430..1120, so they were completely hidden and the cards still
read as empty. Check the device's bounding box, including the rotated AABB on
`tilt`, before picking a position.

At `--ghost-ink` 0.10 the ghost was invisible on a saturated field. It needs
0.18+ to register at 200px. If you lower it, check at carousel size.

## Every card is 112px. That is not a coincidence.

Four rounds of corrections on this set all pushed the same direction: *too
small*, *not heroic*, *boring*, *empty*, *can be bigger*. The consistent signal
was **go bigger** — more type weight, larger devices, no flat empty fields.

So the set is now uniform on scale and varied on everything else:

- **one type scale** — all headlines `--type-hero` 112px, all subheads
  `--type-sub-hero` 40px. A card that drops to 72px reads as an aside next to
  its neighbours, which is exactly the "boring" complaint.
- **five device sizes** — 720 / 780 / 850 / 864 / 1000
- **five layouts** — none share a text position or device placement
- **no flat fields** — every card carries a glow, and the three with real
  negative space also carry a ghost word

`03-saved` runs its ghost **vertically** down the left strip. A horizontal
260px word is ~1400px wide and cannot fit a 250px margin; rotating it is the
only way that field gets used. Its device is also pulled fully into frame —
bleeding the right edge sliced the app's Remove buttons mid-word, which read as
a layout bug rather than a deliberate crop.
