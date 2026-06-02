<!--
  LEEA SKILL FILE
  Component: Song
  Scope: Our World Second Edition — ANY level / ANY unit (format-generic)
  Worked example in Appendix A was first built from Unit 8 Level 4 (2026-06)
-->

# Song SKILL

The Song component turns a unit's song into an **interactive** Style A slide deck (`teach/`) plus a **modal-based** practice app for Leo (`learn/`). The song is a *recycling* lesson — almost every word was already taught in Vocabulary 1, Vocabulary 2, or the Opener — so the job is to **sing, reinforce, and gently set up the grammar that comes next**, not to teach a brand-new word list.

> **This skill is unit-agnostic.** Parts 0–4 are the rules for building *any* unit's Song (Unit 9, 10, …). Wherever you see `<L>` (level) and `<N>` (unit), substitute the real numbers. **Appendix A** is one fully worked example (Unit 8) — it is illustrative only; never copy its words/colors/lyrics into another unit. For a new unit, run Step 0 against that unit's Lesson Planner and pull its own data.

---

## ⚠️ BEFORE DOING ANYTHING — Read these first

1. `LEEA_DESIGN_PRINCIPLES.md` — global rules (themes, save standard, modal standard, apostrophe trap).
2. `Unit_Preflight_SKILL.md` — JSON-first, emoji-locking, glossary structure.
3. This file.
4. The **Vocab 1 + Vocab 2 builds for this unit** (or their locked `vocab-1.json` / `vocab-2.json`) — you MUST reuse their exact words **and emojis**. Never invent emojis the vocab lessons already locked.

Then extract the Song pages from the Lesson Planner (see Step 0).

---

## Build Order (non-negotiable)

```
LP extraction → emojis pulled from locked Vocab 1/2 (never invented)
→ confirm vocab tiers + new words with Dad → slides (confirm before building)
→ Leo app (same chat session) → skill update / extras.json patch
```

Slides first, confirmed, then the app **in the same chat** so the app mirrors exactly what was taught.

---

## Step 0 — LP Extraction Checklist

Unzip the unit Lesson Planner (`unzip Lesson_Planner_Unit_N.pdf`), find the Song pages (`grep -i "use the song\|use it again\|listen, read, and sing"`), and pull:

- **Song title, TR number, Workbook page, Video Sc.**
- **Vocabulary in the song** box → which Vocab 1 and Vocab 2 words appear (these are the *recycled* set).
- **Grammar in the song** → which Grammar 1 / Grammar 2 points the song previews. (This drives the grammar-preview slide — see rule below.)
- **Use the Song** approach → the LP names ONE of: *Activate prior knowledge* / *Set the stage* / *Predict* / *Act it out*. Use the one the LP specifies.
- **Activity 2 (Answer)** → the partner questions.
- **Use It Again** → the Vocabulary 1 swap instruction + the Grammar 1 reuse instruction.
- **End of lesson** → usually "write two new lines for the song" with a model line.
- **Be the Expert** → About the Photo + any Teaching Tip.
- **Related Vocabulary line** (if present) → these words get **proper** games (see depth rule). Not every unit's song has one.

> The Song lesson usually has **no graphic organizer** in its Resources line. If one IS listed, build it interactive with the matching `charts.js` builder. If not, do not invent a chart — interactivity lives in the lyrics and the word games.

---

## Part 1 — Slides (`teach/`)

### File
`teach/our-world/level-<L>/unit-<N>/song.html` → delivered as `teach-l<L>u<N>-song.html`.

### Technical standard
Style A standalone HTML. 1920×1080 fixed canvas, `#scaler` transform-fit, Outfit font (+ Noto Sans JP if Japanese appears), per-slide teacher-notes panel (slide-out, `N` key), `← → / space` nav. Unit theme color. **One `<script>` block** — keep all data, game functions, build, and nav in a single script so function hoisting covers the build step. (Splitting into multiple `<script>` tags caused a "function is not defined" crash because the build ran before later tags were parsed.)

### Slide structure (≈28–31 slides; order follows the LP)
1. Title (song name, TR, WB page, word chips)
2. Objectives + "what's in this song"
3. **New-word introduction games** — one slide each (see depth rule; e.g. chorus / verse / rhyme)
4. **Academic / Related vocabulary — proper games**, one slide each (see depth rule)
5. **Vocabulary 1 & 2 — brief refresh games**, one slide each (see depth rule)
6. **Use the Song** — interactive version of the LP's named approach (e.g. Activate prior knowledge = hobby brainstorm board)
7. **Listen, Read & Sing** — interactive karaoke, split across 1–2 slides
8. Which-word-which-verse matching
9. Activity 2 (Answer) — partner questions + sample answers
10. **Use It Again — Vocabulary 1** swap game
11. **Use It Again — Grammar preview** (see grammar-preview rule)
12. Write two new lines — interactive line builder
13. Be the Expert — About the Photo (+ Teaching Tip slide)
14. ✔ Formative Assessment
15. Great Job!

### 🟢 RULE 1 — Vocabulary introduction depth (TWO TIERS)

This is the most important Song rule. Sort every vocab word into one of two tiers:

**Tier A — BRIEF refresh** (light, song-anchored recall game):
- **Only** Vocabulary 1 and Vocabulary 2 words.
- Why brief: they each have their own full vocabulary lesson elsewhere, so the song just reactivates them.
- Light game types rotate: find-it-in-the-lyric, true/false, fill-the-gap, choose, word-order. One game per word, no two consecutive the same.

**Tier B — PROPER introduction** (full Vocab-1-style game: left word card with emoji/IPA/POS/Dad sentence + right-panel game + definition box that reveals on solve):
- **Academic language words.**
- **Related vocabulary words.**
- **Any content word the song introduces for the first time** (i.e. not from Vocab 1/2).
- Why proper: **academic and related vocabulary are hard, and unless they are recycled with a real game every single time there's a chance, Leo forgets them.** A 2×2 quick-tap grid is NOT enough for academic/related words — give them the same weight as a first-teaching Vocab 1 game, even when they are technically "recycled."

> Net effect: "recycled" does **not** mean "light" for academic/related. Only Vocab 1/2 words get the light treatment. Everything else gets a proper game.

### 🟢 RULE 2 — Short grammar preview (because Grammar 1 comes right after the Song)

In the standard component order, **Grammar 1 immediately follows the Song**, and the song is usually written around that grammar point. So the Song deck must include a **short, easy, terminology-free preview** of that grammar, placed near the end (inside **Use It Again → Grammar 1**).

Rules for the preview:
- **Gentle taste only** — no rules, no labels, no metalanguage (don't say "relative clause," "object pronoun," etc.).
- Pull the examples **straight from the song** so it feels familiar (e.g. for *who*: "the boy *who* has the highest score").
- Make it interactive but low-stakes (tap-to-reveal match cards work well).
- Frame it as "a peek — we'll learn this properly next time." This sets Grammar 1 up instead of front-running it.
- If the song previews two grammar points (Grammar 1 + Grammar 2), preview the one that comes next (Grammar 1); a second can be added if it appears prominently in the lyrics.

### Mini-game rules (shared with Vocab 1)
- One game per word; emojis only as visual clues, never inside option arrays as giveaways.
- Definition box hidden until the game is solved, then slides in.
- No two consecutive slides use the same game mechanic.
- Wrong answers shake/flash and let the learner retry; correct answers lock and reveal.

### Karaoke treatment (Listen, Read & Sing)
- Render the full lyrics with vocab words wrapped as tappable `.kw` spans.
- Tapping a word marks it + increments a live "words found" counter (side panel on slides).
- Show verse labels (Chorus 🔁 / Verse 📜 / Bridge 🎶); the chorus block repeats exactly as in the song so Leo SEES the repetition (reinforces the "chorus" word).

### Teacher notes
Every slide has a notes entry: a short "what to do" + the LP's actual say-lines (italic/`.say` block). New-word and proper-game slides include the definition and a Dad sentence. Keep them parent-facing and brief.

---

## Part 2 — Leo's App (`learn/`)

### File
`learn/our-world/level-<L>/unit-<N>/song.html` → delivered as `learn-l<L>u<N>-song.html`.

### Technical standard — MODALS, not tabs
The Song app is the documented **modal exception** (same as Grammar apps). Home screen = a grid of module cards; each card opens a bottom-sheet modal. Outfit + Noto Sans JP. Mobile-first (Leo opens it on his own).

### Module set (mirror what the slides taught)
| id | Module | Contents |
|----|--------|----------|
| m1 | 🎵 Listen & Sing | full karaoke, tap words, counter |
| m2 | 🆕 Song Words | new-word intro games (carousel) |
| m3 | 🔤 Word Review | Vocab 1+2 refresh games (carousel) |
| m4 | 🔁 Use It Again | swap game + grammar preview (tap-reveal) |
| m5 | ✍️ Write a Line | line builder from the model |
| m6 | 🧠 Quiz | song-awareness + vocab Qs |
| m7 | 📊 My Progress | dashboard (LAST, full-width, no complete button) |

> If the song introduces academic/related/new words (Tier B), give them their **own proper-game carousel module** (or fold them into m2 with full cards) — never bury them as a light afterthought, for the same recycling reason as Rule 1.

### Save system (CRITICAL — exact method names)
```js
const SAVE_PREFIX = '<L>-<N>-song-';
const HOMEWORK_ID = new URLSearchParams(location.search).get('hw') || 'leo-<L>-<N>-song';
const isReview   = new URLSearchParams(location.search).get('review') === '1';

function lSave(key,val){
  try{ localStorage.setItem('leea-'+key, JSON.stringify(val)); }catch(e){}
  try{ if(window.LEEA_CLOUD && window.LEEA_CLOUD.enabled) window.LEEA_CLOUD.saveProgress(HOMEWORK_ID, key, val); }catch(e){}
}
function lLoad(key){ try{const v=localStorage.getItem('leea-'+key);return v?JSON.parse(v):null;}catch(e){return null;} }
async function restoreProgressFromCloud(){
  try{
    if(!window.LEEA_CLOUD || !window.LEEA_CLOUD.enabled) return;
    const rows = await window.LEEA_CLOUD.fetchProgress(HOMEWORK_ID);
    if(!rows) return;
    rows.forEach(r=>{ try{ localStorage.setItem('leea-'+r.storage_key, JSON.stringify(r.value)); }catch(e){} });
  }catch(e){}
}
document.addEventListener('DOMContentLoaded', async ()=>{ await restoreProgressFromCloud(); /* then build UI */ });
```
- Three script tags in `<head>`: `@supabase/supabase-js@2` + `leea-cloud-config.js` + `leea-cloud.js`, with `../` count = folders from the file back to repo root (e.g. 4 levels of `../` for a file at `learn/our-world/level-<L>/unit-<N>/song.html`).
- `lLoad()` reads localStorage only; cloud is restored into localStorage first.
- `restoreProgressFromCloud()` MUST finish before the grid/badges render (root cause of past review-card failures).
- `saveScore`: `{score,total,percent,done:true,timestamp}`. `wrongQuestions`: array of `{question,prompt,chosen,correct}` objects.

### Mark Complete / Redo footer (every content module m1–m5)
- ✕ top-right = dismiss only (no save).
- Green **Mark Leo complete ✓** (`flex:1`) + red **↺ Redo** (fixed 110px).
- Completion saved to `SAVE_PREFIX+id+'-complete'` as `{done:true, timestamp}`; restore checks the **timestamp in the `-complete` key**, not a raw `-done` key.
- `markComplete()` saves → `updateBadge()` → adds `confirmed` (pointer-events:none on the complete button only) → `closeModal()` after 400 ms.
- Redo = **two-tap armed** pattern (first tap arms ~2.5 s, second tap resets). **Never `confirm()`.**
- `updateBadge()` wrapped in try/catch with null checks.

### Japanese visibility rule
Vocab/new-word cards carry a `ja` (Japanese) + `jaen` (short English gloss). Hidden behind a tap-to-reveal button that **resets on every new card** in a carousel. Pull JP from the unit `glossary.json`; if unavailable, use high-confidence standard translations and flag for verification — never guess loosely.

### Quiz (m6)
3 song-awareness questions (e.g. "what is the part that repeats called?" → chorus) + vocabulary questions, several with current-season soccer context. On finish: `saveScore`, save `wrongQuestions`, save `-complete`, show %/score, footer becomes Done + Redo.

### Review mode (`?review=1`)
Banner at top; games pre-reveal the correct answer + definition; quiz shows saved %/score and the wrong-answer list; "not done yet" fallback when nothing is saved.

### Keys saved
`<prefix>m{1..5}-complete`, `<prefix>m6-score`, `<prefix>m6-wrong`, `<prefix>m6-complete`.

---

## Part 3 — Common Patterns & Bugs
- **Apostrophe trap:** build all content with **backtick template strings** so `it's`, `they're`, `what's` are safe. After every JS chunk, extract the script and run `node --check`.
- **Single script scope (slides):** keep one `<script>`; multiple tags break cross-references at build time.
- **Validate by walking:** run the file through jsdom, open every module/slide, click a correct answer, run the quiz — confirms 0 runtime errors before delivery.
- **Soccer:** ALWAYS web-search current-season stats before any player example. Never Ronaldo/Messi. Spread across leagues (Premier League, La Liga, Bundesliga, Ligue 1, Serie A, Champions League, World Cup).

---

## Part 4 — Delivery Checklist
**Slides:** theme color correct · new + academic + related + new-content words get **proper** games · Vocab 1/2 get **brief** games · karaoke tappable · grammar preview present · teacher notes on every slide · `node --check` + jsdom walk pass.
**App:** modals (not tabs) · save standard exact · footer standard on m1–m5 · JP tap-to-reveal · quiz saves score+wrongQuestions · review mode works · `node --check` + jsdom walk pass.
**After:** add `index.html` LIVE line · patch `extras.json` for any new words · fill academic rich-card fields in `glossary.json`.

---

---

# Appendix A — Worked Example (Unit 8, Level 4: "What's Your Hobby?")

> **Illustrative only.** This shows what a completed Song build looks like once Step 0 is run against one unit's Lesson Planner. Do **not** reuse these words, colors, lyrics, or emojis for another unit — pull each new unit's own data. For Unit 9 and beyond, build a fresh appendix like this from that unit's LP.

- **Song:** "What's Your Hobby?" · TR 8.3 · Video Sc. 7 · Workbook p. 96 · theme forest green `#16A34A`, accent arctic blue `#0EA5E9`.
- **Use the Song:** *Activate prior knowledge* (hobby brainstorm; alone vs together; where people compete).
- **Activity 2 (Answer):** (1) Which hobbies are mentioned in the song? (2) Which of these do you like?
- **End of lesson:** write two new lines, model "I collect stuffed animals / because I think they're sweet."
- **Be the Expert:** teen skateboarding in Barbaros Square, **Istanbul, Turkey**; skateboarding began in California, late 1950s; first boards wood + metal wheels; now an Olympic sport.

**New words (Tier B — proper games), logged to `extras.json`:**
| word | emoji | ja |
|------|-------|----|
| chorus | 🔁 | サビ |
| verse | 📜 | バース |
| rhyme | 🎶 | 韻（いん） |

**Academic words (Tier B — proper games; recycled from Opener):** analyze, describe, explain, caption.
> ⚠️ Reconcile emojis with the live `glossary.json`. Working set used: analyze 🔬🔎 · describe 👀🗣️ · explain 💡🗯️ · caption 🏷️📸.

**Vocabulary 1 (Tier A — brief; emojis locked in `vocab-1.json`):**
score 📊🏅 · collect 🗂️🪙 · enjoy 😄🎉 · compete 🏆⚔️ · take photos 📸🌿 · a screen 📺🖥️ · cooperate 🤜🤛 · alone 🧍🔇 · creative 🎨💡

**Vocabulary 2 (Tier A — brief; emojis locked in `vocab-2.json`):**
a fossil 🦴🪨 · a comic book 📖💥 · a stuffed animal 🧸❤️ · a dinosaur 🦕🦖 *(a bug 🐛🔍 is a Vocab 2 word but is NOT in the song)*

**Grammar preview:** Grammar 1 = describing people with **who** (comes right after the Song). Preview lines from the song: "the boy *who* has the highest score," "the girl *who* reads about dinosaurs," "the boy *who* takes a photo." Soccer extension: "Harry Kane, *who* scored 33 goals." No terminology — tap-to-reveal only.

**Soccer (verified at build time, 2025–26 final season):** Kane 33 (Bundesliga top scorer), Mbappé 24 (La Liga top scorer), Haaland (Premier League), Yamal (Barcelona). No Ronaldo/Messi. *(Always re-search current stats for each new build — these go stale.)*

**Build note (Rule 1 in action):** the academic words were first built as a light 2×2 grid, then upgraded to four proper Vocab-1-style game slides + a 🎓 Academic Words app module. That upgrade is the pattern every unit should follow from the start — academic/related words get proper games, never a quick-tap grid.
