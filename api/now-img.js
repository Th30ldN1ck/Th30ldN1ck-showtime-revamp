// Same-origin copy of a TrueVisions image for the /now-app/ mock: tvs.dmpcdn.com and cms.dmpcdn.com send no CORS
// header, so the page can't read their pixels. app.js crops the feed's title logos to their visible part (trimLogo).
const HOSTS = /^https:\/\/(tvs|cms)\.dmpcdn\.com\//;

module.exports = async (req, res) => {
  const u = new URL(req.url || '/', 'http://x').searchParams.get('u') || '';
  if (!HOSTS.test(u)) { res.statusCode = 400; return res.end(); }
  try {
    const r = await fetch(u);
    if (!r.ok) throw new Error(r.status);
    res.statusCode = 200;
    res.setHeader('Content-Type', r.headers.get('content-type') || 'image/webp');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800');
    res.end(Buffer.from(await r.arrayBuffer()));
  } catch (e) {
    res.statusCode = 502;
    res.end();
  }
};
