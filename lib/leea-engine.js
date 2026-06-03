/* ============================================================================
 * LEEA ENGINE — the shared runtime for every Leo lesson app.
 *
 * A lesson file contains ONLY content. It calls LEEA.lesson({ ... }) and the
 * engine handles everything mechanical that used to be copy-pasted into every
 * file and caused real bugs:
 *   - localStorage (both namespaces) + the flags index.html needs
 *   - cloud sync (restore-first, save-on-action, delete-on-redo)
 *   - the review card (?review=1) — renders every module's actual content
 *   - completion badges, scores, redo, progress dashboard
 *
 * The plumbing is LOCKED DOWN. Lessons cannot bypass save/review/redo, so the
 * redo and empty-review bugs physically cannot come back.
 *
 * Block types (module.type):
 *   flashcards · quiz · truefalse · matching · unscramble · builder ·
 *   writing · chart · checklist · karaoke · info · dashboard · custom
 *
 * `custom` is the escape hatch: render(el, api) draws any UI, and the engine
 * still gives it save / load / complete / review for free.
 * ==========================================================================*/
(function () {
  'use strict';

  /* ------------------------------------------------------------------ state */
  let CONFIG, MODULES, SAVE_PREFIX, HOMEWORK_ID, isReview, LEEA;
  let CUR = null;
  const $ = id => document.getElementById(id);

  /* ----------------------------------------------------------------- themes */
  // Each theme just remaps the four accent vars; every class rule recolors.
  const THEMES = {
    green:  { d:'#14532D', m:'#22C55E', base:'#16A34A', l:'#DCFCE7', bg:'#F0FDF4' },
    blue:   { d:'#0C4A6E', m:'#38BDF8', base:'#0EA5E9', l:'#E0F2FE', bg:'#F0F9FF' },
    purple: { d:'#5B21B6', m:'#A78BFA', base:'#7C3AED', l:'#EDE9FE', bg:'#F5F3FF' },
    amber:  { d:'#92400E', m:'#FBBF24', base:'#F59E0B', l:'#FEF3C7', bg:'#FFFBEB' },
    rose:   { d:'#9F1239', m:'#FB7185', base:'#E11D48', l:'#FFE4E6', bg:'#FFF1F2' }
  };

  /* -------------------------------------------------------------------- CSS */
  const BASE_CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --green:#16A34A;--green-d:#14532D;--green-m:#22C55E;--green-l:#DCFCE7;
  --blue:#0EA5E9;--blue-l:#E0F2FE;--amber:#F59E0B;--amber-l:#FEF3C7;--purple:#7C3AED;
  --red:#DC2626;--ink:#14241D;--ink-2:#475a50;--ink-3:#7b8a82;--bg:#F0FDF4;--border:#dfe7e1;
}
body{font-family:'Outfit',system-ui,sans-serif;background:var(--bg);min-height:100vh;color:var(--ink);padding-bottom:40px}
.ja{font-family:'Noto Sans JP','Outfit',sans-serif}
.hdr{background:linear-gradient(135deg,var(--green-d),var(--green));color:#fff;padding:20px 18px 22px;position:sticky;top:0;z-index:40;box-shadow:0 3px 14px rgba(0,0,0,.18)}
.hdr h1{font-size:21px;font-weight:800;display:flex;align-items:center;gap:9px}
.hdr p{font-size:13px;opacity:.9;margin-top:3px}
.wrap{max-width:680px;margin:0 auto;padding:18px 14px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:13px}
.card{background:#fff;border:2px solid var(--border);border-radius:18px;padding:18px 16px;cursor:pointer;position:relative;transition:transform .12s,box-shadow .12s;min-height:128px;display:flex;flex-direction:column}
.card:active{transform:scale(.97)}
.card:hover{box-shadow:0 8px 22px rgba(20,80,40,.12);border-color:var(--green-m)}
.card .ci{font-size:40px;line-height:1}
.card .ct{font-size:18px;font-weight:800;margin-top:10px}
.card .cs{font-size:13px;color:var(--ink-3);margin-top:3px;line-height:1.3;flex:1}
.card.wide{grid-column:1/-1;min-height:auto;flex-direction:row;align-items:center;gap:14px}
.card.wide .ci{font-size:34px}
.card.wide .ct{margin-top:0}
.badge{position:absolute;top:12px;right:12px;font-size:12px;font-weight:800;padding:4px 9px;border-radius:999px;background:var(--border);color:var(--ink-3)}
.badge.done{background:var(--green);color:#fff}
.badge.score{background:var(--blue);color:#fff}
.modal{position:fixed;inset:0;background:rgba(15,30,22,.55);z-index:60;display:none;align-items:flex-end;justify-content:center}
.modal.open{display:flex}
.sheet{background:var(--bg);width:100%;max-width:680px;max-height:94vh;border-radius:22px 22px 0 0;display:flex;flex-direction:column;overflow:hidden;animation:up .25s ease}
@keyframes up{from{transform:translateY(40px);opacity:.6}to{transform:translateY(0);opacity:1}}
.sheet-hdr{background:#fff;padding:16px 18px;display:flex;align-items:center;gap:10px;border-bottom:1px solid var(--border);flex-shrink:0}
.sheet-hdr .si{font-size:26px}
.sheet-hdr h2{font-size:18px;font-weight:800;flex:1}
.x{background:var(--border);border:none;width:36px;height:36px;border-radius:50%;font-size:18px;cursor:pointer;color:var(--ink-2);flex-shrink:0}
.sheet-body{padding:18px;overflow-y:auto;flex:1}
.sheet-ftr{padding:13px 16px;background:#fff;border-top:1px solid var(--border);display:flex;gap:10px;flex-shrink:0}
.btn-complete{flex:1;background:var(--green);color:#fff;border:none;border-radius:13px;padding:15px;font-size:16px;font-weight:800;cursor:pointer;font-family:inherit}
.btn-complete.confirmed{background:var(--green-d);pointer-events:none}
.btn-redo{width:110px;background:#fff;color:var(--red);border:2px solid var(--red);border-radius:13px;padding:15px 0;font-size:15px;font-weight:800;cursor:pointer;font-family:inherit}
.btn-redo.armed{background:var(--red);color:#fff}
.fcard{background:#fff;border:2px solid var(--border);border-radius:16px;padding:16px;text-align:center;margin-bottom:14px;position:relative}
.fcard .fe{font-size:54px;line-height:1}
.fcard .fw{font-size:28px;font-weight:800;margin-top:4px}
.fcard .fi{font-size:14px;color:var(--ink-3);margin-top:2px}
.fcard .ja-btn{margin-top:10px;background:var(--green-l);color:var(--green-d);border:none;border-radius:10px;padding:8px 16px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit}
.fcard .ja-reveal{display:none;margin-top:10px;font-size:17px;color:var(--ink);line-height:1.4}
.fcard .ja-reveal.show{display:block}
.fcard .ja-reveal .jp{font-weight:700}
.fcard .ja-reveal .en{color:var(--ink-2);font-size:15px;margin-top:3px}
.q{font-size:19px;font-weight:600;text-align:center;line-height:1.4;margin-bottom:14px}
.opts{display:flex;flex-direction:column;gap:10px}
.opt{background:#fff;border:2.5px solid var(--border);border-radius:13px;padding:15px;font-size:17px;font-weight:600;cursor:pointer;text-align:center;font-family:inherit}
.opt:active{transform:scale(.98)}
.opt.correct{background:var(--green);border-color:var(--green);color:#fff}
.opt.wrong{background:#fee2e2;border-color:var(--red);color:var(--red)}
.opt.dim{opacity:.5}
.lines{display:flex;flex-direction:column;gap:10px}
.line{background:#fff;border:2.5px solid var(--border);border-radius:13px;padding:14px;font-size:16px;cursor:pointer;line-height:1.35;font-weight:500}
.line.correct{background:var(--green);border-color:var(--green);color:#fff}
.line.wrong{background:#fee2e2;border-color:var(--red)}
.chips{display:flex;flex-wrap:wrap;gap:9px;justify-content:center;margin-top:6px}
.chip{background:var(--blue-l);border:2px solid var(--blue);color:#075985;border-radius:11px;padding:11px 16px;font-size:16px;font-weight:700;cursor:pointer;font-family:inherit}
.chip.used{opacity:.35;pointer-events:none}
.slotline{font-size:20px;font-weight:600;text-align:center;line-height:1.6;margin:8px 0}
.slot{display:inline-block;min-width:120px;border-bottom:3px dashed var(--green);color:var(--green-d);font-weight:800;padding:0 8px}
.fb{text-align:center;font-size:16px;font-weight:700;min-height:24px;margin-top:12px}
.fb.ok{color:var(--green-d)}.fb.no{color:var(--red)}
.def{background:var(--green-l);border:2px solid var(--green);border-radius:13px;padding:0 16px;max-height:0;overflow:hidden;opacity:0;transition:all .4s;margin-top:14px}
.def.show{max-height:240px;opacity:1;padding:14px 16px}
.def .dt{font-size:16px;color:var(--ink);line-height:1.4}
.next-btn{display:none;width:100%;background:var(--blue);color:#fff;border:none;border-radius:13px;padding:14px;font-size:16px;font-weight:800;margin-top:16px;cursor:pointer;font-family:inherit}
.next-btn.show{display:block}
.dots{display:flex;gap:6px;justify-content:center;margin-bottom:14px;flex-wrap:wrap}
.dot{width:9px;height:9px;border-radius:50%;background:var(--border)}
.dot.on{background:var(--green)}
.dot.cur{background:var(--green);transform:scale(1.5)}
.kw{display:inline-block;font-weight:700;color:var(--green-d);background:var(--green-l);border-radius:7px;padding:1px 7px;cursor:pointer;border:2px solid transparent}
.kw.tapped{background:var(--green);color:#fff}
.kl{font-size:17px;line-height:1.9;padding:1px 0}
.klabel{font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--blue);margin:14px 0 4px}
.klabel.cho{color:var(--amber)}
.kcount{background:var(--green-l);border:2px solid var(--green);border-radius:14px;padding:12px;text-align:center;font-size:15px;font-weight:700;color:var(--green-d);margin-bottom:14px;position:sticky;top:0;z-index:2}
.kcount b{font-size:24px;display:block}
.prog-row{display:flex;align-items:center;gap:12px;background:#fff;border:2px solid var(--border);border-radius:13px;padding:13px 15px;margin-bottom:9px}
.prog-row .pi{font-size:24px}
.prog-row .pn{flex:1;font-weight:700;font-size:15px}
.prog-row .ps{font-weight:800;font-size:14px;padding:4px 10px;border-radius:999px;background:var(--border);color:var(--ink-3)}
.prog-row .ps.done{background:var(--green);color:#fff}
.prog-row .ps.score{background:var(--blue);color:#fff}
.wrongs{margin-top:14px}
.wrong-item{background:#fff;border:2px solid var(--border);border-left:6px solid var(--red);border-radius:11px;padding:12px 14px;margin-bottom:8px;font-size:14px;line-height:1.4}
.wrong-item .wp{font-weight:700}
.wrong-item .wc{color:var(--red)}.wrong-item .wok{color:var(--green-d);font-weight:700}
.quiz-result{text-align:center;padding:10px}
.quiz-result .qbig{font-size:60px}
.quiz-result .qpct{font-size:46px;font-weight:900;color:var(--green)}
.note{font-size:13px;color:var(--ink-3);text-align:center;margin-top:14px;line-height:1.4}
.txt{width:100%;min-height:120px;border:2px solid var(--border);border-radius:13px;padding:13px;font-size:16px;font-family:inherit;line-height:1.5;resize:vertical}
.txt:focus{outline:none;border-color:var(--green-m)}
.wc{font-size:13px;color:var(--ink-3);text-align:right;margin-top:6px}
.chk{display:flex;align-items:flex-start;gap:12px;background:#fff;border:2px solid var(--border);border-radius:13px;padding:14px;margin-bottom:10px;cursor:pointer;font-size:16px;line-height:1.4}
.chk .box{width:26px;height:26px;border:2.5px solid var(--border);border-radius:8px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-weight:900;color:#fff}
.chk.on .box{background:var(--green);border-color:var(--green)}
.tbl{width:100%;border-collapse:collapse;margin:6px 0 4px}
.tbl th,.tbl td{border:2px solid var(--border);padding:10px;text-align:left;font-size:15px}
.tbl th{background:var(--green-l);color:var(--green-d);font-weight:800}
.tbl input{width:100%;border:none;font-size:15px;font-family:inherit;padding:4px}
.tbl input:focus{outline:none;background:var(--green-l)}
.bucket{background:#fff;border:2.5px dashed var(--border);border-radius:13px;padding:12px;min-height:70px;margin-bottom:10px}
.bucket .bh{font-weight:800;color:var(--green-d);margin-bottom:8px;font-size:14px}
.bucket.over{border-color:var(--green-m);background:var(--green-l)}
.bucket .tok{display:inline-block;background:var(--green);color:#fff;border-radius:9px;padding:6px 11px;margin:3px;font-weight:700;font-size:14px}
.pool{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:14px}
.pool .tok{background:var(--blue-l);border:2px solid var(--blue);color:#075985;border-radius:10px;padding:9px 13px;font-weight:700;cursor:pointer;font-size:15px}
.pool .tok.used{opacity:.3;pointer-events:none}
/* review */
.rv-card{background:#fff;border:2px solid var(--border);border-radius:16px;padding:16px 18px;margin-bottom:12px}
.rv-lbl{font-size:.65rem;font-weight:800;color:var(--purple);letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px}
.rv-val{font-size:.92rem;color:#1e293b;line-height:1.7;white-space:pre-wrap}
.rv-score-big{font-size:2rem;font-weight:900;color:#059669;text-align:center}
.rv-not-started{text-align:center;padding:40px;color:var(--ink-3);font-size:16px}
`;

  /* ------------------------------------------------------------- storage */
  function lSave(key, val) {
    try { localStorage.setItem('leea-' + key, JSON.stringify(val)); } catch (e) {}
    try { if (window.LEEA_CLOUD && window.LEEA_CLOUD.enabled) window.LEEA_CLOUD.saveProgress(HOMEWORK_ID, key, val); } catch (e) {}
  }
  function lLoad(key) {
    try { const v = localStorage.getItem('leea-' + key); return v ? JSON.parse(v) : null; } catch (e) { return null; }
  }
  function lDelete(key) {
    localStorage.removeItem('leea-' + key);
    try { if (window.LEEA_CLOUD && window.LEEA_CLOUD.enabled) window.LEEA_CLOUD.deleteProgress(HOMEWORK_ID, key); } catch (e) {}
  }
  async function restoreProgressFromCloud() {
    try {
      if (!window.LEEA_CLOUD || !window.LEEA_CLOUD.enabled) return;
      const rows = await window.LEEA_CLOUD.fetchProgress(HOMEWORK_ID);
      if (!rows) return;
      rows.forEach(r => { try { localStorage.setItem('leea-' + r.storage_key, JSON.stringify(r.value)); } catch (e) {} });
    } catch (e) {}
  }
  function saveScore(score, done, extra) {
    const data = Object.assign({ score: score, done: done, timestamp: new Date().toISOString() }, extra || {});
    lSave(SAVE_PREFIX + 'score', data);
    lSave(HOMEWORK_ID + '-score', data);
    if (done) { lSave(SAVE_PREFIX + 'done', true); lSave(HOMEWORK_ID + '-done', true); }
  }
  function markComplete(id, name) {
    lSave(SAVE_PREFIX + id + '-complete', { name: name || 'Leo', done: true, timestamp: new Date().toISOString() });
    lSave(SAVE_PREFIX + id + '-done', true);
    lSave(HOMEWORK_ID + '-' + id + '-done', true);
    updateBadge(id);
    // homework-level done when every completable module is finished
    const completable = MODULES.filter(m => m.type !== 'dashboard');
    const allDone = completable.every(m => {
      if (m.type === 'quiz') { const s = lLoad(SAVE_PREFIX + 'score'); return s && s.done; }
      const c = lLoad(SAVE_PREFIX + m.id + '-complete'); return c && c.timestamp;
    });
    if (allDone) { lSave(SAVE_PREFIX + 'done', true); lSave(HOMEWORK_ID + '-done', true); }
  }
  function doRedo(id) {
    [SAVE_PREFIX + id + '-complete', SAVE_PREFIX + id + '-done', HOMEWORK_ID + '-' + id + '-done']
      .forEach(k => lDelete(k));
    updateBadge(id);
    openModule(id);
  }
  function armRedo(id, btn) {
    if (btn.dataset.armed === '1') { doRedo(id); return; }
    btn.dataset.armed = '1'; btn.classList.add('armed'); btn.textContent = 'Tap again ↺';
    setTimeout(() => { if (btn) { btn.dataset.armed = ''; btn.classList.remove('armed'); btn.textContent = '↺ Redo'; } }, 2500);
  }

  /* ----------------------------------------------------- per-module api */
  function apiFor(mod) {
    return {
      isReview: isReview,
      id: mod.id,
      save: (sub, val) => lSave(SAVE_PREFIX + mod.id + '-' + sub, val),
      load: (sub, fb) => { const v = lLoad(SAVE_PREFIX + mod.id + '-' + sub); return (v === null || v === undefined) ? (fb === undefined ? null : fb) : v; },
      complete: name => markComplete(mod.id, name),
      score: (score, total, wrong) => {
        const pct = Math.round(score / (total || 1) * 100);
        saveScore(score, true, { total: total, percent: pct, wrong: wrong || [] });
        lSave(SAVE_PREFIX + mod.id + '-wrong', wrong || []);
        updateBadge(mod.id);
      },
      close: closeModal,
      esc: escapeHTML
    };
  }
  function escapeHTML(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  /* --------------------------------------------------------------- shell */
  function buildShell() {
    const t = THEMES[CONFIG.theme] || THEMES.green;
    document.documentElement.style.setProperty('--green', t.base);
    document.documentElement.style.setProperty('--green-d', t.d);
    document.documentElement.style.setProperty('--green-m', t.m);
    document.documentElement.style.setProperty('--green-l', t.l);
    document.documentElement.style.setProperty('--bg', t.bg);

    const style = document.createElement('style'); style.textContent = BASE_CSS; document.head.appendChild(style);
    if (!document.querySelector('link[href*="fonts.googleapis"]')) {
      const f = document.createElement('link'); f.rel = 'stylesheet';
      f.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Noto+Sans+JP:wght@400;700&display=swap';
      document.head.appendChild(f);
    }
    document.title = CONFIG.title + ' — Leo';

    document.body.innerHTML = `
      <div id="reviewScreen" style="display:none">
        <div class="hdr"><h1>👀 Neritan's Review</h1><p>${escapeHTML(CONFIG.reviewSubtitle || CONFIG.subtitle || CONFIG.title)}</p></div>
        <div class="wrap" id="reviewBody"></div>
      </div>
      <div id="appRoot">
        <div class="hdr"><h1>${CONFIG.titleIcon || '🎯'} ${escapeHTML(CONFIG.title)}</h1>${CONFIG.subtitle ? `<p>${escapeHTML(CONFIG.subtitle)}</p>` : ''}</div>
        <div class="wrap"><div class="grid" id="grid"></div></div>
        <div class="modal" id="modal"><div class="sheet">
          <div class="sheet-hdr"><span class="si" id="mIcon">🎵</span><h2 id="mTitle">Module</h2><button class="x" id="mClose">✕</button></div>
          <div class="sheet-body" id="mBody"></div>
          <div class="sheet-ftr" id="mFtr"></div>
        </div></div>
      </div>`;
    $('mClose').onclick = closeModal;
    $('modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
  }

  function buildGrid() {
    $('grid').innerHTML = MODULES.map(m => `
      <div class="card ${m.wide ? 'wide' : ''}" data-id="${m.id}">
        <span class="badge" id="badge-${m.id}"></span>
        <div class="ci">${m.icon || '▶️'}</div>
        <div><div class="ct">${escapeHTML(m.title)}</div>${m.sub ? `<div class="cs">${escapeHTML(m.sub)}</div>` : ''}</div>
      </div>`).join('');
    $('grid').querySelectorAll('.card').forEach(c => c.onclick = () => openModule(c.dataset.id));
    MODULES.forEach(m => updateBadge(m.id));
  }

  function updateBadge(id) {
    const b = $('badge-' + id); if (!b) return;
    const m = MODULES.find(x => x.id === id); if (!m) return;
    if (m.type === 'dashboard') { b.className = 'badge'; b.textContent = ''; return; }
    if (m.type === 'quiz') {
      const s = lLoad(SAVE_PREFIX + 'score');
      if (s && s.done) { b.className = 'badge score'; b.textContent = s.percent + '%'; }
      else { b.className = 'badge'; b.textContent = ''; }
      return;
    }
    const c = lLoad(SAVE_PREFIX + id + '-complete');
    if (c && c.timestamp) { b.className = 'badge done'; b.textContent = '✓ Done'; }
    else { b.className = 'badge'; b.textContent = ''; }
  }

  /* --------------------------------------------------------------- modal */
  function openModule(id) {
    const m = MODULES.find(x => x.id === id); if (!m) return; CUR = m;
    $('mIcon').textContent = m.icon || '▶️'; $('mTitle').textContent = m.title;
    $('mFtr').innerHTML = ''; $('mBody').scrollTop = 0;
    const block = BLOCKS[m.type] || BLOCKS.info;
    block.render($('mBody'), m, apiFor(m));
    // content blocks get the standard complete/redo footer; quiz & dashboard manage their own
    if (m.type !== 'quiz' && m.type !== 'dashboard' && block.footer !== false) renderFooter(m);
    $('modal').classList.add('open');
  }
  function closeModal() { $('modal').classList.remove('open'); CUR = null; }
  function renderFooter(m) {
    const done = (lLoad(SAVE_PREFIX + m.id + '-complete') || {}).timestamp;
    $('mFtr').innerHTML = `
      <button class="btn-complete ${done ? 'confirmed' : ''}" id="cbtn-${m.id}">${done ? 'Done ✓' : 'Mark complete ✓'}</button>
      <button class="btn-redo" id="rbtn-${m.id}">↺ Redo</button>`;
    $('cbtn-' + m.id).onclick = () => { markComplete(m.id, 'Leo'); const b = $('cbtn-' + m.id); if (b) { b.classList.add('confirmed'); b.textContent = 'Done ✓'; } setTimeout(closeModal, 400); };
    $('rbtn-' + m.id).onclick = function () { armRedo(m.id, this); };
  }

  /* ============================================================== BLOCKS */
  const BLOCKS = {};

  /* ---- karaoke ---- lines use *word* to mark tappable words ---- */
  function kline(s) { return String(s).replace(/\*([^*]+)\*/g, '<span class="kw" data-w="$1">$1</span>'); }
  BLOCKS.karaoke = {
    render(body, m, api) {
      const blk = sec => `<div class="klabel ${sec.cls || ''}">${escapeHTML(sec.label)}</div>` +
        sec.lines.map(l => `<div class="kl">${kline(l)}</div>`).join('');
      body.innerHTML = `<div class="kcount">Words found <b id="kc">0</b>${escapeHTML(m.intro || 'Tap the highlighted words while you read! 👆')}</div>` +
        m.sections.map(blk).join('');
      let c = 0;
      body.querySelectorAll('.kw').forEach(w => w.onclick = () => {
        if (api.isReview || w.classList.contains('tapped')) return;
        w.classList.add('tapped'); c++; $('kc').textContent = c; api.save('taps', c);
      });
      if (api.isReview) body.querySelectorAll('.kw').forEach(w => w.classList.add('tapped'));
    },
    review(m, api) {
      const c = lLoad(SAVE_PREFIX + m.id + '-complete');
      if (!(c && c.timestamp)) return '';
      const taps = api.load('taps', 0);
      return card(m.title, `🎤 Sang the song · tapped ${taps} word${taps === 1 ? '' : 's'}`);
    }
  };

  /* ---- flashcards ---- carousel of cards, each with an optional mini-game ---- */
  BLOCKS.flashcards = {
    render(body, m, api) {
      body.innerHTML = `<div id="carousel"></div>`;
      const list = m.cards; let i = 0;
      function show() {
        const v = list[i], c = $('carousel');
        c.innerHTML = `
          <div class="dots">${list.map((_, k) => `<span class="dot ${k < i ? 'on' : ''} ${k === i ? 'cur' : ''}"></span>`).join('')}</div>
          <div class="fcard">
            <div class="fe">${v.emoji || '🔤'}</div><div class="fw">${escapeHTML(v.word)}</div>${v.ipa ? `<div class="fi">${escapeHTML(v.ipa)}</div>` : ''}
            ${v.ja ? `<button class="ja-btn" id="jab">意味を見る (tap)</button><div class="ja-reveal" id="jar"><span class="jp ja">${escapeHTML(v.ja)}</span>${v.jaen ? `<div class="en">${escapeHTML(v.jaen)}</div>` : ''}</div>` : ''}
          </div>
          <div id="gwrap"></div>
          ${v.def ? `<div class="def" id="gdef"><div class="dt">${v.def}</div></div>` : ''}
          <button class="next-btn" id="nextb">${i < list.length - 1 ? 'Next word →' : 'Finish ✓'}</button>`;
        if ($('jab')) $('jab').onclick = () => $('jar').classList.add('show');
        const onSolve = () => { if ($('gdef')) $('gdef').classList.add('show'); $('nextb').classList.add('show'); };
        if (v.game) renderGame($('gwrap'), v.game, onSolve, api.isReview); else onSolve();
        if (api.isReview) onSolve();
        $('nextb').onclick = () => {
          if (i < list.length - 1) { i++; show(); }
          else { c.insertAdjacentHTML('beforeend', `<div class="note">🎉 All done! Tap "Mark complete" below.</div>`); }
        };
      }
      show();
    },
    review(m) {
      const c = lLoad(SAVE_PREFIX + m.id + '-complete');
      if (!(c && c.timestamp)) return '';
      return card(m.title, `🎴 Reviewed ${m.cards.length} word${m.cards.length === 1 ? '' : 's'}`);
    }
  };

  /* mini-game engine used inside flashcards (pick / lyric / tf / gap / scramble) */
  function renderGame(wrap, g, onSolve, review) {
    if (g.type === 'pick') {
      wrap.innerHTML = `<div class="q">${g.q}</div><div class="opts">${g.opts.map((o, i) => `<button class="opt" data-i="${i}">${o}</button>`).join('')}</div>`;
      wrap.querySelectorAll('.opt').forEach(o => o.onclick = () => {
        if (+o.dataset.i === g.correct) { o.classList.add('correct'); wrap.querySelectorAll('.opt').forEach(x => x.style.pointerEvents = 'none'); onSolve(); }
        else { o.classList.add('wrong'); setTimeout(() => o.classList.remove('wrong'), 500); }
      });
      if (review) wrap.querySelector(`.opt[data-i="${g.correct}"]`).classList.add('correct');
    } else if (g.type === 'lyric') {
      wrap.innerHTML = `<div class="q">${g.q}</div><div class="lines">${g.lines.map((l, i) => `<div class="line" data-i="${i}">${l}</div>`).join('')}</div>`;
      wrap.querySelectorAll('.line').forEach(l => l.onclick = () => {
        if (+l.dataset.i === g.correct) { l.classList.add('correct'); wrap.querySelectorAll('.line').forEach(x => x.style.pointerEvents = 'none'); onSolve(); }
        else { l.classList.add('wrong'); setTimeout(() => l.classList.remove('wrong'), 500); }
      });
      if (review) wrap.querySelector(`.line[data-i="${g.correct}"]`).classList.add('correct');
    } else if (g.type === 'tf') {
      wrap.innerHTML = `<div class="q">${g.s}</div><div class="opts"><button class="opt" data-v="1">✓ True</button><button class="opt" data-v="0">✗ False</button></div><div class="fb" id="tffb"></div>`;
      wrap.querySelectorAll('.opt').forEach(o => o.onclick = () => {
        const v = o.dataset.v === '1', fb = wrap.querySelector('#tffb');
        if (v === g.a) { o.classList.add('correct'); fb.className = 'fb ok'; fb.textContent = 'Yes! 🎉'; wrap.querySelectorAll('.opt').forEach(x => x.style.pointerEvents = 'none'); onSolve(); }
        else { o.classList.add('wrong'); fb.className = 'fb no'; fb.textContent = 'Try again!'; setTimeout(() => o.classList.remove('wrong'), 500); }
      });
      if (review) wrap.querySelector(`.opt[data-v="${g.a ? 1 : 0}"]`).classList.add('correct');
    } else if (g.type === 'gap') {
      wrap.innerHTML = `<div class="slotline">${g.before} <span class="slot" id="gs">______</span> ${g.after}</div><div class="chips">${g.chips.map(c => `<button class="chip" data-c="${escapeHTML(c)}">${escapeHTML(c)}</button>`).join('')}</div><div class="fb" id="gpfb"></div>`;
      wrap.querySelectorAll('.chip').forEach(c => c.onclick = () => {
        const fb = wrap.querySelector('#gpfb');
        if (c.dataset.c === g.a) { wrap.querySelector('#gs').textContent = g.a; c.classList.add('used'); fb.className = 'fb ok'; fb.textContent = 'Perfect! 🎉'; onSolve(); }
        else { c.style.background = '#fee2e2'; fb.className = 'fb no'; fb.textContent = 'Not that one!'; setTimeout(() => c.style.background = '', 500); }
      });
      if (review) wrap.querySelector('#gs').textContent = g.a;
    } else if (g.type === 'scramble') {
      const jc = g.join === undefined ? ' ' : g.join; let order = [];
      const pieces = [...g.pieces].sort(() => Math.random() - .5);
      wrap.innerHTML = `<div class="q">${g.q}</div><div class="slotline"><span class="slot" id="ss" style="min-width:200px">______</span></div><div class="chips">${pieces.map(p => `<button class="chip" data-p="${escapeHTML(p)}">${escapeHTML(p)}</button>`).join('')}</div><div class="fb" id="scfb"></div>`;
      wrap.querySelectorAll('.chip').forEach(c => c.onclick = () => {
        if (c.classList.contains('used')) return;
        c.classList.add('used'); order.push(c.dataset.p); wrap.querySelector('#ss').textContent = order.join(jc);
        const fb = wrap.querySelector('#scfb');
        if (order.length === g.pieces.length) {
          if (order.join(jc).toLowerCase() === g.a.toLowerCase()) { fb.className = 'fb ok'; fb.textContent = 'You got it! 🎉'; onSolve(); }
          else { fb.className = 'fb no'; fb.textContent = 'Try again!'; order = []; wrap.querySelectorAll('.chip').forEach(x => x.classList.remove('used')); setTimeout(() => { wrap.querySelector('#ss').textContent = '______'; fb.textContent = ''; }, 900); }
        }
      });
      if (review) wrap.querySelector('#ss').textContent = g.a;
    }
  }

  /* ---- quiz ---- sequential MCQ, scored, tracks wrong answers ---- */
  BLOCKS.quiz = {
    footer: false,
    render(body, m, api) {
      const Q = m.questions, pass = m.passMark || 80;
      if (api.isReview) { quizReview(body, m); return; }
      let i = 0, score = 0, wrong = [];
      function show() {
        if (i >= Q.length) return finish();
        const q = Q[i];
        body.innerHTML = `<div class="dots">${Q.map((_, k) => `<span class="dot ${k < i ? 'on' : ''} ${k === i ? 'cur' : ''}"></span>`).join('')}</div>
          <div class="q" style="margin-top:6px">${i + 1}. ${q.q}</div>
          <div class="opts">${q.options.map((o, k) => `<button class="opt" data-k="${k}">${o}</button>`).join('')}</div><div class="fb" id="qfb"></div>`;
        body.querySelectorAll('.opt').forEach(o => o.onclick = () => {
          body.querySelectorAll('.opt').forEach(x => x.style.pointerEvents = 'none');
          const k = +o.dataset.k, fb = $('qfb');
          if (k === q.answer) { o.classList.add('correct'); score++; fb.className = 'fb ok'; fb.textContent = 'Correct! 🎉'; }
          else { o.classList.add('wrong'); body.querySelector(`.opt[data-k="${q.answer}"]`).classList.add('correct'); fb.className = 'fb no'; fb.textContent = 'The answer is in green.'; wrong.push({ prompt: q.q.replace(/<[^>]+>/g, ''), chosen: q.options[k], correct: q.options[q.answer] }); }
          setTimeout(() => { i++; show(); }, 950);
        });
      }
      function finish() {
        const pct = Math.round(score / Q.length * 100);
        api.score(score, Q.length, wrong);
        lSave(SAVE_PREFIX + m.id + '-complete', { name: m.title, done: true, timestamp: new Date().toISOString() });
        body.innerHTML = `<div class="quiz-result"><div class="qbig">${pct >= pass ? '🏆' : pct >= 50 ? '🎉' : '💪'}</div>
          <div class="qpct">${pct}%</div><div style="font-size:18px;font-weight:700;margin-top:4px">${score} / ${Q.length} correct</div>
          <div class="note">${pct >= pass ? (m.passMsg || 'Amazing, Leo!') : (m.tryMsg || 'Good try — go again to get even better!')}</div></div>`;
        $('mFtr').innerHTML = `<button class="btn-complete" id="qdone">Done ✓</button><button class="btn-redo" id="qredo">↺ Redo</button>`;
        $('qdone').onclick = closeModal; $('qredo').onclick = () => BLOCKS.quiz.render(body, m, api);
      }
      $('mFtr').innerHTML = ''; show();
    },
    review(m) {
      const s = lLoad(SAVE_PREFIX + 'score');
      if (!(s && s.done)) return '';
      const wrong = lLoad(SAVE_PREFIX + m.id + '-wrong') || [];
      const wrongHtml = wrong.length
        ? `<div class="rv-lbl" style="color:var(--red);margin-top:14px">Words to practice</div><div class="wrongs">${wrong.map(w => `<div class="wrong-item"><div class="wp">${escapeHTML(w.prompt)}</div>Leo chose: <span class="wc">${escapeHTML(w.chosen)}</span><br>Answer: <span class="wok">${escapeHTML(w.correct)}</span></div>`).join('')}</div>`
        : `<div class="rv-val" style="text-align:center;color:var(--green-d);margin-top:8px">🏆 Perfect — no wrong answers!</div>`;
      return `<div class="rv-card"><div class="rv-lbl">${escapeHTML(m.title)} — Result</div>
        <div class="rv-score-big">${s.score} / ${s.total} — ${s.percent}%</div>
        <div class="rv-val" style="text-align:center;font-size:.75rem;color:var(--ink-3)">${new Date(s.timestamp).toLocaleString()}</div>${wrongHtml}</div>`;
    }
  };
  function quizReview(body, m) {
    const s = lLoad(SAVE_PREFIX + 'score'), wrong = lLoad(SAVE_PREFIX + m.id + '-wrong') || [];
    if (!(s && s.done)) { body.innerHTML = `<div class="note" style="font-size:16px">Quiz not done yet.</div>`; return; }
    body.innerHTML = `<div class="quiz-result"><div class="qpct">${s.percent}%</div><div style="font-weight:700">${s.score} / ${s.total} correct</div></div>` +
      (wrong.length ? `<div class="klabel">Words to practice</div><div class="wrongs">${wrong.map(w => `<div class="wrong-item"><div class="wp">${escapeHTML(w.prompt)}</div>Leo chose: <span class="wc">${escapeHTML(w.chosen)}</span><br>Answer: <span class="wok">${escapeHTML(w.correct)}</span></div>`).join('')}</div>` : `<div class="note">Perfect — no wrong answers! 🏆</div>`);
    $('mFtr').innerHTML = `<button class="btn-complete" id="qc">Close</button>`; $('qc').onclick = closeModal;
  }

  /* ---- truefalse ---- list of statements, scored ---- */
  BLOCKS.truefalse = {
    footer: false,
    render(body, m, api) {
      const S = m.statements;
      if (api.isReview) { const s = lLoad(SAVE_PREFIX + 'score'); body.innerHTML = s ? `<div class="quiz-result"><div class="qpct">${s.percent}%</div></div>` : `<div class="note">Not done yet.</div>`; $('mFtr').innerHTML = `<button class="btn-complete" id="tc">Close</button>`; $('tc').onclick = closeModal; return; }
      let i = 0, score = 0, wrong = [];
      function show() {
        if (i >= S.length) { const pct = Math.round(score / S.length * 100); api.score(score, S.length, wrong); lSave(SAVE_PREFIX + m.id + '-complete', { name: m.title, done: true, timestamp: new Date().toISOString() }); body.innerHTML = `<div class="quiz-result"><div class="qbig">${pct >= 80 ? '🏆' : '💪'}</div><div class="qpct">${pct}%</div><div style="font-weight:700">${score}/${S.length}</div></div>`; $('mFtr').innerHTML = `<button class="btn-complete" id="tc">Done ✓</button>`; $('tc').onclick = closeModal; return; }
        const st = S[i];
        body.innerHTML = `<div class="dots">${S.map((_, k) => `<span class="dot ${k < i ? 'on' : ''} ${k === i ? 'cur' : ''}"></span>`).join('')}</div><div class="q">${st.text}</div><div class="opts"><button class="opt" data-v="1">✓ True</button><button class="opt" data-v="0">✗ False</button></div>`;
        body.querySelectorAll('.opt').forEach(o => o.onclick = () => {
          body.querySelectorAll('.opt').forEach(x => x.style.pointerEvents = 'none');
          const v = o.dataset.v === '1';
          if (v === st.answer) { o.classList.add('correct'); score++; } else { o.classList.add('wrong'); wrong.push({ prompt: st.text.replace(/<[^>]+>/g, ''), chosen: v ? 'True' : 'False', correct: st.answer ? 'True' : 'False' }); }
          setTimeout(() => { i++; show(); }, 800);
        });
      }
      $('mFtr').innerHTML = ''; show();
    },
    review: BLOCKS_quizLikeReview
  };

  /* ---- matching ---- tap a left then its right partner ---- */
  BLOCKS.matching = {
    render(body, m, api) {
      const pairs = m.pairs;
      const rights = pairs.map((p, i) => ({ t: p.right, i })).sort(() => Math.random() - .5);
      body.innerHTML = `<div class="q">${escapeHTML(m.prompt || 'Match the pairs')}</div>
        <div style="display:flex;gap:10px">
          <div style="flex:1" id="mL">${pairs.map((p, i) => `<div class="opt" data-l="${i}">${escapeHTML(p.left)}</div>`).join('')}</div>
          <div style="flex:1" id="mR">${rights.map(r => `<div class="opt" data-r="${r.i}">${escapeHTML(r.t)}</div>`).join('')}</div>
        </div><div class="fb" id="mfb"></div>`;
      if (api.isReview) { body.querySelectorAll('.opt').forEach(o => o.classList.add('correct')); return; }
      let sel = null, done = 0;
      body.querySelectorAll('[data-l]').forEach(o => o.onclick = () => { body.querySelectorAll('[data-l]').forEach(x => x.classList.remove('dim')); o.classList.add('dim'); sel = o; });
      body.querySelectorAll('[data-r]').forEach(o => o.onclick = () => {
        if (!sel) return; const li = sel.dataset.l, ri = o.dataset.r, fb = $('mfb');
        if (li === ri) { sel.classList.add('correct'); o.classList.add('correct'); sel.style.pointerEvents = o.style.pointerEvents = 'none'; sel = null; done++; if (done === pairs.length) { fb.className = 'fb ok'; fb.textContent = 'All matched! 🎉'; } }
        else { o.classList.add('wrong'); setTimeout(() => o.classList.remove('wrong'), 500); }
      });
    },
    review: BLOCKS_completeReview('🔗 Matched all pairs')
  };

  /* ---- unscramble ---- reorder words into a sentence ---- */
  BLOCKS.unscramble = {
    render(body, m, api) {
      body.innerHTML = `<div id="carousel"></div>`; const items = m.items; let i = 0;
      function show() {
        const it = items[i], jc = it.join === undefined ? ' ' : it.join, pieces = [...it.pieces].sort(() => Math.random() - .5);
        let order = [];
        $('carousel').innerHTML = `<div class="dots">${items.map((_, k) => `<span class="dot ${k < i ? 'on' : ''} ${k === i ? 'cur' : ''}"></span>`).join('')}</div>
          <div class="q">${escapeHTML(it.q || 'Put the words in order')}</div>
          <div class="slotline"><span class="slot" id="ss" style="min-width:220px">______</span></div>
          <div class="chips">${pieces.map(p => `<button class="chip" data-p="${escapeHTML(p)}">${escapeHTML(p)}</button>`).join('')}</div>
          <div class="fb" id="uf"></div><button class="next-btn" id="nb">${i < items.length - 1 ? 'Next →' : 'Finish ✓'}</button>`;
        if (api.isReview) { $('ss').textContent = it.answer; $('nb').classList.add('show'); }
        $('carousel').querySelectorAll('.chip').forEach(c => c.onclick = () => {
          if (c.classList.contains('used')) return; c.classList.add('used'); order.push(c.dataset.p); $('ss').textContent = order.join(jc);
          if (order.length === it.pieces.length) { const fb = $('uf'); if (order.join(jc).toLowerCase() === it.answer.toLowerCase()) { fb.className = 'fb ok'; fb.textContent = 'You got it! 🎉'; $('nb').classList.add('show'); } else { fb.className = 'fb no'; fb.textContent = 'Try again!'; order = []; $('carousel').querySelectorAll('.chip').forEach(x => x.classList.remove('used')); setTimeout(() => { $('ss').textContent = '______'; fb.textContent = ''; }, 900); } }
        });
        $('nb').onclick = () => { if (i < items.length - 1) { i++; show(); } else $('carousel').insertAdjacentHTML('beforeend', `<div class="note">🎉 Done! Mark complete below.</div>`); };
      }
      show();
    },
    review: BLOCKS_completeReview('🔡 Unscrambled all sentences')
  };

  /* ---- builder ---- pick chips to fill slots; saves the built sentence ---- */
  BLOCKS.builder = {
    render(body, m, api) {
      const rows = m.rows;
      body.innerHTML = (m.model ? `<div class="fcard" style="background:var(--amber-l);border-color:var(--amber)"><div style="font-size:15px;color:#7c5b06;font-weight:600;line-height:1.5">🎵 Model: ${m.model}</div></div>` : '') +
        rows.map((r, ri) => `<div class="slotline" style="margin-top:${ri ? 14 : 4}px">${r.prefix || ''} <span class="slot" id="bslot-${ri}">${api.load('row-' + ri, '______')}</span> ${r.suffix || ''}</div>
          <div class="chips" id="brow-${ri}">${r.options.map(o => `<button class="chip" data-row="${ri}" data-t="${escapeHTML(o)}">${escapeHTML(o)}</button>`).join('')}</div>`).join('') +
        `<div class="fb ok" id="bfb" style="margin-top:16px;font-size:17px"></div>`;
      function summary() { const vals = rows.map((r, ri) => api.load('row-' + ri, null)); if (vals.every(v => v)) { const s = rows.map((r, ri) => `${r.prefix || ''} ${vals[ri]} ${r.suffix || ''}`).join(' ').replace(/\s+/g, ' ').trim(); $('bfb').textContent = '🎵 "' + s + '"'; } }
      if (api.isReview) { summary(); body.querySelectorAll('.chip').forEach(c => c.style.pointerEvents = 'none'); return; }
      body.querySelectorAll('.chip').forEach(c => c.onclick = () => {
        const ri = c.dataset.row;
        body.querySelectorAll(`[data-row="${ri}"]`).forEach(x => { x.style.background = ''; x.style.color = ''; });
        c.style.background = 'var(--green)'; c.style.color = '#fff';
        $('bslot-' + ri).textContent = c.dataset.t; api.save('row-' + ri, c.dataset.t); summary();
      });
    },
    review(m, api) {
      const vals = m.rows.map((r, ri) => api.load('row-' + ri, null));
      if (!vals.some(v => v)) return '';
      const s = m.rows.map((r, ri) => `${r.prefix || ''} ${vals[ri] || '___'} ${r.suffix || ''}`).join(' ').replace(/\s+/g, ' ').trim();
      return card(m.title + " — Leo's line", '"' + s + '"');
    }
  };

  /* ---- writing ---- free text; saves + shows in review ---- */
  BLOCKS.writing = {
    render(body, m, api) {
      const saved = api.load('text', '');
      body.innerHTML = `${m.prompt ? `<div class="q" style="text-align:left;font-size:16px">${m.prompt}</div>` : ''}
        <textarea class="txt" id="wta" placeholder="${escapeHTML(m.placeholder || 'Write here...')}" ${api.isReview ? 'readonly' : ''}>${escapeHTML(saved)}</textarea>
        <div class="wc" id="wwc">Words: ${countWords(saved)}</div>`;
      if (api.isReview) return;
      $('wta').addEventListener('input', () => { const t = $('wta').value; api.save('text', t); $('wwc').textContent = 'Words: ' + countWords(t); });
    },
    review(m, api) {
      const t = api.load('text', '');
      if (!t || !t.trim()) return '';
      return card(m.title, t);
    }
  };
  function countWords(s) { return (String(s).trim().match(/\S+/g) || []).length; }

  /* ---- chart ---- fill-in table cells ---- */
  BLOCKS.chart = {
    render(body, m, api) {
      body.innerHTML = `${m.prompt ? `<div class="q" style="text-align:left;font-size:16px">${m.prompt}</div>` : ''}
        <table class="tbl"><tr>${m.columns.map(c => `<th>${escapeHTML(c)}</th>`).join('')}</tr>
        ${m.rows.map((r, ri) => `<tr>${m.columns.map((c, ci) => ci === 0 && r.label !== undefined ? `<td><b>${escapeHTML(r.label)}</b></td>` : `<td><input id="cell-${ri}-${ci}" value="${escapeHTML(api.load('cell-' + ri + '-' + ci, ''))}" ${api.isReview ? 'readonly' : ''}></td>`).join('')}</tr>`).join('')}</table>`;
      if (api.isReview) return;
      body.querySelectorAll('input').forEach(inp => inp.addEventListener('input', () => { const id = inp.id.replace('cell-', ''); api.save('cell-' + id, inp.value); }));
    },
    review(m, api) {
      const lines = [];
      m.rows.forEach((r, ri) => m.columns.forEach((c, ci) => { if (ci === 0 && r.label !== undefined) return; const v = api.load('cell-' + ri + '-' + ci, ''); if (v && v.trim()) lines.push((r.label ? r.label + ' · ' : '') + c + ': ' + v); }));
      if (!lines.length) return '';
      return card(m.title, lines.join('\n'));
    }
  };

  /* ---- checklist ---- tick-box self-check ---- */
  BLOCKS.checklist = {
    render(body, m, api) {
      const state = api.load('ticks', m.items.map(() => false));
      body.innerHTML = `${m.prompt ? `<div class="q" style="text-align:left;font-size:16px">${m.prompt}</div>` : ''}` +
        m.items.map((it, i) => `<div class="chk ${state[i] ? 'on' : ''}" data-i="${i}"><div class="box">${state[i] ? '✓' : ''}</div><div>${escapeHTML(it)}</div></div>`).join('');
      if (api.isReview) return;
      body.querySelectorAll('.chk').forEach(c => c.onclick = () => { const i = +c.dataset.i; state[i] = !state[i]; c.classList.toggle('on'); c.querySelector('.box').textContent = state[i] ? '✓' : ''; api.save('ticks', state); });
    },
    review(m, api) {
      const state = api.load('ticks', []); const on = m.items.filter((_, i) => state[i]);
      if (!on.length) return '';
      return card(m.title + ` — ${on.length}/${m.items.length} ticked`, on.map(x => '✅ ' + x).join('\n'));
    }
  };

  /* ---- info ---- read-only teaching slide ---- */
  BLOCKS.info = {
    render(body, m) { body.innerHTML = m.html || `<div class="note" style="font-size:15px">${escapeHTML(m.text || '')}</div>`; },
    review(m) { const c = lLoad(SAVE_PREFIX + m.id + '-complete'); return (c && c.timestamp) ? card(m.title, '📖 Read') : ''; }
  };

  /* ---- dashboard ---- auto progress overview ---- */
  BLOCKS.dashboard = {
    footer: false,
    render(body, m) {
      $('mFtr').innerHTML = `<button class="btn-complete" id="dc">Close</button>`; $('dc').onclick = closeModal;
      const rows = MODULES.filter(x => x.type !== 'dashboard').map(x => {
        if (x.type === 'quiz') { const s = lLoad(SAVE_PREFIX + 'score'); return progRow(x, s && s.done ? s.percent + '%' : '—', s && s.done ? 'score' : ''); }
        const c = lLoad(SAVE_PREFIX + x.id + '-complete'); return progRow(x, c && c.timestamp ? '✓ Done' : '—', c && c.timestamp ? 'done' : '');
      }).join('');
      body.innerHTML = rows + (m.footnote ? `<div class="note">${escapeHTML(m.footnote)}</div>` : '');
    },
    review() { return ''; }
  };
  function progRow(m, val, cls) { return `<div class="prog-row"><span class="pi">${m.icon || '▶️'}</span><span class="pn">${escapeHTML(m.title)}</span><span class="ps ${cls}">${val}</span></div>`; }

  /* ---- custom ---- escape hatch: lesson supplies render(el, api) + optional review(api) ---- */
  BLOCKS.custom = {
    render(body, m, api) { if (typeof m.render === 'function') m.render(body, api); else body.innerHTML = `<div class="note">No render() supplied.</div>`; },
    review(m, api) { if (typeof m.review === 'function') { const out = m.review(api); return out || ''; } const c = lLoad(SAVE_PREFIX + m.id + '-complete'); return (c && c.timestamp) ? card(m.title, '✅ Completed') : ''; }
  };

  /* shared review helpers (declared as functions so they hoist above the block defs that use them) */
  function card(label, value) { return `<div class="rv-card"><div class="rv-lbl">${escapeHTML(label)}</div><div class="rv-val">${escapeHTML(value)}</div></div>`; }
  function BLOCKS_completeReview(msg) { return function (m) { const c = lLoad(SAVE_PREFIX + m.id + '-complete'); return (c && c.timestamp) ? card(m.title, msg) : ''; }; }
  function BLOCKS_quizLikeReview(m) { const s = lLoad(SAVE_PREFIX + 'score'); if (!(s && s.done)) return ''; return card(m.title, `${s.score}/${s.total} — ${s.percent}%`); }

  /* ============================================================= REVIEW */
  function initReviewMode() {
    $('appRoot').style.display = 'none';
    $('reviewScreen').style.display = 'block';
    const body = $('reviewBody');

    const completable = MODULES.filter(m => m.type !== 'dashboard');
    const completedMods = completable.filter(m => {
      if (m.type === 'quiz') { const s = lLoad(SAVE_PREFIX + 'score'); return s && s.done; }
      const c = lLoad(SAVE_PREFIX + m.id + '-complete'); return c && c.timestamp;
    });

    // each block can contribute a content card
    const contentCards = completable.map(m => {
      const block = BLOCKS[m.type] || BLOCKS.info;
      try { return block.review ? block.review(m, apiFor(m)) : ''; } catch (e) { return ''; }
    }).filter(Boolean);

    if (!completedMods.length && !contentCards.length) {
      body.innerHTML = '<div class="rv-not-started">📋 Work not started yet.</div>';
      return;
    }

    let html = '';
    if (completedMods.length) {
      const lines = completedMods.map(m => {
        const c = lLoad(SAVE_PREFIX + m.id + '-complete');
        const ts = c && c.timestamp ? ' · ' + new Date(c.timestamp).toLocaleString() : '';
        return `<div class="prog-row"><span class="pi">${m.icon || '✅'}</span><span class="pn">${escapeHTML(m.title)}${ts}</span><span class="ps done">✓ Done</span></div>`;
      }).join('');
      html += `<div class="rv-card"><div class="rv-lbl">Completed modules — ${completedMods.length} / ${completable.length}</div>${lines}</div>`;
    }
    html += contentCards.join('');
    body.innerHTML = html;
  }

  /* ============================================================== ENTRY */
  LEEA = window.LEEA || {};
  LEEA.lesson = function (config) {
    CONFIG = config;
    MODULES = config.modules || [];
    HOMEWORK_ID = new URLSearchParams(location.search).get('hw') || config.id;
    SAVE_PREFIX = config.id.replace(/^leo-/, '') + '-';
    isReview = new URLSearchParams(location.search).get('review') === '1';

    function boot() {
      buildShell();
      restoreProgressFromCloud().then(() => {
        if (isReview) { initReviewMode(); return; }
        buildGrid();
      });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
  };
  // expose a tiny bit for debugging / custom blocks
  LEEA._internal = { lLoad: k => lLoad(k), lSave: (k, v) => lSave(k, v), open: openModule };
  window.LEEA = LEEA;
})();
