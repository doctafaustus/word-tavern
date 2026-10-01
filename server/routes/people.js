'use strict';

const express = require('express');
const { normalizeHandle, profileFor, regulars } = require('../lib/profile');
const { specFor } = require('../lib/vessels');
const { buildTab } = require('../lib/tab');

const router = express.Router();

router.get('/regulars', (req, res) => {
  res.json({
    list: regulars.map((r) => {
      const spec = specFor(r.handle);
      return {
        handle: r.handle,
        name: r.name,
        joined: r.joined,
        streak: r.streak,
        xp: r.xp,
        wordsPoured: r.wordsPoured,
        vessel: spec,
      };
    }),
  });
});

router.get('/regulars/:handle', (req, res) => {
  const handle = normalizeHandle(req.params.handle);
  if (!handle) return res.status(400).json({ error: 'Bad handle' });
  res.json({ profile: profileFor(handle) });
});

router.get('/my-tab', async (req, res) => {
  if (!req.handle) return res.status(401).json({ error: 'Sign in with Bluesky to view your tab.' });
  try {
    res.json(await buildTab(req.handle));
  } catch (error) {
    console.error('my tab could not load Bluesky history:', error.message);
    res.status(502).json({ error: 'Could not load your public Bluesky post history. Try again shortly.' });
  }
});

module.exports = router;
