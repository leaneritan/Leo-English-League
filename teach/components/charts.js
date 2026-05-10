// charts.js — LEEA Chart Component Library
// Usage: <script src="../../components/charts.js"></script>
// Then call: buildTwoColChart({...}) etc.
(function () {
  const NS = 'leea-chart';
  const state = {
    fillTables: {},
    webs: {},
    venns: {},
  };

  function esc(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function cssVar(name, fallback) {
    return `var(${name}, ${fallback})`;
  }

  function save(key, value) {
    try { localStorage.setItem('leea-' + key, JSON.stringify(value)); } catch (e) {}
  }

  function load(key, fallback = '') {
    try {
      const value = localStorage.getItem('leea-' + key);
      return value === null ? fallback : JSON.parse(value);
    } catch (e) {
      return fallback;
    }
  }

  function injectStyles() {
    if (document.getElementById('leea-chart-styles')) return;
    const style = document.createElement('style');
    style.id = 'leea-chart-styles';
    style.textContent = `
      .${NS} {
        --paper: #FAFAF7;
        --surface: #FFFFFF;
        --border: #E5E3DC;
        --ink: #111111;
        --ink-2: #5A5853;
        --yellow: #FFCC00;
        --ow-blue: #1A6BB5;
        --ow-orange: #E8630A;
        --nc-green: #2E7D32;
        font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        color: var(--ink);
        width: 100%;
      }
      .${NS} * { box-sizing: border-box; }
      .${NS} button,
      .${NS} input,
      .${NS} textarea {
        font: inherit;
      }
      .${NS}__heading {
        font-family: Oswald, Impact, sans-serif;
        font-weight: 700;
        letter-spacing: 1px;
        text-transform: uppercase;
      }
      .${NS}__btn {
        appearance: none;
        border: 2px solid var(--ink);
        border-radius: 4px;
        background: var(--yellow);
        color: var(--ink);
        cursor: pointer;
        font-family: Oswald, Impact, sans-serif;
        font-size: 0.78rem;
        font-weight: 700;
        letter-spacing: 1px;
        padding: 7px 14px;
        transition: transform .16s ease, background .16s ease;
      }
      .${NS}__btn:hover { transform: translateY(-1px); }
      .${NS}__btn:disabled { opacity: .45; cursor: not-allowed; transform: none; }

      .${NS}-twocol {
        border: 2px solid var(--border);
        border-radius: 4px;
        overflow: hidden;
        background: var(--surface);
      }
      .${NS}-twocol__grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
      }
      .${NS}-twocol__head {
        color: #fff;
        font-family: Oswald, Impact, sans-serif;
        font-size: 1rem;
        font-weight: 700;
        letter-spacing: 1px;
        padding: 11px 14px;
        text-align: center;
      }
      .${NS}-twocol__cell {
        min-height: 62px;
        padding: 12px 14px;
        border-top: 1px solid var(--border);
        color: var(--ink);
        font-size: .95rem;
        font-weight: 650;
        line-height: 1.35;
        transition: opacity .24s ease, transform .24s ease;
      }
      .${NS}-twocol__cell:nth-child(4n + 3),
      .${NS}-twocol__cell:nth-child(4n + 4) { background: var(--paper); }
      .${NS}-twocol__cell:nth-child(odd) { border-right: 1px solid var(--border); }
      .${NS}-twocol__cell.is-hidden { opacity: 0; transform: translateY(8px); pointer-events: none; }
      .${NS}-twocol__textarea {
        width: 100%;
        min-height: 64px;
        resize: vertical;
        border: 0;
        border-bottom: 2px solid var(--border);
        border-radius: 0;
        background: transparent;
        color: var(--ink);
        outline: none;
        padding: 6px 2px;
      }
      .${NS}-twocol__textarea:focus { border-bottom-color: var(--ow-orange); }
      .${NS}-twocol__actions { padding: 12px; background: var(--paper); border-top: 1px solid var(--border); }

      .${NS}-dnd__bank,
      .${NS}-dnd__zones {
        display: grid;
        gap: 10px;
      }
      .${NS}-dnd__bank {
        grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
        margin-bottom: 12px;
      }
      .${NS}-dnd__zones {
        grid-template-columns: repeat(var(--zone-count, 2), minmax(0, 1fr));
      }
      .${NS}-dnd__zone {
        min-height: 170px;
        border: 2px dashed var(--border);
        border-radius: 4px;
        background: var(--surface);
        padding: 10px;
        transition: border-color .18s ease, background .18s ease;
      }
      .${NS}-dnd__zone.is-over { border-style: solid; background: var(--paper); }
      .${NS}-dnd__zone-head {
        color: #fff;
        border-radius: 4px;
        font-family: Oswald, Impact, sans-serif;
        font-size: .78rem;
        font-weight: 700;
        letter-spacing: 1px;
        margin-bottom: 9px;
        padding: 6px 8px;
        text-align: center;
      }
      .${NS}-dnd__tile {
        background: var(--surface);
        border: 2px solid var(--border);
        border-radius: 4px;
        color: var(--ink);
        cursor: grab;
        font-size: .9rem;
        font-weight: 650;
        line-height: 1.32;
        margin-bottom: 8px;
        padding: 10px 12px;
        transition: transform .16s ease, border-color .16s ease, background .16s ease;
        user-select: none;
        touch-action: none;
      }
      .${NS}-dnd__tile:hover { transform: translateY(-1px); border-color: var(--ow-blue); }
      .${NS}-dnd__tile.is-dragging { opacity: .55; transform: scale(.98); }
      .${NS}-dnd__tile.is-correct { background: #E8F5E9; border-color: var(--nc-green); cursor: default; }
      .${NS}-dnd__tile.is-wrong { background: #FEE2E2; border-color: #DC2626; animation: ${NS}-shake .28s ease; }
      .${NS}-dnd__success {
        display: none;
        color: var(--nc-green);
        font-family: Oswald, Impact, sans-serif;
        font-weight: 700;
        letter-spacing: 1px;
        margin-top: 10px;
        text-align: center;
      }
      .${NS}-dnd__success.is-visible { display: block; }

      .${NS}-fill {
        width: 100%;
        border-collapse: collapse;
        background: var(--surface);
        border: 2px solid var(--border);
        border-radius: 4px;
        overflow: hidden;
      }
      .${NS}-fill th {
        background: var(--ow-blue);
        color: #fff;
        font-family: Oswald, Impact, sans-serif;
        font-size: .86rem;
        font-weight: 700;
        letter-spacing: 1px;
        padding: 10px 12px;
        text-align: left;
      }
      .${NS}-fill td {
        border-bottom: 1px solid var(--border);
        color: var(--ink);
        font-size: .92rem;
        font-weight: 650;
        padding: 10px 12px;
      }
      .${NS}-fill tr:nth-child(even) td { background: var(--paper); }
      .${NS}-fill input {
        width: 100%;
        border: 0;
        border-bottom: 2px solid var(--border);
        border-radius: 0;
        background: transparent;
        color: var(--ink);
        outline: none;
        padding: 5px 2px;
      }
      .${NS}-fill input.is-ok { border-bottom-color: var(--nc-green); color: var(--nc-green); }
      .${NS}-fill input.is-bad { border-bottom-color: #DC2626; animation: ${NS}-shake .28s ease; }
      .${NS}-fill__actions { display: flex; gap: 8px; margin-top: 10px; }

      .${NS}-web,
      .${NS}-venn {
        border: 2px solid var(--border);
        border-radius: 4px;
        background: var(--surface);
        min-height: 360px;
        overflow: hidden;
        position: relative;
      }
      .${NS}-web svg,
      .${NS}-venn svg {
        display: block;
        width: 100%;
        min-height: 360px;
      }
      .${NS}-web input,
      .${NS}-venn input {
        width: 100%;
        border: 0;
        border-bottom: 2px solid var(--border);
        background: rgba(255,255,255,.82);
        color: var(--ink);
        outline: none;
        text-align: center;
        font-size: 13px;
        font-weight: 700;
      }
      .${NS}-web__actions { padding: 10px; border-top: 1px solid var(--border); background: var(--paper); }
      .${NS}-venn text,
      .${NS}-web text {
        font-family: Inter, system-ui, sans-serif;
        fill: var(--ink);
      }
      .${NS}-venn__label,
      .${NS}-web__center-label {
        font-family: Oswald, Impact, sans-serif;
        font-weight: 700;
        letter-spacing: .6px;
      }

      .${NS}-confetti {
        position: fixed;
        width: 8px;
        height: 12px;
        top: -20px;
        z-index: 9999;
        pointer-events: none;
        animation: ${NS}-fall 1.4s linear forwards;
      }
      @keyframes ${NS}-shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-6px); }
        75% { transform: translateX(6px); }
      }
      @keyframes ${NS}-fall {
        to { transform: translateY(110vh) rotate(420deg); opacity: .15; }
      }
      @media (max-width: 720px) {
        .${NS}-twocol__grid,
        .${NS}-dnd__zones { grid-template-columns: 1fr; }
      }
    `;
    document.head.appendChild(style);
  }

  function complete(action) {
    if (!action || action === 'none') return;
    if (action === 'confetti') {
      confetti();
      return;
    }
    if (typeof action === 'function') {
      action();
      return;
    }
    if (typeof window[action] === 'function') window[action]();
  }

  function confetti() {
    const colors = ['#FFCC00', '#1A6BB5', '#E8630A', '#2E7D32', '#111111'];
    for (let i = 0; i < 42; i++) {
      const piece = document.createElement('div');
      piece.className = `${NS}-confetti`;
      piece.style.left = Math.random() * 100 + 'vw';
      piece.style.background = colors[i % colors.length];
      piece.style.animationDelay = Math.random() * .25 + 's';
      piece.style.transform = `rotate(${Math.random() * 180}deg)`;
      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), 1700);
    }
  }

  function buildTwoColChart(config) {
    injectStyles();
    const id = config.id;
    const rows = config.rows || [];
    const reveal = !!config.revealMode;
    const editable = !!config.editable;
    setTimeout(() => initTwoColChart(id, config), 0);
    const rowHtml = rows.map((row, index) => {
      const hiddenClass = reveal ? ' is-hidden' : '';
      const a = editable
        ? `<textarea class="${NS}-twocol__textarea" data-row="${index}" data-col="a">${esc(load(`${id}-r${index}-a`, row.a || ''))}</textarea>`
        : esc(row.a);
      const b = editable
        ? `<textarea class="${NS}-twocol__textarea" data-row="${index}" data-col="b">${esc(load(`${id}-r${index}-b`, row.b || ''))}</textarea>`
        : esc(row.b);
      return `
        <div class="${NS}-twocol__cell${hiddenClass}" data-row="${index}">${a}</div>
        <div class="${NS}-twocol__cell${hiddenClass}" data-row="${index}">${b}</div>`;
    }).join('');
    return `
      <div class="${NS} ${NS}-twocol" id="${esc(id)}">
        <div class="${NS}-twocol__grid">
          <div class="${NS}-twocol__head" style="background:${esc(config.colA?.color || '#1A6BB5')}">${esc(config.colA?.label || 'Column A')}</div>
          <div class="${NS}-twocol__head" style="background:${esc(config.colB?.color || '#E8630A')}">${esc(config.colB?.label || 'Column B')}</div>
          ${rowHtml}
        </div>
        ${reveal ? `<div class="${NS}-twocol__actions"><button class="${NS}__btn" data-role="reveal">▶ Reveal Next</button></div>` : ''}
      </div>`;
  }

  function initTwoColChart(id, config) {
    const root = document.getElementById(id);
    if (!root) return;
    let step = 0;
    const maxRows = (config.rows || []).length;
    const button = root.querySelector('[data-role="reveal"]');
    if (button) {
      button.addEventListener('click', () => {
        root.querySelectorAll(`.${NS}-twocol__cell[data-row="${step}"]`).forEach(cell => {
          cell.classList.remove('is-hidden');
        });
        step++;
        if (step >= maxRows) button.disabled = true;
      });
    }
    root.querySelectorAll('textarea[data-row][data-col]').forEach(textarea => {
      textarea.addEventListener('input', () => {
        save(`${id}-r${textarea.dataset.row}-${textarea.dataset.col}`, textarea.value);
      });
    });
  }

  function buildDndSorter(config) {
    injectStyles();
    const id = config.id;
    const tiles = [...(config.tiles || [])].sort(() => Math.random() - 0.5);
    setTimeout(() => initDndSorter(id, config), 0);
    return `
      <div class="${NS} ${NS}-dnd" id="${esc(id)}" style="--zone-count:${(config.zones || []).length || 2}">
        <div class="${NS}-dnd__bank" data-role="bank">
          ${tiles.map((tile, index) => `
            <div class="${NS}-dnd__tile" draggable="true" data-answer="${esc(tile.answer)}" data-original-index="${index}">
              ${esc(tile.text)}
            </div>`).join('')}
        </div>
        <div class="${NS}-dnd__zones">
          ${(config.zones || []).map(zone => `
            <div class="${NS}-dnd__zone" data-zone="${esc(zone.key)}">
              <div class="${NS}-dnd__zone-head" style="background:${esc(zone.color || '#1A6BB5')}">${esc(zone.label)}</div>
            </div>`).join('')}
        </div>
        <div class="${NS}-dnd__success" data-role="success">Complete</div>
      </div>`;
  }

  function initDndSorter(id, config) {
    const root = document.getElementById(id);
    if (!root) return;
    const bank = root.querySelector('[data-role="bank"]');
    const tiles = [...root.querySelectorAll(`.${NS}-dnd__tile`)];
    const zones = [...root.querySelectorAll(`.${NS}-dnd__zone`)];
    let placed = 0;
    let dragTile = null;
    let touchTile = null;
    let clone = null;
    let offsetX = 0;
    let offsetY = 0;

    tiles.forEach(tile => {
      tile.addEventListener('dragstart', e => {
        if (tile.classList.contains('is-correct')) return;
        dragTile = tile;
        tile.classList.add('is-dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      tile.addEventListener('dragend', () => {
        tile.classList.remove('is-dragging');
        dragTile = null;
      });
      tile.addEventListener('touchstart', e => {
        if (tile.classList.contains('is-correct')) return;
        touchTile = tile;
        const rect = tile.getBoundingClientRect();
        offsetX = e.touches[0].clientX - rect.left;
        offsetY = e.touches[0].clientY - rect.top;
        clone = tile.cloneNode(true);
        clone.style.cssText = `position:fixed;z-index:9999;pointer-events:none;opacity:.9;width:${rect.width}px;`;
        document.body.appendChild(clone);
      }, { passive: true });
      tile.addEventListener('touchmove', e => {
        if (!clone) return;
        e.preventDefault();
        clone.style.left = e.touches[0].clientX - offsetX + 'px';
        clone.style.top = e.touches[0].clientY - offsetY + 'px';
      }, { passive: false });
      tile.addEventListener('touchend', e => {
        if (!touchTile) return;
        const touch = e.changedTouches[0];
        if (clone) clone.remove();
        clone = null;
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        const zone = target && target.closest(`.${NS}-dnd__zone`);
        if (zone) tryPlace(touchTile, zone);
        touchTile = null;
      }, { passive: true });
    });

    zones.forEach(zone => {
      zone.addEventListener('dragover', e => {
        e.preventDefault();
        zone.classList.add('is-over');
      });
      zone.addEventListener('dragleave', () => zone.classList.remove('is-over'));
      zone.addEventListener('drop', e => {
        e.preventDefault();
        zone.classList.remove('is-over');
        if (dragTile) tryPlace(dragTile, zone);
      });
    });

    function tryPlace(tile, zone) {
      if (tile.dataset.answer === zone.dataset.zone) {
        tile.classList.add('is-correct');
        tile.draggable = false;
        zone.appendChild(tile);
        placed++;
        if (placed >= tiles.length) {
          const success = root.querySelector('[data-role="success"]');
          if (success) success.classList.add('is-visible');
          complete(config.onComplete);
        }
      } else {
        tile.classList.add('is-wrong');
        bank.appendChild(tile);
        setTimeout(() => tile.classList.remove('is-wrong'), 360);
      }
    }
  }

  function buildFillTable(config) {
    injectStyles();
    const id = config.id;
    state.fillTables[id] = config;
    setTimeout(() => initFillTable(id), 0);
    return `
      <div class="${NS}" id="${esc(id)}">
        <table class="${NS}-fill">
          <thead><tr>${(config.columns || []).map(col => `<th>${esc(col)}</th>`).join('')}</tr></thead>
          <tbody>
            ${(config.rows || []).map(row => `
              <tr>
                <td>${esc(row.fixed)}</td>
                ${(row.inputs || []).map(input => `<td><input id="${esc(input.id)}" data-input-id="${esc(input.id)}" placeholder="..."></td>`).join('')}
              </tr>`).join('')}
          </tbody>
        </table>
        <div class="${NS}-fill__actions">
          <button class="${NS}__btn" data-role="check">${esc(config.checkLabel || 'Check ✅')}</button>
          <button class="${NS}__btn" data-role="show">${esc(config.showAnswersLabel || 'Show Answers 🔍')}</button>
        </div>
      </div>`;
  }

  function initFillTable(id) {
    const root = document.getElementById(id);
    const config = state.fillTables[id];
    if (!root || !config) return;
    root.querySelector('[data-role="check"]').addEventListener('click', () => checkFillTable(id));
    root.querySelector('[data-role="show"]').addEventListener('click', () => showFillTableAnswers(id));
  }

  function fillFields(config) {
    return (config.rows || []).flatMap(row => row.inputs || []);
  }

  function checkFillTable(id) {
    const config = state.fillTables[id];
    if (!config) return;
    let allCorrect = true;
    fillFields(config).forEach(field => {
      const input = document.getElementById(field.id);
      if (!input) return;
      const value = input.value.trim().toLowerCase();
      const ok = (field.answer || []).some(answer => value.includes(String(answer).toLowerCase()));
      input.classList.toggle('is-ok', ok);
      input.classList.toggle('is-bad', !ok);
      if (!ok) {
        allCorrect = false;
        setTimeout(() => input.classList.remove('is-bad'), 420);
      }
    });
    if (allCorrect) confetti();
  }

  function showFillTableAnswers(id) {
    const config = state.fillTables[id];
    if (!config) return;
    fillFields(config).forEach(field => {
      const input = document.getElementById(field.id);
      if (!input) return;
      input.value = field.answer?.[0] || '';
      input.classList.add('is-ok');
      input.classList.remove('is-bad');
    });
  }

  function buildWordWeb(config) {
    injectStyles();
    const id = config.id;
    state.webs[id] = {
      ...config,
      nodes: [...(config.nodes || [])],
    };
    setTimeout(() => initWordWeb(id), 0);
    return `
      <div class="${NS} ${NS}-web" id="${esc(id)}" data-role="web"></div>
      ${config.addable ? `<div class="${NS} ${NS}-web__actions"><button class="${NS}__btn" data-web-add="${esc(id)}">＋ Add idea</button></div>` : ''}`;
  }

  function initWordWeb(id) {
    renderWordWeb(id);
    window.addEventListener('resize', () => renderWordWeb(id));
    const add = Array.from(document.querySelectorAll('[data-web-add]'))
      .find(button => button.dataset.webAdd === id);
    if (add) {
      add.addEventListener('click', () => {
        state.webs[id].nodes.push({ text: '', emoji: '＋' });
        renderWordWeb(id);
      });
    }
  }

  function renderWordWeb(id) {
    const config = state.webs[id];
    const root = document.getElementById(id);
    if (!config || !root) return;
    const width = Math.max(root.clientWidth, 560);
    const height = 380;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * .34;
    const nodes = config.nodes || [];
    const editable = !!(config.editable || config.addable);
    const outer = nodes.map((node, index) => {
      const angle = (-Math.PI / 2) + (index * 2 * Math.PI / Math.max(nodes.length, 1));
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      const saved = load(`${id}-node-${index}`, node.text || '');
      const label = editable
        ? `<foreignObject x="${x - 55}" y="${y - 16}" width="110" height="34"><input xmlns="http://www.w3.org/1999/xhtml" data-web-input="${index}" value="${esc(saved)}"></foreignObject>`
        : `<text x="${x}" y="${y + 5}" text-anchor="middle" font-size="14" font-weight="700">${esc(node.text)}</text>`;
      return `
        <line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="${cssVar('--border', '#E5E3DC')}" stroke-width="2"/>
        <circle cx="${x}" cy="${y}" r="50" fill="${cssVar('--surface', '#FFFFFF')}" stroke="${cssVar('--ow-blue', '#1A6BB5')}" stroke-width="2"/>
        <text x="${x}" y="${y - 20}" text-anchor="middle" font-size="22">${esc(node.emoji || '')}</text>
        ${label}`;
    }).join('');
    root.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(config.center?.text || 'Word web')}">
        ${outer}
        <circle cx="${cx}" cy="${cy}" r="68" fill="${cssVar('--yellow', '#FFCC00')}" stroke="${cssVar('--ink', '#111111')}" stroke-width="3"/>
        <text x="${cx}" y="${cy - 12}" text-anchor="middle" font-size="30">${esc(config.center?.emoji || '')}</text>
        <text class="${NS}-web__center-label" x="${cx}" y="${cy + 24}" text-anchor="middle" font-size="20">${esc(config.center?.text || '')}</text>
      </svg>`;
    root.querySelectorAll('[data-web-input]').forEach(input => {
      input.addEventListener('input', () => save(`${id}-node-${input.dataset.webInput}`, input.value));
    });
  }

  function buildVennDiagram(config) {
    injectStyles();
    const id = config.id;
    state.venns[id] = config;
    setTimeout(() => initVennDiagram(id), 0);
    return `<div class="${NS} ${NS}-venn" id="${esc(id)}"></div>`;
  }

  function initVennDiagram(id) {
    renderVennDiagram(id);
    window.addEventListener('resize', () => renderVennDiagram(id));
  }

  function renderVennDiagram(id) {
    const config = state.venns[id];
    const root = document.getElementById(id);
    if (!config || !root) return;
    const width = Math.max(root.clientWidth, 640);
    const height = 390;
    const left = width * .42;
    const right = width * .58;
    const cy = height * .52;
    const r = Math.min(width * .24, 150);
    const editable = !!config.editable;
    function items(items, x, y, key) {
      return (items || []).map((item, index) => {
        const yy = y + index * 26;
        const saved = load(`${id}-${key}-${index}`, item);
        return editable
          ? `<foreignObject x="${x - 95}" y="${yy - 16}" width="190" height="28"><input xmlns="http://www.w3.org/1999/xhtml" data-venn-input="${key}-${index}" value="${esc(saved)}"></foreignObject>`
          : `<text x="${x}" y="${yy}" text-anchor="middle" font-size="15" font-weight="700">${esc(item)}</text>`;
      }).join('');
    }
    root.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(config.circleA?.label || 'Venn diagram')}">
        <circle cx="${left}" cy="${cy}" r="${r}" fill="${esc(config.circleA?.color || '#1A6BB5')}" fill-opacity=".18" stroke="${esc(config.circleA?.color || '#1A6BB5')}" stroke-width="3"/>
        <circle cx="${right}" cy="${cy}" r="${r}" fill="${esc(config.circleB?.color || '#E8630A')}" fill-opacity=".18" stroke="${esc(config.circleB?.color || '#E8630A')}" stroke-width="3"/>
        <ellipse cx="${width / 2}" cy="${cy}" rx="${r * .48}" ry="${r * .92}" fill="${cssVar('--yellow', '#FFCC00')}" fill-opacity=".2"/>
        <text class="${NS}-venn__label" x="${left - r * .35}" y="${cy - r - 18}" text-anchor="middle" font-size="20">${esc(config.circleA?.label || '')}</text>
        <text class="${NS}-venn__label" x="${right + r * .35}" y="${cy - r - 18}" text-anchor="middle" font-size="20">${esc(config.circleB?.label || '')}</text>
        ${items(config.itemsA, left - r * .42, cy - 35, 'a')}
        ${items(config.itemsAB, width / 2, cy - 20, 'ab')}
        ${items(config.itemsB, right + r * .42, cy - 35, 'b')}
      </svg>`;
    root.querySelectorAll('[data-venn-input]').forEach(input => {
      input.addEventListener('input', () => save(`${id}-${input.dataset.vennInput}`, input.value));
    });
  }

  window.LEEA_CHARTS = {
    buildTwoColChart,
    buildDndSorter,
    buildFillTable,
    buildWordWeb,
    buildVennDiagram,
  };

  window.buildTwoColChart = buildTwoColChart;
  window.buildDndSorter = buildDndSorter;
  window.buildFillTable = buildFillTable;
  window.buildWordWeb = buildWordWeb;
  window.buildVennDiagram = buildVennDiagram;
})();
