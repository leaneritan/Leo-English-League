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

3. **Show everything that shows as DONE in Leo's app.** If a module badge says
   DONE, the review must reflect that. The standard review shows:
   - A "COMPLETED MODULES — X / 10" card listing every completed module + timestamp
   - Quiz scores (both final quiz and sub-module quizzes)
   - All written content (paragraphs, chart cells, free writing)
   - Checklist state (only if something is ticked or module is marked complete)

### Standard `initReviewMode()` structure

```js
function initReviewMode() {
  document.getElementById('appRoot').style.display = 'none';
  document.getElementById('reviewScreen').classList.add('show');
  const body = document.getElementById('reviewBody');

  // 1. Load all data
  const scoreData = lLoad(SAVE_PREFIX + 'score');
  // ... load all content keys

  // 2. Check which modules are marked complete
  const MOD_NAMES = { m1: 'Name 1', m2: 'Name 2', /* ... */ };
  const completedMods = Object.keys(MOD_NAMES).filter(id => {
    const d = lLoad(SAVE_PREFIX + id + '-complete', null);
    return d && d.timestamp;
  });

  // 3. "Not started" — only if truly nothing exists
  const hasAnything = scoreData || completedMods.length > 0 || /* written content keys */;
  if (!hasAnything) {
    body.innerHTML = '<div class="rv-not-started">📋 Work not started yet.</div>';
    return;
  }

  // 4. Build HTML — completedMods card first, then content
  let html = '';
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
  // ... then quiz results, written content, etc.

  body.innerHTML = html;
}
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
