'use strict';

const express = require('express');
const words = require('../lib/words');

const router = express.Router();

router.get('/archive', (req, res) => {
  res.json({ list: words.archive() });
});

router.get('/archive/:day', (req, res) => {
  const day = parseInt(req.params.day, 10);
  if (!Number.isInteger(day) || day < 1 || day > words.dayNumber()) {
    return res.status(404).json({ error: 'No such day on the board.' });
  }
  const entry = words.entryForDay(day);
  const h = (day * 2654435761) >>> 0;
  res.json({
    entry,
    pours: 180 + (h % 420),
  });
});

module.exports = router;
