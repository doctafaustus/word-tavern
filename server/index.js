'use strict';

require('dotenv').config();

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const auth = require('./routes/auth');
const tavern = require('./routes/tavern');
const people = require('./routes/people');
const archive = require('./routes/archive');
const vessels = require('./routes/vessels');

const app = express();
const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, '..', 'public');

function publicRevision(directory = publicDir, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      publicRevision(filePath, files);
    } else if (/\.(?:html|js|css)$/i.test(entry.name)) {
      const contentHash = crypto.createHash('sha1').update(fs.readFileSync(filePath)).digest('hex');
      files.push(`${path.relative(publicDir, filePath)}:${contentHash}`);
    }
  }
  return files;
}

app.disable('x-powered-by');
app.use(express.json());
app.use(auth.attach);

app.use('/api', tavern);
app.use('/api', people);
app.use('/api', archive);
app.use('/api', vessels);
app.post('/api/auth/login', auth.login);
app.post('/api/auth/logout', auth.logout);
app.get('/api/auth/me', auth.me);

if (process.env.NODE_ENV === 'development') {
  app.get('/__dev/revision', (req, res) => {
    const revision = crypto.createHash('sha1').update(publicRevision().sort().join('\n')).digest('hex');
    res.set('Cache-Control', 'no-store').send(revision);
  });

  app.get('*', (req, res, next) => {
    const requestedPath = req.path === '/' ? 'index.html' : decodeURIComponent(req.path.slice(1));
    const htmlPath = path.extname(requestedPath) ? requestedPath : `${requestedPath}.html`;
    const filePath = path.resolve(publicDir, htmlPath);
    if (path.extname(filePath).toLowerCase() !== '.html'
      || !filePath.startsWith(`${publicDir}${path.sep}`)) {
      return next();
    }

    fs.readFile(filePath, 'utf8', (error, html) => {
      if (error) {
        return error.code === 'ENOENT' ? next() : next(error);
      }
      const reloadScript = '<script src="/js/dev-reload.js"></script>';
      res.type('html').send(html.replace(/<\/body>/i, `${reloadScript}</body>`));
    });
  });
}

app.use(express.static(publicDir, { extensions: ['html'] }));

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'The tap jammed. Try again in a moment.' });
});

app.listen(PORT, () => {
  console.log(`Word Tavern is pouring on http://localhost:${PORT}`);
});
