'use strict';

const words = require('../../data/words.json');
const tavern = require('../../data/tavern.json');

const DAY_MS = 86400000;

function launchDate() {
  const [y, m, d] = tavern.launchDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

// Board day number for a date: launch day = #1. UTC arithmetic so DST
// never produces two "days" or a skipped one.
function dayNumber(date = new Date()) {
  const utc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor((utc - launchDate().getTime()) / DAY_MS) + 1;
}

function entryForDay(n) {
  const entry = words[(n - 1) % words.length];
  const dayMs = launchDate().getTime() + (n - 1) * DAY_MS;
  const date = new Date(dayMs);
  return {
    day: n,
    date: date.toISOString().slice(0, 10),
    dateLabel: date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }),
    ...entry,
  };
}

function today() {
  return entryForDay(dayNumber());
}

function yesterday() {
  return entryForDay(dayNumber() - 1);
}

// Next local midnight — the "next pour" / "last call" countdown target.
function nextPourAt() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0).toISOString();
}

// Full archive from launch through today. Stable pseudo-random pour counts
// per day, so refreshes don't make the numbers dance.
function archive() {
  const n = dayNumber();
  const out = [];
  for (let day = 1; day <= n; day++) {
    const e = entryForDay(day);
    const h = (day * 2654435761) >>> 0;
    out.push({
      day: e.day,
      date: e.date,
      dateLabel: e.dateLabel,
      word: e.word,
      pos: e.pos,
      short: e.definitions[0].text.length > 90 ? e.definitions[0].text.slice(0, 87) + '…' : e.definitions[0].text,
      pours: 180 + (h % 420),
    });
  }
  return out.reverse();
}

module.exports = { dayNumber, today, yesterday, nextPourAt, archive, entryForDay, tavern };
