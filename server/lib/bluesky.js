'use strict';

// Live Tap Feed data comes straight from Bluesky's public API — no login
// needed to read it. Results are cached for ~10 minutes (memory first, then
// a disk file, so server restarts within the window don't re-hit the API).

const fs = require('fs');
const path = require('path');
const { dayNumber } = require('./words');

const TTL = 10 * 60 * 1000;
// Bluesky runs two public appviews; try each before giving up.
const APIS = [
  'https://api.bsky.app/xrpc/app.bsky.feed.searchPosts',
  'https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts',
];
const CACHE_DIR = path.join(__dirname, '..', '..', 'data-cache');
const memory = new Map(); // word -> { fetchedAt, posts }

function cachePath(key) {
  return path.join(CACHE_DIR, `feed-${key.toLowerCase().replace(/[^a-z0-9]+/g, '_')}-day${dayNumber()}.json`);
}

function fresh(entry) {
  return entry && Date.now() - entry.fetchedAt < TTL;
}

async function fetchFromBluesky(word, sort) {
  let lastErr = null;
  for (const api of APIS) {
    try {
      return await fetchOnce(api, word, sort);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('Bluesky unreachable');
}

async function fetchOnce(api, word, sort) {
  const url = `${api}?q=${encodeURIComponent(word)}&sort=${sort}&limit=25`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(`Bluesky responded ${res.status}`);
    const data = await res.json();
    return (data.posts || []).map((p) => ({
      uri: p.uri,
      handle: p.author && p.author.handle,
      name: (p.author && p.author.displayName) || (p.author && p.author.handle) || 'unknown',
      text: p.record && p.record.text ? p.record.text : '',
      replies: p.replyCount || 0,
      reposts: p.repostCount || 0,
      likes: p.likeCount || 0,
      at: (p.record && p.record.createdAt) || p.indexedAt || null,
    })).filter((p) => p.handle && p.text);
  } finally {
    clearTimeout(timer);
  }
}

function readDiskCache(word) {
  try {
    const raw = fs.readFileSync(cachePath(word), 'utf8');
    const entry = JSON.parse(raw);
    if (fresh(entry)) return entry;
  } catch (_) { /* missing or stale */ }
  return null;
}

function writeDiskCache(word, entry) {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(cachePath(word), JSON.stringify(entry));
  } catch (_) { /* cache is best-effort */ }
}

async function searchPosts(word, sort = 'top', force = false) {
  const key = `${word}:${sort}`;
  let entry = force ? null : memory.get(key);
  if (!force && fresh(entry)) return { posts: entry.posts, source: 'live-cache' };

  if (!force) entry = readDiskCache(key);
  if (!force && fresh(entry)) {
    memory.set(key, entry);
    return { posts: entry.posts, source: 'live-cache' };
  }

  try {
    const posts = await fetchFromBluesky(word, sort);
    entry = { fetchedAt: Date.now(), posts };
    memory.set(key, entry);
    writeDiskCache(key, entry);
    return { posts, source: 'live' };
  } catch (err) {
    const stale = entry || memory.get(key) || readAnyDisk(key);
    if (stale && stale.posts.length) {
      return { posts: stale.posts, source: 'stale' };
    }
    return { posts: [], source: 'offline', error: err.message };
  }
}

function readAnyDisk(word) {
  try {
    return JSON.parse(fs.readFileSync(cachePath(word), 'utf8'));
  } catch (_) { return null; }
}

module.exports = { searchPosts, TTL };
