# LEEA — Build Instructions for Claude

This file is read by Claude at the start of every lesson-building session —
whether in Claude Code (automatically) or Claude on the web (uploaded by Neritan).

**If you are Claude reading this:** from Unit 8 onward, lessons are built on the
**LEEA Engine** (`lib/leea-engine.js`). A lesson file contains *only content* — you
do NOT write storage, cloud sync, review mode, badges, or redo logic. The engine
owns all of that. Your job is to fill in a content schema. Follow it exactly and the
review card, cloud sync, and redo all work automatically.

> Older lessons (most of Unit 7) are hand-built single-file apps using the legacy
> pattern. Leave them as they are unless asked to migrate one. The legacy rules live
> in git history; everything below is the current standard.

---

## Project Overview

**Leo's Elite English Academy (LEEA)** is a single-parent SPA (`index.html`) that
links to standalone lesson HTML apps under `learn/`. Neritan (the parent) reviews
Leo's work through `?review=1` on each lesson and monitors progress on the home screen.

---

## How a lesson works now

A lesson is a tiny HTML shell that loads the engine and calls `LEEA.lesson({...})`
with content. **This is the entire file** — no CSS, no save functions, no review code:

```html
<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Song · What's Your Hobby? — Leo's App 🎵</title>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="../../../../lib/leea-cloud-config.js"></script>
<script src="../../../../lib/leea-cloud.js"></script>
<script src="../../../../lib/leea-engine.js"></script>
</head><body><script>
LEEA.lesson({
  id: 'leo-4-8-song',          // HOMEWORK_ID — always 'leo-{level}-{unit}-{slug}'
  titleIcon: '🎵',
  title: "What's Your Hobby?",
  subtitle: 'Unit 8 · Song · Leo’s practice',
  reviewSubtitle: 'Unit 8 · Song · What’s Your Hobby?',
  theme: 'green',              // green | blue | purple | amber | rose
  modules: [ /* ... blocks ... */ ]
});
</script></body></html>
```

- The four `<script>` tags are required and must be in this order. The `../../../../`
  path is correct for `learn/our-world/level-4/unit-N/`. Adjust depth if nesting differs.
- `id` is the `HOMEWORK_ID`. The engine derives `SAVE_PREFIX` from it automatically
  (`'leo-4-8-song'` → `'4-8-song-'`). You never touch storage keys.

---

## Module schema

`modules` is an array. Every module has `id`, `type`, `icon`, `title`, and an optional
`sub` (shown on the card). `id` is `m1`, `m2`, … (`ma`, `mb` are fine too). Add
`wide: true` to make a card span the full row (used for the dashboard).

Pick a `type` from the blocks below. Put content in the fields that block expects.

### `flashcards` — word carousel, each card with an optional mini-game
```js
{ id:'m2', type:'flashcards', icon:'🆕', title:'Song Words', sub:'chorus · verse · rhyme',
  cards:[
    { word:'chorus', emoji:'🔁', ipa:'/ˈkɔːrəs/', ja:'サビ', jaen:'the repeating part',
      def:'A chorus = the part of a song that repeats.',
      game:{ type:'pick', q:'Which part repeats?', opts:['Chorus','Verse'], correct:0 } }
  ] }
```
`ipa`, `ja`, `jaen`, `def`, `game` are all optional. Mini-game `game.type` options:
- `pick`     → `{ q, opts:[...], correct: <index> }`
- `lyric`    → `{ q, lines:[...], correct: <index> }`  (tap the right line)
- `tf`       → `{ s: '<statement>', a: true|false }`
- `gap`      → `{ before, after, chips:[...], a:'<correct chip>' }`
- `scramble` → `{ q, pieces:[...], a:'<answer>', join:'' }` (`join` defaults to a space)

### `quiz` — sequential multiple choice, auto-scored, tracks wrong answers
```js
{ id:'m6', type:'quiz', icon:'🧠', title:'Quiz', sub:'Show what you know', passMark:80,
  passMsg:'Amazing, Leo!', tryMsg:'Sing it again — you’ve got this!',
  questions:[ { q:'What repeats in a song?', options:['chorus','verse'], answer:0 } ] }
```

### `truefalse` — list of statements, scored
```js
{ id:'m3', type:'truefalse', icon:'✅', title:'True or False',
  statements:[ { text:'A fossil is in rock.', answer:true } ] }
```

### `matching` — tap a left item, then its right partner
```js
{ id:'m4', type:'matching', icon:'🔗', title:'Match', prompt:'Match word to meaning',
  pairs:[ { left:'score', right:'points in a game' } ] }
```

### `unscramble` — reorder word chips into a sentence
```js
{ id:'m5', type:'unscramble', icon:'🔡', title:'Word Order',
  items:[ { q:'Put the words in order.', pieces:['photos','take'], answer:'take photos' } ] }
```

### `builder` — pick chips to fill slots; **the built sentence is saved and shown in review**
```js
{ id:'m5', type:'builder', icon:'✍️', title:'Write a Line',
  model:'"I <b>collect stuffed animals</b>."',
  rows:[
    { prefix:'I', options:['take photos','read comics'] },
    { prefix:'because', suffix:'.', options:['it is fun','I love them'] }
  ] }
```

### `writing` — free text; **saved and shown in review**
```js
{ id:'m8', type:'writing', icon:'📝', title:'Free Writing',
  prompt:'Write 2 sentences about your hobby.', placeholder:'I like…' }
```

### `chart` — fill-in table cells; **filled cells shown in review**
```js
{ id:'m7', type:'chart', icon:'📊', title:'Plan', prompt:'Fill the chart',
  columns:['Invention','Fact','Opinion'],
  rows:[ { label:'Phone' }, { label:'Car' } ] }   // label = read-only first cell (optional)
```

### `checklist` — tick-box self-check; **ticked items shown in review**
```js
{ id:'m9', type:'checklist', icon:'☑️', title:'Edit Check',
  prompt:'Tick what you did:', items:['Capital letters','Full stops','Spelling'] }
```

### `karaoke` — song lyrics; wrap tappable words in `*asterisks*`
```js
{ id:'m1', type:'karaoke', icon:'🎵', title:'Listen & Sing',
  intro:'Tap the green words while you sing! 🎤',
  sections:[
    { label:'Chorus 🔁', cls:'cho', lines:["What's your hobby?"] },
    { label:'Verse 1 📜', lines:["The highest *score* wins the *game*."] }
  ] }
```

### `info` — read-only teaching slide
```js
{ id:'m0', type:'info', icon:'📖', title:'Read', html:'<p>Any HTML you want.</p>' }
// or: text:'Plain text instead of html'
```

### `dashboard` — auto progress overview (no content needed)
```js
{ id:'m7', type:'dashboard', icon:'📊', title:'My Progress', wide:true,
  footnote:'Keep practising! 🎶' }
```

---

## `custom` — the escape hatch (when no block fits)

When an activity doesn't match any block, use `custom`. You write only the
interaction; the engine still gives you storage, completion, redo, and the review card.

```js
{ id:'mX', type:'custom', icon:'🎯', title:'Label the Map',
  render(el, api){
    el.innerHTML = `...your UI...`;
    // api.isReview  → true when Neritan is reviewing; render the saved state read-only
    // api.save(subkey, value)   → persists (both namespaces + cloud) automatically
    // api.load(subkey, fallback)
    // api.complete(name?)       → mark module done
    // api.score(score, total, wrongArray)  → for quiz-like customs
    // api.esc(str)              → HTML-escape helper
  },
  review(api){            // optional — return HTML string for the review card, or '' to skip
    const v = api.load('answer', '');
    return v ? `<div class="rv-card"><div class="rv-lbl">Label the Map</div><div class="rv-val">${api.esc(v)}</div></div>` : '';
  }
}
```

**Rule for `custom`:** if Leo produces content (types, picks, drags), you MUST
`api.save(...)` it on interaction AND return it from `review(api)`. That is the whole
point — Neritan must see what Leo did, not just "completed". Use the `.rv-card` /
`.rv-lbl` / `.rv-val` classes (the engine provides them) so it matches every other card.

See `learn/our-world/level-4/unit-8/song.html` module `m4` for a real example.

---

## What the engine guarantees (do NOT reimplement)

- **Storage** — both namespaces + the flags `index.html` needs; never writes empties on load.
- **Cloud sync** — restore-first on load, save-on-action, delete-on-redo. Correct API calls baked in.
- **Review card** (`?review=1`) — completed-modules card first, then a content card for every
  block that has saved content. `writing`, `builder`, `chart`, `checklist`, `quiz`, and `custom`
  show Leo's actual content automatically.
- **Redo** — deletes cloud rows properly (no zombie "Done" after reload).
- **Badges, scores, completion, progress dashboard, theming.**

If you find yourself writing `lSave`, `markComplete`, `initReviewMode`, `restoreProgressFromCloud`,
or review CSS in a lesson file, stop — that belongs to the engine, not the lesson.

---

## Registering the lesson on the home screen

The live-lesson list is **`live.json`** at the repo root — NOT hardcoded in `index.html`.
Add one line:

```json
"l-4-8-song": { "url": "learn/our-world/level-4/unit-8/song.html", "desc": "What's Your Hobby? song app" }
```

Key format: `"{n|l}-{level}-{unit}-{slug}"` — `n` = Neritan (teach), `l` = Leo (learn).
**Do NOT edit `index.html`.** If a lesson shows "Coming Soon", its `live.json` entry is missing.

**Every time you create a lesson, output two things:**
1. The complete HTML file with its exact repo path.
2. The `live.json` line to add.

Neritan uploads the HTML manually, then adds the `live.json` line.

---

## Checklist for a new engine lesson

- [ ] Four `<script>` tags in `<head>`: Supabase CDN → leea-cloud-config.js → leea-cloud.js → leea-engine.js
- [ ] `<body>` contains only the `LEEA.lesson({...})` script — no CSS, no other logic
- [ ] `id` is `'leo-{level}-{unit}-{slug}'`
- [ ] Every module has `id`, `type`, `icon`, `title`
- [ ] Each module's content fields match its block's schema above
- [ ] Any `custom` block saves Leo's content on interaction AND returns it from `review(api)`
- [ ] Optional: a `dashboard` module (usually last, `wide:true`) for the progress overview
- [ ] Output the exact file path + the `live.json` line

---

## Extending the engine

If a genuinely new activity will recur across many lessons, add it as a first-class
block in `lib/leea-engine.js` (a `render`/`review` pair in the `BLOCKS` map) rather than
repeating a `custom` block. Keep all plumbing inside the engine — lessons stay pure content.
Smoke-test with a minimal DOM shim (see how the engine's blocks were verified) before shipping.
