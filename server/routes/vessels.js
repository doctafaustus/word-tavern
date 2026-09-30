'use strict';

const express = require('express');
const { normalizeHandle } = require('../lib/profile');
const { specFor, attrsFor, TYPE_NAMES } = require('../lib/vessels');

const router = express.Router();

router.get('/vessel/:handle', (req, res) => {
  const handle = normalizeHandle(req.params.handle);
  if (!handle) return res.status(400).json({ error: 'Bad handle' });
  const spec = specFor(handle);
  res.json({ handle, vessel: spec, attrs: attrsFor(spec) });
});

router.get('/vessel-types', (req, res) => {
  res.json({ types: Object.entries(TYPE_NAMES).map(([type, name]) => ({ type, name })) });
});

module.exports = router;
