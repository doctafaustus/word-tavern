// Procedural vessel renderer — a straight port of the Tap Room design's
// vessel generator. Given a spec {type, body, band, lid, trim, emblem} it
// returns an SVG string. viewBox is 0 0 100 100.

const INK = '#1E1A16';

function attrs(o) {
  return Object.entries(o)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}="${String(v).replace(/"/g, '&quot;')}"`)
    .join(' ');
}

export function vesselSVG(t, size = 100, px = 2) {
  const sw = ((px || 2) * 100) / size;
  const k = [];
  const S = (o) => attrs({ stroke: INK, strokeWidth: sw, strokeLinejoin: 'round', strokeLinecap: 'round', ...o });

  const handle = (d, w, fill) => {
    k.push(`<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w + 2 * sw}" stroke-linecap="round" />`);
    k.push(`<path d="${d}" fill="none" stroke="${fill}" stroke-width="${w}" stroke-linecap="round" />`);
  };
  const dots = (pts, fill, r, op) => {
    for (const [x, y] of pts) k.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" opacity="${op}" />`);
  };

  const glass = t.glass || '#EDF3F4';

  switch (t.type) {
    case 'stein':
      handle('M68 40 C86 40 88 46 88 57 C88 68 84 74 68 74', 7, t.body);
      k.push(`<rect ${S({ x: 26, y: 30, width: 42, height: 54, rx: 2, fill: t.body })} />`);
      dots([[31, 48], [36, 67], [60, 50], [63, 66], [44, 70], [55, 46], [33, 58], [62, 58]], INK, 0.7, 0.25);
      k.push(`<rect ${S({ x: 26, y: 37, width: 42, height: 5, fill: t.band })} />`);
      k.push(`<rect ${S({ x: 26, y: 73, width: 42, height: 5, fill: t.band })} />`);
      k.push(`<circle ${S({ cx: 47, cy: 57.5, r: 9, fill: t.band })} />`);
      k.push(`<path d="M47 51 C51 54 51 61 47 64 C43 61 43 54 47 51Z" fill="${t.body}" />`);
      k.push(`<rect ${S({ x: 24, y: 82, width: 46, height: 5, rx: 1, fill: t.lid })} />`);
      k.push(`<path ${S({ d: 'M64 29 L72 17 L77 19 L71 30', fill: t.lid })} />`);
      k.push(`<path ${S({ d: 'M23 31 Q47 15 71 31 Z', fill: t.lid })} />`);
      k.push(`<circle ${S({ cx: 47, cy: 20, r: 3, fill: t.lid })} />`);
      break;
    case 'mug':
      handle('M68 42 C84 42 86 48 86 57 C86 66 82 72 68 72', 7, t.body);
      k.push(`<rect ${S({ x: 24, y: 32, width: 44, height: 52, rx: 7, fill: t.body })} />`);
      k.push(`<path ${S({ d: 'M24 39 Q24 32 31 32 L61 32 Q68 32 68 39 L68 47 Q64 53 60 47 Q56 55 51 47 Q46 53 42 47 Q37 56 33 47 Q28 51 24 47 Z', fill: t.band })} />`);
      break;
    case 'enamel':
      handle('M68 44 C82 44 84 50 84 58 C84 66 80 70 68 70', 6, t.body);
      k.push(`<rect ${S({ x: 24, y: 34, width: 44, height: 48, rx: 3, fill: t.body })} />`);
      k.push(`<rect ${S({ x: 22, y: 30, width: 48, height: 7, rx: 3.5, fill: t.band })} />`);
      k.push(`<rect ${S({ x: 24, y: 78, width: 44, height: 5, rx: 1.5, fill: t.band })} />`);
      dots([[33, 52], [59, 66], [40, 72]], t.band, 1.8, 1);
      break;
    case 'pint':
      k.push(`<path ${S({ d: 'M28 18 L72 18 L65 86 L35 86 Z', fill: glass })} />`);
      k.push(`<path d="M29.4 31 L70.6 31 L65.3 84.5 L34.7 84.5 Z" fill="${t.body}" />`);
      k.push(`<path d="M28.6 23 L71.4 23 L70.5 32 L29.5 32Z" fill="#FFF8E6" />`);
      k.push(`<path d="M37 38 L40 78" stroke="#fff" stroke-width="3" opacity="0.5" stroke-linecap="round" />`);
      k.push(`<circle ${S({ cx: 52, cy: 58, r: 8, fill: t.band })} />`);
      k.push(`<path ${S({ d: 'M28 18 L72 18 L65 86 L35 86 Z', fill: 'none' })} />`);
      break;
    case 'wine':
      k.push(`<ellipse ${S({ cx: 50, cy: 86, rx: 16, ry: 3.5, fill: glass })} />`);
      k.push(`<rect ${S({ x: 48, y: 57, width: 4, height: 29, fill: glass })} />`);
      k.push(`<path ${S({ d: 'M30 14 C28 44 36 58 50 58 C64 58 72 44 70 14 Z', fill: glass })} />`);
      k.push(`<path d="M31.2 33 C33 50 39 56.5 50 56.5 C61 56.5 67 50 68.8 33 Z" fill="${t.body}" />`);
      k.push(`<path ${S({ d: 'M30 14 C28 44 36 58 50 58 C64 58 72 44 70 14 Z', fill: 'none' })} />`);
      k.push(`<path d="M30 14 L70 14" stroke="${t.trim}" stroke-width="${sw * 2.2}" stroke-linecap="round" />`);
      break;
    case 'goblet':
      k.push(`<path ${S({ d: 'M32 89 Q50 79 68 89 Z', fill: t.body })} />`);
      k.push(`<rect ${S({ x: 46, y: 56, width: 8, height: 28, fill: t.body })} />`);
      k.push(`<ellipse ${S({ cx: 50, cy: 70, rx: 7.5, ry: 4, fill: t.band })} />`);
      k.push(`<path ${S({ d: 'M25 16 L75 16 Q75 50 50 57 Q25 50 25 16Z', fill: t.body })} />`);
      k.push(`<rect ${S({ x: 25.5, y: 24, width: 49, height: 7, fill: t.band })} />`);
      dots([[37, 27.5], [50, 27.5], [63, 27.5]], t.emblem, 2.4, 1);
      break;
    case 'teacup':
      k.push(`<ellipse ${S({ cx: 50, cy: 80, rx: 36, ry: 6.5, fill: t.body })} />`);
      handle('M74 46 C86 46 86 62 71 62', 5, t.body);
      k.push(`<path ${S({ d: 'M18 40 L82 40 Q80 72 50 75 Q20 72 18 40Z', fill: t.body })} />`);
      k.push(`<path d="M18.5 40 L81.5 40" stroke="${t.trim}" stroke-width="${sw * 2.2}" stroke-linecap="round" />`);
      dots([[30, 52], [42, 55], [54, 55], [66, 52]], t.band, 2.6, 1);
      break;
    case 'bottle':
      k.push(`<rect ${S({ x: 40, y: 10, width: 20, height: 12, rx: 2, fill: t.band })} />`);
      k.push(`<path ${S({ d: 'M41 22 L59 22 L67 34 L33 34Z', fill: t.body })} />`);
      k.push(`<rect ${S({ x: 30, y: 32, width: 40, height: 56, rx: 8, fill: t.body })} />`);
      k.push(`<rect ${S({ x: 30, y: 48, width: 40, height: 22, fill: '#FFF8E6' })} />`);
      k.push(`<circle ${S({ cx: 50, cy: 59, r: 6, fill: t.band })} />`);
      break;
    default:
      k.push(`<circle ${S({ cx: 50, cy: 50, r: 30, fill: t.body || '#E2DCCB' })} />`);
  }

  return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" style="display:block;overflow:visible" aria-hidden="true">${k.join('')}</svg>`;
}

export const RARITY_COLORS = {
  Common: '#7D766B',
  Uncommon: '#1E9450',
  Rare: '#2F6FE0',
  Epic: '#8B3FD9',
  Legendary: '#E0690F',
};

export const RARITY_BGS = {
  Common: '#F2F0EC',
  Uncommon: '#E4F6EA',
  Rare: '#E8F0FD',
  Epic: '#F3EAFC',
  Legendary: '#FDEEDF',
};

export function rarityColor(r) { return RARITY_COLORS[r] || RARITY_COLORS.Common; }
export function rarityBg(r) { return RARITY_BGS[r] || RARITY_BGS.Common; }
