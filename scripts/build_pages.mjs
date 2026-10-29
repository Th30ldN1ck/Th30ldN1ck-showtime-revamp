// Deploy-time build (Vercel runs it; scripts/serve.js runs it locally). Node only, no dependencies.
//
// From site/data/index.json (written by build_data.py) it writes:
//   site/data/list.json      – what the browser loads: no summaries except the newest SUMMARY_N, image paths
//                              without the shared host prefix. About a third of index.json's size.
//   site/data/meta/<c>.json  – full summary per article, loaded with the article's body chunk
//   site/<path>/index.html   – a copy of index.html per section, show hub and article, with that page's
//                              title and share-preview tags (LINE/Facebook/X don't run the page's JS)
// All of these are generated: they're git-ignored and rebuilt on every deploy.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'site');
const ORIGIN = process.env.SITE_URL
  || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'https://showtime-revamp.vercel.app');
const IMG = 'https://www.truevisions.co.th/static/';
const SUMMARY_N = 400;

// Names only; the full section/show config lives in site/app.js.
const SECTIONS = {
  sports: ['Sports', 'ข่าวกีฬา ผลบอล พรีวิวก่อนเกม', { football: 'Football', racing: 'Racing', tennis: 'Tennis', badminton: 'Badminton', more: 'กีฬาอื่นๆ' }],
  'movies-series': ['Movies & Series', 'หนังและซีรีส์ใหม่บน TrueVisions NOW', { series: 'Series', movies: 'Movies' }],
  shows: ['Shows', 'รายการโชว์ เรียลลิตี้ และข่าวบันเทิง', { entertainment: 'บันเทิง' }],
  kids: ['Kids', 'การ์ตูนและรายการเด็ก', {}],
  knowledge: ['Knowledge', 'สารคดี ความรู้ และข่าว', { knowledge: 'Knowledge', news: 'News' }],
};
const SHOWS = {
  'the-voice': ['The Voice Thailand 2026', '80vMxY9qaaAE'],
  agt: ["America's Got Talent", '2E9VKzwNPW3Q'],
  'true-af-2026': ['True AF 2026', 'ad5yoYRkyK8d'],
};
const SITE_NAME = 'Showtime | TrueVisions NOW';
const SITE_DESC = 'ข่าวกีฬา หนัง ซีรีส์ และรายการโชว์ จาก TrueVisions';

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const write = (f, s) => { fs.mkdirSync(path.dirname(path.join(ROOT, f)), { recursive: true }); fs.writeFileSync(path.join(ROOT, f), s); };
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const index = JSON.parse(read('data/index.json'));
const titles = (() => { try { return JSON.parse(read('data/titles.json')).titles; } catch { return {}; } })();

write('data/list.json', JSON.stringify(index.map((a, i) => {
  const o = { id: a.id, t: a.t, sec: a.sec, sub: a.sub, d: a.d, c: a.c };
  if (a.img) o.img = a.img.startsWith(IMG) ? a.img.slice(IMG.length) : a.img;
  if (i < SUMMARY_N && a.s) o.s = a.s;
  if (a.rec) o.rec = 1;
  return o;
})));
const meta = {};
for (const a of index) (meta[a.c] ||= {})[a.id] = { s: a.s || '' };
for (const [c, m] of Object.entries(meta)) write(`data/meta/${c}.json`, JSON.stringify(m));

const template = read('index.html');
const START = '<!-- page-meta -->', END = '<!-- /page-meta -->';
if (!template.includes(START) || !template.includes(END)) throw new Error('index.html is missing the page-meta markers');
const page = ({ url, title, desc, img, type = 'website' }) => {
  const full = title ? `${title} | Showtime` : SITE_NAME;
  const tags = [
    `<title>${esc(full)}</title>`,
    `<meta name="description" content="${esc(desc || SITE_DESC)}">`,
    `<link rel="canonical" href="${ORIGIN}${url}">`,
    `<meta property="og:site_name" content="Showtime · TrueVisions NOW">`,
    `<meta property="og:type" content="${type}">`,
    `<meta property="og:url" content="${ORIGIN}${url}">`,
    `<meta property="og:title" content="${esc(title || SITE_NAME)}">`,
    `<meta property="og:description" content="${esc(desc || SITE_DESC)}">`,
    img && `<meta property="og:image" content="${esc(img)}">`,
    `<meta name="twitter:card" content="${img ? 'summary_large_image' : 'summary'}">`,
  ].filter(Boolean).join('\n');
  const html = template.slice(0, template.indexOf(START) + START.length) + '\n' + tags + '\n' + template.slice(template.indexOf(END));
  return html;
};

for (const sec of Object.keys(SECTIONS)) fs.rmSync(path.join(ROOT, sec), { recursive: true, force: true });
let n = 0;
const out = (url, p) => { write(`${url.slice(1)}/index.html`, page({ url, ...p })); n++; };
const newestImg = list => { const a = list.find(x => x.img); return a && a.img; };
for (const [sec, [name, desc, subs]] of Object.entries(SECTIONS)) {
  const inSec = index.filter(a => a.sec === sec);
  out(`/${sec}`, { title: name, desc, img: newestImg(inSec) });
  for (const [sub, subName] of Object.entries(subs)) out(`/${sec}/${sub}`, { title: `${subName} · ${name}`, desc, img: newestImg(inSec.filter(a => a.sub === sub)) });
}
for (const [key, [name, now]] of Object.entries(SHOWS)) {
  out(`/shows/${key}`, { title: name, desc: `ข่าวและไฮไลต์ ${name} บน Showtime`, img: titles[now]?.img || newestImg(index.filter(a => a.sub === key)) });
}
for (const a of index) out(`/${a.sec}/${a.id}`, { title: a.t, desc: a.s, img: a.img, type: 'article' });
// the home page (and /search) is index.html itself, with the site-wide tags already in its page-meta block
console.log(`build_pages: list.json + ${Object.keys(meta).length} meta chunks + ${n} pages (${ORIGIN})`);
