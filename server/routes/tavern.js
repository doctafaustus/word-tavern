'use strict';

const express = require('express');
const words = require('../lib/words');
const { buildFeed } = require('../lib/feed');
const { searchPosts } = require('../lib/bluesky');
const { profileFor, leaderboard } = require('../lib/profile');
const { specFor } = require('../lib/vessels');
const { timingSafeEqual } = require('crypto');

const regulars = require('../../data/regulars.json');
const quips = require('../../data/quips.json');

const router = express.Router();

function quip(key) {
  const list = quips[key] || ['…'];
  return list[Math.floor(Math.random() * list.length)];
}

router.get('/today', async (req, res) => {
  const t = words.today();
  const y = words.yesterday();
  const feed = await buildFeed(t, 'top').catch(() => ({ posts: [], source: 'offline' }));
  res.json({
    day: t.day,
    word: t,
    yesterday: { day: y.day, word: y.word, pours: 180 + ((y.day * 2654435761) >>> 0) % 420 },
    poured: 340 + feed.posts.length,
    nextPourAt: words.nextPourAt(),
    quest: { text: `Use ${t.word} in a Bluesky post today`, xp: 25 },
    board: {
      tavern: words.tavern.name,
      vesselsMinted: words.tavern.vesselsMinted,
      stats: stats(),
      quip: quip('header'),
    },
  });
});

router.get('/feed', async (req, res) => {
  const sort = req.query.sort === 'top' ? 'top' : 'newest';
  const t = words.today();
  const feed = await buildFeed(t, sort).catch((err) => {
    console.error('feed build failed:', err.message);
    return { posts: [], source: 'offline' };
  });
  res.json({
    word: t.word,
    sort,
    source: feed.source,
    pending: 2 + (Math.floor(Date.now() / 60000) % 5),
    posts: feed.posts,
  });
});

router.post('/admin/refresh-feed', async (req, res) => {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) {
    return res.status(503).json({ error: 'Admin refresh is disabled. Configure ADMIN_SECRET on the server.' });
  }

  const suppliedSecret = Buffer.from(req.get('x-admin-secret') || '');
  const expectedSecret = Buffer.from(adminSecret);
  if (suppliedSecret.length !== expectedSecret.length || !timingSafeEqual(suppliedSecret, expectedSecret)) {
    return res.status(401).json({ error: 'Invalid admin secret.' });
  }

  const t = words.today();
  const [newest, top] = await Promise.all([
    searchPosts(t.word, 'latest', true),
    searchPosts(t.word, 'top', true),
  ]);
  const results = { newest: newest.source, top: top.source };
  if (newest.source !== 'live' || top.source !== 'live') {
    console.error('admin feed refresh incomplete:', results);
    return res.status(502).json({ error: 'Bluesky could not refresh both feed caches.', results });
  }

  res.json({
    word: t.word,
    refreshedAt: new Date().toISOString(),
    counts: { newest: newest.posts.length, top: top.posts.length },
  });
});

router.get('/online', (req, res) => {
  const minute = Math.floor(Date.now() / 60000);
  const list = regulars.map((r) => {
    const spec = specFor(r.handle);
    return { handle: r.handle, name: r.name.split(' ')[0], rarity: spec.rarity, vessel: spec };
  });
  res.json({
    count: 1284 + [0, 2, 1, 4, 3, 6, 5, 7][minute % 8],
    guests: 1102,
    mostEver: words.tavern.mostEver,
    list,
  });
});

router.get('/leaderboard', (req, res) => {
  res.json({
    topTab: leaderboard('weekly').slice(0, 8),
    streaks: leaderboard('streak').slice(0, 8),
    pours: leaderboard('pours').slice(0, 8),
  });
});

router.get('/stats', (req, res) => {
  res.json(stats());
});

function stats() {
  return {
    day: words.dayNumber(),
    wordsServed: words.dayNumber(),
    postsCounted: words.tavern.postsCounted.toLocaleString('en-US'),
    regulars: words.tavern.regularsTotal.toLocaleString('en-US'),
    vesselsMinted: words.tavern.vesselsMinted.toLocaleString('en-US'),
    newestRegular: words.tavern.newestRegular,
    est: words.tavern.launchDate.slice(0, 4),
  };
}

router.get('/bartender', (req, res) => res.json({ quip: quip('board') }));

router.get('/quips', (req, res) => res.json({ rules: quips.rules || [], board: quips.board || [] }));

module.exports = router;
