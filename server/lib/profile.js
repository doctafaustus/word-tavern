'use strict';

const regulars = require('../../data/regulars.json');
const { specFor, attrsFor } = require('./vessels');

// Accept "wren", "@wren" or "wren.bsky.social" and normalize to a full
// handle the way Bluesky users type it.
function normalizeHandle(input) {
  let h = String(input || '').trim().toLowerCase().replace(/^@/, '');
  if (!h) return null;
  if (!/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/.test(h)) return null;
  if (!h.includes('.')) h += '.bsky.social';
  return h;
}

// A player is "seeded" (one of our regulars, with authored stats) or brand
// new. Vessel always comes from the handle hash.
function profileFor(handle) {
  const seed = regulars.find((r) => r.handle === handle);
  const spec = specFor(handle);
  const profile = {
    handle,
    name: seed ? seed.name : handle.split('.')[0],
    seeded: Boolean(seed),
    vessel: spec,
    vesselAttrs: attrsFor(spec),
    joined: seed ? seed.joined : new Date().toISOString().slice(0, 10),
    streak: seed ? seed.streak : 0,
    xp: seed ? seed.xp : 0,
    wordsPoured: seed ? seed.wordsPoured : 0,
    weeklyXp: seed ? seed.weeklyXp : 0,
    tab: seed ? seed.tab : [],
  };
  return profile;
}

function leaderboard(kind) {
  const rows = regulars.map((r) => {
    const spec = specFor(r.handle);
    return {
      handle: r.handle,
      name: r.name,
      xp: r.xp,
      weeklyXp: r.weeklyXp,
      streak: r.streak,
      wordsPoured: r.wordsPoured,
      vessel: { type: spec.type, rarity: spec.rarity, name: spec.name },
    };
  });
  const key = kind === 'streak' ? 'streak' : kind === 'pours' ? 'wordsPoured' : 'weeklyXp';
  return rows.sort((a, b) => b[key] - a[key]);
}

module.exports = { normalizeHandle, profileFor, leaderboard, regulars };
