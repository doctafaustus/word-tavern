// Regular — one player's vessel, stats, and running tab.

import { api, esc, el, fmt } from '../api.js';
import { vesselSVG, rarityColor } from '../vessel.js';
import { mountChrome } from '../chrome.js';

async function init() {
  const params = new URLSearchParams(location.search);
  const handle = params.get('handle') || 'wren.bsky.social';

  const chrome = await mountChrome('regulars', {
    crumbs: [{ label: 'Word Tavern' }, { label: 'Regulars', href: '/regulars.html' }, { label: '@' + handle }],
  });

  const { profile: p } = await api(`/api/regulars/${encodeURIComponent(handle)}`);
  const rc = rarityColor(p.vessel.rarity);
  const isMe = chrome.me.loggedIn && chrome.me.me.handle === p.handle;

  const main = document.getElementById('main');
  main.innerHTML = '';

  main.appendChild(el(`<div class="page-head">
    <h1>${esc(p.name)} ${isMe ? '<span class="rarity-badge" style="background:#E0690F;vertical-align:middle">you</span>' : ''}</h1>
    <p>@${esc(p.handle)} · at the bar since ${esc(p.joined)}</p>
  </div>`));

  const grid = el('<div class="profile-grid"></div>');

  grid.appendChild(el(`<div class="stein-card" style="margin:0;max-width:none">
    <div class="stein-card__art" style="border-color:${rc}">
      <span class="stein-card__rarity" style="background:${rc}">${esc(p.vessel.rarity.toUpperCase())}</span>
      ${vesselSVG(p.vessel, 150, 2.4)}
      <div class="stein-card__tier" style="color:${rc}">${esc(p.vessel.rarity)} tier</div>
    </div>
    <div class="stein-card__details">
      <div class="stein-card__namerow">
        <div class="stein-card__name">${esc(p.vessel.name)}</div>
        <span class="verified-chip">hash verified ✓</span>
      </div>
      <div class="stein-card__handle">@${esc(p.handle)}</div>
      <div class="attr-grid">
        ${p.vesselAttrs.map((a) => `<div class="attr"><div class="attr__k">${esc(a.k)}</div><div class="attr__v">${esc(a.v)}</div></div>`).join('')}
      </div>
      <div class="stein-card__stats">
        <span><b>${p.streak}</b> <span>day streak</span></span>
        <span><b>${fmt(p.xp)}</b> <span>XP</span></span>
        <span><b>${fmt(p.wordsPoured)}</b> <span>words poured</span></span>
      </div>
    </div>
  </div>`));

  const tabRows = p.tab.map((t) => `
    <tr>
      <td class="mono">#${t.day == null ? '—' : fmt(t.day)}</td>
      <td class="mono">${esc(t.date)}</td>
      <td class="word-cell">${esc(t.word)}</td>
      <td class="mono">+${t.xp} XP</td>
    </tr>`).join('');

  grid.appendChild(el(`<div class="side-card">
    <div class="side-card__head">Running tab<span class="plain">${p.tab.length} recent</span></div>
    <div class="side-card__body" style="padding:4px 0 0">
      <table class="tab-table">
        <thead><tr><th>DAY</th><th>DATE</th><th>WORD</th><th>XP</th></tr></thead>
        <tbody>${tabRows}</tbody>
      </table>
    </div>
    <div class="side-card__foot" style="padding:10px">
      <div class="receipt-note" style="margin-top:0">Every word lands on the tab. At closing time on New Year's Eve the Barkeep prints the full itemized receipt of your year — every word, every pour, every crit.</div>
    </div>
  </div>`));

  main.appendChild(grid);
}

init().catch((e) => {
  document.getElementById('main').innerHTML = `<p style="padding:40px 0;color:#B8324A">The tap jammed: ${esc(e.message)}</p>`;
});
