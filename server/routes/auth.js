'use strict';

const crypto = require('crypto');
const { normalizeHandle, profileFor } = require('../lib/profile');

const quips = require('../../data/quips.json');

const sessions = new Map(); // token -> handle
const COOKIE = 'wt_session';
const WEEK = 7 * 24 * 3600 * 1000;

function quip(key) {
  const list = quips[key] || ['…'];
  return list[Math.floor(Math.random() * list.length)];
}

function readToken(req) {
  const header = req.headers.cookie || '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === COOKIE) return decodeURIComponent(v.join('='));
  }
  return null;
}

function currentHandle(req) {
  const token = readToken(req);
  return token && sessions.has(token) ? sessions.get(token) : null;
}

function attach(req, res, next) {
  req.handle = currentHandle(req);
  next();
}

function login(req, res) {
  const handle = normalizeHandle(req.body && req.body.handle);
  if (!handle) {
    return res.status(400).json({ ok: false, error: 'That handle does not look right. Try something like wren.bsky.social.' });
  }
  const token = crypto.randomBytes(18).toString('hex');
  sessions.set(token, handle);
  res.cookie(COOKIE, token, { httpOnly: true, sameSite: 'lax', maxAge: WEEK, path: '/' });
  const profile = profileFor(handle);
  res.json({ ok: true, quip: quip('login'), me: profile });
}

function logout(req, res) {
  const token = readToken(req);
  if (token) sessions.delete(token);
  res.clearCookie(COOKIE, { path: '/' });
  res.json({ ok: true });
}

function me(req, res) {
  if (!req.handle) return res.json({ loggedIn: false, quip: quip('login') });
  res.json({ loggedIn: true, me: profileFor(req.handle), quip: quip('login') });
}

module.exports = { login, logout, me, attach };
