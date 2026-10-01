// Archive — every word the tavern has ever served.

import { api, esc, el, fmt } from '../api.js';
import { mountChrome } from '../chrome.js';

let openDay = null; // which day's detail is currently shown inline

async function init() {
  const [{ list }] = await Promise.all([
    api('/api/archive'),
    mountChrome('archive', { crumbs: [{ label: 'Word Tavern' }, { label: 'The Bar' }, { label: 'Archive' }] }),
  ]);

  const main = document.getElementById('main');
  main.innerHTML = '';

  main.appendChild(el(`<div class="page-head">
    <h1>The Archive</h1>
    <p>Every word on tap since the doors opened. ${fmt(list.length)} pours served. Click a day to pull its card.</p>
  </div>`));

  // Group by month, newest first (list already arrives newest-first).
  const groups = new Map();
  for (const item of list) {
    const key = item.date.slice(0, 7);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }

  const rowsByDay = new Map();
  const maxDay = Math.max(...list.map((i) => i.day));
  for (const [month, items] of groups) {
    const label = new Date(month + '-02T00:00:00Z').toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    main.appendChild(el(`<div class="month-label">${esc(label)}</div>`));
    const rows = el('<div class="arch-list"></div>');
    for (const item of items) {
      const row = el(`<a class="arch-row ${item.day === maxDay ? 'arch-row--today' : ''}" href="/archive.html#day-${item.day}" data-day="${item.day}">
        <span class="arch-row__day">#${fmt(item.day)}</span>
        <span class="arch-row__date">${esc(item.date)}</span>
        <span><span class="arch-row__word">${esc(item.word)}</span><span class="arch-row__pos">${esc(item.pos)}</span></span>
        <span class="arch-row__short">${esc(item.short)}</span>
        <span class="arch-row__pours">${fmt(item.pours)} pours</span>
      </a>`);
      row.addEventListener('click', (e) => {
        e.preventDefault();
        toggleDay(item.day, row);
      });
      rows.appendChild(row);
      rowsByDay.set(item.day, row);
    }
    main.appendChild(rows);
  }

  async function toggleDay(day, row) {
    // Clicking the open row collapses it.
    if (openDay === day) {
      closeDetail();
      return;
    }
    openDay = day;
    closeDetail();

    const { entry, pours } = await api(`/api/archive/${day}`);
    const detail = renderDetail(entry, pours);
    row.after(detail);
    row.classList.add('arch-row--open');
    row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function closeDetail() {
    document.querySelectorAll('.arch-detail--inline').forEach((n) => n.remove());
    document.querySelectorAll('.arch-row--open').forEach((n) => n.classList.remove('arch-row--open'));
  }

  function renderDetail(entry, pours) {
    return el(`<section class="arch-detail arch-detail--inline">
      <div class="wotd__wordrow">
        <h1 class="wotd__word" style="font-size:44px">${esc(entry.word)}</h1>
        <span class="wotd__pron">${esc(entry.pronunciation)} · ${esc(entry.pos)}</span>
      </div>
      <div class="wotd__sayit">say it: ${esc(entry.sayIt)} · ${esc(entry.dateLabel)} · ${fmt(pours)} pours</div>
      <div class="rule"></div>
      <div class="defs">
        ${entry.definitions.map((d, i) => `<div class="def">
          <span class="def__num">${i + 1}</span>
          <div class="def__content">
            <div class="def__text">${esc(d.text)}</div>
            ${d.example ? `<div class="def__example">“${esc(d.example)}”</div>` : ''}
          </div>
        </div>`).join('')}
      </div>
      <div class="info-grid">
        <div class="info-box info-box--origin"><div class="info-box__label">ORIGIN STORY</div><p>${esc(entry.origin)}</p></div>
        <div class="info-box info-box--thesaurus"><div class="info-box__label">THESAURUS</div><p><b>Synonyms:</b> ${entry.synonyms.map(esc).join(', ')}.<br><b>Opposite:</b> ${esc(entry.antonym)}.</p></div>
      </div>
    </section>`);
  }

  // Deep link: /archive.html#day-32 opens inline at that row.
  const m = location.hash.match(/^#day-(\d+)$/);
  if (m) {
    const row = rowsByDay.get(parseInt(m[1], 10));
    if (row) {
      openDay = parseInt(m[1], 10);
      const { entry, pours } = await api(`/api/archive/${openDay}`);
      const detail = renderDetail(entry, pours);
      row.after(detail);
      row.classList.add('arch-row--open');
      row.scrollIntoView({ block: 'nearest' });
    }
  }
}

init().catch((e) => {
  document.getElementById('main').innerHTML = `<p style="padding:40px 0;color:#B8324A">The tap jammed: ${esc(e.message)}</p>`;
});
