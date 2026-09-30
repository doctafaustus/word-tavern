// Today's Word — the Tap Room page.

import { api, esc, el, fmt, tickCountdown, ICONS } from '../api.js';
import { vesselSVG, rarityColor, rarityBg } from '../vessel.js';
import { mountChrome } from '../chrome.js';

const HOUSE_STEIN = { type: 'stein', body: '#FFFFFF', band: '#E0690F', lid: '#1E1A16' };

// The five rarity tiers, straight from the design's "Rarity on the rack".
const TIERS = [
  { name: 'Common', pct: '52%', mat: 'White ceramic', v: { type: 'mug', body: '#F4F1E8', band: '#C9C2B4' } },
  { name: 'Uncommon', pct: '27%', mat: 'Forest glaze', v: { type: 'enamel', body: '#CDEBD6', band: '#1E9450' } },
  { name: 'Rare', pct: '14%', mat: 'Cobalt & pewter', v: { type: 'stein', body: '#E2DCCB', band: '#2F6FE0', lid: '#A9A79F' } },
  { name: 'Epic', pct: '5%', mat: 'Violet bone china', v: { type: 'teacup', body: '#E9D9F8', trim: '#E2B54A', band: '#8B3FD9' } },
  { name: 'Legendary', pct: '2%', mat: 'Sunstone brass', v: { type: 'goblet', body: '#E2B54A', band: '#E0690F', emblem: '#2F6FE0' } },
];

async function init() {
  const chrome = await mountChrome('today', {
    crumbs: [
      { label: 'Word Tavern' },
      { label: 'The Bar' },
      { label: 'Word of the Day No. {{day}}' },
    ],
  });

  const { today, me } = chrome;
  const share = document.getElementById('share-word');
  if (share) share.addEventListener('click', (e) => {
    e.preventDefault();
    window.open(composeIntent(`${today.word.word} — today's word on tap at Word Tavern. Pour it into a post.`), '_blank');
  });

  const main = document.getElementById('main');
  main.innerHTML = '';

  const welcomeBanner = renderWelcomeBanner();
  if (welcomeBanner) main.appendChild(welcomeBanner);
  main.appendChild(renderWotd(today, me.me));
  main.appendChild(renderLayout(today));
  main.appendChild(me.loggedIn ? renderShowcase(me.me) : renderSigninCard());
  main.appendChild(renderRarityRack());
  const showcase = document.getElementById('drinkware-showcase');
  welcomeBanner?.querySelector('.welcome-banner__link').addEventListener('click', (event) => {
    event.preventDefault();
    showcase.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  welcomeBanner?.querySelector('.welcome-banner__close').addEventListener('click', () => {
    welcomeBanner.remove();
    try {
      localStorage.setItem('word-tavern:welcome-banner-dismissed', 'true');
    } catch (error) {
      console.warn('Could not save welcome banner preference:', error);
    }
  });

  // Sidebar data streams in after first paint.
  hydrateSidebar(today);
  hydrateFeed(today);
}

function composeIntent(text) {
  return `https://bsky.app/intent/compose?text=${encodeURIComponent(text)}`;
}

function renderWelcomeBanner() {
  try {
    if (localStorage.getItem('word-tavern:welcome-banner-dismissed') === 'true') return null;
  } catch (error) {
    console.warn('Could not read welcome banner preference:', error);
  }

  return el(`<aside class="welcome-banner" aria-label="A note from the bartender">
    <div class="welcome-banner__host">
      <img class="welcome-banner__avatar" src="/img/bartender-modified.png" alt="Bartender">
      <b>Bartender</b>
    </div>
    <div class="welcome-banner__bubble">
      <p><i>Psst, new here?</i> Your drinkware was poured from your Bluesky ID, so it’s one of a kind. Use the day’s word in a real post and it gets fancier: glazes, engravings, maybe a goblet someday. <a class="welcome-banner__link" href="#drinkware-showcase">See your stein</a></p>
      <button class="welcome-banner__close" type="button" aria-label="Dismiss welcome message">×</button>
    </div>
  </aside>`);
}

// ── Word of the day card ───────────────────────────────────────────────────

function renderWotd(today, me) {
  const w = today.word;
  const defs = w.definitions.map((d, i) => `
    <div class="def">
      <span class="def__num">${i + 1}.</span>
      <div class="def__content">
        <div class="def__text">${esc(d.text)}</div>
        ${d.example ? `<div class="def__example">“${esc(d.example)}”</div>` : ''}
      </div>
    </div>`).join('');

  const avatar = me ? vesselSVG(me.vessel, 42, 1.4) : vesselSVG(HOUSE_STEIN, 42, 1.4);

  const node = el(`<section class="wotd">
    <div class="wotd__top">
      <div>
        <div class="wotd__wordrow">
          ${w.audio ? `<button class="pronunciation-play" type="button" aria-label="Play pronunciation of ${esc(w.word)}" title="Play pronunciation">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9v6h4l5 4V5L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4.03v8.05A4.5 4.5 0 0 0 16.5 12zm-2.5-9.23v2.06a8 8 0 0 1 0 14.34v2.06a10 10 0 0 0 0-18.46z"/></svg>
          </button>` : ''}
          <h1 class="wotd__word">${esc(w.word)}</h1>
        </div>
        <div class="wotd__pron">${esc(w.pronunciation)} · ${esc(w.pos)}</div>
        <div class="wotd__sayit">say it: ${esc(w.sayIt)}</div>
      </div>
      <div class="wotd__pour-column">
        <div class="wotd__ribbon">WORD OF THE DAY #${fmt(today.day)}</div>
        <div class="pour-box">
          <div class="pour-box__count" id="poured-count">${fmt(today.poured)}</div>
          <div class="pour-box__label">POURED TODAY ON BLUESKY</div>
          <div class="pour-box__lastcall">last call in <b data-countdown="${esc(today.nextPourAt)}"></b></div>
        </div>
      </div>
    </div>
    <div class="word-details">
      <div class="word-details__row">
        <div class="word-details__label">Meaning</div>
        <div class="defs">${defs}</div>
      </div>
      <div class="word-details__row word-details__row--origin">
        <div class="word-details__label">Origin</div>
        <p class="word-details__text">${esc(w.origin)}</p>
      </div>
    </div>
    <div class="quest-bar">
      <div class="quest-bar__left">
        <div class="quest-bar__avatar">${avatar}</div>
        <div>
          <span class="quest-bar__eyebrow">TODAY'S QUEST</span>
          <div class="quest-bar__text">${esc(today.quest.text)} <span class="quest-bar__xp">+${today.quest.xp} XP</span></div>
        </div>
      </div>
      <a class="btn" href="${composeIntent(w.word + ' ')}" target="_blank" rel="noopener">Post on Bluesky ↗</a>
    </div>
  </section>`);

  node.querySelectorAll('[data-countdown]').forEach((n) => tickCountdown(n, n.dataset.countdown));
  const playButton = node.querySelector('.pronunciation-play');
  if (playButton) {
    const audio = new Audio(w.audio);
    playButton.addEventListener('click', () => {
      audio.currentTime = 0;
      audio.play().catch((error) => {
        console.error(`Could not play pronunciation for "${w.word}":`, error);
      });
    });
  }
  return node;
}

// ── Feed + sidebar layout ──────────────────────────────────────────────────

function renderLayout(today) {
  return el(`<div class="layout">
    <section>
      <div class="feed-head">
        <span class="feed-head__title">Live Tap Feed</span>
        <span class="feed-head__live"><span class="pip"></span><span id="feed-live-label">LIVE FROM BLUESKY</span></span>
      </div>
      <div class="feed-sub">
        <span>Sort: <b id="sort-newest">Newest</b> · <a href="#" id="sort-top">Most liked</a></span>
      </div>
      <div class="posts" id="posts"><p class="quiet">Pulling the first pints…</p></div>
      <div class="feed-load-more" id="feed-load-more" hidden>
        <button class="btn btn--ghost btn--small" type="button" id="feed-load-more-button">Load More</button>
      </div>
    </section>
    <aside class="sidebar">
      <div class="side-card">
        <div class="side-card__head">Who's at the bar<span class="plain" id="online-count"></span></div>
        <div class="side-card__body"><div class="online-list" id="online-list"></div></div>
        <div class="side-card__foot" id="online-foot"></div>
      </div>
      <div class="side-card">
        <div class="side-card__head">Top of the tab<span class="plain">this week</span></div>
        <div class="side-card__body" id="top-tab"></div>
      </div>
      <div class="side-card">
        <div class="side-card__head">Yesterday: ${esc(today.yesterday.word)}</div>
        <div class="side-card__body yesterday-best" id="yesterday"></div>
      </div>
      <div class="side-card rarity-chart">
        <div class="side-card__head">Rarity on the rack<span class="plain">${esc(today.board.stats.vesselsMinted)} claimed</span></div>
        <div class="side-card__body">
          ${[...TIERS].reverse().map((tier) => `
            <div class="rarity-chart__row">
              <span class="rarity-chart__swatch" style="background:${rarityColor(tier.name)}"></span>
              <b style="color:${rarityColor(tier.name)}">${esc(tier.name)}</b>
              <span class="rarity-chart__pct">${esc(tier.pct)}</span>
            </div>`).join('')}
        </div>
      </div>
    </aside>
  </div>`);
}

async function hydrateFeed(today, sort = 'newest') {
  const feed = await api(`/api/feed?sort=${sort}`).catch(() => ({ posts: [], source: 'offline', pending: 0 }));
  const postsNode = document.getElementById('posts');
  postsNode.innerHTML = '';
  const posts = feed.posts.slice(0, 25);
  let visibleCount = Math.min(12, posts.length);
  posts.slice(0, visibleCount).forEach((p) => postsNode.appendChild(renderPost(p, today.day)));

  const loadMore = document.getElementById('feed-load-more');
  const loadMoreButton = document.getElementById('feed-load-more-button');
  const updateLoadMore = () => {
    loadMore.hidden = visibleCount >= posts.length;
    loadMoreButton.textContent = 'Load More';
  };
  updateLoadMore();
  loadMoreButton.onclick = () => {
    const nextCount = Math.min(visibleCount + 10, posts.length, 25);
    posts.slice(visibleCount, nextCount).forEach((p) => postsNode.appendChild(renderPost(p, today.day)));
    visibleCount = nextCount;
    updateLoadMore();
  };

  const label = document.getElementById('feed-live-label');
  if (feed.source === 'offline') label.textContent = 'BLUESKY UNREACHABLE — SHOWING HOUSE POURS';

  document.getElementById('sort-newest').outerHTML = sort === 'newest' ? '<b id="sort-newest">Newest</b>' : '<a href="#" id="sort-newest">Newest</a>';
  document.getElementById('sort-top').outerHTML = sort === 'top' ? '<b id="sort-top">Most liked</b>' : '<a href="#" id="sort-top">Most liked</a>';
  document.getElementById('sort-newest').onclick = (e) => { e.preventDefault(); setSort('newest'); };
  document.getElementById('sort-top').onclick = (e) => { e.preventDefault(); setSort('top'); };
  function setSort(s) {
    currentSort = s;
    hydrateFeed(today, s);
  }
}

let currentSort = 'newest';

function renderPost(p, day) {
  const rc = rarityColor(p.vessel.rarity);
  const body = `${esc(p.pre)}${p.word ? `<mark class="hl">${esc(p.word)}</mark>` : ''}${esc(p.post)}`;
  const postedAt = formatPostTimestamp(p.at);
  const voteId = p.link || `${p.handle}:${p.pre}${p.word}${p.post}`;
  const voteStorageKey = `word-tavern:feed-votes:${day}`;
  const votedPosts = readVotes(voteStorageKey);
  const hasVoted = votedPosts.has(voteId);
  const node = el(`<article class="post">
    <div class="post__head">
      <div class="post__avatar">
        <div class="vessel-circle">${vesselSVG(p.vessel, 38, 1.3)}</div>
        <span class="post__rarity" style="background:${rc}">${esc(p.vessel.rarity.toUpperCase())}</span>
      </div>
      <div class="post__id">
        <div class="post__name">${esc(p.name)}</div>
        <div class="post__handle">${esc(p.handle)}</div>
      </div>
      <div class="post__head-end">
        <span class="post__time"${postedAt ? ` title="${esc(postedAt)}"` : ''}>${esc(p.time)}</span>
      </div>
    </div>
    <p class="post__body"></p>
    <div class="counted-pill">✓ Counted · +${p.xp} XP${p.crit ? ' crit' : ''} · ${esc(p.vesselLabel)}</div>
    <div class="post__meta">
      <button class="post__tavern-vote${hasVoted ? ' is-voted' : ''}" type="button"
        data-vote-id="${esc(voteId)}" aria-pressed="${hasVoted}" title="Word Tavern vote, saved only in this browser">
        ${ICONS.like}<span>Cheers</span><span class="post__tavern-count">${hasVoted ? '1' : ''}</span>
      </button>
      <div class="post__bsky-stats" aria-label="Bluesky post stats">
        ${p.link
    ? `<a class="post__bsky-label" href="${esc(p.link)}" target="_blank" rel="noopener" title="Open post on Bluesky">ON BLUESKY ${ICONS.external}</a>`
    : '<span class="post__bsky-label">ON BLUESKY</span>'}
        <span title="Replies">${ICONS.reply}${fmt(p.replies)}</span>
        <span title="Reposts">${ICONS.repost}${fmt(p.reposts)}</span>
        <span title="Bluesky likes">${ICONS.like}${fmt(p.likes)}</span>
      </div>
    </div>
  </article>`);
  const bodyNode = node.querySelector('.post__body');
  bodyNode.innerHTML = body;
  node.querySelector('.post__tavern-vote').addEventListener('click', (event) => {
    const button = event.currentTarget;
    const votes = readVotes(voteStorageKey);
    if (votes.has(voteId)) votes.delete(voteId);
    else votes.add(voteId);
    localStorage.setItem(voteStorageKey, JSON.stringify([...votes]));
    const hasVotedNow = votes.has(voteId);
    button.classList.toggle('is-voted', hasVotedNow);
    button.setAttribute('aria-pressed', String(hasVotedNow));
    button.title = hasVotedNow
      ? 'Your Word Tavern vote is saved in this browser. Click to remove it.'
      : 'Word Tavern vote, saved only in this browser';
    button.querySelector('.post__tavern-count').textContent = hasVotedNow ? '1' : '';
  });
  return node;
}

function readVotes(storageKey) {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
    return new Set(Array.isArray(stored) ? stored.filter((id) => typeof id === 'string') : []);
  } catch (_) {
    return new Set();
  }
}

function formatPostTimestamp(timestamp) {
  const date = new Date(timestamp);
  if (!timestamp || Number.isNaN(date.getTime())) return '';

  const parts = new Intl.DateTimeFormat('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  }).formatToParts(date);
  const part = (type) => parts.find((item) => item.type === type)?.value || '';
  return `${part('month')}/${part('day')}/${part('year')} ${part('hour')}:${part('minute')}${part('dayPeriod').toLowerCase()} ${part('timeZoneName')}`;
}

async function hydrateSidebar(today) {
  const [online, lb] = await Promise.all([
    api('/api/online'),
    api('/api/leaderboard'),
  ]);

  document.getElementById('online-count').textContent = fmt(online.count);
  document.getElementById('online-list').innerHTML = online.list.map((o) => {
    const rc = rarityColor(o.vessel.rarity);
    return `<span>${vesselSVG(o.vessel, 15, 0.8)}<a href="/regular.html?handle=${encodeURIComponent(o.handle)}" style="color:${rc}">${esc(o.name)}</a></span>`;
  }).join('');
  document.getElementById('online-foot').textContent = `…and ${fmt(online.guests)} guests. Most ever: ${fmt(online.mostEver.count)} on ${online.mostEver.date}.`;

  document.getElementById('top-tab').innerHTML = lb.topTab.slice(0, 5).map((t, i) => `
    <div class="tab-row">
      <b>${i + 1}</b>
      ${vesselSVG(t.vessel, 16, 0.8)}
      <a href="/regular.html?handle=${encodeURIComponent(t.handle)}" style="font-weight:bold">${esc(t.name.split(' ')[0].toLowerCase())}</a>
      <span class="xp">${fmt(t.weeklyXp)}</span>
    </div>`).join('');

  document.getElementById('yesterday').innerHTML = `
    ${fmt(today.yesterday.pours)} pours. Best of the night by <a href="/regular.html?handle=quietbenji" class="amber" style="font-weight:bold">quietbenji</a>:
    <div class="yesterday-quote">“Asked for a laconic reply. Got 'k.'”</div>`;
}

// ── Your drinkware / sign-in ───────────────────────────────────────────────

function renderShowcase(me) {
  const rc = rarityColor(me.vessel.rarity);
  return el(`<section class="showcase" id="drinkware-showcase">
    <div style="text-align:center">
      <span class="showcase__eyebrow">YOUR COLLECTIBLE IS ON THE RACK</span>
      <h2 class="showcase__title">Your one-of-a-kind drinkware</h2>
      <p class="showcase__sub">This unique cup is tied to your Bluesky handle. Use each day's new word to earn XP and grow your streak, with your drinkware as a keepsake of your progress.</p>
    </div>
    <div class="stein-card">
      <div class="stein-card__art" style="border-color:${rc}">
        <span class="stein-card__rarity" style="background:${rc}">${esc(me.vessel.rarity.toUpperCase())}</span>
        ${vesselSVG(me.vessel, 150, 2.4)}
        <div class="stein-card__tier" style="color:${rc}">${esc(me.vessel.rarity)} tier</div>
      </div>
      <div class="stein-card__details">
        <div class="stein-card__namerow">
          <div class="stein-card__name">${esc(me.vessel.name)}</div>
          <span class="verified-chip">hash verified ✓</span>
        </div>
        <div class="stein-card__handle">@${esc(me.handle)}</div>
        <div class="attr-grid">
          ${me.vesselAttrs.map((a) => `<div class="attr"><div class="attr__k">${esc(a.k)}</div><div class="attr__v">${esc(a.v)}</div></div>`).join('')}
        </div>
        <div class="stein-card__stats">
          <span><b>${me.streak}</b> <span>day streak</span></span>
          <span><b>${fmt(me.xp)}</b> <span>XP</span></span>
          <span><b>${fmt(me.wordsPoured)}</b> <span>words poured</span></span>
        </div>
        <div class="stein-card__actions">
          <a class="btn" href="${composeIntent(`My Word Tavern drinkware: ${me.vessel.name} (${me.vessel.rarity}). Same handle, same cup — what's yours?`)}" target="_blank" rel="noopener">Share my ${me.vessel.typeName.toLowerCase()}</a>
          <a class="btn btn--ghost" href="/registry.html">Browse the collection</a>
        </div>
      </div>
    </div>
  </section>`);
}

function renderSigninCard() {
  return el(`<section class="showcase" id="drinkware-showcase">
    <div style="text-align:center">
      <span class="showcase__eyebrow">THERE'S A STOOL WITH YOUR NAME ON IT</span>
      <h2 class="showcase__title">Claim your collectible drinkware</h2>
      <p class="showcase__sub">Your Bluesky handle determines a unique cup and rarity to collect at the Word Tavern. Use the daily word in a public post to earn XP and build a streak while you grow your vocabulary.</p>
    </div>
    <div class="stein-card" style="justify-content:center">
      <div class="signin-card" style="flex:1;min-width:280px;border:none;box-shadow:none;padding:6px">
        <div>
          <b>Sign in to claim your drinkware</b>
          <p>No password — it's a mock sign-in for now. Type any Bluesky handle and the tavern does the rest.</p>
        </div>
        <button class="btn" onclick="document.getElementById('sign-in')?.click()">Sign in with Bluesky</button>
      </div>
    </div>
  </section>`);
}

// ── Rarity rack ────────────────────────────────────────────────────────────

function renderRarityRack() {
  return el(`<div>
    <div class="section-title">
      <h2>Rarity on the rack</h2>
      <p>Shape, glaze, trim and wear all come from your account hash.</p>
    </div>
    <div class="tier-grid">
      ${TIERS.map((t) => {
        const rc = rarityColor(t.name);
        const rbg = rarityBg(t.name);
        return `<div class="tier tier--${t.name}">
          <span class="tier__pct" style="color:${rc};background:${rbg}">${t.pct}</span>
          ${vesselSVG(t.v, 64, 1.8)}
          <div class="tier__name" style="color:${rc}">${t.name}</div>
          <div class="tier__mat">${t.mat}</div>
        </div>`;
      }).join('')}
    </div>
  </div>`);
}

init().catch((e) => {
  document.getElementById('main').innerHTML = `<p style="padding:40px 0;color:#B8324A">The tap jammed: ${esc(e.message)}</p>`;
});
