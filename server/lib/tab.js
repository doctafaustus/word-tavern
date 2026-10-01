'use strict';

const { getAuthorPosts } = require('./bluesky');
const { dayNumber, entryForDay, tavern } = require('./words');

async function buildTab(handle) {
  const { posts, source } = await getAuthorPosts(handle);
  const currentDay = dayNumber();
  const entriesByDay = new Map();

  for (const post of posts) {
    const day = dayNumber(new Date(post.at));
    if (day < 1 || day > currentDay) continue;

    const entry = entryForDay(day);
    if (!post.text.toLowerCase().includes(entry.word.toLowerCase())) continue;

    const likes = Number(post.likes) || 0;
    const xp = likes >= 100 ? 50 : 25;
    const current = entriesByDay.get(day);
    if (current && current.likes >= likes) continue;

    const postId = post.uri ? post.uri.split('/').pop() : null;
    entriesByDay.set(day, {
      day,
      date: entry.date,
      word: entry.word,
      definition: entry.definitions[0]?.text || '',
      xp,
      likes,
      url: postId ? `https://bsky.app/profile/${handle}/post/${postId}` : null,
    });
  }

  return {
    handle,
    entries: [...entriesByDay.values()].sort((a, b) => b.day - a.day),
    scannedPosts: posts.length,
    since: tavern.launchDate,
    source,
  };
}

module.exports = { buildTab };
