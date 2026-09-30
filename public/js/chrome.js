// Shared page chrome: board bar, masthead, nav, crumbs, footer, auth modal.

import { api, esc, el, fmt, tickCountdown } from './api.js';
import { vesselSVG, rarityColor } from './vessel.js';

const NAV = [
  ['today', "Today's Word", '/'],
  ['archive', 'Archive', '/archive.html'],
  ['board', 'The Board', '/board.html'],
  ['regulars', 'Regulars', '/regulars.html'],
  ['registry', 'Drinkware', '/registry.html'],
  ['rules', 'House Rules', '/rules.html'],
];

export async function mountChrome(active, { crumbs = null } = {}) {
  const [today, online, me, stats] = await Promise.all([
    api('/api/today'),
    api('/api/online'),
    api('/api/auth/me'),
    api('/api/stats'),
  ]);

  document.body.prepend(el(`<div>
    <div class="board-bar" id="board-bar"></div>
    <div class="container chrome-head">
      <div class="masthead" id="masthead"></div>
      <nav class="nav-bar" id="nav-bar"></nav>
      ${crumbs !== null ? '<div class="crumbs" id="crumbs"></div>' : '<div style="margin-bottom:28px"></div>'}
    </div>
  </div>`));

  renderBoardBar(today, online);
  renderMasthead(me.me);
  renderNav(active);
  if (crumbs !== null) renderCrumbs(crumbs, today);
  mountFooter(stats);
  mountAdminPanel(today.word.word, active);

  return { today, online, me };
}

function mountAdminPanel(word, active) {
  const panel = el(`<aside class="admin-panel">
    <div class="admin-panel__heading">
      <h2 class="admin-panel__title">Admin · feed cache</h2>
      <button class="admin-panel__toggle" type="button" aria-controls="admin-panel-content">
        <span aria-hidden="true">▾</span>
        <span class="sr-only">Collapse admin panel</span>
      </button>
    </div>
    <div class="admin-panel__content" id="admin-panel-content">
      <p>Force-refresh today’s “${esc(word)}” feed on Bluesky.</p>
      <form class="admin-panel__form">
        <input id="admin-secret" name="secret" type="password" aria-label="Admin secret" autocomplete="current-password" placeholder="Server ADMIN_SECRET" required>
        <button class="btn btn--small" type="submit">Refresh</button>
      </form>
      <div class="admin-panel__status" role="status" aria-live="polite"></div>
    </div>
  </aside>`);
  document.body.appendChild(panel);

  const toggle = panel.querySelector('.admin-panel__toggle');
  const content = panel.querySelector('.admin-panel__content');
  const preferenceKey = 'word-tavern:admin-panel-collapsed';
  let collapsed = false;
  try {
    collapsed = localStorage.getItem(preferenceKey) === 'true';
  } catch (error) {
    console.warn('Could not read admin panel preference:', error);
  }

  const setCollapsed = (value) => {
    collapsed = value;
    panel.classList.toggle('is-collapsed', collapsed);
    content.hidden = collapsed;
    toggle.setAttribute('aria-expanded', String(!collapsed));
    toggle.setAttribute('aria-label', collapsed ? 'Expand admin panel' : 'Collapse admin panel');
    toggle.querySelector('[aria-hidden="true"]').textContent = collapsed ? '▴' : '▾';
  };
  setCollapsed(collapsed);
  toggle.addEventListener('click', () => {
    setCollapsed(!collapsed);
    try {
      localStorage.setItem(preferenceKey, String(collapsed));
    } catch (error) {
      console.warn('Could not save admin panel preference:', error);
    }
  });

  const form = panel.querySelector('form');
  const button = form.querySelector('button');
  const status = panel.querySelector('.admin-panel__status');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    button.disabled = true;
    status.textContent = 'Refreshing Bluesky data…';
    try {
      const result = await api('/api/admin/refresh-feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': form.elements.secret.value },
        body: '{}',
      });
      status.textContent = `Refreshed ${result.counts.newest} newest and ${result.counts.top} most-liked posts.`;
      if (active === 'today') setTimeout(() => location.reload(), 1200);
    } catch (error) {
      status.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });
}

function renderBoardBar(today, online) {
  const bar = document.getElementById('board-bar');
  bar.innerHTML = `
    <span class="board-tag"><span class="board-tag__pip"></span>LISTENING TO BLUESKY</span>
    <span>Posts heard today: <b>${fmt(today.poured)}</b></span>
    <span>Players posting: <b>${fmt(online.count)}</b></span>
    <span>On tap: <b>${esc(today.word.word)}</b></span>
    <span class="spacer">next pour in <b data-countdown="${esc(today.nextPourAt)}"></b></span>`;
  bar.querySelectorAll('[data-countdown]').forEach((n) => tickCountdown(n, n.dataset.countdown));
}

function renderMasthead(me) {
  const head = document.getElementById('masthead');
  const connection = me
    ? `<div class="connection-info">
        <span class="connection-pill connection-pill--blue"><span class="pip"></span>Connected to Bluesky</span>
        <p>We read your public posts, never your DMs</p>
      </div>`
    : `<div class="connection-info connection-info--signed-out">
        <button class="btn btn--small" id="sign-in">Sign in with Bluesky</button>
        <span class="connection-pill connection-pill--muted"><span class="pip"></span>Not connected</span>
      </div>`;
  const account = me
    ? `<div class="account">
        <a class="user-chip" href="/regular.html?handle=${encodeURIComponent(me.handle)}" title="Your tab">
          <span class="user-chip__avatar">${vesselSVG(me.vessel, 36, 1.3)}</span>
          <span>
            <span class="user-chip__name">@${esc(me.handle)}</span>
            <span class="user-chip__sub">
              <span class="rarity-badge" style="background:${rarityColor(me.vessel.rarity)}">${esc(me.vessel.rarity)}</span>
              ${me.streak}-day streak · ${fmt(me.xp)} XP
            </span>
          </span>
        </a>
        <button class="btn btn--ghost btn--small" id="sign-out">Sign out</button>
      </div>`
    : '';

  head.innerHTML = `
    <div class="brand">
      <a class="brand__link" href="/" aria-label="Word Tavern home">
        <img class="brand__img" src="/img/word-tavern-logo.png" alt="Word Tavern">
      </a>
      <span class="brand__tagline">The daily word game you play by posting on <b>Bluesky</b></span>
    </div>
    <div class="masthead__right">${connection}${account}</div>`;

  const signIn = document.getElementById('sign-in');
  if (signIn) signIn.addEventListener('click', openLoginModal);
  const signOut = document.getElementById('sign-out');
  if (signOut) signOut.addEventListener('click', async () => {
    await api('/api/auth/logout', { method: 'POST', body: '{}' });
    location.reload();
  });
}

function renderNav(active) {
  const nav = document.getElementById('nav-bar');
  const links = NAV.map(([key, label, href], i) => {
    const sep = i < NAV.length - 1 ? '<span class="dot-sep">|</span>' : '';
    return `<a href="${href}" class="${key === active ? 'is-active' : ''}">${label}</a>${sep}`;
  }).join('');
  nav.innerHTML = `
    <div class="nav-bar__links">${links}</div>
    <a class="nav-bar__notes" href="/rules.html#private-notes">Barkeep's notes: <b>3 new</b></a>`;
}

function renderCrumbs(crumbs, today) {
  const node = document.getElementById('crumbs');
  const trail = crumbs.map((c, i) => {
    const last = i === crumbs.length - 1;
    const label = esc(c.label).replace('{{day}}', fmt(today.day));
    const body = last || !c.href ? `<b>${label}</b>` : `<a href="${c.href}">${label}</a>`;
    const sep = last ? '' : ' › ';
    return body + sep;
  }).join('');
  node.innerHTML = `<span>${trail}</span><span>You last visited: yesterday at 11:48 PM · <a href="#" id="share-word">Share today's word</a></span>`;
}

function mountFooter(stats) {
  const foot = document.getElementById('chrome-foot');
  foot.innerHTML = `
    <div class="footer-stats"><b>Tavern statistics:</b> Words served: ${fmt(stats.wordsServed)} · Bluesky posts counted: ${stats.postsCounted} · Regulars: ${stats.regulars} · Newest regular: <a href="/regular.html?handle=${encodeURIComponent(stats.newestRegular)}" class="amber" style="font-weight:bold">${esc(stats.newestRegular)}</a></div>
    <div class="footer-line">
      <span>Word Tavern · est. ${stats.est} · built on Bluesky</span>
      <span><a href="/rules.html">House rules</a> · <a href="/rules.html#detection">How we detect posts</a> · <a href="/archive.html">Archive</a></span>
    </div>`;
}

// ── Login modal ────────────────────────────────────────────────────────────

async function openLoginModal() {
  const regulars = await api('/api/regulars').then((d) => d.list.slice(0, 8)).catch(() => []);
  const backdrop = el(`<div class="modal-backdrop">
    <div class="modal">
      <h2>Claim your seat</h2>
      <p class="sub">Sign in to claim your collectible Word Tavern drinkware. Your Bluesky handle determines your one-of-a-kind cup and its rarity.</p>
      <form class="login-form">
        <input name="handle" placeholder="you.bsky.social" autocomplete="off" spellcheck="false" />
        <button class="btn" type="submit">Pull up a stool</button>
      </form>
      <div class="login-error" hidden></div>
      <div class="regular-pick">…or step in as one of the regulars:
        <div class="chips">${regulars.map((r) => `<button type="button" class="chip" data-handle="${esc(r.handle)}">${esc(r.name.split(' ')[0])}</button>`).join('')}</div>
      </div>
      <div class="barkeep-note" hidden></div>
      <div class="close-row"><button class="btn btn--ghost btn--small" id="modal-close">Not thirsty</button></div>
    </div>
  </div>`);
  document.body.appendChild(backdrop);

  const close = () => backdrop.remove();
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
  backdrop.querySelector('#modal-close').addEventListener('click', close);
  backdrop.querySelectorAll('.chip').forEach((c) => c.addEventListener('click', () => submit(c.dataset.handle)));

  const form = backdrop.querySelector('form');
  const err = backdrop.querySelector('.login-error');
  const note = backdrop.querySelector('.barkeep-note');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submit(form.handle.value);
  });

  async function submit(handle) {
    err.hidden = true;
    try {
      const res = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ handle }) });
      note.textContent = `The Barkeep: “${res.quip}”`;
      note.hidden = false;
      form.querySelector('button').disabled = true;
      setTimeout(() => location.reload(), 1100);
    } catch (e2) {
      err.textContent = e2.message;
      err.hidden = false;
    }
  }
}
