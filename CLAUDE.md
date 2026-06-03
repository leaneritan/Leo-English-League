# LEEA — Build Instructions for Claude

This file is read by Claude at the start of every lesson-building session —
whether in Claude Code (automatically) or Claude on the web (uploaded by Neritan).

**If you are Claude reading this:** follow every rule in this file when generating
or editing any LEEA lesson app. Do not skip the checklist at the bottom.
The rules here were written to fix real bugs that caused Leo's review cards to
show empty for Neritan. Ignoring them will break the review.

---

## Project Overview

**Leo's Elite English Academy (LEEA)** is a single-parent SPA (`index.html`) that
embeds links to standalone lesson HTML apps under `learn/`. Neritan (the parent)
reviews Leo's work through a review mode in each lesson app and monitors progress
on the home screen homework cards.

---

## Lesson App Architecture

Every lesson app is a single self-contained HTML file. It uses:
- `leea-cloud-config.js` + `leea-cloud.js` for Supabase cloud sync
- `localStorage` as the primary data store (cloud syncs on top)

### Required constants at the top of every lesson app

```js
const SAVE_PREFIX  = '{level}-{unit}-{lesson}-';   // e.g. '4-7-writing-'
const HOMEWORK_ID  = new URLSearchParams(location.search).get('hw') || 'leo-{level}-{unit}-{lesson}';
// e.g. 'leo-4-7-writing'
```

`SAVE_PREFIX` is always `HOMEWORK_ID` with `leo-` stripped and a trailing `-`.
They must stay consistent — `index.html` derives `savePrefix` from `HOMEWORK_ID`
by calling `id.replace(/^leo-/, '')` to reconstruct it.

---

## localStorage Key Rules — CRITICAL

### Two namespaces exist for every lesson

| Namespace | Pattern | Example |
|---|---|---|
| SAVE_PREFIX | `leea-{SAVE_PREFIX}{key}` | `leea-4-7-writing-m4-p1` |
| HOMEWORK_ID | `leea-{HOMEWORK_ID}-{key}` | `leea-leo-4-7-writing-score` |

`lSave(key, val)` writes to `leea-{key}` — so always pass the full prefixed key.

### What must be written where

| Data | Key written | Both namespaces? |
|---|---|---|
| Quiz score / final result | `SAVE_PREFIX + 'score'` AND `HOMEWORK_ID + '-score'` | Yes — use `saveScore()` |
| Module complete flag | `SAVE_PREFIX + id + '-complete'` (object with `timestamp`) | Yes (see below) |
| Module done flag | `SAVE_PREFIX + id + '-done'` AND `HOMEWORK_ID + '-' + id + '-done'` | Yes |
| Text/answers/content | `SAVE_PREFIX + key` only | No |
| Homework-level done | `SAVE_PREFIX + 'done'` AND `HOMEWORK_ID + '-done'` | Yes |

### `markComplete(id, name)` — required standard implementation

```js
function markComplete(id, name) {
  lSave(SAVE_PREFIX + id + '-complete', { name, timestamp: new Date().toISOString(), done: true });
  lSave(SAVE_PREFIX + id + '-done', true);
  lSave(HOMEWORK_ID + '-' + id + '-done', true);
  updateBadge(id, 'done');
  const btn = document.getElementById('cbtn-' + id);
  if (btn) { btn.classList.add('confirmed'); btn.textContent = '✅ ' + name + ' complete'; }
  setTimeout(() => closeModal(id), 400);
}
```

`markComplete` writes **button-click flags only** — it does NOT contain actual student
content. Never use these flags to detect whether content exists.

### `saveScore(score, done, extra)` — required standard implementation

```js
function saveScore(score, done, extra = {}) {
  const data = { score, done, timestamp: new Date().toISOString(), ...extra };
  lSave(SAVE_PREFIX + 'score', data);
  lSave(HOMEWORK_ID + '-score', data);
  if (done) {
    lSave(SAVE_PREFIX + 'done', true);
    lSave(HOMEWORK_ID + '-done', true);
  }
}
```

---

## Page-Load Writes — CRITICAL BUG TO AVOID

**Problem:** `load*()` functions run on `DOMContentLoaded` and call `lSave` with
empty strings for fields that haven't been filled yet. This creates keys like
`leea-4-7-writing-m4-p1: ""` in localStorage immediately on page open —
before the student has done any work.

**Rule:** `lSave` must only be called in response to **user action** (typing,
clicking, submitting). Never call `lSave` inside a `load*()` function.

```js
// WRONG — writes empty string on page load
function loadM4() {
  document.getElementById('m4-p1').value = lLoad(SAVE_PREFIX + 'm4-p1', '');
  m4Update(); // ← m4Update calls lSave — do NOT call this here
}

// CORRECT — only reads on load, only saves on user input
function loadM4() {
  document.getElementById('m4-p1').value = lLoad(SAVE_PREFIX + 'm4-p1', '');
  m4RefreshUI(); // a read-only UI update, no lSave calls
}
function m4Update() {            // called by oninput only
  const text = document.getElementById('m4-p1').value;
  lSave(SAVE_PREFIX + 'm4-p1', text);
  // ... word count, badge update etc.
}
```

Similarly, never call `lSave` at module-scope (top-level) for things like
`m9-topic` — only save on user interaction.

---

## Cloud Sync — CRITICAL

Every lesson app that uses cloud sync needs **all three scripts** in `<head>`, in this exact order:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="../../../../lib/leea-cloud-config.js"></script>
<script src="../../../../lib/leea-cloud.js"></script>
```

Without the Supabase CDN script, `window.supabase` is `undefined` and `leea-cloud.js`
silently disables itself — cloud sync never runs, Neritan on a different device sees
an empty review.

### Exact save/load/restore implementation

The `restoreProgressFromCloud` function has two common wrong spellings that silently
fail. Always copy this exact version:

```js
async function restoreProgressFromCloud() {
  if (!window.LEEA_CLOUD || !window.LEEA_CLOUD.enabled) return;
  try {
    const rows = await LEEA_CLOUD.fetchProgress(HOMEWORK_ID); // ← fetchProgress NOT getProgress
    if (rows) rows.forEach(r =>
      localStorage.setItem('leea-' + r.storage_key, JSON.stringify(r.value)) // ← storage_key NOT r.key
    );
  } catch(e) {}
}
```

Apps that store under `SAVE_PREFIX + key` directly (no `leea-` prefix) use:
```js
localStorage.setItem(SAVE_PREFIX + r.storage_key, JSON.stringify(r.value))
```
Match whichever prefix pattern `lSave` uses in that app.

### DOMContentLoaded — required exact order

```js
window.addEventListener('DOMContentLoaded', async function() {
  await restoreProgressFromCloud(); // ← ALWAYS first — before review AND before load*()
  if (new URLSearchParams(location.search).get('review') === '1') {
    initReviewMode(); return;        // ← review uses cloud data, so must come after restore
  }
  // normal init: initHWBanner(), loadM3(), loadM4(), etc.
});
```

**Never** put the review check before `await restoreProgressFromCloud()`.
**Never** declare `isReview` without using it — declaring and then ignoring it in
DOMContentLoaded means review mode silently falls through to normal init.

---

## Review Mode — CRITICAL

Every lesson app must support `?review=1` in the URL. When this param is present:
- Hide the main app (`#appRoot`)
- Show `#reviewScreen`
- Call `initReviewMode()`

### `initReviewMode()` — required rules

1. **Check for completed modules first**, using `SAVE_PREFIX + id + '-complete'` keys.
   A module is complete if the stored object has a `timestamp` property.

2. **"Work not started yet" check must include completions.** Only show it when
   *nothing at all* has been done — no completions, no written text, no scores.

3. **Show ALL student-generated content — not just completion status.**
   Neritan uses the review card to see exactly what Leo did. Every piece of
   data Leo produced must appear as a readable card:
   - Written text (paragraphs, sentences, free writing) → show the actual text
   - Quiz scores → show score + total + pass/fail + timestamp + wrong answers listed
   - Chip/slot selections → show the completed sentence Leo built
   - Chart / table cells → show each cell value
   - Checklist → show ticked items (only if something is ticked)
   - Completed modules list → always first, with timestamps

   **Do NOT show only "✅ Checked answers" for activities where the actual
   answers can be saved and displayed.** If Leo filled in a blank, typed a
   sentence, or selected a chip, save that value and show it in the review.

4. **Save content on user action so it can appear in review.**
   Any module where Leo produces content (writes text, selects chips, fills
   blanks) must call `lSave` when Leo interacts — not just on markComplete.
   markComplete writes flags only. Content must be saved separately.

### Required CSS — include in every lesson app

```css
.rv-card  { background:#fff; border:2px solid #dfe7e1; border-radius:16px; padding:16px 18px; margin-bottom:12px; }
.rv-lbl   { font-size:.65rem; font-weight:800; color:#7c3aed; letter-spacing:.08em; text-transform:uppercase; margin-bottom:8px; }
.rv-val   { font-size:.92rem; color:#1e293b; line-height:1.7; white-space:pre-wrap; }
.rv-score-big { font-size:2rem; font-weight:900; color:#059669; text-align:center; }
.rv-not-started { text-align:center; padding:40px; color:#7b8a82; font-size:16px; }
```

### Standard `initReviewMode()` structure

```js
function initReviewMode() {
  document.getElementById('appRoot').style.display = 'none';
  document.getElementById('reviewScreen').classList.add('show');
  const body = document.getElementById('reviewBody');

  // 1. Load ALL saved content keys
  const scoreData  = lLoad(SAVE_PREFIX + 'score');
  const writing1   = lLoad(SAVE_PREFIX + 'm4-p1', '');   // example — use real keys
  const writing2   = lLoad(SAVE_PREFIX + 'm4-p2', '');
  // ... load every content key the lesson saves

  // 2. Check which modules are marked complete
  const MOD_NAMES = { m1: 'Name 1', m2: 'Name 2', /* ... */ };
  const completedMods = Object.keys(MOD_NAMES).filter(id => {
    const d = lLoad(SAVE_PREFIX + id + '-complete', null);
    return d && d.timestamp;
  });

  // 3. "Not started" — only if truly nothing exists
  const hasAnything = scoreData || completedMods.length > 0 || writing1 || writing2 /* || other content */;
  if (!hasAnything) {
    body.innerHTML = '<div class="rv-not-started">📋 Work not started yet.</div>';
    return;
  }

  // 4. Build HTML — completedMods card FIRST, then scores, then written content
  let html = '';

  // Completed modules overview
  if (completedMods.length > 0) {
    const lines = completedMods.map(id => {
      const d = lLoad(SAVE_PREFIX + id + '-complete', null);
      const ts = d?.timestamp ? ' · ' + new Date(d.timestamp).toLocaleString() : '';
      return `✅ ${MOD_NAMES[id]}${ts}`;
    }).join('\n');
    html += `<div class="rv-card">
      <div class="rv-lbl">COMPLETED MODULES — ${completedMods.length} / ${Object.keys(MOD_NAMES).length}</div>
      <div class="rv-val" style="font-size:.82rem;line-height:1.9">${lines}</div>
    </div>`;
  }

  // Quiz result — always show score + timestamp + wrong answers
  if (scoreData) {
    const pct = Math.round(scoreData.score / (scoreData.total || 1) * 100);
    const wrongHtml = scoreData.wrong && scoreData.wrong.length
      ? `<div class="rv-val" style="color:#dc2626;margin-top:8px">Missed: ${scoreData.wrong.join(', ')}</div>`
      : `<div class="rv-val" style="color:#16a34a;margin-top:4px">🏆 No wrong answers!</div>`;
    html += `<div class="rv-card">
      <div class="rv-lbl">QUIZ RESULT</div>
      <div class="rv-score-big">${scoreData.score} / ${scoreData.total || '?'} — ${pct}%</div>
      <div class="rv-val" style="text-align:center;font-size:.75rem;color:#7b8a82">${new Date(scoreData.timestamp).toLocaleString()}</div>
      ${wrongHtml}
    </div>`;
  }

  // Written content — show actual text, not just "completed"
  if (writing1 || writing2) {
    html += `<div class="rv-card">
      <div class="rv-lbl">MODULE 4 — LEO'S WRITING</div>
      <div class="rv-val">${writing1 || '(empty)'}${writing2 ? '\n\n' + writing2 : ''}</div>
    </div>`;
  }

  // ... add a card for every other content type (chips, chart cells, etc.)

  body.innerHTML = html;
}
```

### Required `#reviewScreen` HTML — include in every lesson app

```html
<div id="reviewScreen" style="display:none;max-width:680px;margin:0 auto;padding:18px 14px">
  <div style="background:linear-gradient(135deg,#7c3aed,#5b21b6);color:#fff;border-radius:16px;padding:18px 20px;margin-bottom:16px">
    <div style="font-size:11px;font-weight:800;letter-spacing:2px;opacity:.8;text-transform:uppercase">Neritan's Review</div>
    <div style="font-size:20px;font-weight:900;margin-top:4px">Leo's Work</div>
  </div>
  <div id="reviewBody"></div>
</div>
```

---

## Homework Status in `index.html`

`index.html` uses two functions to detect progress from the outside (without
opening the lesson app):

```js
function isHomeworkDone(id) {
  return lLoad(id + '-done', false);
  // Reads leea-{HOMEWORK_ID}-done — written by saveScore() when passed=true
}

function isHomeworkStarted(id) {
  // Checks BOTH namespaces, excludes flags, excludes empty/null values
  const savePrefix = 'leea-' + id.replace(/^leo-/, '') + '-';
  const hwPrefix   = 'leea-' + id + '-';
  const hasRealContent = k => {
    if (k.endsWith('-done') || k.endsWith('-complete')) return false;
    const raw = localStorage.getItem(k);
    if (raw === null) return false;
    try {
      const v = JSON.parse(raw);
      if (v === null || v === false || v === 0 || v === '') return false;
      if (typeof v === 'string') return v.trim().length > 0;
      if (Array.isArray(v)) return v.some(x => x !== null && x !== '' && x !== undefined);
      if (typeof v === 'object') return Object.keys(v).length > 0;
      return true;
    } catch { return raw.trim().length > 0; }
  };
  return Object.keys(localStorage).some(k =>
    (k.startsWith(hwPrefix) || k.startsWith(savePrefix)) && hasRealContent(k)
  );
}
```

**Do not simplify these functions.** The value-content check exists because lesson
apps write empty strings and null arrays to localStorage on page load.

---

## Adding a New Lesson to the Home Screen

The list of live lessons is in **`live.json`** at the repo root — NOT hardcoded in `index.html`.
`index.html` fetches it on boot: `fetch('live.json').then(r=>r.json()).then(data=>{ LIVE=data; ... })`.

**Do NOT edit `index.html` to add a lesson.** Just add one line to `live.json`:

```json
"l-4-8-grammar1": { "url": "learn/our-world/level-4/unit-8/grammar-1.html", "desc": "Short description" }
```

Key format: `"{n|l}-{level}-{unit}-{slug}"` where `n` = Neritan (teach), `l` = Leo (learn).

**Every time you create a new lesson app, output two things:**
1. The complete HTML file with its exact repo path (e.g. `learn/our-world/level-4/unit-8/grammar-1.html`)
2. The `live.json` line to add alongside it

Neritan uploads the HTML file to GitHub manually, then edits `live.json` to add the entry.
If the lesson shows "Coming Soon" on the home screen, the `live.json` entry is missing.

### `doRedo` — required standard implementation

When a module has a Redo button, **never use `lSave(key, null)` to clear it** — upserting
`null` to Supabase silently fails if the `value` column has a NOT NULL constraint, leaving
the cloud row intact. On mobile page reload, `restoreProgressFromCloud` re-fetches and
restores the Done state, making Redo appear broken.

Always use `localStorage.removeItem` + `LEEA_CLOUD.deleteProgress`:

```js
function doRedo(id) {
  const keys = [SAVE_PREFIX + id + '-complete', SAVE_PREFIX + id + '-done', HOMEWORK_ID + '-' + id + '-done'];
  keys.forEach(k => {
    localStorage.removeItem('leea-' + k);
    try { if (window.LEEA_CLOUD && window.LEEA_CLOUD.enabled) LEEA_CLOUD.deleteProgress(HOMEWORK_ID, k); } catch(e) {}
  });
  updateBadge(id);
  openModule(id);
}
```

`LEEA_CLOUD.deleteProgress(homeworkId, storageKey)` is implemented in `lib/leea-cloud.js`
and issues a real `DELETE` query on the `leea_progress` table.

---

## Checklist When Generating a New Lesson App

### Constants & save helpers
- [ ] `SAVE_PREFIX` and `HOMEWORK_ID` constants defined at top
- [ ] `lSave` / `lLoad` helper functions present
- [ ] `saveScore()` writes to both namespaces
- [ ] `markComplete()` writes `-complete` (with timestamp), `-done` (both namespaces)
- [ ] `load*()` functions do NOT call `lSave` — read-only

### Cloud sync
- [ ] All three scripts present in `<head>`: Supabase CDN → leea-cloud-config.js → leea-cloud.js
- [ ] `restoreProgressFromCloud()` uses `LEEA_CLOUD.fetchProgress` (not `getProgress`)
- [ ] `restoreProgressFromCloud()` uses `r.storage_key` (not `r.key`)
- [ ] DOMContentLoaded is `async` and `await`s `restoreProgressFromCloud()` as its **first line**

### Review mode
- [ ] `#appRoot` wraps the main app — `initReviewMode()` hides it
- [ ] `#reviewScreen` element exists (hidden by default)
- [ ] `isReview` is declared AND checked in DOMContentLoaded — not just declared
- [ ] Review check comes **after** `await restoreProgressFromCloud()` in DOMContentLoaded
- [ ] Review "not started" check includes `completedMods.length > 0`
- [ ] Review shows completed modules card when any module is done
- [ ] Review shows all content that shows as DONE in Leo's app

### Redo buttons
- [ ] `doRedo` uses `localStorage.removeItem` + `LEEA_CLOUD.deleteProgress` — never `lSave(key, null)`

### Registering the lesson
- [ ] Output the exact repo file path for Neritan to upload
- [ ] Output the `live.json` line to add (do NOT edit `index.html`)
