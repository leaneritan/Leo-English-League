/**
 * LEEA Sunshine Organizer Component
 * learn/components/sunshine.js
 *
 * Builds an SVG sunshine organizer with triangular rays.
 * Each ray is clickable and shows a vocabulary word + question preview.
 *
 * Usage:
 *   document.getElementById('my-container').innerHTML =
 *     buildSunshine({ words, saved, onSelect });
 *
 * Config:
 *   words    {Array}    Required. Array of { word, emoji } objects (3–8 items).
 *   saved    {Object}   Optional. { 0: 'question text', 1: '...' } from localStorage.
 *   onSelect {Function} Optional. Callback(index) when a ray is tapped.
 *   id       {String}   Optional. SVG element id (default: 'sun-svg').
 *   centerLabel {String} Optional. Center text (default: 'My Questions').
 *   color    {String}   Optional. Stroke/fill colour (default: '#16A34A').
 *   size     {Number}   Optional. ViewBox size (default: 540).
 */

function buildSunshine({
  words,
  saved = {},
  onSelect = null,
  id = 'sun-svg',
  centerLabel = 'My Questions',
  color = '#16A34A',
  size = 540,
}) {
  if (!words || !words.length) return '<p>No words provided.</p>';

  const n    = words.length;
  const cx   = size / 2;
  const cy   = size / 2;
  const innerR = Math.round(size * 0.172); // 93 @ 540
  const outerR = Math.round(size * 0.415); // 224 @ 540
  const hw   = Math.round(size * 0.078);   // 42  @ 540  (half-width of ray base)

  // Distribute rays evenly, starting from top (−90°)
  const startAngle = -90;
  const step = 360 / n;
  const angles = Array.from({ length: n }, (_, i) => startAngle + i * step);

  const NS = 'http://www.w3.org/2000/svg'; // not used in string mode — we build strings

  // ── helpers ──────────────────────────────────────────────────
  function pt(x, y) { return `${x.toFixed(1)},${y.toFixed(1)}`; }
  function attr(pairs) {
    return Object.entries(pairs).map(([k,v]) => `${k}="${v}"`).join(' ');
  }
  function esc(s) {
    return String(s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  // First code point only (handles emoji safely)
  function firstChar(str) {
    const cp = str.codePointAt(0);
    return cp ? String.fromCodePoint(cp) : str[0];
  }

  // ── build rays ────────────────────────────────────────────────
  let rays = '';
  angles.forEach((deg, si) => {
    const rad = deg * Math.PI / 180;
    const cos = Math.cos(rad), sin = Math.sin(rad);
    const hasQ = !!(saved[si]);

    // Triangle vertices
    const tx = cx + cos * outerR,             ty = cy + sin * outerR;
    const lx = cx + cos * innerR - sin * hw,  ly = cy + sin * innerR + cos * hw;
    const rx = cx + cos * innerR + sin * hw,  ry = cy + sin * innerR - cos * hw;

    const fillColor = hasQ ? '#dcfce7' : '#f9fafb';

    // Text rotation — align with ray, flip if it would be upside-down
    let rotDeg = deg - 90;
    if (rotDeg > 90 || rotDeg < -90) rotDeg += 180;

    // Text position (55% from inner to outer along ray)
    const textDist = innerR + (outerR - innerR) * 0.52;
    const textX = (cx + cos * textDist).toFixed(1);
    const textY = (cy + sin * textDist).toFixed(1);
    const transform = `translate(${textX},${textY}) rotate(${rotDeg.toFixed(1)})`;

    // Emoji position (near tip)
    const emDist = innerR + (outerR - innerR) * 0.83;
    const emX = (cx + cos * emDist).toFixed(1);
    const emY = (cy + sin * emDist).toFixed(1);

    const word  = words[si];
    const emoji = firstChar(word.emoji || '');

    // Question preview
    const qRaw   = (saved[si] || '').trim();
    const preview = qRaw.length > 18 ? qRaw.substring(0, 18) + '…' : qRaw;

    const clickAttr = onSelect
      ? `onclick="(${onSelect.toString()})(${si})" style="cursor:pointer"`
      : '';

    rays += `
<g ${clickAttr}>
  <polygon ${attr({
    points: `${pt(tx,ty)} ${pt(lx,ly)} ${pt(rx,ry)}`,
    fill: fillColor, stroke: color,
    'stroke-width': '2.5', 'stroke-linejoin': 'round',
  })} />
  <text ${attr({
    x: '0', y: '0',
    'text-anchor': 'middle', 'dominant-baseline': 'middle',
    transform, 'font-family': 'Outfit, sans-serif',
    'font-size': n <= 5 ? '12' : '10',
    'font-weight': '800', fill: '#15803d',
  })}>${esc(word.word)}</text>
  <text ${attr({
    x: emX, y: emY,
    'text-anchor': 'middle', 'dominant-baseline': 'middle',
    'font-size': '14',
  })}>${emoji}</text>
  ${preview ? `<text ${attr({
    x: '0', y: '14',
    'text-anchor': 'middle', 'dominant-baseline': 'middle',
    transform, 'font-family': 'Outfit, sans-serif',
    'font-size': '9', fill: '#374151',
  })}>${esc(preview)}</text>` : ''}
</g>`;
  });

  // ── center ────────────────────────────────────────────────────
  const lineY = cy + 8;
  const lines = centerLabel.split(' ');
  const lineOffset = lines.length === 1 ? 0 : -9;
  const centerTextEls = lines.map((txt, li) => `
  <text ${attr({
    x: cx, y: cy + lineOffset + li * 18,
    'text-anchor': 'middle', 'dominant-baseline': 'middle',
    'font-family': 'Outfit, sans-serif',
    'font-size': '14', 'font-weight': '800', fill: '#15803d',
  })}>${esc(txt)}</text>`).join('');

  // ── assemble SVG ──────────────────────────────────────────────
  return `
<svg id="${id}" viewBox="0 0 ${size} ${size}"
  style="width:100%;max-width:520px;filter:drop-shadow(0 4px 12px rgba(0,0,0,.08))"
  xmlns="http://www.w3.org/2000/svg">
  ${rays}
  <circle cx="${cx}" cy="${cy}" r="${innerR + 2}" fill="white" stroke="${color}" stroke-width="3"/>
  <circle cx="${cx}" cy="${cy}" r="${innerR - 9}" fill="none"  stroke="${color}" stroke-width="1.5"/>
  <line x1="${cx - 46}" y1="${lineY}" x2="${cx + 46}" y2="${lineY}"
    stroke="#9ca3af" stroke-width="1.5"/>
  ${centerTextEls}
</svg>`;
}
