# Word Tavern

## Local development

Run `npm run dev` to start the app with server restart, Sass compilation, and
full-page browser reload. Open <http://localhost:3000/>. Changes to files under
`public/` refresh the browser; changes to SCSS rebuild the CSS and then refresh
the page automatically. Stop all dev watchers with Ctrl+C.

## Admin feed refresh

The bottom-right admin panel can force-refresh today's Bluesky feed caches. Set
`ADMIN_SECRET` in a root-level `.env` file, then enter the same value in the
panel. On first setup, generate a strong secret and start the app:

`.env` contents:

```text
ADMIN_SECRET=your-long-random-secret
```

```sh
npm start
```

The server loads `.env` automatically at startup. All `.env` files are ignored
by Git; do not force-add or publish them. Use HTTPS when operating the panel
against a remotely hosted server.
