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
    out.land = tl.landscape_image || tl.poster || d.thumb || '';
  }
  if (d.enable_date) out.start = Date.parse(d.enable_date) || 0;
  return out;
}

module.exports = async (req, res) => {
  try {
    const shelves = await (await fetch(FEED)).json();
    const out = [];
    for (const s of shelves) {
      const st = s.style || {}, h = s.header || {}, bg = st.background || {};
      const personal = PERSONAL[s.type_call_api];
      if (s.type_call_api && !personal && s.type_call_api !== 'by_netflix_activation' && s.type_call_api !== 'by_shelfid') continue;
      if (s.type_call_api === 'by_netflix_activation' && h.type === 'unset_header') continue;
      const items = (s.items || []).map(e => item(e.data || {}, st.type)).filter(x => x.id);
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
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.end(JSON.stringify(out));
  } catch (e) {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end('[]');
  }
};
