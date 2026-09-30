'use strict';

const express = require('express');
const { normalizeHandle, profileFor, regulars } = require('../lib/profile');
const { specFor } = require('../lib/vessels');

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

module.exports = router;
