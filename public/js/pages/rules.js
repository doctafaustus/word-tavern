// House Rules — how the game works, in the Barkeep's own words.

import { api, esc, el } from '../api.js';
import { mountChrome } from '../chrome.js';

async function init() {
  const [{ rules: faq }] = await Promise.all([
    api('/api/quips'),
    mountChrome('rules', { crumbs: [{ label: 'Word Tavern' }, { label: 'House Rules' }] }),
  ]);

  const main = document.getElementById('main');
  main.innerHTML = '';

  main.appendChild(el(`<div class="page-head">
    <h1>House Rules</h1>
    <p>Posted behind the bar, in permanent ink. The Barkeep does not repeat himself. (He will repeat himself.)</p>
  </div>`));

  const list = el('<div class="rules-list"></div>');

  list.appendChild(el(`<section class="rule-card" id="detection">
    <h2><span class="step-num">1</span> One word goes on tap at midnight</h2>
    <p>Every day the tavern posts a new word of the day — board number, pronunciation, definitions, the lot. You have until the next midnight, local time, to use it. The countdown on the board is law.</p>
  </section>`));

  list.appendChild(el(`<section class="rule-card">
    <h2><span class="step-num">2</span> Pour the word into a real Bluesky post</h2>
    <p>Write a public post on Bluesky that uses the day's word. The tavern listens to the public firehose and counts every pour automatically — no screenshots, no receipts, no honor system. The Live Tap Feed shows pours as they land, straight from Bluesky.</p>
  </section>`));

  list.appendChild(el(`<section class="rule-card">
    <h2><span class="step-num">3</span> XP, crits, and streaks</h2>
    <ul>
      <li><b>+25 XP</b> for a counted pour — one per word per day.</li>
      <li><b>+50 XP crit</b> when your post passes 100 likes. The room agrees with you.</li>
      <li><b>Streaks</b> grow by one for every day you pour. Miss a day and the Barkeep sighs audibly.</li>
      <li>Weekly XP puts you on <a href="/board.html" class="amber" style="font-weight:700">the Board</a> — the top of the tab.</li>
    </ul>
  </section>`));

  list.appendChild(el(`<section class="rule-card">
    <h2><span class="step-num">4</span> Claim your collectible drinkware</h2>
    <p>Sign in to claim the unique cup tied to your Bluesky handle. Its shape, colors, and rarity are generated from your handle, so it is yours alone. Use the daily vocabulary word in a public post to earn XP and grow your streak; your drinkware is a keepsake of your time learning new words at the Tavern. A Common mug is not a consolation prize — it's <i>your</i> mug. Browse the <a href="/registry.html" class="amber" style="font-weight:700">Drinkware Collection</a> to see the different shapes and rarities.</p>
  </section>`));

  list.appendChild(el(`<section class="rule-card">
    <h2><span class="step-num">5</span> Run your tab</h2>
    <p>Every word you pour lands on your tab, kept behind the bar. On New Year's Eve the tavern closes out the year and prints you a full itemized receipt of your vocabulary — every word, every date, every crit. Frame it. Argue with it. It's yours.</p>
  </section>`));

  list.appendChild(el(`<section class="rule-card" id="private-notes">
    <h2><span class="step-num">6</span> Notes from the Barkeep</h2>
    <p>A quiet word from behind the bar, just for your tab. These little notes are private—not messages from other patrons, and never posted on the public board. The Barkeep has left three new ones for you.</p>
  </section>`));

  list.appendChild(el(`<section class="rule-card">
    <h2>Asked at the bar</h2>
    ${faq.map((f) => `<div class="faq-item">
      <div class="q">${esc(f.q)}</div>
      <div class="a">“${esc(f.a)}” — the Barkeep</div>
    </div>`).join('')}
  </section>`));

  main.appendChild(list);
}

init().catch((e) => {
  document.getElementById('main').innerHTML = `<p style="padding:40px 0;color:#B8324A">The tap jammed: ${esc(e.message)}</p>`;
});
