// HBO titles for the /now-appCP/ concept's True Exclusive rail: TMDB's most popular HBO-network series (House of the
// Dragon, The Last of Us, …) with their posters, linking to the NOW prototype's TMDB title pages like the hero does.
// Same TMDB_API_KEY as api/now-hero.js; no key or a TMDB error -> [] and the rail falls back to the NOW feed.
const API = 'https://api.themoviedb.org/3';
const IMG = 'https://image.tmdb.org/t/p';
const HBO = 49, MAX = 12;

const get = (path, q = {}) => {
  const u = new URL(API + path);
  Object.entries({ api_key: process.env.TMDB_API_KEY, ...q }).forEach(([k, v]) => u.searchParams.set(k, v));
  return fetch(u).then(r => { if (!r.ok) throw new Error(`TMDB ${r.status}`); return r.json(); });
};

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const fail = () => { res.statusCode = 200; res.setHeader('Cache-Control', 'no-store'); res.end('[]'); };
  if (!process.env.TMDB_API_KEY) return fail();
  try {
    // well-known drama/comedy only (vote count floor, no talk or news shows), most popular first
    const { results } = await get('/discover/tv', {
      language: 'th-TH', with_networks: HBO, sort_by: 'popularity.desc', 'vote_count.gte': 800, without_genres: '10767,10763',
    });
    const items = results.filter(t => t.poster_path).slice(0, MAX).map(t => ({
      id: t.id, type: 'tv', t: t.name, poster: `${IMG}/w342${t.poster_path}`,
    }));
    res.statusCode = 200;
    res.setHeader('Cache-Control', items.length ? 's-maxage=86400, stale-while-revalidate=604800' : 'no-store');
    res.end(JSON.stringify(items));
  } catch (e) {
    fail();
  }
};
