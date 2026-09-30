// The Board — leaderboards, tavern stats, and the Barkeep's boss teaser.

import { api, esc, el, fmt } from '../api.js';
import { vesselSVG, rarityColor } from '../vessel.js';
import { mountChrome } from '../chrome.js';

const HOUSE_STEIN = { type: 'stein', body: '#FFFFFF', band: '#E0690F', lid: '#1E1A16' };

async function init() {
  const [lb, stats, bartender] = await Promise.all([
    api('/api/leaderboard'),
    api('/api/stats'),
    api('/api/bartender'),
    mountChrome('board', { crumbs: [{ label: 'Word Tavern' }, { label: 'The Board' }] }),
  ]);

  const main = document.getElementById('main');
  main.innerHTML = '';

  main.appendChild(el(`<div class="page-head">
    <h1>The Board</h1>
    <p>Who's been pouring, who's been sipping, and what the tavern owes the year.</p>
  </div>`));

  main.appendChild(el(`<div class="stat-strip">
    <div class="stat-box"><b>${fmt(stats.wordsServed)}</b><span>WORDS SERVED</span></div>
    <div class="stat-box"><b>${stats.postsCounted}</b><span>POSTS COUNTED</span></div>
    <div class="stat-box"><b>${stats.regulars}</b><span>REGULARS</span></div>
    <div class="stat-box"><b>${stats.vesselsMinted}</b><span>DRINKWARE CLAIMED</span></div>
  </div>`));

  const grid = el('<div class="board-grid"></div>');
  grid.appendChild(lbCard('Top of the tab', 'THIS WEEK — XP', lb.topTab, 'weeklyXp'));
  grid.appendChild(lbCard('Longest streaks', 'DAYS', lb.streaks, 'streak'));
  grid.appendChild(lbCard('Most words poured', 'ALL TIME', lb.pours, 'wordsPoured'));
  main.appendChild(grid);

  main.appendChild(el(`<div class="boss-teaser">
    <div class="boss-teaser__mug">${vesselSVG(HOUSE_STEIN, 72, 2)}</div>
    <div>
      <h2>Something is coming for the taproom.</h2>
      <p>Word is the Barkeep has been stacking crates by the cellar door. Regulars who pour daily will want to be ready — the whole tavern fights as one, and every post lands a hit.</p>
      <p class="barkeep-sig">The Barkeep: “${esc(bartender.quip)}”</p>
    </div>
  </div>`));
}

function lbCard(title, sub, rows, key) {
  return el(`<div class="lb-card">
    <div class="lb-card__head">${esc(title)}<span class="plain">${esc(sub)}</span></div>
    <table class="lb-table"><tbody>
      ${rows.map((r, i) => {
        const rc = rarityColor(r.vessel.rarity);
        return `<tr>
          <td class="rank">${i + 1}</td>
          <td><span class="who">${vesselSVG(r.vessel, 16, 0.8)}<a href="/regular.html?handle=${encodeURIComponent(r.handle)}">${esc(r.name.split(' ')[0].toLowerCase())}</a></span></td>
          <td class="num" style="color:${rc}">${esc(r.vessel.rarity)}</td>
          <td class="num"><b>${fmt(r[key])}</b></td>
        </tr>`;
      }).join('')}
    </tbody></table>
  </div>`);
}

init().catch((e) => {
  document.getElementById('main').innerHTML = `<p style="padding:40px 0;color:#B8324A">The tap jammed: ${esc(e.message)}</p>`;
});
