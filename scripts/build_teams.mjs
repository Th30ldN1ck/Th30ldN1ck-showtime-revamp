// Club badges for the now-app sport pages' Teams row. The NOW sport feed has no team data, only match titles, and those
// are in Thai; its English twin (same event ids) gives each side's English name, which TheSportsDB can look up. Badges
// are downloaded once into site/now-app/img/teams/ with site/now-app/teams.json (Thai name -> English name, badge
// file), so the page never calls TheSportsDB itself. Its free key rate-limits bursts, so lookups are spaced out.
// Run: node scripts/build_teams.mjs   (re-run to add teams from new fixtures; existing ones are kept)
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const FEED = lang => `https://tvs.dmpcdn.com/tvapp/v1/th/sport_category_adult_${lang}.json`;
const LEAGUES = /live upcoming (ucl|laliga|calcio serie a|scottish premiership)/i;
const OUT = new URL('../site/now-app/img/teams/', import.meta.url), MAP = new URL('../site/now-app/teams.json', import.meta.url);
const API = 'https://www.thesportsdb.com/api/v1/json/123/searchteams.php?t=';
// feed short names TheSportsDB doesn't know as written
const ALIAS = { 'Man City': 'Manchester City', 'Man Utd': 'Manchester United', 'Man United': 'Manchester United', Leipzig: 'RB Leipzig',
  PSG: 'Paris SG', 'Atl. Madrid': 'Atletico Madrid', 'Atletico Madrid': 'Atletico Madrid', Inter: 'Inter Milan', 'Bodo/Glimt': 'Bodo Glimt',
  Sporting: 'Sporting CP', 'Club Brugge': 'Club Brugge', 'Slavia Prague': 'Slavia Praha', 'Slovan Bratislava': 'Slovan Bratislava',
  'Athletic Bilbao': 'Athletic Bilbao', 'Racing de Santander': 'Racing Santander', 'Sabah FK': 'Sabah', 'Viking FK': 'Viking', 'LASK': 'LASK Linz', Dortmund: 'Borussia Dortmund', Bayern: 'Bayern Munich', Lille: 'Lille OSC', 'Heart of Midlothian': 'Hearts', 'St. Johnstone': 'St Johnstone', 'Union Saint-Gilloise': 'Union SG' };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const sides = t => { const m = t.match(/^(.+?)\s?:\s(.+)$/), rest = m ? m[2] : t, s = rest.split(/\s+(?:vs\.?|v\.?|พบ)\s+/i); return s.length === 2 ? s.map(x => x.trim()) : null; };
const slug = s => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const [th, en] = await Promise.all(['th', 'en'].map(l => fetch(FEED(l)).then(r => r.json())));
const enTitle = new Map(en.flatMap(s => (s.items || []).map(e => [e.data?.id, e.data?.title])));
const pairs = new Map();   // Thai name -> English name
for (const s of th) {
  if (!LEAGUES.test(s.name || '')) continue;
  for (const e of s.items || []) {
    const a = sides(e.data?.title || ''), b = sides(enTitle.get(e.data?.id) || '');
    if (a && b) a.forEach((n, i) => pairs.set(n, b[i]));
  }
}
// the clubs in past matches too: each league's replay series (full matches, highlights) lists its matches as episodes on
// the NOW website, in Thai at /th/content/<id> and in English at /en/content/<id> (same episode ids)
const payloadArray = (html, key) => { const m = `\\"${key}\\":`, at = html.indexOf(m); if (at < 0) return []; const from = at + m.length;
  for (let i = from, d = 0; i < html.length; i++) { if (html[i] === '[') d++; else if (html[i] === ']' && --d === 0) return JSON.parse(JSON.parse(`"${html.slice(from, i + 1)}"`)); } return []; };
const epTitles = async (id, lang) => new Map(payloadArray(await (await fetch(`https://now.truevisions.co.th/${lang}/content/${id}`, { headers: { 'user-agent': 'Mozilla/5.0' } })).text(), 'vod_items')
  .flatMap(s => (s.vod_items || []).map(e => [e.id, (e.title || '').replace(/\s*\(.*$/, '').trim()])));
const LEAGUE_VOD = /แชมเปียนส์ ลีก|ลาลิกา|ลา ?ลีกา|เซเรีย|สกอตติช/;
const series = th.filter(s => (s.style || {}).type === 'base_shelf' && /football/i.test(s.name || '')).flatMap(s => (s.items || []).map(e => e.data))
  .filter(d => d && LEAGUE_VOD.test(d.title || ''));
for (const d of series) {
  const [a, b] = await Promise.all([epTitles(d.id, 'th'), epTitles(d.id, 'en')]);
  for (const [id, t] of a) { const x = sides(t), y = sides(b.get(id) || ''); if (x && y) x.forEach((n, i) => pairs.has(n) || pairs.set(n, y[i])); }
}
console.log(`${pairs.size} teams from fixtures and ${series.length} replay series`);
const map = JSON.parse(await readFile(MAP, 'utf8').catch(() => '{}'));
await mkdir(OUT, { recursive: true });
let found = 0, missed = [];
for (const [thName, enName] of pairs) {
  if (map[thName]?.badge) continue;
  let team;
  for (const q of [...new Set([ALIAS[enName], enName])].filter(Boolean)) {
    for (let tries = 0; tries < 3; tries++) {
      const res = await fetch(API + encodeURIComponent(q));
      const text = await res.text();
      await sleep(2500);
      if (text.startsWith('error') || !res.ok) { await sleep(20000); continue; }   // rate limited: back off and retry
      team = (JSON.parse(text).teams || []).find(t => t.strSport === 'Soccer' && t.strBadge);
      break;
    }
    if (team) break;
  }
  if (!team) { missed.push(enName); map[thName] = { en: enName }; continue; }
  const file = `${slug(enName)}.png`, img = await fetch(`${team.strBadge}/small`);
  if (img.ok) { await writeFile(new URL(file, OUT), Buffer.from(await img.arrayBuffer())); map[thName] = { en: enName, badge: file }; found++; }
  else { missed.push(enName); map[thName] = { en: enName }; }
  console.log(`${thName} -> ${enName}: ${map[thName].badge || 'no badge'}`);
}
await writeFile(MAP, JSON.stringify(map, null, 1) + '\n');
console.log(`${pairs.size} teams, ${found} new badges; no badge: ${missed.join(', ') || 'none'}`);
