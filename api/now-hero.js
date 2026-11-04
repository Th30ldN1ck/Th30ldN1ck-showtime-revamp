// Hero slides for the /now-app/ mock's new look, from TMDB's trending titles this week: textless poster, the title's
// own logo (Thai first, then English), rank, rating, year and Thai genre. Only titles that have both a textless poster
// and a logo are used, so every card can carry the big logo. Runs as a Vercel function (and through scripts/serve.js):
// the TMDB key stays server-side in the TMDB_API_KEY environment variable. No key or a TMDB error -> [] and the mock
// falls back to the NOW feed's hero.
const API = 'https://api.themoviedb.org/3';
const IMG = 'https://image.tmdb.org/t/p';
const MAX = 8;
// Netflix titles are left out: Netflix (TMDB provider 8) streaming in TH or US, or a Netflix-network (213) series
const NETFLIX = 8, NETFLIX_NETWORK = 213;
const onNetflix = d => (d.networks || []).some(n => n.id === NETFLIX_NETWORK)
  || ['TH', 'US'].some(c => ((((d['watch/providers'] || {}).results || {})[c] || {}).flatrate || []).some(p => p.provider_id === NETFLIX));

const get = (path, q = {}) => {
  const u = new URL(API + path);
  Object.entries({ api_key: process.env.TMDB_API_KEY, ...q }).forEach(([k, v]) => u.searchParams.set(k, v));
  return fetch(u).then(r => { if (!r.ok) throw new Error(`TMDB ${r.status}`); return r.json(); });
};
const byLang = (list, langs) => langs.map(l => list.filter(x => x.iso_639_1 === l).sort((a, b) => b.vote_average - a.vote_average)[0]).find(Boolean);

function rating(d, type) {
  const pick = rows => ['TH', 'US'].map(c => rows.find(r => r.iso_3166_1 === c)).find(Boolean);
  if (type === 'tv') return (pick((d.content_ratings || {}).results || []) || {}).rating || '';
  const row = pick((d.release_dates || {}).results || []);
  return row ? ((row.release_dates || []).find(x => x.certification) || {}).certification || '' : '';
}

// Card tag lines: each title gets the tags that fit it, best first (new episodes with the next one's weekday, finished
// series, new movies, top-3 trending, then general ones); assign() then gives each card its best tag not already used
// MAX_SAME times, so the hero doesn't repeat one line on every card
const DAY = 864e5, MAX_SAME = 2;
function tags(d, type, rank) {
  const now = Date.now(), at = s => Date.parse(s || '') || 0, out = [];
  if (type === 'tv') {
    const next = at((d.next_episode_to_air || {}).air_date), last = at((d.last_episode_to_air || {}).air_date);
    if (next > now - DAY && next - now < 7 * DAY) {
      out.push(`ตอนใหม่ทุก${new Date(next).toLocaleDateString('th-TH', { weekday: 'long', timeZone: 'Asia/Bangkok' })}`);
    }
    if (last && now - last < 14 * DAY) out.push('ตอนใหม่');
    if (/Ended|Canceled/.test(d.status || '')) out.push(d.number_of_seasons > 1 ? `ดูครบ ${d.number_of_seasons} ซีซัน` : 'ดูยกซีรีส์');
  } else {
    const rel = at(d.release_date);
    if (rel && rel <= now && now - rel < 45 * DAY) out.push('เข้าใหม่');
  }
  if (rank <= 3) out.push(`อันดับ ${rank} มาแรงสัปดาห์นี้`);
  out.push('กำลังมาแรง', 'ห้ามพลาด', 'แนะนำสำหรับคุณ');
  return out;
}
function assign(slides) {
  const used = {};
  for (const s of slides) {
    s.tag = s.tags.find(t => (used[t] || 0) < MAX_SAME) || s.tags[s.tags.length - 1];
    used[s.tag] = (used[s.tag] || 0) + 1;
    delete s.tags;
  }
  return slides;
}

async function slide(t, rank) {
  const type = t.media_type;
  const d = await get(`/${type}/${t.id}`, {
    language: 'th-TH', include_image_language: 'th,en,null',
    append_to_response: type === 'tv' ? 'images,content_ratings,watch/providers' : 'images,release_dates,watch/providers',
  });
  const logo = byLang(d.images.logos || [], ['th', 'en']);
  const poster = byLang(d.images.posters || [], [null]);
  if (!logo || !poster || onNetflix(d)) return null;
  return {
    id: d.id, type, rank, t: d.title || d.name, tags: tags(d, type, rank),
    art: `${IMG}/w780${poster.file_path}`, bg: d.backdrop_path ? `${IMG}/w780${d.backdrop_path}` : `${IMG}/w342${poster.file_path}`,
    logo: `${IMG}/w500${logo.file_path}`,
    year: (d.release_date || d.first_air_date || '').slice(0, 4), rate: rating(d, type),
    genre: ((d.genres || [])[0] || {}).name || '',
  };
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (!process.env.TMDB_API_KEY) { res.statusCode = 200; return res.end('[]'); }
  try {
    // two pages, so there are enough left after the Netflix and no-logo cuts
    const pages = await Promise.all([1, 2].map(page => get('/trending/all/week', { language: 'th-TH', page })));
    const trending = pages.flatMap(p => p.results).filter(t => t.media_type === 'movie' || t.media_type === 'tv');
    const slides = (await Promise.all(trending.map((t, i) => slide(t, i + 1).catch(() => null)))).filter(Boolean).slice(0, MAX);
    assign(slides);
    res.statusCode = 200;
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.end(JSON.stringify(slides));
  } catch (e) {
    res.statusCode = 502;
    res.end('[]');
  }
};
