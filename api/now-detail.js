// What the NOW feed doesn't carry for the TV app's content detail page (/now-tv/): episodes per season, cast and
// director, from TMDB. ?t=<feed title>&y=<release year>&s=1 for a series. The feed title is searched as is, then its
// Latin part ("กันและกัน ฉันและนาย Stay with Me" -> "Stay with Me"); only a result from the same year (±1) counts, so a
// title TMDB doesn't know gets {} rather than someone else's episodes. Same TMDB_API_KEY as now-hero.js.
const API = 'https://api.themoviedb.org/3';
const STILL = 'https://image.tmdb.org/t/p/w780';
const MAX_SEASONS = 4, MAX_CAST = 12;

const get = (path, q = {}) => {
  const u = new URL(API + path);
  Object.entries({ api_key: process.env.TMDB_API_KEY, ...q }).forEach(([k, v]) => u.searchParams.set(k, v));
  return fetch(u).then(r => { if (!r.ok) throw new Error(`TMDB ${r.status}`); return r.json(); });
};

async function find(title, year, tv) {
  title = title.replace(/\[[^\]]*\]|\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim(); // "ราคี [Director’s Cut]" -> "ราคี"
  const latin = (title.match(/[A-Za-z][A-Za-z0-9 :'’&!?.,-]+/) || [''])[0].trim();
  for (const query of [...new Set([title, latin].filter(q => q.length > 1))]) {
    const { results = [] } = await get(`/search/${tv ? 'tv' : 'movie'}`, { query, language: 'th-TH' });
    const hit = results.find(r => {
      const y = +String(r.first_air_date || r.release_date || '').slice(0, 4);
      return !year || (y && Math.abs(y - year) <= 1);
    });
    if (hit) return hit.id;
  }
  return 0;
}

async function season(id, n) {
  const [th, en] = await Promise.all([get(`/tv/${id}/season/${n}`, { language: 'th-TH' }), get(`/tv/${id}/season/${n}`, { language: 'en-US' }).catch(() => ({}))]);
  const enEps = en.episodes || [];
  return {
    n, eps: (th.episodes || []).map((e, i) => ({
      n: e.episode_number, t: e.name || '', syn: e.overview || (enEps[i] || {}).overview || '',
      img: e.still_path ? STILL + e.still_path : '', dur: e.runtime || 0, air: e.air_date || '',
    })),
  };
}

module.exports = async (req, res) => {
  const q = new URL(req.url || '/', 'http://x').searchParams;
  const send = (code, body) => {
    res.statusCode = code;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=86400');
    res.end(JSON.stringify(body));
  };
  if (!process.env.TMDB_API_KEY || !q.get('t')) return send(200, {});
  try {
    const tv = q.get('s') === '1';
    const id = await find(q.get('t'), +q.get('y') || 0, tv);
    if (!id) return send(200, {});
    const d = await get(`/${tv ? 'tv' : 'movie'}/${id}`, { language: 'th-TH', append_to_response: tv ? 'aggregate_credits' : 'credits' });
    const credits = (tv ? d.aggregate_credits : d.credits) || {};
    const directors = tv
      ? [...(d.created_by || []).map(p => p.name), ...(credits.crew || []).filter(p => (p.jobs || []).some(j => j.job === 'Director')).map(p => p.name)]
      : (credits.crew || []).filter(p => p.job === 'Director').map(p => p.name);
    const out = { director: [...new Set(directors)].slice(0, 3), cast: (credits.cast || []).slice(0, MAX_CAST).map(p => p.name) };
    if (tv) {
      const nums = (d.seasons || []).map(s => s.season_number).filter(n => n > 0).slice(-MAX_SEASONS);
      out.seasons = (await Promise.all(nums.map(n => season(id, n).catch(() => null)))).filter(s => s && s.eps.length);
      const last = d.last_episode_to_air;
      if (last) out.last = { n: last.episode_number, s: last.season_number, air: last.air_date };
    }
    send(200, out);
  } catch (e) {
    send(200, {});
  }
};
