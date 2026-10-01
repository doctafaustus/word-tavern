// My Tab — a player's itemized vocabulary receipt.

import { api, esc, el, fmt } from '../api.js';
import { mountChrome } from '../chrome.js';

async function init() {
  const chrome = await mountChrome('my-tab', {
    crumbs: [{ label: 'Word Tavern' }, { label: 'My Tab' }],
  });

  const main = document.getElementById('main');
  main.innerHTML = '';

  if (!chrome.me.loggedIn) {
    main.appendChild(el(`<div class="my-tab-page">
    <div class="page-head">
      <h1>My Tab</h1>
      <p>Your vocabulary, itemized pour by pour.</p>
    </div>
    <section class="tab-receipt tab-receipt--empty">
      <h2>Claim your place at the bar</h2>
      <p>Sign in with Bluesky to see the words recorded on your tab.</p>
      <a class="btn" href="/">Head to today’s word</a>
    </section>
    </div>`));
    return;
  }

  const profile = chrome.me.me;
  const tab = await api('/api/my-tab');
  const entries = tab.entries;
  const recordedXp = entries.reduce((sum, entry) => sum + Number(entry.xp || 0), 0);
  const rows = entries.map((entry) => `
    <div class="tab-receipt__row">
      <div class="tab-receipt__date">
        <span>${entry.day == null ? 'FIRST POUR' : `DAY ${fmt(entry.day)}`}</span>
        <time datetime="${esc(entry.date)}">${esc(entry.date)}</time>
      </div>
      <div class="tab-receipt__word-group">
        <div class="tab-receipt__word">${entry.url
    ? `<a href="${esc(entry.url)}" target="_blank" rel="noopener">${esc(entry.word)} ↗</a>`
    : esc(entry.word)}</div>
        <p class="tab-receipt__definition">${esc(entry.definition)}</p>
      </div>
      <div class="tab-receipt__xp">+${fmt(entry.xp)} <span>XP</span></div>
    </div>`).join('');

  main.appendChild(el(`<div class="my-tab-page">
  <div class="page-head">
    <h1>My Tab</h1>
    <p>Your vocabulary, itemized pour by pour.</p>
  </div>
  <section class="tab-receipt" aria-label="Your vocabulary tab">
    <header class="tab-receipt__header">
      <div>
        <span class="tab-receipt__eyebrow">WORD TAVERN · PERSONAL RECEIPT</span>
        <h2>${esc(profile.name)}’s tab</h2>
        <span class="tab-receipt__handle">@${esc(profile.handle)}</span>
      </div>
      <div class="tab-receipt__stamp">THE BAR<br>VOCABULARY</div>
    </header>
    <div class="tab-receipt__summary">
      <span><b>${fmt(entries.length)}</b> words poured</span>
      <span><b>${fmt(recordedXp)}</b> XP on this receipt</span>
    </div>
    <div class="tab-receipt__list">
      <div class="tab-receipt__columns"><span>DATE / BOARD</span><span>WORD LEARNED</span><span>XP</span></div>
      ${rows || '<p class="tab-receipt__empty">No daily-word posts found yet. Today’s word is waiting at the bar.</p>'}
    </div>
    <footer class="tab-receipt__footer">
      <span>${entries.length} recorded ${entries.length === 1 ? 'pour' : 'pours'}</span>
      <span>${fmt(tab.scannedPosts)} public posts checked</span>
    </footer>
  </section>
  <p class="tab-receipt__note">Matched against public posts since ${esc(tab.since)}. Private or deleted posts aren’t visible to the tavern.</p>
  </div>`));
}

init().catch((error) => {
  document.getElementById('main').innerHTML = `<p style="padding:40px 0;color:#B8324A">The tap jammed: ${esc(error.message)}</p>`;
});
