---
name: Opener_SKILL
description: Builds Unit Opener slides (teach/) and Leo's independent practice app (learn/) for Our World Second Edition Level 4. Use when user requests Unit Opener slides, Leo app, or both for any unit. Updated from Unit 6 + Unit 8 builds — 2026-05.
version: 2.0
---

# Opener SKILL

> Extracted from Unit 8 "That's Really Interesting!" Opener — 2026-05-25
> Covers: HTML slides (teach/) + Leo app (learn/) + JSON delivery
> Two modes: Claude builds directly | Claude Design prompt

---

## ⚠️ BEFORE DOING ANYTHING — Read these first

1. **`LEEA_DESIGN_PRINCIPLES.md`** — North star, architecture, color themes, emoji rules, soccer rule, save standard, handoff checklist. Read this before writing a single line of code.
2. **`Unit_Preflight_SKILL.md`** — Lesson Planner extraction workflow, glossary/extras authoring, tag format, build order. Read this before touching the lesson planner.

Do not proceed until both files have been read from project knowledge.

---

## Two Modes

**Mode 1 — Claude builds directly** (default)
Claude reads the lesson planner, builds slides + app in the same session.
Deliver: `teach-l4u{N}-opener.html` + `learn-l4u{N}-opener.html` + JSON patch

**Mode 2 — Claude Design prompt**
Claude generates a detailed spec prompt for the slides only (suitable for Claude Design or another Claude session).
The Leo app should always be built directly (Mode 1) — it requires Supabase wiring that Claude Design cannot handle.

**If unclear, ask:**
> "Should I build the Opener directly, or generate a Claude Design prompt for the slides?"

---

## Step 0 — Read before building

**The Unit Glossary SKILL runs first.** By the time you build the Opener, the vocab table already exists — do NOT re-extract the LP.

Read from the Glossary SKILL handoff:
- Related Vocabulary words + count (4–6+, varies by unit)
- Academic Language words + count (typically 4, may vary)
- Emoji assignments (already locked — use them exactly)
- Introduce sub-sections listed for this unit (Build Background, Activate Prior Knowledge, Set the Stage, Explain, Recycle — only what the LP lists)
- BE THE EXPERT content (About the Photo, Vocabulary Strategy tip)
- Student Book activity type (Look and answer / Look and circle / Check T/F / Write a Caption)
- Formative Assessment tasks
- Unit theme, anchor photo, creative through-line

**Through-line examples** — determines the unit activity tab label and Leo app Tab 3 content:

| Unit | Through-line | Tab 3 label | Slide activity |
|---|---|---|---|
| 6 | Deep Sea Explorer's Journal | ✍️ My Caption | Write a Caption (Explorer's Log Entry #1) |
| 8 | Reporter's Notebook | ✍️ My Caption | Write a Caption (Reporter's Notebook) |
| Others | Read LP Writing/Mission section for clues | Adapt | Adapt |

Then:
1. Confirm unit color theme (see table below)
2. Plan slide count: `2 fixed opening + R related slides + 1 related recap + A academic slides + 1 academic recap + closing slides = total`
   - R = related word count from Glossary SKILL
   - A = academic word count from Glossary SKILL
   - Closing slides vary by how many Introduce sub-sections the LP lists (see slide structure below)

---

## Core philosophy

**Follow the LP. Make it digital and interactive.**

The Lesson Planner is the curriculum backbone — every slide, every activity, every section must trace back to something in the LP. We don't invent lesson structure. We follow the sequence, the objectives, the activities, and the vocabulary exactly as the LP defines them.

What we bring is the **digital and interactive layer**:
- Static vocabulary → interactive games
- Discussion questions → tap-to-reveal cards
- Paper activities → live HTML with immediate feedback
- Teacher script → teacher notes panel
- Homework → Leo's independent app with Supabase save

**When in doubt:** if the LP says it, include it. If the LP doesn't say it, don't invent it.

---

## Part 1 — Slides (teach/)

### File
`teach-l4u{N}-opener.html` → `teach/our-world/level-4/unit-{N}/opener.html`

### Technical standard
- 1920×1080 fixed canvas, `transform: scale()` on outer container only
- Outfit font (Google Fonts)
- Standalone HTML — no external web components
- Teacher notes: JS object `NOTES` keyed by slide number, slide-out panel (440px), keyboard shortcut N
- Keyboard nav: ← → arrows + spacebar
- Nav bar (52px, fixed bottom): ◀ Prev · slide counter · Next ▶ · 📝 Notes · unit label

### Slide structure (variable total — formula below)

**Total = 2 fixed opening + R related slides + 1 related recap + A academic slides + 1 academic recap + closing slides**

R = related word count · A = academic word count · Closing = ~10–14 depending on LP Introduce sub-sections

**Fixed opening (always 2 slides):**

| # | Section | Content |
|---|---------|---------|
| 1 | **In This Unit, I Will…** | 4 goal cards from LP "In This Unit" panel — always slide 1 |
| 2 | Objectives | 4 cards: content objectives, language objectives, unit big picture, today's words |

**Related Vocabulary — one slide per word + recap:**

| # | Section | Content |
|---|---------|---------|
| 3 … 2+R | Related Vocab — word 1…R | Two-column: word info left, interactive game right |
| 3+R | Related Recap | Tap-to-flip cards (all R related words) |

**Academic Vocabulary — one slide per word + recap:**

| # | Section | Content |
|---|---------|---------|
| 4+R … 3+R+A | Academic Vocab — word 1…A | Two-column: word info left, interactive game right |
| 4+R+A | Academic Recap | Tap-to-flip cards + key distinction box |

**Fixed closing — Introduce sub-sections + rest:**

Each Introduce sub-section listed in the LP gets its **own dedicated slide** with the sub-section name in the header. Only include sub-sections the LP actually lists — skip any not present.

| Position | Section | Content |
|---|---|---|
| +1 | Introduce → Build Background | Stand-up / prior knowledge connection activity |
| +2 | Introduce → Activate Prior Knowledge | Draw, label, discuss activity |
| (+3) | Introduce → Set the Stage | Only if LP lists it |
| (+4) | Introduce → Explain | Only if LP lists it |
| (+5) | Introduce → Recycle | Only if LP lists it |
| +next | **Title** | Unit N reveal — theme background, title, theme chips |
| +next | The Photo | CSS art scene + 4 tap-to-reveal discussion cards |
| +next | About the Photo | BE THE EXPERT — photographer + location + story |
| +next | Vocabulary Strategy | BE THE EXPERT — vocabulary learning tip from LP sidebar |
| +next | Teaching Tip | BE THE EXPERT — encouragement guidance for Dad |
| +next | Look and Check | SB activity — varies by unit (T/F, circle, answer, caption) |
| +next | Write a Caption / Unit Activity | Through-line activity (Explorer's Log, Reporter's Notebook, etc.) |
| +next | Formative Assessment | Tap-to-mark cards |
| +next | Unit Preview | Grid of all 11 components |
| +last | Great Job! | Celebration — gradient, trophy, all word chips |

**Example — Unit 6 (R=6, A=4, Introduce: Build Background + Activate = 2 sub-sections):**
`2 + 6 + 1 + 4 + 1 + 2 (Introduce) + 10 (rest of closing) = 26 slides`

**Example — Unit 8 (R=4, A=4, Introduce: Build Background only = 1 sub-section):**
`2 + 4 + 1 + 4 + 1 + 1 (Introduce) + 10 (rest of closing) = 23 slides`

### Two-column vocabulary slide layout
```
LEFT 36% (word panel)          RIGHT 64% (game panel)
─────────────────────          ──────────────────────
[RELATED / ACADEMIC tag]       [Interactive game]
[big emoji]
[big word]                     [Definition reveal]
[pronunciation]                (hidden until game done)
[Dad 💬 script]
```
Border-right separates panels. Teacher notes explain what Dad says and what Leo should do.

### Interactive game types

| Game | Best for | Mechanic |
|---|---|---|
| Spinner wheel | hobby / collections / categories | Click SPIN, wheel rotates through emojis |
| Dark room | photographer / creator | Click shutter, flash, polaroid drops |
| Mountain trail | hiker / explorer / journey | Tap 5 waypoints in order |
| Ice tap | hidden animal / discovery | Tap 5× anywhere, animal slides in |
| Photo detective | analyze / observe | Click 5 pulsing ❓ hotspots on scene |
| Notebook fill | describe / report | Tap WHO/WHAT/WHERE/WHEN/HOW buttons |
| Why chain | explain / cause-effect | Tap 3 locked cards left-to-right |
| Caption match | caption / label | 3 options, tap correct one |

Not every word needs its own unique game. Simpler words can share a strong activity.

### Teacher notes
```javascript
const NOTES = {
  1: '<p class="tn-lbl">Slide purpose</p><p>What to say, expected response, tips.</p>',
  // one entry per slide
};
```

---

## Part 2 — Leo App (learn/)

### File
`learn-l4u{N}-opener.html` → `learn/our-world/level-4/unit-{N}/opener.html`

### Key principle
Leo uses this **alone** after the lesson. No Dad 💬 prompts. No teacher instructions. Clean, self-explanatory UI.

### LEEA Save Standard
```javascript
const SAVE_PREFIX = '4-{N}-opener-';
const HOMEWORK_ID = new URLSearchParams(location.search).get('hw') || 'leo-4-{N}-opener';
const isReview = new URLSearchParams(location.search).get('review') === '1';
```
Lib path from `learn/our-world/level-4/unit-{N}/opener.html`:
`../../../../lib/leea-cloud-config.js` and `../../../../lib/leea-cloud.js`

### Tab structure (6 tabs)
```
[📚 Related Words] [🔍 Academic Words] [🖼️ The Scene] [✍️ Unit Activity] [⚽ Can Leo Score?] [🎯 My Progress]
```
- **My Progress is always LAST**
- Tab 2 emoji adapts to unit anchor photo subject
- Tab 3 label adapts to unit through-line
- Yellow badge appears when section complete

### Tab 0 — Related Words
- Flashcards (tap to flip) · Match (click-to-match) · Fill in the blank
- Module footer: `↺ Redo` (110px) + `Mark Related Words complete ✓` (flex:1)

### Tab 1 — Academic Words
- Flashcards · Scenario selector (4 rounds, one per academic word — unit-specific, not hardcoded WHAT/WHY) · Fill in the blank
- Module footer: same pattern

### Tab 2 — The Scene
- CSS art scene (16:9, emoji-based) + 5 questions
- Module footer

### Tab 3 — Unit Activity
- Driven by through-line (Write a Caption = Reporter's Notebook / Explorer's Log textarea)
- Module footer

### Tab 4 — Can Leo Score?
- 3 unit-awareness questions (📘) + N vocab questions (⚽ soccer players)
- No Ronaldo/Messi · web-search stats · 3+ leagues
- GOAL! animation on correct · confetti at ≥73%
- No module footer — auto-completes

### Tab 5 — My Progress
- Unit card + word chips + progress list linking to all tabs
- Renders fresh on every open

### Module footer pattern
```html
<div class="mod-footer">
  <button class="redo-btn" id="redo-{s}" onclick="armedRedo('{s}')">↺ Redo</button>
  <button class="complete-btn" id="complete-{s}" onclick="markSectionComplete('{s}')">Mark [Name] complete ✓</button>
</div>
```
- Redo: two-tap armed (3s timeout, no confirm())
- Mark complete: saves `{done:true, timestamp:Date.now()}`, confirmed class, badge
- Restore on load: check for `timestamp` in saved data

---

## Part 3 — JSON delivery

Use `Unit_Glossary_SKILL` for all JSON authoring.

- Academic words → rich cards tagged `L4U{N}Op`
- Related words → simple cards tagged `L4U{N}Op`
- Deliver as full updated snapshot
- `l4-extras.json` → liberal additions or empty array

**Do not skip. Build is not complete until both JSON files are delivered.**

---

## ⚠️ STEP 4 — Handoff summary (MANDATORY)

```
✅ Unit N Opener — Complete

FILES DELIVERED:
• teach-l4uN-opener.html → teach/our-world/level-4/unit-N/opener.html
• learn-l4uN-opener.html → learn/our-world/level-4/unit-N/opener.html
• l4-glossary.json → content/our-world/level-4/glossary.json
• l4-extras.json → content/our-world/level-4/extras.json

WORDS ADDED TO GLOSSARY:
Academic (rich cards): word1, word2, word3, word4
Related (simple cards): word5, word6, word7, word8
Extras: [none / list any]

NEXT: Vocab 1
```

---

## Unit color themes

| Unit | Primary | Academic accent |
|---|---|---|
| 5 | Orange `#F97316` | — |
| 6 | Ocean teal | — |
| 7 | Purple `#7C3AED` | — |
| 8 | Forest green `#16A34A` | Arctic blue `#0EA5E9` |
| 9 | TBD | — |

---

## Soccer rule
- ❌ Never Ronaldo or Messi
- ✅ Always web-search current stats before writing examples
- ✅ 3+ leagues when soccer is used

---

## Changelog

**v2.0** — 2026-05-26
- Step 0: LP extraction removed — Unit Glossary SKILL runs first
- Slide 1 changed to "In This Unit, I Will…"
- Slide structure: variable word count (R+A from Glossary SKILL)
- Introduce sub-sections: each gets own dedicated slide
- Fixed closing: added Activate Prior Knowledge + Vocabulary Strategy
- Tab 1 sort: replaced hardcoded WHAT/WHY with unit-specific scenario selector
- Through-line examples table added
- Handoff summary made mandatory (Step 4)

**v1.0** — 2026-05-25
First extraction from Unit 8 Opener build.
