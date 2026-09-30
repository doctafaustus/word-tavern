'use strict';

const { specFor } = require('./vessels');
const { searchPosts } = require('./bluesky');

const seedPosts = require('../../data/seedposts.json');

// Split a post's text around the word of the day so the UI can highlight it.
function splitAround(text, word) {
  const i = text.toLowerCase().indexOf(word.toLowerCase());
  if (i === -1) return { pre: text, word: '', post: '' };
  return {
    pre: text.slice(0, i),
    word: text.slice(i, i + word.length),
    post: text.slice(i + word.length),
  };
}

function timeLabel(at) {
  if (!at) return '';
  const mins = Math.max(1, Math.round((Date.now() - new Date(at).getTime()) / 60000));
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

// XP rules (also written up on the House Rules page):
// +25 XP for using the word in a public post; a post with 100+ likes lands
// as a crit for +50 XP.
function xpFor(likes) {
  return likes >= 100 ? { xp: 50, crit: true } : { xp: 25, crit: false };
}

function decorate(p, wordEntry) {
  const spec = specFor(p.handle);
  const parts = p.text != null
    ? splitAround(p.text, wordEntry.word)
    : { pre: p.pre || '', word: p.word || '', post: p.post || '' };
  const { xp, crit } = xpFor(p.likes || 0);
  return {
    handle: p.handle,
    name: p.name || p.handle,
    time: p.time || timeLabel(p.at),
    at: p.at || null,
    pre: parts.pre,
    word: parts.word,
    post: parts.post,
    replies: p.replies || 0,
    reposts: p.reposts || 0,
    likes: p.likes || 0,
    xp,
    crit,
    vessel: spec,
    vesselLabel: `${spec.rarity} ${spec.typeName.toLowerCase()}`,
    link: p.uri ? `https://bsky.app/profile/${p.handle}/post/${p.uri.split('/').pop()}` : null,
    seeded: !p.uri,
  };
}

// The showcase posts in seedposts.json are for "mercurial" (day one of the
// site). Other days run on live Bluesky results alone.
function seedsFor(wordEntry) {
  if (wordEntry.word !== 'mercurial') return [];
  return seedPosts.map((p) => ({ ...p, uri: null }));
}

async function buildFeed(wordEntry, sort = 'newest') {
  const live = await searchPosts(wordEntry.word, sort === 'top' ? 'top' : 'latest');
  const seen = new Set();
  const posts = [];

  for (const p of seedsFor(wordEntry)) {
    posts.push(decorate(p, wordEntry));
    seen.add(p.handle);
  }
  for (const p of live.posts) {
    if (seen.has(p.handle)) continue;
    seen.add(p.handle);
    posts.push(decorate(p, wordEntry));
  }

  posts.sort((a, b) => (sort === 'top' ? b.likes - a.likes : 0));
  if (sort !== 'top') {
    posts.sort((a, b) => postedAt(b) - postedAt(a));
  }

  return { posts, source: live.source, blueskyError: live.error || null };
}

function postedAt(post) {
  const timestamp = post.at ? Date.parse(post.at) : NaN;
  if (Number.isFinite(timestamp)) return timestamp;
  return Date.now() - rankFromLabel(post.time) * 60000;
}

function rankFromLabel(label) {
  const n = parseInt(label, 10);
  if (/m$/.test(label)) return n;
  if (/h$/.test(label)) return n * 60;
  if (/d$/.test(label)) return n * 1440;
  return 9999;
}

module.exports = { buildFeed, splitAround };
