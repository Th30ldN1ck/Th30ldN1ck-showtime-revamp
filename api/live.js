// Upcoming and live sports broadcasts from the TVS NOW sport feed, trimmed for the Sports pages.
// Runs as a Vercel function (and through scripts/serve.js locally): the feed has no CORS header and is ~3 MB.
const FEED = 'https://tvs.dmpcdn.com/tvapp/v1/th/sport_category_adult_th.json';
// "Live Upcoming <league>" shelf name -> Showtime sports subcategory
const SUBS = [
  [/motorsport|f1|moto ?gp/i, 'racing'],
  [/table tennis/i, 'more'],
  [/tennis/i, 'tennis'],
  [/badminton/i, 'badminton'],
  [/laliga|serie a|ucl|uel|conference|dfb|scottish|saudi|turkish|coppa|asean|shopee|high school|premier|football|futsal/i, 'football'],
];

module.exports = async (req, res) => {
  try {
    const shelves = await (await fetch(FEED)).json();
    const now = Date.now(), seen = new Set(), out = [];
    for (const shelf of shelves) {
      const name = shelf.name || '';
      if (!/live upcoming/i.test(name)) continue;
      const league = name.replace(/.*live upcoming\s*/i, '').replace(/\(edit\)/i, '').trim();
      const sub = (SUBS.find(([re]) => re.test(league)) || [null, 'more'])[1];
      for (const e of shelf.items || []) {
        const d = e.data || {};
        const start = Date.parse(d.start_date), end = Date.parse(d.end_date);
        if (d.content_type !== 'livetv' || !d.id || seen.has(d.id) || !(end > now)) continue;
        seen.add(d.id);
        out.push({ id: d.id, t: d.title, img: (d.thumb_list || {}).landscape_image || d.thumb || '', start, end, league, sub });
      }
    }
    out.sort((a, b) => a.start - b.start);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.end(JSON.stringify(out.slice(0, 80)));
  } catch (e) {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end('[]');
  }
};
