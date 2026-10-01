'use strict';

const crypto = require('crypto');
const { normalizeHandle, profileFor } = require('../lib/profile');

const quips = require('../../data/quips.json');

const COOKIE = 'wt_session';
const WEEK = 7 * 24 * 3600 * 1000;
const DEV_SESSION_SECRET = 'word-tavern-local-development-session-key';

function sessionSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  return process.env.NODE_ENV === 'development' ? DEV_SESSION_SECRET : null;
}

function quip(key) {
  const list = quips[key] || ['…'];
  return list[Math.floor(Math.random() * list.length)];
}

function readToken(req) {
  const header = req.headers.cookie || '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === COOKIE) {
      try {
        return decodeURIComponent(v.join('='));
      } catch (_) {
        return null;
      }
    }
  }
  return null;
}

function currentHandle(req) {
  const token = readToken(req);
  const secret = sessionSecret();
  if (!token || !secret) return null;

  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) return null;

  const expected = crypto.createHmac('sha256', secret).update(payload).digest();
  let supplied;
  try {
    supplied = Buffer.from(signature, 'base64url');
  } catch (_) {
    return null;
  }
  if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!Number.isFinite(session.exp) || session.exp <= Date.now()) return null;
    return normalizeHandle(session.handle);
  } catch (_) {
    return null;
  }
}

function attach(req, res, next) {
  req.handle = currentHandle(req);
  next();
}

function login(req, res) {
  const secret = sessionSecret();
  if (!secret) {
    return res.status(503).json({ ok: false, error: 'Configure SESSION_SECRET before enabling sign-in.' });
  }

  const handle = normalizeHandle(req.body && req.body.handle);
  if (!handle) {
    return res.status(400).json({ ok: false, error: 'That handle does not look right. Try something like wren.bsky.social.' });
  }
  const payload = Buffer.from(JSON.stringify({ handle, exp: Date.now() + WEEK })).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  const token = `${payload}.${signature}`;
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: WEEK,
    path: '/',
  });
  const profile = profileFor(handle);
  res.json({ ok: true, quip: quip('login'), me: profile });
}

function logout(req, res) {
  res.clearCookie(COOKIE, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
  res.json({ ok: true });
}

function me(req, res) {
  if (!req.handle) return res.json({ loggedIn: false, quip: quip('login') });
  res.json({ loggedIn: true, me: profileFor(req.handle), quip: quip('login') });
}

module.exports = { login, logout, me, attach };
