// The TVS NOW mobile home screen, for the /now-app/ mock: the same homepage_adult_th feed the peacock-clone's
// /api/tvs-feed proxies, trimmed to the fields the mock draws. Runs as a Vercel function (and through scripts/serve.js
// locally): the feed has no CORS header and is ~5 MB.
const FEED = 'https://tvs.dmpcdn.com/mobile/v1/th/homepage_adult_th.json';
// Shelves the app fills per user (continue watching, my list, favourite channels, Netflix binding); the mock fakes the
// first two from other shelves and drops the rest.
const PERSONAL = { by_continue_watching: 'continue', by_mylist: 'mylist' };

function item(d, shelfType) {
  const tl = d.thumb_list || {}, set = d.setting || {};
  const type = d.content_type === 'livetv' ? 'tvs-live' : d.content_type === 'sfvseries' ? 'sfv'
    : d.content_type === 'hilight' ? 'hl' : d.movie_type === 'series' ? 'tvs-series' : 'tvs-movie';
  const out = {
    id: d.id, type, t: d.title,
    poster: tl.portrait_image || tl.poster || '',
    land: tl.ott_landscape || tl.landscape_image || d.thumb || '',
  };
  if (d.exclusive_badge_type === 'only_now') out.now = 1;
  if (type === 'sfv') out.genres = d.genres || [];
  if (shelfType === 'hero_banner_shelf' || shelfType === 'only_now_shelf' || type === 'sfv') out.syn = (d.synopsis || set.campaign_description_th || '').trim();
  if (shelfType === 'hero_banner_shelf') {
    Object.assign(out, { logo: d.title_logo || '', cta: set.button_text_th || '', genres: d.genres || [], year: d.release_year || '',
      rate: d.rate || '', pub: Date.parse(d.publish_date) || 0 });
  }
  if (shelfType === 'only_now_shelf') Object.assign(out, { genres: d.genres || [], year: d.release_year || '', rate: d.rate || '' });
  if (type === 'hl') { out.t = set.campaign_name_th || d.title; out.poster = tl.portrait_image || tl.ott_portrait || ''; out.banner = set.campaign_item_images_mobile_th || ''; out.ctx = set.context_key || ''; }
  if (type === 'tvs-live') {
    out.start = Date.parse(d.start_date) || 0; out.end = Date.parse(d.end_date) || 0;
    out.ch = d.digital_no || ''; out.logo = d.thumb || '';
    if (!(d.subscription_tiers || []).includes('basic')) out.pay = 1; // needs a package: the TV design's crown
    // a live event that isn't sport (concerts, award shows like MAMA): the live page files it under บันเทิง
    if (shelfType !== 'livetv_shelf' && d.article_category && !d.article_category.includes('sports')) out.ent = 1;
    out.land = tl.landscape_image || tl.poster || d.thumb || '';
    // a channel's programme on air now (the Live TV cards): its name, slot and picture (often just the logo again)
    if (shelfType === 'livetv_shelf' && d.epg_title) Object.assign(out, { prog: d.epg_title.trim(),
      ps: Date.parse(d.epg_start_date) || 0, pe: Date.parse(d.eng_end_date) || 0, still: d.epg_thumb !== d.thumb ? d.epg_thumb || '' : '' });
  }
  if (d.enable_date) out.start = Date.parse(d.enable_date) || 0;
  return out;
}

// ?details=1: what the mock's content detail page adds for each feed title (synopsis, length, resolution, rating, year,
// genres), fetched once after the home draws so the home payload stays small
function details(d) {
  const res = (d.resolution || {}).description || '';
  return { syn: (d.synopsis || '').trim(), dur: +d.duration || 0, res: (res.match(/\(([^)]+)\)/) || [, res])[1],
    rate: d.rate || '', year: d.release_year || '', genres: d.genres || [], series: d.movie_type === 'series',
    aud: (d.audio || []).filter(Boolean), sub: (d.subtitle || []).filter(Boolean) };
}

// The TV guide (epg.truevisions.co.th, as the TVS NOW mini app uses it) knows what's on more exactly than the feed and
// has a real frame from each programme: channel number -> { prog, ps, pe, still }. Its page carries the data in the
// Next.js payload, JSON inside a JS string (quotes escaped). Best effort: no guide, the feed's own epg_* fields stay.
function payloadArray(html, key) {
  const marker = `\\"${key}\\":`, at = html.indexOf(marker);
  if (at < 0) return [];
  const from = at + marker.length;
  for (let i = from, depth = 0; i < html.length; i++) {
    if (html[i] === '[') depth++;
    else if (html[i] === ']' && --depth === 0) return JSON.parse(JSON.parse(`"${html.slice(from, i + 1)}"`));
  }
  return [];
}
const GUIDE = 'https://epg.truevisions.co.th/th/channel';
const guideList = async () => payloadArray(await (await fetch(GUIDE, { signal: AbortSignal.timeout(4000) })).text(), 'channels');
async function guide() {
  const list = await guideList(), map = new Map();
  for (const c of list) {
    const n = c.nowPlaying, start = n && n.startTime;
    if (!start) continue;
    const day = start.slice(0, 10).replace(/-/g, ''), time = start.slice(11, 19).replace(/:/g, '');
    map.set(String(c.number), { prog: ((n.title || {}).th || (n.title || {}).default || '').trim(), ps: Date.parse(start), pe: Date.parse(n.endTime),
      still: `https://epgthumb.stm.trueid.net/thumbnail_large/${c.id}/${day}/${day}_${time}.jpg` });
  }
  return map;
}

// ?channels=1: the Live TV page (see more): every channel in the app's own Live TV groups (ดิจิทัลทีวี, ฟรีทีวี, beIN…),
// a channel counting in the first group it's in, with what's on now
const CHANNELS = 'https://tvs.dmpcdn.com/tvapp/v1/th/livetv_adult_th.json';
async function channelGroups() {
  const [shelves, g] = await Promise.all([fetch(CHANNELS).then(r => r.json()), guide().catch(() => new Map())]);
  const seen = new Set(), out = [];
  for (const s of shelves) {
    const items = (s.items || []).map(e => e.data || {}).filter(d => d.id && d.digital_no && !seen.has(d.id) && seen.add(d.id))
      .map(d => Object.assign(item(d, 'livetv_shelf'), g.get(String(d.digital_no)) || {}))
      .sort((a, b) => a.ch - b.ch);
    if (items.length) out.push({ title: ((s.header || {}).title_th || '').trim(), items });
  }
  return out;
}

// ?live=1: the ไลฟ์สดและที่กำลังมา page (see more), from the NOW sport feed as the TVS NOW mini app reads it: each
// "Live Upcoming <sport>" shelf is one sport, named in the shelf's name; events in the catch-all shelves (Free, Special
// Event, Live NOW) take the sport whose tag they carry, else none (they show under กีฬาทั้งหมด only)
const SPORT_FEED = 'https://tvs.dmpcdn.com/tvapp/v1/th/sport_category_adult_th.json';
const SPORT_TH = { 'muay thai': 'มวยไทย', volleyball: 'วอลเลย์บอล', tennis: 'เทนนิส', 'table tennis': 'เทเบิลเทนนิส', golf: 'กอล์ฟ',
  motorsports: 'มอเตอร์สปอร์ต', badminton: 'แบดมินตัน', snooker: 'สนุกเกอร์', takraw: 'ตะกร้อ', futsal: 'ฟุตซอล', boxing: 'มวยสากล',
  rugby: 'รักบี้', athletics: 'กรีฑา', baseball: 'เบสบอล', 'calcio serie a': 'Serie A' };
const GENERIC = /^(free|special event)$/i;
const slug = x => x.toLowerCase().replace(/[^a-z0-9]/g, '');
async function liveEvents() {
  const shelves = await (await fetch(SPORT_FEED)).json(), now = Date.now();
  const sportOf = n => (n.match(/live upcoming\s+(.+)/i) || [])[1];
  const named = shelves.map(s => sportOf(s.name || '')).filter(Boolean).map(n => n.replace(/\(edit\)/i, '').trim()).filter(n => !GENERIC.test(n));
  const bySlug = new Map(named.map(n => [slug(n), n]));
  const events = new Map();
  for (const s of shelves) {
    const raw = sportOf(s.name || ''), own = raw && raw.replace(/\(edit\)/i, '').trim();
    if (!own && !/live now/i.test(s.name || '')) continue;
    for (const e of s.items || []) {
      const d = e.data || {};
      if (d.content_type !== 'livetv' || !d.id || !(Date.parse(d.end_date) > now)) continue;
      const sport = own && !GENERIC.test(own) ? own : bySlug.get((d.article_category || []).map(slug).find(c => bySlug.has(c)));
      if (events.has(d.id) && (events.get(d.id).sport || !sport)) continue;
      events.set(d.id, { ...item(d, 'coming_shelf'), sport: sport ? SPORT_TH[sport.toLowerCase()] || sport : '' });
    }
  }
  return [...events.values()].sort((a, b) => a.start - b.start);
}

// ?vod=1: the sport feed's replay shelves (highlights, full matches, past fight nights…) by sport, for a live event's
// ไฮไลท์และย้อนหลัง tab
const VOD_SHELVES = [[/muay thai/i, 'muay'], [/football/i, 'football'], [/motorsport/i, 'motor'], [/futsal/i, 'futsal'],
  [/badminton/i, 'badminton'], [/more sports/i, 'more']];
async function sportVod() {
  const shelves = await (await fetch(SPORT_FEED)).json(), out = {};
  for (const s of shelves) {
    if ((s.style || {}).type !== 'base_shelf') continue;
    const key = (VOD_SHELVES.find(([re]) => re.test(s.name || '')) || [])[1];
    if (!key) continue;
    const seen = new Set((out[key] || []).map(i => i.id));
    out[key] = [...(out[key] || []), ...(s.items || []).map(e => item(e.data || {}, 'base_shelf')).filter(i => i.id && !seen.has(i.id))];
  }
  return out;
}
// ?ch=626: that channel's programmes today from the TV guide, for a live event's channel tab
async function channelDay(num) {
  const c = (await guideList()).find(x => String(x.number) === String(num));
  if (!c) return [];
  const items = payloadArray(await (await fetch(`${GUIDE}/${c.id}`, { signal: AbortSignal.timeout(4000) })).text(), 'initialItems');
  return items.map(p => ({ t: ((p.title || {}).th || (p.title || {}).default || '').trim(), start: Date.parse(p.startTime), end: Date.parse(p.endTime),
    still: p.thumbnailUrl || '' })).filter(p => p.t && p.start);
}

// ?cat=movie|series|sport: a category page (the header's ภาพยนตร์ / ซีรีส์ / กีฬา pills), from the NOW app's own
// category feed: its hero, then every shelf that has titles, trimmed like the home
const CATS = { movie: 'movie', series: 'series', sport: 'sport' };
async function category(name) {
  const shelves = await (await fetch(`https://tvs.dmpcdn.com/mobile/v1/th/${CATS[name]}_category_adult_th.json`)).json(), now = Date.now();
  const out = [];
  for (const s of shelves) {
    const st = s.style || {}, h = s.header || {};
    let items = (s.items || []).map(e => item(e.data || {}, st.type)).filter(x => x.id);
    if (items.some(i => i.type === 'tvs-live')) items = items.filter(i => i.type !== 'tvs-live' || !i.end || i.end > now);   // events still to come
    if (!items.length) continue;
    out.push({ kind: st.type, title: (h.title_th || st.title_th || '').trim(), items: items.slice(0, st.type === 'hero_banner_shelf' ? 8 : 24) });
  }
  return out;
}

module.exports = async (req, res) => {
  try {
    const q = new URL(req.url || '/', 'http://x').searchParams;
    if (q.has('channels') || q.has('live') || q.has('vod') || q.has('ch') || CATS[q.get('cat')]) {
      const groups = q.has('live') ? await liveEvents() : q.has('vod') ? await sportVod() : q.has('ch') ? await channelDay(q.get('ch'))
        : CATS[q.get('cat')] ? await category(q.get('cat')) : await channelGroups();
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
      return res.end(JSON.stringify(groups));
    }
    const shelves = await (await fetch(FEED)).json();
    const wantDetails = q.has('details'), more = {};
    const out = [];
    for (const s of shelves) {
      const st = s.style || {}, h = s.header || {}, bg = st.background || {};
      const personal = PERSONAL[s.type_call_api];
      if (s.type_call_api && !personal && s.type_call_api !== 'by_netflix_activation' && s.type_call_api !== 'by_shelfid') continue;
      if (s.type_call_api === 'by_netflix_activation' && h.type === 'unset_header') continue;
      const items = (s.items || []).map(e => item(e.data || {}, st.type)).filter(x => x.id);
      if (wantDetails) (s.items || []).slice(0, 30).forEach(e => { const d = e.data || {}; if (d.id && d.movie_type && !more[d.id]) more[d.id] = details(d); });
      if (!items.length && !personal) continue;
      out.push({
        id: s.id, kind: personal || st.type,
        title: (h.title_th || st.title_th || '').trim(),
        tag: st.tag_th || '', icon: h.icon || '', more: !!h.see_more,
        colors: (bg.colors || []).map(c => c.color),
        bg: bg.image_url_portrait || '',
        items: items.slice(0, 30),
      });
    }
    const tv = out.filter(s => s.kind === 'livetv_shelf');
    if (tv.length && !wantDetails) {
      const g = await guide().catch(() => new Map());
      tv.forEach(s => s.items.forEach(it => { const n = g.get(String(it.ch)); if (n && n.prog) Object.assign(it, n); }));
    }
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.end(JSON.stringify(wantDetails ? more : out));
  } catch (e) {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end('[]');
  }
};
