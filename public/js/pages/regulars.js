// Regulars — everyone who keeps a stool warm.

import { api, esc, el, fmt } from '../api.js';
import { vesselSVG, rarityColor } from '../vessel.js';
import { mountChrome } from '../chrome.js';

async function init() {
  const [{ list }] = await Promise.all([
    api('/api/regulars'),
    mountChrome('regulars', { crumbs: [{ label: 'Word Tavern' }, { label: 'Regulars' }] }),
  ]);

  const main = document.getElementById('main');
  main.innerHTML = '';

  main.appendChild(el(`<div class="page-head">
    <h1>Regulars</h1>
    <p>${fmt(list.length)} of the house's finest. Click a mug to see their tab.</p>
  </div>`));

  const grid = el('<div class="reg-grid"></div>');
  for (const r of list) {
    const rc = rarityColor(r.vessel.rarity);
    grid.appendChild(el(`<a class="reg-card" href="/regular.html?handle=${encodeURIComponent(r.handle)}">
      <div style="position:relative">
        <div style="width:64px;height:64px;border-radius:50%;background:#F2F5FB;border:1px solid ${rc};display:flex;align-items:center;justify-content:center;overflow:hidden">
          ${vesselSVG(r.vessel, 52, 1.6)}
        </div>
        <span class="rarity-badge" style="background:${rc};position:absolute;left:50%;bottom:-6px;transform:translateX(-50%);white-space:nowrap">${esc(r.vessel.rarity)}</span>
      </div>
      <div class="reg-card__name">${esc(r.name)}</div>
      <div class="reg-card__handle">@${esc(r.handle)}</div>
      <div class="reg-card__stats">
        <span><b>${r.streak}</b> streak</span>
        <span><b>${fmt(r.xp)}</b> XP</span>
        <span><b>${fmt(r.wordsPoured)}</b> pours</span>
      </div>
    </a>`));
  }
  main.appendChild(grid);
}

init().catch((e) => {
  document.getElementById('main').innerHTML = `<p style="padding:40px 0;color:#B8324A">The tap jammed: ${esc(e.message)}</p>`;
});
