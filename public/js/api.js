// Tiny API + DOM helpers shared by every page.

export async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data.error) msg = data.error;
    } catch (_) { /* keep default */ }
    throw new Error(msg);
  }
  return res.json();
}

export function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export function fmt(n) {
  return Number(n).toLocaleString('en-US');
}

export function countdownText(targetIso) {
  const ms = new Date(targetIso).getTime() - Date.now();
  if (ms <= 0) return 'any moment now';
  const s = Math.floor(ms / 1000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(Math.floor(s / 3600))}h ${pad(Math.floor((s % 3600) / 60))}m ${pad(s % 60)}s`;
}

export function tickCountdown(node, targetIso) {
  const update = () => { node.textContent = countdownText(targetIso); };
  update();
  setInterval(update, 1000);
}

export const ICONS = {
  reply: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3 4h14v10H8l-4 3v-3H3z"/></svg>',
  repost: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><path d="M4 9V6h11l-3-3M16 11v3H5l3 3"/></svg>',
  like: '<svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 16.5s-6.5-3.9-6.5-8.6A3.4 3.4 0 0 1 10 6.2a3.4 3.4 0 0 1 6.5 1.7c0 4.7-6.5 8.6-6.5 8.6z"/></svg>',
  external: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 5H5v10h10v-3M11 5h4v4M13 7l-6.5 6.5"/></svg>',
};
