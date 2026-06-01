---
name: Vocab1_SKILL
description: Builds Unit Vocabulary 1 slides (teach/) and Leo's independent practice app (learn/) for Our World Second Edition Level 4. Use when user requests Vocab 1 slides, Leo app, or both for any unit. Extracted from Unit 8 build — 2026-06.
version: 1.0
---

# Vocabulary 1 SKILL

> Extracted from Unit 8 "That's Really Interesting!" Vocabulary 1 — 2026-06
> Covers: HTML slides (teach/) + Leo app (learn/)
> Build order: LP extraction → JSON → slides → app → skill

---

## ⚠️ BEFORE DOING ANYTHING — Read these first

1. **`LEEA_DESIGN_PRINCIPLES.md`** — North star, architecture, color themes, emoji rules, soccer rule, save standard, handoff checklist.
2. **`Unit_Preflight_SKILL.md`** — Lesson Planner extraction workflow, glossary/extras authoring, tag format, build order.

Do not proceed until both files have been read from project knowledge.

---

## Build Order (non-negotiable)

```
1. Read LP → extract vocab words + graphic organizers + TR numbers + BE THE EXPERT content
2. Lock emoji table (one emoji per word, no changes after this)
3. Build slides (teach/)  ← confirm with user before building
4. Build Leo app (learn/) ← in the same chat session
5. Extract this skill
```

Never build the app before the slides. The app depends on knowing what was taught.

---

## Step 0 — LP Extraction Checklist

Read `Lesson_Planner_Unit_N.pdf` and extract:

| Item | Where in LP | Notes |
|---|---|---|
| Academic Language words | LP p.1 header | Usually 4 words — verify exact count |
| Related Vocabulary words | LP p.1 | Usually 1–3 words — verify exact count |
| Content Vocabulary words | LP p.2–3 | Exact count varies — always read TR: X.2 audio script to confirm |
| Graphic organizers | LP Resources line | Every listed organizer becomes an interactive slide/tab |
| TR: X.1 | LP p.3 | Reading text (3 paragraphs) |
| TR: X.2 | Audio script file | Word + sentence pairs — used in Match tab |
| Vocabulary Strategy | LP BE THE EXPERT | Used in slides + skill extraction |
| Teaching Tip | LP BE THE EXPERT | Used in slides |
| Formative Assessment | LP last page | Used in slide 40+ and quiz tab |

**STOP if any of these are missing — ask before proceeding.**

### Graphic Organizer → Builder lookup

| LP says | Builder to use | Location |
|---|---|---|
| Two-column chart | `buildDndSorter()` | `teach/components/charts.js` |
| Word web | `buildWordWeb()` | `teach/components/charts.js` |
| Sunshine organizer | `buildSunshine()` | `learn/components/sunshine.js` (Leo app) / `buildSunshineSlide()` in slides |
| Venn diagram | `buildVennDiagram()` | `teach/components/charts.js` |
| T-chart | `buildTwoColChart()` | `teach/components/charts.js` |
| Fill-in table | `buildFillTable()` | `teach/components/charts.js` |

**Rule:** Every organizer listed in the LP Resources line becomes an interactive slide in teach/ AND an interactive tab in learn/. Never skip one.

---

## Part 1 — Slides (teach/)

### File
`teach-l4u{N}-vocab1.html` → `teach/our-world/level-4/unit-{N}/vocab1.html`

### Technical standard
- 1920×1080 fixed canvas, `transform: scale()` on outer container only
- Outfit font (Google Fonts)
- Standalone HTML — no external dependencies except `teach/components/charts.js`
- Teacher notes: JS object `NOTES` keyed by slide number, slide-out panel (440px), keyboard shortcut N
- Keyboard nav: ← → arrows + spacebar
- Nav bar: fixed 52px bottom, forest green Notes button
- Unit theme color applied to all headers

### Slide structure (total varies — 40–45 slides typical)

| # | Section | Count | Notes |
|---|---|---|---|
| 1 | Title | 1 | Unit name, "Vocabulary 1", all word chips preview |
| 2 | Objectives | 1 | 4 objective cards + Big Question |
| 3 | Related Vocabulary | 1 per word | Mini-game for EACH related word |
| 4 | Academic Language Recap | 1 | 2×2 grid of mini-games, one per academic word |
| 5–N | Content Vocabulary Games | 1 per word | One unique mini-game per content vocab word |
| N+1–N+2 | Warm Up | 2 | Recycle (what is a hobby?) + activities grid |
| N+3–N+4 | Present | 2 | Open book photos + vocab diagram |
| N+5–N+7 | Reading | 1 per paragraph | TR: X.1 text + discussion questions |
| N+8–N+9 | Practice 1 | 2 | TR: X.1 instructions + discussion |
| N+10 | Graphic Organizer | 1 per organizer | From LP Resources line — use charts.js |
| N+11–N+12 | Practice 2 | 2 | TR: X.2 listen and repeat |
| N+13–N+14 | Recap | 2 | Act it out + concept contrast (e.g. alone vs together) |
| N+15–N+16 | Apply | 2 | Model dialogue + Sunshine Organizer Q&A |
| N+17–N+18 | Extend | 2 | Paragraph writing + share |
| N+19–N+20 | Wrap Up | 2 | Guessing game + role play |
| N+21–N+22 | BE THE EXPERT | 2 | Vocabulary Strategy + Teaching Tip |
| N+23 | Formative Assessment | 1 | Tap yes/no per LP assessment question |
| N+24 | Great Job! | 1 | All words celebration |

### Mini-game rules

**Every vocabulary type gets mini-games — no exceptions:**
- Related vocab words: 1 unique game per word
- Academic language words: 2×2 grid, 1 unique game per word
- Content vocab words: 1 unique game per word (14 unique games for 14 words)

**Game variety rule:** No two consecutive slides may use the same game type.

**Game design principles:**
- Game name shown in the game-title bar
- Left panel (36%): tag chip, emoji, word, IPA, syllables, pos, Dad 💬 sentence
- Right panel (64%): game area + definition box (hidden until game complete)
- Definition box: green border, slides in with `.show` class on game complete
- Japanese text: NEVER shown on teach/ slides (teacher-facing only)
- Soccer players: Haaland, Salah, Bellingham, Yamal, Musiala, Kane — always web-search for current 2025-26 stats first. Never Ronaldo or Messi.

**Apostrophe rule (CRITICAL):**
Never use apostrophes (`'s`, `it's`, `don't`, `let's`) inside single-quoted JS strings.
Always change to double-quoted strings OR rephrase. Run `node --check` after every JS chunk.

**Academic mini-game types (2×2 grid, slide 4):**
Each word gets one of: data analysis question, best-description MCQ, scenario MCQ, caption picker.
Color code: analyze=#0EA5E9, describe=#7C3AED, explain=#F59E0B, caption=#16A34A.

### Teacher notes
Every slide must have a NOTES entry. Structure:
```javascript
const NOTES = {
  1: '<p class="tn-lbl">Set the mood</p><p>...</p>',
  // ...
};
```
Each note includes: purpose label, what to say, TPR instructions, soccer link where relevant.

---

## Part 2 — Leo's App (learn/)

### File
`learn-l4u{N}-vocab1.html` → `learn/our-world/level-4/unit-{N}/vocab-1.html`

### Technical standard
- Outfit font, forest green `#16A34A` theme
- Tab-based navigation (NOT screens, NOT step-by-step modals)
- Max-width constraints: flashcard-wrap `560px`, tab-body `800px`, both centered
- Three required scripts in `<head>`:
  ```html
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="../../../../lib/leea-cloud-config.js"></script>
  <script src="../../../../lib/leea-cloud.js"></script>
  ```
  Path `../../../../` = 4 levels up from `learn/our-world/level-4/unit-N/`
- charts.js (if Sort tab needed): `<script src="/teach/components/charts.js"></script>`
- sunshine.js (if Apply tab needed): `<script src="/learn/components/sunshine.js"></script>`

### Save system (CRITICAL — exact method names)

```javascript
const SAVE_PREFIX = '4-{N}-vocab-1-';  // N = unit number
const HOMEWORK_ID = new URLSearchParams(location.search).get('hw') || 'leo-4-{N}-vocab-1';
const isReview = new URLSearchParams(location.search).get('review') === '1';

function lSave(key, val) {
  localStorage.setItem(SAVE_PREFIX + key, JSON.stringify(val));
  if (window.LEEA_CLOUD) LEEA_CLOUD.saveProgress(HOMEWORK_ID, key, val);
}
function lLoad(key, fallback) {
  const raw = localStorage.getItem(SAVE_PREFIX + key);
  return raw !== null ? JSON.parse(raw) : fallback;
}
async function restoreProgressFromCloud() {
  if (!window.LEEA_CLOUD) return;
  try {
    const rows = await LEEA_CLOUD.fetchProgress(HOMEWORK_ID);  // ← fetchProgress NOT getProgress
    if (rows) rows.forEach(r =>
      localStorage.setItem(SAVE_PREFIX + r.storage_key, JSON.stringify(r.value))  // ← storage_key NOT key
    );
  } catch(e) {}
}
```

**DOMContentLoaded MUST be async and await cloud restore first:**
```javascript
document.addEventListener('DOMContentLoaded', async () => {
  await restoreProgressFromCloud();  // ← MUST complete before ANY lLoad() call
  updateProgress();
  for (let i = 0; i < TOTAL_TABS; i++) restoreComplete(i);
  renderTab0();  // render first tab after cloud data is in localStorage
});
```

### Tab structure (13 tabs — always in this order)

| # | Icon | Name | Content |
|---|---|---|---|
| 0 | 📚 | Academic & Related | Flashcards for ALL academic + related vocab words (never content vocab) |
| 1 | 🔥 | Warm Up | Hobby chip selector + alone/together textareas + big question |
| 2 | 🎯 | Present | All content vocab words, one at a time — word card + Dad script + yes/no check |
| 3 | 🃏 | Flashcards | All content vocab words — practice flip + quiz mode + shuffle |
| 4 | 🧠 | BE THE EXPERT | Graphic organizer from LP (two-column sort, word web, etc.) |
| 5 | 📖 | Reading | TR: X.1 fill-in-blank — sticky word bank outside scroll container |
| 6 | 📝 | Practice | 5 MCQ questions from the reading discussion |
| 7 | 🔤 | Unscramble | All content vocab words — practice mode + timed quiz mode |
| 8 | 🔗 | Match | TR: X.2 word ↔ sentence — 2 rounds, matched-pairs table |
| 9 | ☀️ | Apply | Sunshine Organizer — sentence builder + question writer per ray |
| 10 | 🎭 | Wrap Up | Guessing game clues (7 rounds) |
| 11 | ✅ | Quiz | 14 MCQ, one per content vocab word — score + trophy result |
| 12 | ⚽ | Dribble! | Soccer challenge — same 14 questions, beat the defenders |

**Tab 0 rule:** Academic & Related ONLY. "Academic" means all words listed under Academic Language AND Related Vocabulary in the LP — regardless of word count. Never mix content vocab into Tab 0.

### Japanese visibility rule
Japanese text is HIDDEN by default on all flashcards (learn/ apps).
Show/hide via tap-to-reveal button: `🇯🇵 日本語` → reveals → `🇯🇵 隠す` → hides.
Japanese state RESETS on every new card (never carries over).

```javascript
function toggleJp(e) {
  e.stopPropagation();
  const jp = document.getElementById('fc-jp');
  const btn = document.getElementById('fc-jp-btn');
  const revealed = jp.classList.toggle('revealed');
  btn.textContent = revealed ? '🇯🇵 隠す' : '🇯🇵 日本語';
}
```

### Mark Complete / Redo footer (every tab)
```html
<div class="tab-footer">
  <button class="btn-redo" id="redo-N" onclick="doRedo(N)">↺ Redo</button>
  <button class="btn-complete" id="complete-N" onclick="markComplete(N)">Mark [Name] complete ✓</button>
</div>
```
- Redo: two-tap armed pattern — first tap arms (red, "Sure?"), second tap executes. 3s timeout resets.
- **NEVER use `confirm()` dialogs — banned everywhere.**
- `markComplete(N)` saves `{ done: true, timestamp: Date.now() }` then updates badge.
- `confirmed` class = `pointer-events:none` on complete button only (not redo).
- Restore on load: check for `timestamp` in the saved object, NOT raw `done` key.

### Tab 4 — BE THE EXPERT (graphic organizer)
Uses `buildDndSorter()` from `/teach/components/charts.js` for two-column sort:
```javascript
function initSort() {
  const el = document.getElementById('sort-leo');
  if (!el || el.innerHTML.trim()) return;
  el.innerHTML = buildDndSorter({
    id: 'dnd-leo{N}',
    tiles: [ /* all vocab words with answer keys */ ],
    zones: [
      { key: 'things', label: '👤 People or Things', color: '#1A6BB5' },
      { key: 'actions', label: '⚡ Actions', color: '#16A34A' },
    ],
    onComplete: function() { document.getElementById('sort-done').classList.add('show'); }
  });
}
```
Zone labels and colors vary by unit — read the LP to determine what the two columns should be.

### Tab 9 — Sunshine Organizer
Uses `buildSunshine()` from `/learn/components/sunshine.js`:
```javascript
wrap.innerHTML = buildSunshine({
  id: 'sunshine-svg',
  words: sunWords.map(i => ({ word: vocabWords[i].word, emoji: vocabWords[i].emoji })),
  saved: lLoad('sunshine', {}),
  onSelect: openSunEditor,
  centerLabel: 'My Questions',
});
```
**onclick callback rule:** `buildSunshine` registers `onSelect` as `window.__sunCB`. This is required because `let/const` variables in script scope are NOT accessible from inline onclick strings.

**Each ray has two activities (in order):**
1. **Sentence Builder** — scrambled word chips, Leo taps in order to build a sentence using the vocabulary word. Tap built sentence to remove last word. ✓ Check validates.
2. **Question Writer** — textarea saves to that ray. Preview appears inside the ray on the SVG.

**Word selection:** Choose 5 content vocab words that make varied, interesting questions. Prioritize verbs and adjectives over nouns.

### Tab 5 — Reading (sticky word bank)
Word bank MUST be `position:sticky; top:0; z-index:20` and placed OUTSIDE the scrolling container:
```html
<!-- OUTSIDE tab-body, BEFORE it -->
<div style="position:sticky;top:0;z-index:20;background:#fff;...">
  <!-- word bank buttons -->
</div>
<div class="tab-body">
  <!-- reading paragraphs with blanks -->
</div>
```
Parent container must have `overflow:auto` NOT `overflow:hidden`.

### Tab 7 — Unscramble
- Scramble the word WITHOUT the article (e.g. scramble `controller` not `a controller`)
- Hint shows: letter count + first letter + pos (in practice mode only)
- Accept answer with or without the article
- `data-ans` attribute holds the full word including article

### Tab 8 — Match (TR: X.2)
- Sentences come from TR: X.2 audio script in EXACT audio-script order
- Split into 2 rounds of 7 (round 1 = first 7, round 2 = last 7)
- Matched pairs accumulate in a table below as Leo completes them
- Wrong match: both chips flash red briefly, then reset (no penalty)

### Review mode (`?review=1`)
When `isReview === true`:
```javascript
document.addEventListener('DOMContentLoaded', async () => {
  await restoreProgressFromCloud();
  if (isReview) { initReviewMode(); return; }
  // ... normal init
});
```
`initReviewMode()` shows a read-only card layout for Dad:
- Progress: all tabs listed with ✅/⬜ + timestamp
- Warm Up responses: selected hobbies, alone/together text, big question answer
- Sunshine rays: word + what Leo wrote (⬜ if empty)
- Style: read-only, no interactive elements, Dad-facing, clean card layout

### Keys saved per tab

| Key | Type | Where saved |
|---|---|---|
| `tab-0` … `tab-12` | `{done, timestamp}` | `markComplete(N)` |
| `wu-hobbies` | `string[]` | `wuSave()` on chip tap |
| `wu-alone`, `wu-together`, `wu-answer` | `string` | `wuSave()` on textarea input |
| `sunshine` | `{0:'q', 1:'q', ...}` | `sunEditorSave()` on input |

---

## Part 3 — Common Patterns & Bugs

### Apostrophe trap (applies to both slides and app)
**Pattern:** `'Leo's turn'` inside a single-quoted JS string silently breaks execution.
**Fix:** Change outer quotes to double: `"Leo's turn"` OR rephrase to avoid the apostrophe.
**Check:** Run `node --check file.html` after every JS chunk.

### Word bank parent overflow
**Pattern:** Sticky word bank stops sticking if any parent has `overflow:hidden`.
**Fix:** Word bank outside the scrolling container. Parent uses `overflow:auto`.

### `restoreProgressFromCloud()` timing
**Pattern:** App renders before cloud data arrives → review card shows empty.
**Fix:** `await restoreProgressFromCloud()` MUST complete before any `lLoad()` call.
**Exact method names:** `LEEA_CLOUD.fetchProgress()` and `r.storage_key` (not `getProgress` / `r.key`).

### `confirm()` banned
Never use `confirm()` anywhere. Use the two-tap armed pattern for all destructive actions.

### `updateBadge()` null check
Always wrap badge updates in try/catch with null check:
```javascript
try {
  const el = document.getElementById('prog-fill');
  if (el) el.style.width = pct + '%';
} catch(e) {}
```

### Soccer players
Always web-search for current 2025-26 season stats before generating examples.
Spread across 3+ leagues per deck. Never Ronaldo or Messi.
Current active: Haaland, Salah, Yamal, Musiala, Kane, Bellingham.

---

## Part 4 — Delivery Checklist

### Slides (teach/)
- [ ] All LP graphic organizers have interactive slides using charts.js
- [ ] Every vocabulary type (related, academic, content) has mini-games
- [ ] No two consecutive vocab slides use the same game type
- [ ] Teacher notes on every slide
- [ ] `node --check` passes with zero errors
- [ ] Soccer players are current, spread across leagues, no Ronaldo/Messi

### Leo's app (learn/)
- [ ] Tab 0 contains only Academic + Related words (never content vocab)
- [ ] Japanese hidden by default with tap-to-reveal
- [ ] Sticky word bank is outside scroll container
- [ ] `await restoreProgressFromCloud()` before any lLoad()
- [ ] `LEEA_CLOUD.fetchProgress()` (not getProgress)
- [ ] `r.storage_key` (not r.key)
- [ ] Two-tap armed redo, no confirm()
- [ ] Review mode (`?review=1`) shows Dad-facing read-only summary
- [ ] `node --check` passes with zero errors
- [ ] sunshine.js imported from `/learn/components/sunshine.js`
- [ ] charts.js imported from `/teach/components/charts.js`

---

## Part 5 — Unit 8 Reference Data

> Canonical reference for Unit 8 Vocab 1. Use as a worked example when adapting to other units.

**Unit:** 8 · "That's Really Interesting!" · Forest green `#16A34A`
**File paths:** `teach/our-world/level-4/unit-8/vocab1.html` · `learn/our-world/level-4/unit-8/vocab-1.html`
**SAVE_PREFIX:** `'4-8-vocab-1-'` · **HOMEWORK_ID:** `'leo-4-8-vocab-1'`

**Vocabulary counts:**
- Academic: 4 (analyze, describe, explain, caption)
- Related: 1 (a musical instrument)
- Content: 14

**Content vocab (emoji locked):**

| Word | Emoji | IPA | POS |
|---|---|---|---|
| collect | 🗂️🪙 | /kəˈlɛkt/ | verb |
| a musical group | 🎵👥 | /mjuːzɪkəl ɡruːp/ | noun |
| creative | 🎨💡 | /kriˈeɪtɪv/ | adjective |
| take photos | 📸🌿 | /teɪk foʊtoʊz/ | verb phrase |
| enjoy | 😄🎉 | /ɪnˈdʒɔɪ/ | verb |
| alone | 🧍🔇 | /əˈloʊn/ | adverb |
| an avatar | 🎮👤 | /ˈævətɑːr/ | noun |
| compete | 🏆⚔️ | /kəmˈpiːt/ | verb |
| a point | 🔢⭐ | /pɔɪnt/ | noun |
| score | 📊🏅 | /skɔːr/ | noun |
| together | 👫🤝 | /təˈɡɛðər/ | adverb |
| cooperate | 🤜🤛 | /koʊˈɒpəreɪt/ | verb |
| a controller | 🕹️🎮 | /kənˈtroʊlər/ | noun |
| a screen | 📺🖥️ | /skriːn/ | noun |

**Graphic organizers (from LP Resources line):**
- Two-column chart → `buildDndSorter` (People or Things | Actions) — slides + Tab 4
- Sunshine organizer → `buildSunshine` — Tab 9

**Sunshine words (Tab 9, 5 rays):** collect (0), creative (2), enjoy (4), compete (7), cooperate (11)

**Sunshine sentences (sentence builder):**

| Ray | Word | Sentence chips |
|---|---|---|
| 0 | collect | I · collect · soccer · cards · as · a · hobby · . |
| 1 | creative | Yamal · is · very · creative · with · the · ball · . |
| 2 | enjoy | Do · you · enjoy · playing · video · games · ? |
| 3 | compete | Haaland · and · Kane · compete · every · season · . |
| 4 | cooperate | We · cooperate · to · win · the · game · . |

**TR: X.1 blanks (14, in order):** collect · a musical group · Creative · take photos · enjoy · alone · avatars · compete · points · score · together · cooperate · controller · screen

**TR: X.2 pairs (audio-script order):**
1. collect — "What do you collect?"
2. a musical group — "What's your favorite musical group?"
3. creative — "Many creative people like to take photos."
4. take photos — "I love to take photos of animals."
5. enjoy — "Do you enjoy video games?"
6. alone — "I like to play video games alone."
7. an avatar — "Can I see your avatar?"
8. compete — "Do you like to compete?"
9. a point — "I have seven points already!"
10. score — "What's the score?"
11. together — "Let's play my new video game together."
12. cooperate — "I like to cooperate more than compete!"
13. a controller — "There are three controllers in this game."
14. a screen — "Look at the screen."

---

## Part 6 — JSON Updates (after slides + app are complete)

Run this step AFTER both slides and app are built and tested.

### 6a — extras.json patch

Extract every non-LP word that appeared **repeatedly and meaningfully** in games, app mechanics, or reading context. Use this filter:

- Did Leo interact with this word in a game mechanic? (e.g. tapping coins for 'collect')
- Did it appear in 2+ different slides or tabs?
- Would Leo remember it from the lesson?

**V1 component rule: 0–2 extras entries maximum.** If more than 2 qualify, pick the highest-exposure ones.

For each extra word, write a simple card entry:
```json
{
  "id": "word-id",
  "word": "the word",
  "emoji": "🔡",
  "category": "extras",
  "tags": ["L4U{N}V1"],
  "pos": "noun/verb/etc",
  "sample": "Sample sentence with <b>target word</b> bolded.",
  "jp_word": "日本語",
  "jp_reading": "よみかた",
  "jp_sentence": "日本語の<b>例文</b>。",
  "jp_tags": ["タグ"]
}
```

Deliver as a patch file `l4u{N}v1-extras-patch.json` — NOT a full file replacement.

### 6b — glossary.json patch

Two changes always needed after Vocab 1:

**1. New related vocabulary word** (if V1 has a related word not in the Opener):
Add as a simple card with tag `L4U{N}V1`.

**2. Tag recycled academic words:**
The 4 academic words were introduced in the Opener (`L4U{N}Op`).
In Vocab 1 they are recycled — add `L4U{N}V1` to their existing tags array.

Deliver as a patch file `l4u{N}v1-glossary-patch.json` with clear instructions:
- Which entries to add (full JSON)
- Which entries to update (id + tag to add)

### Unit 8 Vocab 1 reference

**extras.json additions (2 words):**
- `gorilla` 🦍 — Perfect Shot game + Caption exercise + BE THE EXPERT reading (3 contexts)
- `a coin` 🪙 — central mechanic of Collector game (collect)

**glossary.json additions:**
- New entry: `a musical instrument` 🎷🎻 — related word, tag `L4U8V1`
- Tag update: add `L4U8V1` to analyze, describe, explain, caption (recycled from Opener)
