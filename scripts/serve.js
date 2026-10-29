// Local dev server: same behaviour as the Vercel deploy. Runs build_pages.mjs, serves site/ with real paths
// (/sports/31475 -> site/sports/31475/index.html, anything unknown -> index.html) and api/*.js functions.
// Usage: node scripts/serve.js   (PORT=8000 by default)
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'site');
const API = path.join(__dirname, '..', 'api');
require('child_process').execFileSync(process.execPath, [path.join(__dirname, 'build_pages.mjs')], { stdio: 'inherit' });

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.webp': 'image/webp' };

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.startsWith('/api/')) {
    const fn = path.join(API, url.pathname.slice(5).replace(/[^\w-]/g, '') + '.js');
    if (fs.existsSync(fn)) return require(fn)(req, res);
  }
  let file = path.join(ROOT, decodeURIComponent(url.pathname));
  if (!file.startsWith(ROOT)) { res.statusCode = 403; return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) file = path.join(ROOT, 'index.html');
  res.setHeader('Content-Type', TYPES[path.extname(file)] || 'application/octet-stream');
  res.setHeader('Cache-Control', 'no-cache');
  fs.createReadStream(file).pipe(res);
}).listen(process.env.PORT || 8000, () => console.log(`Showtime on http://localhost:${process.env.PORT || 8000}`));
