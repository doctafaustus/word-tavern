# Copilot instructions

## Build, run, and validate

- `npm run dev` starts the Express server, watches/compiles Sass, and reloads the browser. Open <http://localhost:3000/>; BrowserSync proxies the server on port 3001.
- `npm start` runs the app directly on port 3000 (or `PORT` if set).
- `npm run build:css` compiles `scss/main.scss` to `public/css/main.css`.
- `npm run watch:css` watches and recompiles the Sass entry point.
- There is no configured test runner, test script, or lint script in `package.json`, so there is no single-test command.

For the admin feed-refresh panel, set `ADMIN_SECRET` in a root `.env` file. The server loads it with dotenv; `.env` files are Git-ignored and must not be committed.

## Architecture

Word Tavern is a small Express application serving a static, multi-page browser app. `server/index.js` mounts the JSON API routers under `/api`, serves files from `public/`, and adds the development-only HTML reload route. Each page is a standalone HTML document whose native ES-module entry point lives in `public/js/pages/`; there is no JavaScript bundler or front-end framework.

The browser pages call the API for their content. `public/js/api.js` provides shared fetch, escaping, and DOM helpers, while `public/js/chrome.js` mounts the common navigation, account controls, board bar, and footer. Server-side route handlers in `server/routes/` use domain helpers in `server/lib/` and return JSON.

The JSON files in `data/` are the app's content and seeded player data. `server/lib/words.js` derives the current board day from `data/tavern.json`'s launch date using UTC day arithmetic, and selects that day's entry from `data/words.json`. `server/lib/feed.js` decorates results from the public Bluesky API with app-specific profile and XP data; `server/lib/bluesky.js` caches responses in memory and in the ignored `data-cache/` directory, with stale/offline fallbacks. `data/seedposts.json` supplies the initial showcase feed for the first word.

Styles are authored in `scss/`: `main.scss` imports the tokens, base, component, and page partials, and Sass writes the served stylesheet to `public/css/main.css`.

## Product context

Word Tavern is intended to be a free-to-start word-of-the-day game played through real Bluesky posts: players use the daily vocabulary word to earn XP and promote the game, and can team up against weekly community bosses where posts deal damage and likes add bonus hits. Each account is meant to claim a unique spellbook or drink vessel derived from its identity; rarity-tier loot, stratagems, and cosmetic skins are part of the planned progression and monetization, with community growth through Bluesky and a subreddit preceding monetization.

Keep product direction separate from shipped behavior. The current code generates vessels deterministically from normalized handles, accepts a handle in its app login flow rather than performing Bluesky OAuth, searches public Bluesky posts for the current word, and displays seeded XP/profile data. Boss battles and the broader rewards and monetization systems are not implemented here yet.

## Repository conventions

- Keep the server in CommonJS modules and browser code in native ES modules. Add API endpoints to the relevant router under `server/routes/`; routers are mounted centrally in `server/index.js`.
- Keep app content and seeded records in the existing JSON files under `data/`. Keep generated feed cache files in `data-cache/`, not in source data.
- New browser pages should follow the existing pattern: a `public/*.html` shell loads a `public/js/pages/*.js` module, uses shared `api`/`chrome` helpers, and fetches page data from `/api`.
- Use `esc` for untrusted values inserted into HTML templates; use `textContent` when rendering plain text. Use the shared `el` helper for creating DOM from templates.
- Put shared page styles in the existing SCSS partials and preserve the `scss/main.scss` import/build path so the served CSS stays in sync.
