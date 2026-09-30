// Drinkware Collection — the eight shapes, the five rarities, and the
// inspect-a-handle counter.

import { api, esc, el } from '../api.js';
import { vesselSVG, rarityColor, rarityBg } from '../vessel.js';
import { mountChrome } from '../chrome.js';

const TIERS = [
  { name: 'Common', pct: '52%', mat: 'White ceramic', v: { type: 'mug', body: '#F4F1E8', band: '#C9C2B4' } },
  { name: 'Uncommon', pct: '27%', mat: 'Forest glaze', v: { type: 'enamel', body: '#CDEBD6', band: '#1E9450' } },
  { name: 'Rare', pct: '14%', mat: 'Cobalt & pewter', v: { type: 'stein', body: '#E2DCCB', band: '#2F6FE0', lid: '#A9A79F' } },
  { name: 'Epic', pct: '5%', mat: 'Violet bone china', v: { type: 'teacup', body: '#E9D9F8', trim: '#E2B54A', band: '#8B3FD9' } },
  { name: 'Legendary', pct: '2%', mat: 'Sunstone brass', v: { type: 'goblet', body: '#E2B54A', band: '#E0690F', emblem: '#2F6FE0' } },
];

const SPECIMENS = [
  { v: { type: 'stein', body: '#E2DCCB', band: '#2F6FE0', lid: '#A9A79F' }, label: 'Stein' },
  { v: { type: 'mug', body: '#F1E6CF', band: '#E0690F' }, label: 'Mug' },
  { v: { type: 'enamel', body: '#F4F1E8', band: '#2F4A8B' }, label: 'Enamel mug' },
  { v: { type: 'pint', body: '#F0A93A', band: '#C0392B' }, label: 'Pint glass' },
  { v: { type: 'wine', body: '#B8324A', trim: '#E2B54A' }, label: 'Wine glass' },
  { v: { type: 'goblet', body: '#E2B54A', band: '#7A3B1E', emblem: '#1E9450' }, label: 'Goblet / chalice' },
  { v: { type: 'teacup', body: '#F4D3C4', trim: '#E2B54A', band: '#8B3FD9' }, label: 'Teacup' },
  { v: { type: 'bottle', body: '#9FC7A8', band: '#1E1A16' }, label: 'Canteen / water bottle' },
];

async function init() {
  await mountChrome('registry', { crumbs: [{ label: 'Word Tavern' }, { label: 'Drinkware Collection' }] });

  const main = document.getElementById('main');
  main.innerHTML = '';

  main.appendChild(el(`<div class="page-head">
    <h1>Drinkware Collection</h1>
    <p>Your collectible at the Word Tavern is a one-of-a-kind cup tied to your Bluesky handle. Using the daily vocabulary word in a public post earns XP and builds your streak; your drinkware is a keepsake to show off along the way.</p>
  </div>`));

  main.appendChild(el(`<div class="inspect-box">
    <h2>Inspect a handle</h2>
    <p>Look up any Bluesky handle to see the unique cup and rarity it gets at the Tavern.</p>
    <form class="login-form" id="inspect-form">
      <input name="handle" placeholder="you.bsky.social" autocomplete="off" spellcheck="false">
      <button class="btn" type="submit">Inspect</button>
    </form>
    <div id="inspect-result"></div>
  </div>`));

  main.appendChild(el(`<div class="section-title" style="margin-top:44px">
    <h2>Rarity on the rack</h2>
    <p>Odds are baked into the hash. Nobody — not even the Barkeep — can re-roll for you.</p>
  </div>
  <div class="tier-grid">
    ${TIERS.map((t) => {
      const c = rarityColor(t.name);
      const b = rarityBg(t.name);
      return `<div class="tier tier--${t.name}">
        <span class="tier__pct" style="color:${c};background:${b}">${t.pct}</span>
        ${vesselSVG(t.v, 64, 1.8)}
        <div class="tier__name" style="color:${c}">${t.name}</div>
        <div class="tier__mat">${t.mat}</div>
      </div>`;
    }).join('')}
  </div>`));

  main.appendChild(el(`<div class="section-title" style="margin-top:44px">
    <h2>The eight shapes</h2>
    <p>From the humble pint to the chalice. Paper cup enthusiasts: we're working on it.</p>
  </div>
  <div class="type-strip">
    ${SPECIMENS.map((s) => `<div class="type-cell">
      ${vesselSVG(s.v, 56, 1.6)}
      <div class="type-cell__name">${s.label}</div>
    </div>`).join('')}
  </div>`));

  const form = document.getElementById('inspect-form');
  const result = document.getElementById('inspect-result');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const handle = form.handle.value.trim();
    if (!handle) return;
    result.innerHTML = '<p class="quiet" style="margin-top:14px">Polishing the glass…</p>';
    try {
      const d = await api(`/api/vessel/${encodeURIComponent(handle)}`);
      const rc = rarityColor(d.vessel.rarity);
      result.innerHTML = '';
      result.appendChild(el(`<div class="inspect-result">
        <div class="inspect-result__art" style="border-color:${rc}">
          <span class="stein-card__rarity" style="background:${rc}">${esc(d.vessel.rarity.toUpperCase())}</span>
          ${vesselSVG(d.vessel, 110, 1.8)}
        </div>
        <div>
          <div class="inspect-result__name">${esc(d.vessel.name)}</div>
          <div class="inspect-result__handle">@${esc(d.handle)} · <span style="color:${rc};font-weight:700">${esc(d.vessel.rarity)}</span></div>
          <div class="attr-grid" style="margin-top:12px">
            ${d.attrs.map((a) => `<div class="attr"><div class="attr__k">${esc(a.k)}</div><div class="attr__v">${esc(a.v)}</div></div>`).join('')}
          </div>
        </div>
      </div>`));
    } catch (err) {
      result.innerHTML = `<p class="login-error">${esc(err.message)}</p>`;
    }
  });
}

init().catch((e) => {
  document.getElementById('main').innerHTML = `<p style="padding:40px 0;color:#B8324A">The tap jammed: ${esc(e.message)}</p>`;
});
