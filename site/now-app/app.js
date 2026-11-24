// TVS NOW mobile home mock: draws the live NOW home feed (api/now-home.js) shelf by shelf, in the feed's own order.
// Titles open their page in the peacock-clone app, like the Showtime "ดูเลย" buttons.
const NOW_APP = 'https://tvs-newhomepage.vercel.app';
const NETFLIX_URL = 'https://www.truevisions.co.th/netflix';
const HERO_SLIDES = 7;
const TZ = 'Asia/Bangkok';

const esc = s => String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const img = (src, alt = '') => src ? `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy">` : '';
const nowBadge = it => it.now ? '<i class="nowb">NOW</i>' : '';
const chev = '<svg class="chev" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"><path d="m9 5 7 7-7 7"/></svg>';
const head = (title, extra = '') => title ? `<h2 class="shelf-h">${extra}${esc(title)}</h2>` : '';
const link = it => /^tvs-/.test(it.type) ? `href="${NOW_APP}/watch/${it.type}/${it.id}" target="_blank" rel="noopener"` : '';

// "วันนี้ 12:50", "พรุ่งนี้ 20:00", "วันอาทิตย์ 08:00" within the week, else "12 พ.ย. 20:00" (Bangkok time)
const dayKey = t => new Date(t).toLocaleDateString('en-CA', { timeZone: TZ });
function when(t) {
  if (!t) return '';
  const time = new Date(t).toLocaleTimeString('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
  const days = Math.round((Date.parse(dayKey(t)) - Date.parse(dayKey(Date.now()))) / 864e5);
  if (days === 0) return `วันนี้ ${time}`;
  if (days === 1) return `พรุ่งนี้ ${time}`;
  if (days > 1 && days < 7) return `${new Date(t).toLocaleDateString('th-TH', { timeZone: TZ, weekday: 'long' })} ${time}`;
  return `${new Date(t).toLocaleDateString('th-TH', { timeZone: TZ, day: 'numeric', month: 'short' })} ${time}`;
}

const poster = it => `<a class="poster" ${link(it)}>${nowBadge(it)}${img(it.poster || it.land, it.t)}</a>`;
const row = (items, card) => `<div class="row">${items.map(card).join('')}</div>`;
const shelf = (s, body, cls = '') => `<section class="shelf ${cls}">${head(s.title, s.icon === 'thunder' ? bolt : '')}${body}</section>`;
const bolt = '<svg width="24" height="26" viewBox="0 0 24 26"><path fill="#fff" d="M14 0 2 15h8l-2 11 13-16h-8z"/></svg>';
const colors = s => `style="--c1:${esc(s.colors[0] || '#222')};--c2:${esc(s.colors[1] || s.colors[0] || '#111')}"`;

function hero(s) {
  const slides = s.items.filter(it => /^tvs-/.test(it.type) && it.poster).slice(0, HERO_SLIDES);
  if (!slides.length) return '';
  return `<section class="hero">
    <div class="hero-track">${slides.map(it => `<div class="slide">
      <a ${link(it)}>${`<img src="${esc(it.poster)}" alt="">`}</a>
      <div class="slide-body"><h2>${esc(it.t)}</h2><p>${esc(it.syn)}</p>
        <div class="hero-ctas">
          <a class="btn-play" ${link(it)}><svg width="26" height="26" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11"/><path fill="#fff" d="m10 7.5 6 4.5-6 4.5z"/></svg>รับชมตอนนี้</a>
          <a class="btn-add"><svg width="22" height="22" viewBox="0 0 24 24" stroke="#fff" stroke-width="2.4" stroke-linecap="round"><path d="M12 4v16M4 12h16"/></svg></a>
        </div></div>
    </div>`).join('')}</div>
    <div class="dots">${slides.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>
  </section>`;
}

// New look hero: Netflix/Disney-style big cards built from parts: HeroArt (textless poster), HeroBadge, HeroLogo (the
// title's own logo, large and centred), HeroMeta and HeroActions. Slides are TMDB's trending titles, else the NOW feed's (heroSlides).
// The carousel loops endlessly: one clone of the last slide sits before the first and one of the first after the last, and landing
// on a clone jumps silently to the real slide.
const NEW_DAYS = 21;
let TMDB_HERO = [];
function feedBadge(it) {
  if (it.pub && Date.now() - it.pub < NEW_DAYS * 864e5) return 'มาใหม่';
  return it.now ? 'เฉพาะบน NOW' : '';
}
const metaLine = (rate, bits) => `${rate ? `<i class="rate">${esc(rate)}</i>` : ''}${bits.filter(Boolean).map(esc).join(' • ')}`;
// Live slides (NOW's edge over the pure-VOD apps): what's on air now and the next two upcoming events from the feed's
// live shelves, near-duplicates (two tables of the same snooker match) dropped. Their posters carry the event name, so
// the card shows no logo: a LIVE badge or a ticking countdown, the channel, and ดูสด / ตั้งเตือน.
let LIVE_HERO = [];
const LIVE_UPCOMING = 2;
function liveHero(shelves) {
  const now = Date.now(), seen = new Set();
  const fresh = it => { const k = it.t.slice(0, 14); return it.poster && !seen.has(k) && seen.add(k); };
  const live = shelves.filter(s => s.kind === 'title_shelf').flatMap(s => s.items)
    .filter(it => it.type === 'tvs-live' && it.start <= now && it.end > now).filter(fresh).slice(0, 1);
  const next = shelves.filter(isLive).flatMap(s => s.items).filter(it => it.type === 'tvs-live' && it.start > now)
    .sort((a, b) => a.start - b.start).filter(fresh).slice(0, LIVE_UPCOMING);
  return [...live, ...next].map(it => ({
    art: it.poster, bg: it.land || it.poster, t: it.t, href: link(it), cls: 'hc-live', match: matchOf(it.t), start: it.start, end: it.end,
    ch: it.ch,
  }));
}
// Sport card built from parts (MONOMAX-style): competition, the two sides with their crests, the date and kick-off in
// the middle. The feed has no team data or logos, so the sides come from the event title ("2027 AOFC WFCQ : Australia
// vs New Zealand") and each side gets its flag, or a monogram crest in a colour of its own; titles that aren't a match
// show the competition and the event name instead.
function matchOf(t) {
  // "competition : event", or "competition: event" as the Thai titles write it
  const cm = t.match(/^(.+?)\s?:\s(.+)$/), [comp, rest] = cm ? [cm[1], cm[2]] : ['', t];
  const sides = rest.split(/\s+(?:vs\.?|v\.?|พบ)\s+/i);   // Thai titles write "อิหร่าน พบ เลบานอน"
  return sides.length === 2 ? { comp: comp.trim(), sides: sides.map(x => x.trim()) } : { comp: comp.trim(), event: rest.trim() };
}
// national teams get their flag (flagcdn.com); clubs and anything unknown keep the monogram
const FLAGS = {
  thailand: 'th', vietnam: 'vn', malaysia: 'my', indonesia: 'id', philippines: 'ph', singapore: 'sg', myanmar: 'mm', cambodia: 'kh',
  laos: 'la', japan: 'jp', 'south korea': 'kr', korea: 'kr', 'korea republic': 'kr', 'north korea': 'kp', china: 'cn', 'chinese taipei': 'tw',
  taiwan: 'tw', 'hong kong': 'hk', india: 'in', iran: 'ir', iraq: 'iq', 'saudi arabia': 'sa', qatar: 'qa', uae: 'ae',
  'united arab emirates': 'ae', jordan: 'jo', uzbekistan: 'uz', kazakhstan: 'kz', australia: 'au', 'new zealand': 'nz', 'united states': 'us',
  usa: 'us', canada: 'ca', mexico: 'mx', brazil: 'br', argentina: 'ar', uruguay: 'uy', colombia: 'co', chile: 'cl', peru: 'pe',
  england: 'gb-eng', scotland: 'gb-sct', wales: 'gb-wls', 'great britain': 'gb', 'united kingdom': 'gb', ireland: 'ie', france: 'fr',
  germany: 'de', spain: 'es', italy: 'it', portugal: 'pt', netherlands: 'nl', belgium: 'be', switzerland: 'ch', austria: 'at',
  denmark: 'dk', sweden: 'se', norway: 'no', finland: 'fi', poland: 'pl', 'czech republic': 'cz', czechia: 'cz', croatia: 'hr',
  serbia: 'rs', slovenia: 'si', slovakia: 'sk', hungary: 'hu', romania: 'ro', bulgaria: 'bg', greece: 'gr', turkey: 'tr', turkiye: 'tr',
  ukraine: 'ua', russia: 'ru', morocco: 'ma', egypt: 'eg', nigeria: 'ng', senegal: 'sn', 'south africa': 'za', cameroon: 'cm', ghana: 'gh',
  lebanon: 'lb', oman: 'om', afghanistan: 'af', bahrain: 'bh', kuwait: 'kw', syria: 'sy', palestine: 'ps', yemen: 'ye',
  kyrgyzstan: 'kg', tajikistan: 'tj', turkmenistan: 'tm', mongolia: 'mn', bangladesh: 'bd', 'sri lanka': 'lk', nepal: 'np', 'timor-leste': 'tl',
  brunei: 'bn', guam: 'gu', fiji: 'fj', tahiti: 'pf', 'solomon islands': 'sb',
  // the same countries as the Thai feed writes them
  'ไทย': 'th', 'เวียดนาม': 'vn', 'มาเลเซีย': 'my', 'อินโดนีเซีย': 'id', 'ฟิลิปปินส์': 'ph', 'สิงคโปร์': 'sg', 'เมียนมา': 'mm', 'กัมพูชา': 'kh',
  'ลาว': 'la', 'สปป.ลาว': 'la', 'บรูไน': 'bn', 'ติมอร์-เลสเต': 'tl', 'ญี่ปุ่น': 'jp', 'เกาหลีใต้': 'kr', 'เกาหลีเหนือ': 'kp', 'จีน': 'cn',
  'จีนไทเป': 'tw', 'ฮ่องกง': 'hk', 'อินเดีย': 'in', 'อิหร่าน': 'ir', 'อิรัก': 'iq', 'ซาอุดีอาระเบีย': 'sa', 'กาตาร์': 'qa', 'ยูเออี': 'ae',
  'สหรัฐอาหรับเอมิเรตส์': 'ae', 'จอร์แดน': 'jo', 'อุซเบกิสถาน': 'uz', 'คาซัคสถาน': 'kz', 'คีร์กีซสถาน': 'kg', 'ทาจิกิสถาน': 'tj',
  'เติร์กเมนิสถาน': 'tm', 'ออสเตรเลีย': 'au', 'นิวซีแลนด์': 'nz', 'เลบานอน': 'lb', 'โอมาน': 'om', 'อัฟกานิสถาน': 'af', 'บาห์เรน': 'bh',
  'คูเวต': 'kw', 'ซีเรีย': 'sy', 'ปาเลสไตน์': 'ps', 'เยเมน': 'ye', 'มองโกเลีย': 'mn', 'บังกลาเทศ': 'bd', 'ศรีลังกา': 'lk', 'เนปาล': 'np',
  'สหรัฐอเมริกา': 'us', 'สหรัฐฯ': 'us', 'แคนาดา': 'ca', 'เม็กซิโก': 'mx', 'บราซิล': 'br', 'อาร์เจนตินา': 'ar', 'อุรุกวัย': 'uy',
  'โคลอมเบีย': 'co', 'ชิลี': 'cl', 'เปรู': 'pe', 'อังกฤษ': 'gb-eng', 'สกอตแลนด์': 'gb-sct', 'เวลส์': 'gb-wls', 'ไอร์แลนด์': 'ie',
  'ฝรั่งเศส': 'fr', 'เยอรมนี': 'de', 'สเปน': 'es', 'อิตาลี': 'it', 'โปรตุเกส': 'pt', 'เนเธอร์แลนด์': 'nl', 'เบลเยียม': 'be',
  'สวิตเซอร์แลนด์': 'ch', 'ออสเตรีย': 'at', 'เดนมาร์ก': 'dk', 'สวีเดน': 'se', 'นอร์เวย์': 'no', 'ฟินแลนด์': 'fi', 'โปแลนด์': 'pl',
  'เช็กเกีย': 'cz', 'สาธารณรัฐเช็ก': 'cz', 'โครเอเชีย': 'hr', 'เซอร์เบีย': 'rs', 'สโลวีเนีย': 'si', 'สโลวาเกีย': 'sk', 'ฮังการี': 'hu',
  'โรมาเนีย': 'ro', 'บัลแกเรีย': 'bg', 'กรีซ': 'gr', 'ตุรกี': 'tr', 'ยูเครน': 'ua', 'รัสเซีย': 'ru', 'โมร็อกโก': 'ma', 'อียิปต์': 'eg',
  'ไนจีเรีย': 'ng', 'เซเนกัล': 'sn', 'แอฟริกาใต้': 'za', 'แคเมอรูน': 'cm', 'กานา': 'gh', 'ตาฮีตี': 'pf', 'ฟิจิ': 'fj',
};
const crest = name => {
  const flag = FLAGS[name.toLowerCase().replace(/\s*\((?:หญิง|ชาย)\)$|\s+(u\d+|women|men|หญิง|ชาย)$/i, '').trim()];
  if (flag) return `<img class="hm-flag" src="https://flagcdn.com/w320/${flag}.png" alt="">`;
  // a club with a badge (teams.json, scripts/build_teams.mjs) shows its real crest
  const club = (TEAMS || {})[name];
  if (club && club.badge) return `<img class="hm-flag hm-badge" src="/now-app/img/teams/${club.badge}" alt="">`;
  const hue = [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
  // Thai initials don't make a badge: a Thai name gets a plain shield in its colour instead of letters
  if (/[\u0E00-\u0E7F]/.test(name)) return `<i class="hm-crest hm-shield" style="--hue:${hue}"><svg width="44%" height="44%" viewBox="0 0 24 24" fill="rgba(255,255,255,.85)"><path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5z"/></svg></i>`;
  const w = name.replace(/[^\p{L}\p{N} ]/gu, '').split(/\s+/).filter(Boolean);
  const mono = (w.length > 1 ? w[0][0] + w[1][0] : (w[0] || '?').slice(0, 2)).toUpperCase();
  return `<i class="hm-crest" style="--hue:${hue}">${esc(mono)}</i>`;
};
const dmy = t => {
  const day = x => new Date(x).toLocaleDateString('en-GB', { timeZone: TZ, day: '2-digit', month: '2-digit' });
  return day(t) === day(Date.now()) ? 'วันนี้' : day(t) === day(Date.now() + 864e5) ? 'พรุ่งนี้' : day(t);
};
function HeroMatch(h) {
  const m = h.match, onAir = h.start <= Date.now();
  const mid = onAir ? '<span class="hm-when"><i class="hm-live">LIVE</i></span>'
    : `<span class="hm-when"><b>${hhmm(h.start)}</b><small>${dmy(h.start)}</small></span>`;
  return `<div class="hm">${m.comp ? `<span class="hm-comp">${esc(m.comp)}</span>` : ''}${m.sides
    ? `<div class="hm-teams"><span class="hm-side">${crest(m.sides[0])}<b>${esc(m.sides[0])}</b></span>${mid}<span class="hm-side">${crest(m.sides[1])}<b>${esc(m.sides[1])}</b></span></div>`
    : `<div class="hm-teams hm-solo"><b class="hm-event">${esc(m.event)}</b>${mid}</div>`}</div>`;
}
// VOD slides with a live slide after every two of them: TMDB's trending titles (api/now-hero.js: textless posters made
// for portrait, so the tall hero stays sharp), or if TMDB isn't available the NOW feed's own hero titles, their wide
// textless art cropped tall (softer: the crop enlarges it) with their title logo
const metaA = (series, genre, year, rate) => `${[series ? 'ซีรีส์' : 'ภาพยนตร์', genre, year].filter(Boolean).map(esc).join(' · ')}${rate ? ` <i class="rate">${esc(rate)}</i>` : ''}`;
function heroSlides(s) {
  const vod = TMDB_HERO.length
    // the glow behind the card (bg) is the poster the card shows: TMDB's backdrop is a different still, often in other colours
    ? TMDB_HERO.map(h => ({ art: h.art, bg: h.art, logo: h.logo, t: h.t, href: `href="${NOW_APP}/watch/${h.type}/${h.id}" target="_blank" rel="noopener"`,
        badge: esc(h.tag || ''), meta: metaLine(h.rate, [h.year, h.genre]), cls: 'hc-tall',
        // ใหม่ 2 (Apple-style): "ภาพยนตร์ · สยองขวัญ · 2026" then the rating chip
        metaA: metaA(h.type === 'tv', h.genre, h.year, h.rate) }))
    : s.items.filter(it => /^tvs-(movie|series)$/.test(it.type) && it.land).slice(0, HERO_SLIDES).map(it => ({ art: it.land, bg: it.land,
        logo: it.logo, t: it.t, href: link(it), badge: feedBadge(it), meta: exclMeta(it), cls: 'hc-feed',
        metaA: metaA(it.type === 'tvs-series', (it.genres || []).map(g => GENRE_TH[g]).find(Boolean), it.year, it.rate) }));
  const out = [];
  vod.forEach((h, i) => { out.push(h); if (i % 2 === 0 && LIVE_HERO[i / 2]) out.push(LIVE_HERO[i / 2]); });
  return out;
}

// Live cards: no badge; the card's parts (HeroMatch) carry the day and kick-off, so the status line under them adds
// only what they don't: the channel, and before a start within 24 hours a ticking countdown.
const pad2 = n => String(n).padStart(2, '0');
const hhmm = t => new Date(t).toLocaleTimeString('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
function liveStatus(h) {
  const ms = h.start - Date.now(), ch = h.ch ? `ช่อง ${esc(h.ch)}` : '';
  if (ms <= 0 || ms > 864e5) return ch;
  const t = Math.floor(ms / 1000);
  return [`เริ่มใน ${pad2(Math.floor(t / 3600))}:${pad2(Math.floor(t / 60) % 60)}:${pad2(t % 60)}`, ch].filter(Boolean).join(' · ');
}

// live cards (MONOMAX-style): the event's landscape picture framed at the top over a blurred copy of itself, so its
// baked-in text doesn't fight the card's own parts below
const liveArt = h => `<img class="lv-blur" src="${esc(h.bg)}" alt="" loading="lazy"><img class="lv-frame" src="${esc(h.bg)}" alt="" loading="lazy">`;
const HeroArt = h => h.match ? `<span class="hc-art lv">${liveArt(h)}</span>` : `<span class="hc-art">${img(h.art, '')}</span>`;
const HeroBadge = h => h.cls === 'hc-live' || !h.badge ? '' : `<i class="hc-badge">${h.badge}</i>`;
const HeroLogo = h => h.match ? HeroMatch(h) : h.logo ? `<img class="hc-logo" src="${esc(h.logo)}" alt="${esc(h.t)}">` : `<b class="hc-tt">${esc(h.t)}</b>`;
const HeroMeta = h => h.cls === 'hc-live'
  ? `<span class="hc-status" data-start="${h.start}" data-ch="${esc(h.ch || '')}">${liveStatus(h)}</span>`
  : `<span class="excl-meta">${LOOK === 'apple' && h.metaA ? h.metaA : h.meta}</span>`;
// same CTA pair as the current (เดิม) hero: white รับชมตอนนี้ + dark square add button. Live slides: ดูสด, or for an
// upcoming event ตั้งเตือน (a reminder toggle; the button takes the add button's place)
const playIcon = '<svg width="26" height="26" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11"/><path fill="#fff" d="m10 7.5 6 4.5-6 4.5z"/></svg>';
const bellIcon = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 21h4" stroke-linecap="round"/></svg>';
const addBtn = '<a class="btn-add" aria-label="เพิ่มในรายการของฉัน"><svg width="22" height="22" viewBox="0 0 24 24" stroke="#fff" stroke-width="2.4" stroke-linecap="round"><path d="M12 4v16M4 12h16"/></svg></a>';
// Live cards keep the same CTA pair and sizes as the other hero cards (main button + square add): the main button is
// red ● ดูสด while on air, or the white ตั้งเตือน reminder toggle before it starts.
// reminders are one list (REMINDERS) shared by the hero, the schedule's bells and the detail page
const heroId = h => watchKey(h.href).split('/')[1];
// after the detail page changes a reminder, bring the bells and hero buttons already on screen in line
function syncReminders() {
  document.querySelectorAll('[data-bell]').forEach(b => { const on = REMINDERS.has(b.dataset.bell); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  document.querySelectorAll('.hc-card [data-remind]').forEach(b => {
    const on = REMINDERS.has(b.closest('.hc-card').dataset.watch.split('/')[1]);
    b.classList.toggle('set', on); b.querySelector('span').textContent = on ? 'ตั้งเตือนแล้ว' : 'ตั้งเตือน';
  });
  const hf = document.querySelector('.hf-ctas [data-remind]');
  if (hf) { const id = heroId(HF_SLIDES[[...document.querySelectorAll('.hf-art')].findIndex(a => a.classList.contains('on'))] || {});
    if (id) { const on = REMINDERS.has(id); hf.classList.toggle('set', on); hf.querySelector('span').textContent = on ? 'ตั้งเตือนแล้ว' : 'ตั้งเตือน'; } }
}
function HeroActions(h) {
  if (h.cls === 'hc-live') {
    const main = h.start <= Date.now()
      ? `<a class="btn-play btn-live" ${h.href}><b></b>ดูสด</a>`
      : REMINDERS.has(heroId(h)) ? `<a class="btn-play btn-remind set" data-remind>${bellIcon}<span>ตั้งเตือนแล้ว</span></a>`
      : `<a class="btn-play btn-remind" data-remind>${bellIcon}<span>ตั้งเตือน</span></a>`;
    return `<span class="hero-ctas">${main}${addBtn}</span>`;
  }
  return `<span class="hero-ctas"><a class="btn-play" ${h.href}>${playIcon}รับชมตอนนี้</a>${addBtn}</span>`;
}
const HeroCard = (h, on, clone) => `<div class="hc-card ${h.cls}${on ? ' on' : ''}"${clone ? ' data-clone aria-hidden="true"' : ''} data-bg="${esc(h.bg)}" data-watch="${esc(watchKey(h.href))}">
  ${HeroArt(h)}<span class="hc-body">${HeroBadge(h)}${HeroLogo(h)}${HeroMeta(h)}${HeroActions(h)}</span></div>`;
function heroCards(s) {
  const slides = heroSlides(s);
  if (!slides.length) return '';
  const n = slides.length;
  return `<section class="hc${LOOK === 'apple' ? ' hc-apple' : ''}">
    <div class="hc-glow"><img class="top" src="${esc(slides[0].bg)}" alt=""><img alt=""></div>
    <div class="hc-track">${heroClones(slides, -1)}${slides.map((h, i) => HeroCard(h, !i)).join('')}${heroClones(slides, 1)}</div>
    <div class="dots">${slides.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>
  </section>`;
}
// The loop has HC_CLONES copies at each end (the last slides before the first, the first slides after the last), so a
// copy's peeking neighbours are the same as its real slide's and the silent swap between them doesn't jump.
const HC_CLONES = 2;
const heroClones = (slides, side) => {
  const n = slides.length, k = Math.min(HC_CLONES, n);
  const picks = side < 0 ? slides.slice(n - k) : slides.slice(0, k);
  return picks.map(h => HeroCard(h, false, true)).join('');
};
function wireHeroCards(screen) {
  const sec = screen.querySelector('.hc');
  if (!sec) return;
  const track = sec.querySelector('.hc-track'), cards = [...track.children], dots = [...sec.querySelectorAll('.dots i')];
  const k = track.querySelectorAll('[data-clone]').length / 2, n = cards.length - 2 * k, layers = [...sec.querySelectorAll('.hc-glow img')];
  // backdrop crossfade: the next glow loads into the hidden layer, then fades in over the current one (no dip to black)
  cards.forEach(c => { new Image().src = c.dataset.bg; });   // preload, so the fade starts right away
  const showBg = src => {
    const top = layers.find(l => l.classList.contains('top')), back = layers.find(l => l !== top);
    if (top.getAttribute('src') === src) return;
    back.onload = () => { back.classList.add('top'); top.classList.remove('top'); };
    back.src = src;
  };
  const step = () => cards[2].offsetLeft - cards[1].offsetLeft;
  const go = (i, smooth) => track.scrollTo({ left: i * step(), behavior: smooth ? 'smooth' : 'instant' });
  let cur = k, touching = false, idle;
  requestAnimationFrame(() => go(k));                       // start on the real first slide, copies of the last ones to its left
  // as the card changes: scale, dot and backdrop follow (clones carry their slide's backdrop, so a wrap is seamless)
  const mark = i => {
    cards.forEach((c, j) => c.classList.toggle('on', j === i));
    dots.forEach((d, j) => d.classList.toggle('on', j === ((i - k) % n + n) % n));
    showBg(cards[i].dataset.bg);
  };
  // once the scroll has fully settled (finger up, momentum and snap done): wrap off a clone onto the real slide
  // the wrap swaps a clone for its identical real slide: no transitions for that one frame, so nothing replays
  const settle = () => {
    if (touching || (cur >= k && cur < k + n)) return;
    track.classList.add('instant');
    cur += cur < k ? n : -n; go(cur); mark(cur); parallax();
    requestAnimationFrame(() => requestAnimationFrame(() => track.classList.remove('instant')));
  };
  // parallax: each card's art shifts against the swipe in proportion to its distance from the centre
  const arts = cards.map(c => c.querySelector('.hc-art'));
  const parallax = () => {
    const mid = track.scrollLeft + track.clientWidth / 2, w = cards[1].offsetWidth;
    cards.forEach((c, i) => {
      const d = (c.offsetLeft + w / 2 - mid) / w;
      if (Math.abs(d) < 2) arts[i].style.transform = `translateX(${(-d * 18).toFixed(2)}%)`;
    });
  };
  let raf;
  track.addEventListener('scroll', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(parallax); }, { passive: true });
  requestAnimationFrame(() => requestAnimationFrame(parallax));
  let fallback;
  track.addEventListener('scroll', () => {
    const i = Math.round(track.scrollLeft / step());
    if (i !== cur) { cur = i; mark(i); }
    clearTimeout(fallback);
    if (!('onscrollend' in window)) fallback = setTimeout(settle, 250);   // Safari < 18.2 has no scrollend
  }, { passive: true });
  track.addEventListener('scrollend', settle);
  // tick the live status lines (countdowns)
  clearInterval(countTimer);
  countTimer = setInterval(() => sec.querySelectorAll('.hc-status').forEach(el => {
    el.innerHTML = liveStatus({ start: +el.dataset.start, ch: el.dataset.ch });
  }), 1000);
  sec.addEventListener('click', e => {
    const r = e.target.closest('[data-remind]');
    if (!r) return;
    const on = r.classList.toggle('set');
    // clones mirror their slide, so update every copy of this reminder
    const card = r.closest('.hc-card'), bg = card.dataset.bg, id = card.dataset.watch.split('/')[1];
    on ? REMINDERS.add(id) : REMINDERS.delete(id);
    cards.filter(c => c.dataset.bg === bg).forEach(c => {
      const b = c.querySelector('[data-remind]'); b.classList.toggle('set', on); b.querySelector('span').textContent = on ? 'ตั้งเตือนแล้ว' : 'ตั้งเตือน';
    });
  });
  // autoplay every 5 s; any touch, drag or wheel pauses it, and it resumes 5 s after the person stops
  const play = () => { sec.classList.remove('held'); clearInterval(heroTimer); heroTimer = setInterval(() => { if (!touching) go(cur + 1, true); }, 5000); };
  const hold = () => { sec.classList.add('held'); clearInterval(heroTimer); clearTimeout(idle); idle = setTimeout(play, 5000); };
  track.addEventListener('touchstart', () => { touching = true; hold(); }, { passive: true });
  track.addEventListener('touchend', () => { touching = false; hold(); if (!('onscrollend' in window)) fallback = setTimeout(settle, 250); });
  track.addEventListener('pointerdown', hold);
  track.addEventListener('wheel', hold, { passive: true });
  play();
}

// ใหม่ 2 hero (Apple TV-style): no scrolling strip. The art crossfades in place, the logo + meta line slide out and the
// next ones slide in from the swipe direction (the current one follows the finger while dragging), and the buttons stay
// where they are, only their label changing. Loops endlessly; autoplay 5 s, paused while touched.
function heroFade(s) {
  const slides = heroSlides(s);
  if (!slides.length) return '';
  HF_SLIDES = slides;
  return `<section class="hf hc-apple">
    ${slides.map((h, i) => `<div class="hf-art${i ? '' : ' on'}${h.match ? ' lv' : ''}" data-watch="${esc(watchKey(h.href))}">${h.match ? liveArt(h) : img(h.art, '')}</div>`).join('')}
    <div class="hf-body">
      <div class="hf-logos">${slides.map((h, i) => `<div class="hf-slide${i ? '' : ' on'}">${HeroLogo(h)}${HeroMeta(h)}</div>`).join('')}</div>
      <div class="hf-ctas">${HeroActions(slides[0])}</div>
    </div>
    <div class="dots">${slides.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>
  </section>`;
}
let HF_SLIDES = [];
function wireHeroFade(screen) {
  const sec = screen.querySelector('.hf');
  if (!sec) return;
  const arts = [...sec.querySelectorAll('.hf-art')], logos = [...sec.querySelectorAll('.hf-slide')];
  const dots = [...sec.querySelectorAll('.dots i')], ctas = sec.querySelector('.hf-ctas'), n = arts.length;
  let cur = 0, idle;
  const drawCtas = () => { ctas.innerHTML = HeroActions(HF_SLIDES[cur]); };
  // dir 1 = next (new logo comes in from the right), -1 = previous
  const show = (to, dir) => {
    to = (to + n) % n;
    if (to === cur) return;
    const out = logos[cur], inn = logos[to];
    out.style.transition = ''; out.style.opacity = ''; out.classList.remove('on'); out.style.transform = `translateX(${-dir * 70}px)`;
    inn.style.transition = 'none'; inn.style.transform = `translateX(${dir * 70}px)`; inn.offsetWidth;
    inn.style.transition = ''; inn.style.transform = ''; inn.classList.add('on');
    arts[cur].classList.remove('on'); arts[to].classList.add('on');
    dots.forEach((d, j) => d.classList.toggle('on', j === to));
    if (dots[to]) { dots[to].classList.remove('on'); dots[to].offsetWidth; dots[to].classList.add('on'); }   // restart the timer pill
    cur = to;
    drawCtas();
  };
  const play = () => { sec.classList.remove('held'); clearInterval(heroTimer); heroTimer = setInterval(() => show(cur + 1, 1), 5000); };
  const hold = () => { sec.classList.add('held'); clearInterval(heroTimer); clearTimeout(idle); idle = setTimeout(play, 5000); };
  // drag: the current logo follows the finger; past 50px it commits to the next/previous slide
  let x0 = null, dx = 0;
  sec.addEventListener('pointerdown', e => { if (e.target.closest('a')) return; x0 = e.clientX; dx = 0; sec.moved = false; hold(); });
  addEventListener('pointermove', e => {
    if (x0 === null) return;
    dx = e.clientX - x0;
    if (Math.abs(dx) > 8) sec.moved = true;   // a swipe, not a tap on the poster (wireDetails)
    const l = logos[cur]; l.style.transition = 'none'; l.style.transform = `translateX(${dx * .5}px)`; l.style.opacity = 1 - Math.min(Math.abs(dx) / 260, .7);
  });
  addEventListener('pointerup', () => {
    if (x0 === null) return;
    x0 = null;
    const l = logos[cur];
    if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
    else { l.style.transition = ''; l.style.transform = ''; l.style.opacity = ''; }
  });
  // trackpad / wheel: one slide per gesture
  let acc = 0, cool = 0;
  sec.addEventListener('wheel', e => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault(); hold();
    if (Date.now() < cool) return;
    acc += e.deltaX;
    if (Math.abs(acc) > 40) { show(cur + Math.sign(acc), Math.sign(acc)); acc = 0; cool = Date.now() + 600; }
  }, { passive: false });
  sec.addEventListener('click', e => {
    const r = e.target.closest('[data-remind]');
    if (!r) return;
    const id = heroId(HF_SLIDES[cur]);
    REMINDERS.has(id) ? REMINDERS.delete(id) : REMINDERS.add(id);
    drawCtas();
  });
  clearInterval(countTimer);
  countTimer = setInterval(() => sec.querySelectorAll('.hc-status').forEach(el => {
    el.innerHTML = liveStatus({ start: +el.dataset.start, ch: el.dataset.ch });
  }), 1000);
  play();
}

// The feed leaves these shelves empty (the app fills them per user); the mock borrows titles from other shelves.
function continueWatching(s, all) {
  const src = (all.find(x => x.title === 'รายการทีวีแนะนำ') || { items: [] }).items.filter(it => it.land).slice(3, 6);
  const left = ['เหลืออีก 1 ชม. 20 น.', 'เหลืออีก 2 นาที', 'เหลืออีก 35 นาที'], pct = [8, 96, 40];
  return shelf(s, row(src, (it, i) => `<a class="land-card cw" ${link(it)}>
    <div class="land">${img(it.land, it.t)}<span class="ep">EP.1</span>
      <span class="playc"><svg width="14" height="14" viewBox="0 0 24 24"><path fill="#fff" d="M7 4v16l13-8z"/></svg></span>
      <span class="left">${left[i]}</span><span class="bar"><i style="width:${pct[i]}%"></i></span></div>
    <div class="cw-t"><span>EP.01 | ${esc(it.t)}</span><svg width="18" height="22" viewBox="0 0 6 22"><circle cx="3" cy="4" r="2" fill="#fff"/><circle cx="3" cy="11" r="2" fill="#fff"/><circle cx="3" cy="18" r="2" fill="#fff"/></svg></div>
  </a>`));
}
function myList(s, all) {
  const src = (all.find(x => x.title === 'ภาพยนตร์แนะนำ') || { items: [] }).items.slice(1, 3);
  return shelf(s, row(src, poster));
}

function landCard(it, label) {
  return `<a class="land-card" ${link(it)}><div class="land">${img(it.land, it.t)}${label}</div><div class="land-t">${esc(it.t)}</div></a>`;
}
function live(s, onAir) {
  const now = Date.now();
  return liveRow(s, s.items.filter(it => it.type !== 'tvs-live' || (onAir ? it.start <= now && it.end > now : it.end > now)));
}
// New looks: one live row, what's on air first, then upcoming in start order (the feed splits these into two shelves;
// with nothing on air there's only the upcoming one). Cards as the TVS NOW mini app draws them (LiveRail): the event's
// picture with a Live pill or its day and kick-off, then the competition and the event name.
function liveMerged(live, upcoming) {
  const now = Date.now(), seen = new Set();
  const onAir = (live ? live.items : []).filter(it => it.start <= now && it.end > now);
  const next = (upcoming ? upcoming.items : []).filter(it => it.start > now).sort((a, b) => a.start - b.start);
  LIVE_EVENTS = [...onAir, ...next].filter(it => !seen.has(it.id) && seen.add(it.id));
  if (!LIVE_EVENTS.length) return '';
  return `<section class="shelf">${moreHead('ไลฟ์สดและที่กำลังมา', 'live')}${row(LIVE_EVENTS.slice(0, 10), evCard)}</section>`;
}
let LIVE_EVENTS = [];
// a row heading that opens the row's see more page (the whole heading, not only the chevron, as in the mini app)
const moreHead = (title, page) => `<h2 class="shelf-h"><button class="more-h" data-more="${page}">${esc(title)}<span aria-label="ดูเพิ่มเติม">${chev}</span></button></h2>`;
// "competition : event" (or "competition: event", as the Thai titles write it)
const evTitle = it => { const m = it.t.match(/^(.+?)\s?:\s(.+)$/); return m ? [m[1], m[2]] : ['', it.t]; };
function evCard(it) {
  const [c, t] = evTitle(it), comp = c || it.sport, onNow = it.start <= Date.now();
  return `<a class="ev-card" ${link(it)}><span class="ev-pic">${img(it.land || it.poster, '')}${onNow ? liveBadge : `<i class="ev-time">${dayTime(it.start)}</i>`}</span>
    ${comp ? `<span class="ev-comp">${esc(comp)}</span>` : ''}<span class="ev-t">${esc(t)}</span></a>`;
}
const liveBadge = '<i class="live-b"><b></b>Live</i>';
// "วันนี้ 13:50", "พรุ่งนี้ 09:00", "ศ. 21:30": an upcoming event's day and kick-off
const dayTime = t => `${/\//.test(dmy(t)) ? new Date(t).toLocaleDateString('th-TH', { timeZone: TZ, weekday: 'short' }) : dmy(t)} ${hhmm(t)}`;
// New looks' Live TV row, the mini app's ChannelCard: what's on each channel now (api/now-home.js: the TV guide's frame
// from the programme, or the feed's picture) with a Live pill, a lock on channels that need a package, minutes left
// and a progress bar; under it the round channel logo, the programme, the channel and number, and the time slot. A
// channel with no picture shows its logo on a dark tile.
const liveTv = s => `<section class="shelf">${moreHead('ทีวีสด', 'tv')}${row(s.items, tvCard)}</section>`;
function tvCard(it) {
  const name = it.t.replace(/\s*-\s*Now$/i, '').trim();
  return `<a class="tv-card" ${link(it)}><span class="tv-pic">${it.still ? img(it.still, '') : `<span class="tv-tile"><img src="${esc(it.logo)}" alt="" data-trim></span>`}
    ${liveBadge}${it.pay ? `<i class="tv-lock" role="img" aria-label="สำหรับสมาชิก">${lockIc}</i>` : ''}<span class="tv-left" data-ps="${it.ps || 0}" data-pe="${it.pe || 0}"></span></span>
    <span class="tv-info"><span class="tv-logo"><img src="${esc(it.logo)}" alt="" data-trim></span><span>
    <b>${esc(it.prog || name)}</b><small>${esc(name)} · ช่อง ${esc(it.ch)}</small>${it.ps && it.pe ? `<small>${hhmm(it.ps)}–${hhmm(it.pe)}</small>` : ''}</span></span></a>`;
}

// See more pages (new looks), pushed over the home like the mini app's: ทีวีสด = every channel in the app's own Live TV
// groups (api/now-home.js?channels=1, fetched on first open), a row each with its count; ไลฟ์สดและที่กำลังมา = the
// events by day, the day pinned at the left as the list scrolls, full-width event cards. A card opens the detail page.
let CHANNEL_GROUPS, LIVE_FEED;
const DAY_KEY = t => new Date(t).toLocaleDateString('en-CA', { timeZone: TZ });
const dayDate = k => new Date(Date.parse(`${k}T12:00:00+07:00`));
const thDay = (k, o) => dayDate(k).toLocaleDateString('th-TH', { timeZone: TZ, ...o });
function liveDays(events) {
  const days = new Map(), now = Date.now();
  events.forEach(it => { const k = DAY_KEY(Math.max(it.start, now)); days.set(k, [...(days.get(k) || []), it]); });
  if (!days.size) return '<p class="mp-err">ไม่มีรายการในหมวดนี้</p>';
  return [...days].map(([k, list]) => {
    const lbl = dmy(dayDate(k).getTime());
    return `<section class="mp-day" data-day="${k}"><div class="mp-date"><span><small>${/\//.test(lbl) ? thDay(k, { weekday: 'short' }) : lbl}</small><b>${thDay(k, { day: 'numeric' })}</b><small>${thDay(k, { month: 'short' })}</small></span></div>
      <div class="mp-evs">${list.map(evCard).join('')}</div></section>`;
  }).join('');
}
// the live page's filter bar, as in the mini app (SportFilters): a round calendar button, then the sport tabs; the
// calendar lists the next 7 days (days with nothing on are grey) and scrolls the list to the one picked
const calIc = '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round"><rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>';
// Sport tabs in order of how much Thai viewers watch them (an editorial order for the demo; real viewing data could
// set it later): football's leagues first, then volleyball, Muay Thai, badminton, motorsport, entertainment, the rest;
// anything not listed after them A–Z, the catch-all last
const SPORT_RANK = ['UCL', 'LaLiga', 'Serie A', 'Scottish Premiership', 'วอลเลย์บอล', 'มวยไทย', 'แบดมินตัน', 'มอเตอร์สปอร์ต', 'บันเทิง',
  'เทนนิส', 'กอล์ฟ', 'สนุกเกอร์'];
const sportRank = n => n === 'กีฬาอื่นๆ' ? 1e3 : (SPORT_RANK.indexOf(n) + 1 || 999);
const bySport = (a, b) => sportRank(a) - sportRank(b) || a.localeCompare(b, 'th');
function liveFilters(events, sport) {
  const sports = [...new Set(events.map(e => e.sport).filter(Boolean))].sort(bySport);
  return `<div class="mp-filters"><button class="mp-calb" aria-label="เลือกวันที่">${calIc}</button><div class="mp-chips" role="tablist">${['', ...sports]
    .map(x => `<button role="tab" data-sport="${esc(x)}" aria-selected="${x === sport}"${x === sport ? ' class="on"' : ''}>${esc(x || 'ทั้งหมด')}</button>`).join('')}</div></div>`;
}
const tvGroups = () => CHANNEL_GROUPS.map(g => `<section class="shelf"><h2 class="shelf-h">${esc(g.title)} <small class="mp-n">${g.items.length}</small></h2>${row(g.items, tvCard)}</section>`).join('');
// ใหม่ 2's live page: ตารางถ่ายทอดสด from the Figma (Fix issues, Live detail 1250:18970): category tabs, a date strip
// (one day at a time), then a section per category (round picture, name, chevron that picks its tab) listing that
// day's events as compact rows: picture with the time or Live, the event, a bell to be reminded or play when on air
const REMINDERS = new Set();
function liveMerge(list) {
  const ids = new Set(list.map(e => e.id)), now = Date.now();
  LIVE_FEED = [...list, ...LIVE_EVENTS.filter(e => !ids.has(e.id)).map(e => ({ ...e, sport: e.ent ? 'บันเทิง' : '' }))]
    .filter(e => e.end > now || !e.end).sort((a, b) => a.start - b.start);
  LIVE_FEED.forEach(it => { const k = `${it.type}/${it.id}`; if (!TITLES.has(k)) TITLES.set(k, it); });
}
// short Thai weekdays as the design writes them ("จ. 8 ธ.ค.", "อ. 20:30"); the browser's Thai dates spell them out
const TH_WD = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
const wdOf = t => TH_WD[new Date(new Date(t).toLocaleString('en-US', { timeZone: TZ })).getDay()];
// competitions with a real logo get a section of their own (as in the design); the rest stay under their sport with
// its initial. Logos in img/live/logos/ (Wikimedia Commons / Wikipedia; the feed carries none)
const COMPS = [
  [/แชมเปียนส์ ลีก|champions league/i, 'UEFA Champions League', 'ucl.png'], [/ลา ลีกา|laliga/i, 'LaLiga', 'laliga.png'],
  [/เซเรีย อา|serie a/i, 'Serie A', 'seriea.png'], [/สกอตติช|scottish/i, 'Scottish Premiership', 'spfl.png'],
  [/^F1\b|formula 1/i, 'Formula 1', 'f1.svg'], [/^F2\b|formula 2/i, 'Formula 2', 'f2.png'], [/moto ?gp/i, 'MotoGP', 'motogp.svg'],
  [/uk championship/i, 'UK Championship', 'uk-snooker.png'], [/^LET\b|ladies european/i, 'Ladies European Tour', 'let.png'],
  [/davis cup/i, 'Davis Cup', 'davis.svg'],
];
// sections with no logo get their sport's icon (line icons, white on the grey circle)
const SPORT_IC = {
  'กอล์ฟ': '<circle cx="12" cy="8.5" r="5.5"/><path d="M10 7h.01M13 6h.01M14 9h.01M11 10h.01M12 14v6M9 20h6"/>',
  'มวยไทย': '<path d="M7 11V7.5A3.5 3.5 0 0 1 10.5 4H14a4 4 0 0 1 4 4v5a4 4 0 0 1-4 4H9.5A2.5 2.5 0 0 1 7 14.5V11z"/><path d="M7 11h4.5a1.5 1.5 0 0 1 0 3H9"/><path d="M8.5 17v3h8v-3.6"/>',
  'วอลเลย์บอล': '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5c1.5 3 1.5 6 0 8.5M12 12c-3 .5-6 2-7.4 4.3M12 12c2.6 1.7 5.7 2 8.3 1.2"/>',
  'แบดมินตัน': '<path d="M8 16l-2.5 2.5a2 2 0 1 0 2.8 2.8L10.8 19"/><path d="M8 16l2.8 3L20 9.8 14.2 4z"/><path d="M11 8.5l4.5 4.5M13 6.5l4.5 4.5"/>',
  'มอเตอร์สปอร์ต': '<path d="M5 21V4"/><path d="M5 4h14v9H5"/><path d="M5 8.5h14M9.7 4v9M14.3 4v9"/><path d="M5 4h4.7v4.5H5zM14.3 4H19v4.5h-4.7zM9.7 8.5h4.6V13H9.7z" fill="currentColor"/>',
  'เทนนิส': '<circle cx="12" cy="12" r="8.5"/><path d="M5 6.5c3.5 3 3.5 8 0 11M19 6.5c-3.5 3-3.5 8 0 11"/>',
  'สนุกเกอร์': '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="11" r="3.2"/><path d="M12 9.6v.01M12 12.4v.01"/>',
  'ฟุตซอล': '<circle cx="12" cy="12" r="8.5"/><path d="m12 7.5 3.2 2.3-1.2 3.8h-4l-1.2-3.8zM12 7.5V3.5M15.2 9.8l3.9-1.3M14 13.6l2.4 3.3M10 13.6l-2.4 3.3M8.8 9.8 4.9 8.5"/>',
  'บันเทิง': '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/>',
  'กีฬาอื่นๆ': '<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4v1.5A3.5 3.5 0 0 0 7.5 11M17 6h3v1.5a3.5 3.5 0 0 1-3.5 3.5M12 14v4M8 21h8l-1-3H9z"/>',
};
const sportIc = name => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${SPORT_IC[name] || SPORT_IC['กีฬาอื่นๆ']}</svg>`;
const compOf = e => { const c = COMPS.find(([re]) => re.test(e.t)); return c ? { name: c[1], logo: c[2] } : { name: e.sport || 'กีฬาอื่นๆ' }; };
const scIc = n => `<img src="/now-app/img/live/${n}.svg" alt="" width="${n === 'back' ? 20 : 24}" height="${n === 'back' ? 20 : 24}">`;
// under a competition's own heading the row drops the competition ("ยูฟา แชมเปียนส์ ลีก 26/27: …"); under a sport
// heading it keeps it as a small grey line over the event, else "JLPGA …: Day 3" would read just "Day 3"
function schedRow(e, comp) {
  const onNow = e.start <= Date.now(), [c, rest] = evTitle(e);
  const t = comp || !c ? `<span>${esc(comp ? rest : e.t)}</span>` : `<small>${esc(c)}</small><span>${esc(rest)}</span>`;
  return `<div class="sc-row"><a class="sc-pic${onNow ? ' on' : ''}" ${link(e)}>${img(e.land || e.poster, '')}
    <i class="sc-badge">${onNow ? `${scIc('red-dot').replace(/width="24" height="24"/, 'width="5" height="5"')}Live` : `${wdOf(e.start)} ${hhmm(e.start)}`}</i></a>
    <a class="sc-t" ${link(e)}>${t}</a>${onNow
      ? `<a class="sc-ic" data-play="${esc(e.id)}" aria-label="ดูสด">${scIc('play')}</a>`
      : `<button class="sc-ic${REMINDERS.has(e.id) ? ' on' : ''}" data-bell="${esc(e.id)}" aria-pressed="${REMINDERS.has(e.id)}" aria-label="ตั้งเตือน">${scIc('bell')}</button>`}</div>`;
}
function openSchedule(preset = '') {
  const el = document.createElement('section');
  el.className = 'mpage sched';
  el.innerHTML = `<header class="sc-top"><button class="sc-back" aria-label="กลับ">${scIc('back')}</button><h1>ตารางถ่ายทอดสด</h1></header>
    <div class="sc-bars"><div class="sc-cats" role="tablist"></div><div class="sc-days" role="tablist"></div></div><div class="mp-scroll"><div class="loading"><i></i></div></div>`;
  const body = el.querySelector('.mp-scroll'), cats = el.querySelector('.sc-cats'), days = el.querySelector('.sc-days');
  // the category tabs and the date strip slide away with the scroll, as native apps' toolbars do: they follow the
  // finger pixel for pixel (no timed animation while scrolling, so nothing to flicker), and when the scroll stops part
  // way they ease to fully shown or hidden. Not on a list too short to scroll past them; the bounce at either end and
  // the top of the list always show them.
  const bars = el.querySelector('.sc-bars');
  let lastY = 0, off = 0, settle;
  const place = (snap) => { bars.style.transition = snap ? '' : 'none'; bars.style.transform = off ? `translateY(${-off}px)` : ''; };
  el.resetBars = () => { off = 0; lastY = 0; place(true); };
  body.addEventListener('scroll', () => {
    const y = body.scrollTop, room = body.scrollHeight - body.clientHeight, h = bars.offsetHeight;
    const d = y - lastY; lastY = y;
    if (room < h + 80 || y <= 0) off = 0;
    else if (y < room) off = Math.min(h, Math.max(0, off + d));
    place(false);
    clearTimeout(settle);
    settle = setTimeout(() => { if (off && off < h) { off = off > h / 2 && y > h ? h : 0; place(true); } }, 120);
  }, { passive: true });
  const today = DAY_KEY(Date.now()), dayOf = e => DAY_KEY(Math.max(e.start, Date.now()));
  let cat = preset, day = today;
  const label = k => k === today ? 'วันนี้' : `${wdOf(dayDate(k))} ${thDay(k, { day: 'numeric', month: 'short' })}`;
  const draw = () => {
    const names = [...new Set(LIVE_FEED.map(e => e.sport || 'กีฬาอื่นๆ'))].sort(bySport);
    cats.innerHTML = ['', ...names].map(c => `<button role="tab" data-cat="${esc(c)}" aria-selected="${c === cat}"${c === cat ? ' class="on"' : ''}>${esc(c || 'ทั้งหมด')}</button>`).join('');
    const pool = LIVE_FEED.filter(e => !cat || (e.sport || 'กีฬาอื่นๆ') === cat);
    const keys = [...new Set(pool.map(dayOf))].sort();
    if (!keys.includes(day)) day = keys.find(k => k >= today) || keys[0] || today;
    days.innerHTML = keys.map(k => `<button role="tab" data-d="${k}" aria-selected="${k === day}"${k === day ? ' class="on"' : ''}>${label(k)}</button>`).join('');
    // sections in kick-off order of their first event
    const groups = new Map();
    pool.filter(e => dayOf(e) === day).forEach(e => { const c = compOf(e), g = groups.get(c.name) || { ...c, list: [] }; g.list.push(e); groups.set(c.name, g); });
    body.innerHTML = [...groups.values()].map(({ name, logo, list }) => `<section class="sc-sec">
      <button class="sc-h" data-cat="${esc(list[0].sport || 'กีฬาอื่นๆ')}"><span class="sc-av${logo ? ' logo' : ''}">${logo ? `<img src="/now-app/img/live/logos/${logo}" alt="">` : sportIc(name)}</span><b>${esc(name)}</b>${scIc('chevron')}</button>
      <div class="sc-list">${list.map(e => schedRow(e, logo)).join('')}</div></section>`).join('') || '<p class="mp-err">ไม่มีรายการในวันนี้</p>';
    body.scrollTop = 0; el.resetBars && el.resetBars();
    el.style.setProperty('--bars', `${el.querySelector('.sc-bars').offsetHeight}px`);
    [cats, days].forEach(bar => { const on = bar.querySelector('.on'); on && bar.scrollTo({ left: on.offsetLeft - (bar.clientWidth - on.offsetWidth) / 2 }); });
  };
  el.addEventListener('click', e => {
    if (e.target.closest('.sc-back')) { el.classList.add('out'); return setTimeout(() => el.remove(), 250); }
    const c = e.target.closest('[data-cat]'), d = e.target.closest('[data-d]'), bell = e.target.closest('[data-bell]'), play = e.target.closest('[data-play]');
    if (c) { cat = c.dataset.cat; return draw(); }
    if (d) { day = d.dataset.d; return draw(); }
    if (bell) {
      const on = !REMINDERS.has(bell.dataset.bell);
      on ? REMINDERS.add(bell.dataset.bell) : REMINDERS.delete(bell.dataset.bell);
      bell.classList.toggle('on', on); bell.setAttribute('aria-pressed', on);
      return;
    }
    const a = play ? play : e.target.closest('a[href*="/watch/"]');
    const ev = play ? LIVE_FEED.find(x => x.id === play.dataset.play) : a && TITLES.get(watchKey(a.getAttribute('href')));
    if (!ev) return;
    e.preventDefault();
    play && canPlayNow() ? nowPlayer(ev) : openDetail(ev);
  });
  document.querySelector('.phone').appendChild(el);
  return draw;
}
// Category pages (the header's ภาพยนตร์ / ซีรีส์ / กีฬา pills), from the NOW app's own category feeds
// (api/now-home.js?cat=), Netflix-style without the hero: a หมวดหมู่ ▾ button under the title opens a full-screen
// blurred list of the category's shelves (countries, genres, sports); ทั้งหมด shows every shelf as the home draws them
// (poster rows, the Only on NOW cards, event cards for sport's live shelves), a picked one shows just that shelf as a
// grid (or a list of event cards) and names the button. A title opens its detail page.
const CAT_PAGES = { movie: 'ภาพยนตร์', series: 'ซีรีส์', sport: 'กีฬา' }, CAT_DATA = {};
const caret = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 9h12l-6 7z"/></svg>';
// a rail as the mini app draws it (PosterRail): three posters across, the heading's ดูเพิ่มเติม opening the rail as a grid
function catShelf(s, i) {
  if (s.kind === 'only_now_shelf') return onlyNowRow(s);
  const live = s.items.some(it => it.type === 'tvs-live');
  const h = s.items.length > 3 ? `<h2 class="shelf-h"><button class="more-h" data-shelf="${i}">${esc(s.title)}<span aria-label="ดูเพิ่มเติม">${chev}</span></button></h2>` : head(s.title);
  return `<section class="shelf">${h}${row(s.items, live ? evCard : poster)}</section>`;
}
function openCategory(cat) {
  const el = document.createElement('section');
  el.className = 'mpage cat';
  el.innerHTML = `<header class="sc-top"><button class="sc-back" aria-label="กลับ">${scIc('back')}</button><h1>${CAT_PAGES[cat]}</h1></header>
    <div class="mp-scroll"><div class="cat-pick"><button class="cat-btn" aria-haspopup="listbox"><span>หมวดหมู่</span>${caret}</button></div>
    <div class="cat-body"><div class="loading"><i></i></div></div></div>`;
  const body = el.querySelector('.mp-scroll'), content = el.querySelector('.cat-body'), btn = el.querySelector('.cat-btn span');
  let shelves = [], sel = -1;
  const draw = () => {
    const one = shelves[sel];
    btn.textContent = one ? one.title : 'หมวดหมู่';
    content.innerHTML = !one ? shelves.map(catShelf).join('')
      : one.items.some(it => it.type === 'tvs-live') ? `<div class="cat-evs">${one.items.map(evCard).join('')}</div>`
      : `<div class="dt-grid cat-grid">${one.items.map(poster).join('')}</div>`;
    body.scrollTop = 0;
  };
  const menu = () => {
    const m = document.createElement('div');
    m.className = 'cat-menu';
    m.innerHTML = `<div class="cat-list" role="listbox">${['ทั้งหมด', ...shelves.map(x => x.title)].map((t, i) => `<button role="option" data-i="${i - 1}"${i - 1 === sel ? ' class="on" aria-selected="true"' : ''}>${esc(t)}</button>`).join('')}</div>
      <button class="cat-x" aria-label="ปิด">${closeIcon}</button>`;
    const close = () => { m.classList.add('out'); setTimeout(() => m.remove(), 200); };
    m.addEventListener('click', e => {
      const o = e.target.closest('[data-i]');
      if (o) { sel = +o.dataset.i; draw(); return close(); }
      if (e.target.closest('.cat-x') || e.target === m) close();
    });
    el.appendChild(m);
    const on = m.querySelector('.on'); on && on.scrollIntoView({ block: 'center' });
  };
  el.addEventListener('click', e => {
    if (e.target.closest('.sc-back')) { el.classList.add('out'); return setTimeout(() => el.remove(), 250); }
    if (e.target.closest('.cat-btn')) return shelves.length && menu();
    const more = e.target.closest('[data-shelf]');
    if (more) { sel = +more.dataset.shelf; return draw(); }
    const a = e.target.closest('a[href*="/watch/"]'), d = a && TITLES.get(watchKey(a.getAttribute('href')));
    if (d) { e.preventDefault(); openDetail(d); }
  });
  document.querySelector('.phone').appendChild(el);
  const ready = sh => {
    sh.forEach(x => x.items.forEach(it => { const k = `${it.type}/${it.id}`; if (/^tvs-/.test(it.type) && !TITLES.has(k)) TITLES.set(k, it); }));
    shelves = sh.filter(x => x.kind !== 'hero_banner_shelf' && x.title);
    draw();
  };
  if (CAT_DATA[cat]) ready(CAT_DATA[cat]);
  else fetch(`/api/now-home?cat=${cat}`).then(r => r.json()).then(sh => { CAT_DATA[cat] = sh; ready(sh); })
    .catch(() => { content.innerHTML = '<p class="mp-err">โหลดไม่สำเร็จ</p>'; });
}
// The กีฬา pill's page, after the Sport wireframes (Figma Sport, 84:3872 "Sport - Home page") without their hero:
// ไลฟ์สดและที่กำลังมา, then a block per sport in popularity order (its logo or icon, its upcoming event cards, its
// highlights and replays where the sport feed has them, a ตารางแข่งขัน button that opens the live schedule on that
// sport's tab); a sport's name in its header opens the sport's own page (its events, the schedule button, its
// replays). Continue watching, teams, standings and the ad slot have no data in the feeds, so they're left out.
let TEAMS;
const LEAGUE_LOGO = { UCL: 'ucl.png', LaLiga: 'laliga.png', 'Serie A': 'seriea.png', 'Scottish Premiership': 'spfl.png' };
const SPORT_VOD_KEY = n => LEAGUE_LOGO[n] ? 'football' : { 'มวยไทย': 'muay', 'มอเตอร์สปอร์ต': 'motor', 'แบดมินตัน': 'badminton', 'ฟุตซอล': 'futsal' }[n] || 'more';
// the feed's "more sports" replays mix sports: a sport in that bucket only gets the ones whose title names it
const VOD_WORDS = { 'วอลเลย์บอล': /volley|วอลเลย์/i, 'เทนนิส': /tennis|เทนนิส/i, 'กอล์ฟ': /golf|กอล์ฟ|lpga|pga/i, 'สนุกเกอร์': /snooker|สนุกเกอร์/i };
// a league only gets its own competition's replays (its name in the title); the rest of football goes in one row
const vodFor = name => { const key = SPORT_VOD_KEY(name), list = SPORT_VOD[key] || [];
  if (LEAGUE_LOGO[name]) return list.filter(t => SPORT_WORDS[name].test(t.t)).sort((a, b) => /ไฮไลท์|highlight/i.test(b.t) - /ไฮไลท์|highlight/i.test(a.t));
  return key === 'more' ? (VOD_WORDS[name] ? list.filter(t => VOD_WORDS[name].test(t.t)) : []) : list; };
const footballRest = () => (SPORT_VOD.football || []).filter(t => !Object.keys(LEAGUE_LOGO).some(n => SPORT_WORDS[n].test(t.t)));
const VOD_NAME = { football: 'ฟุตบอล', muay: 'มวยไทย', motor: 'มอเตอร์สปอร์ต', badminton: 'แบดมินตัน', futsal: 'ฟุตซอล', more: 'กีฬาอื่นๆ' };
// the schedule as a small outlined pill (calendar + ตารางแข่งขัน) on the right of a sport's header
const fixturesBtn = name => `<button class="sp-fix" data-fix="${esc(name)}">${calIc}<span>ตารางแข่งขัน</span></button>`;
// a sport's header: its name with a chevron opens the sport's own page, the pill on the right its schedule
const sportHead = name => `<h2 class="shelf-h sp-h"><button class="sp-name" data-hub="${esc(name)}">${esc(name)}${chev}</button>${fixturesBtn(name)}</h2>`;
const vodRow = (title, list) => list && list.length ? `<section class="shelf">${head(title)}${row(list.slice(0, 18), poster)}</section>` : '';
function sportData() {
  const live = LIVE_FEED ? Promise.resolve() : fetch('/api/now-home?live=1').then(r => r.json()).catch(() => []).then(l => { if (!LIVE_FEED) liveMerge(l); });
  const vod = SPORT_VOD ? Promise.resolve() : fetch('/api/now-home?vod=1').then(r => r.json()).catch(() => ({})).then(v => {
    SPORT_VOD = v; Object.values(v).flat().forEach(t => { const k = `${t.type}/${t.id}`; if (!TITLES.has(k)) TITLES.set(k, t); }); });
  return Promise.all([live, vod]);
}
const sportsWithEvents = () => [...new Set(LIVE_FEED.map(e => e.sport).filter(x => x && x !== 'บันเทิง'))].sort(bySport);
function sportPageShell(title) {
  const el = document.createElement('section');
  el.className = 'mpage cat sport-pg';
  el.innerHTML = `<header class="sc-top"><button class="sc-back" aria-label="กลับ">${scIc('back')}</button><h1>${esc(title)}</h1></header>
    <div class="mp-scroll"><div class="loading"><i></i></div></div>`;
  el.addEventListener('click', e => {
    if (e.target.closest('.sc-back')) { el.classList.add('out'); return setTimeout(() => el.remove(), 250); }
    const fix = e.target.closest('[data-fix]');
    if (fix) return openMore('live', fix.dataset.fix === 'ทั้งหมด' ? '' : fix.dataset.fix);
    const hub = e.target.closest('[data-hub]');
    if (hub) return openSportHub(hub.dataset.hub);
    const past = e.target.closest('[data-past]'), pv = past && PAST_EPS.get(past.dataset.past);
    if (pv) { e.preventDefault(); return canPlayNow() ? nowPlayer(pv) : openDetail(TITLES.get(`${pv.type}/${pv.id}`) || pv); }
    const tm = e.target.closest('[data-team]');
    if (tm) return openTeam(tm.dataset.team, tm.dataset.league);
    const bell = e.target.closest('[data-bell]');
    if (bell) { const id = bell.dataset.bell, on = !REMINDERS.has(id); on ? REMINDERS.add(id) : REMINDERS.delete(id); syncReminders(); return; }
    const play = e.target.closest('[data-play]'), ev = play && (LIVE_FEED || []).find(x => x.id === play.dataset.play);
    if (ev) { e.preventDefault(); return canPlayNow() ? nowPlayer(ev) : openDetail(ev); }
    const more = e.target.closest('[data-more]');
    if (more) return openMore(more.dataset.more);
    const a = e.target.closest('a[href*="/watch/"]'), d = a && TITLES.get(watchKey(a.getAttribute('href')));
    if (d) { e.preventDefault(); openDetail(d); }
  });
  document.querySelector('.phone').appendChild(el);
  return el.querySelector('.mp-scroll');
}
function openSportPage() {
  const body = sportPageShell('กีฬา');
  sportData().then(() => {
    const now = Date.now(), live = LIVE_FEED.filter(e => e.sport !== 'บันเทิง'), shown = new Set();
    const sports = sportsWithEvents();
    const blocks = sports.map(name => {
      const evs = live.filter(e => e.sport === name), key = SPORT_VOD_KEY(name), own = key === 'more' || LEAGUE_LOGO[name];
      const vod = own ? vodFor(name) : !shown.has(key) && SPORT_VOD[key]; if (vod && !own) shown.add(key);
      return `<div class="sp-block">${sportHead(name)}${row(evs.slice(0, 10), evCard)}
        ${vod && vod.length ? vodRow(`ไฮไลท์และย้อนหลัง · ${own ? name : VOD_NAME[key]}`, vod) : ''}</div>`;
    }).join('');
    // replay shelves no block showed (a sport with nothing on, futsal)
    const rest = vodRow('ฟุตบอลรายการอื่น', footballRest()) + Object.keys(SPORT_VOD).filter(k => k !== 'football' && !shown.has(k)).map(k => vodRow(VOD_NAME[k], SPORT_VOD[k])).join('');
    // the top shelf wears the same header as the sport blocks: its title, and the pill for the whole schedule
    body.innerHTML = `<section class="shelf"><h2 class="shelf-h sp-h"><span>ไลฟ์สดและที่กำลังมา</span>${fixturesBtn('ทั้งหมด')}</h2>${row(live.filter(e => !e.end || e.end > now).slice(0, 10), evCard)}</section>
      ${blocks}${rest}`;
  });
}
// One sport's own page (the wireframes' "Sport - Hub"): a band in the sport's colour (its logo or icon, a line, the
// channels it's on), what's on air now as big cards, ช่องที่กำลังถ่ายทอด (Live TV channels whose programme now is this
// sport), the coming week as schedule rows by day (ไลฟ์สดและที่กำลังมา), ทีม (leagues: the clubs in its fixtures with their
// badges, built by scripts/build_teams.mjs; a team opens its own page), its highlights / full matches, and related
// films and series from the category feeds (only when a few really match).
const LEAGUE_TINT = { UCL: '#14307a', LaLiga: '#a3122a', 'Serie A': '#123f9c', 'Scottish Premiership': '#3d2466', 'วอลเลย์บอล': '#9a5a00',
  'มวยไทย': '#8a1616', 'แบดมินตัน': '#0d6b50', 'มอเตอร์สปอร์ต': '#943300', 'เทนนิส': '#4d7300', 'กอล์ฟ': '#1a5c27', 'สนุกเกอร์': '#0a5233' };
const SPORT_DESC = { UCL: 'ศึกสโมสรยุโรป ถ่ายทอดสดทุกนัด', LaLiga: 'ฟุตบอลลีกสเปน', 'Serie A': 'ฟุตบอลลีกอิตาลี', 'Scottish Premiership': 'ฟุตบอลลีกสกอตแลนด์',
  'วอลเลย์บอล': 'วอลเลย์บอลลีกไทยและต่างประเทศ', 'มวยไทย': 'ศึกมวยไทยจากเวทีชั้นนำ ทุกสัปดาห์', 'แบดมินตัน': 'แบดมินตันรายการระดับโลก',
  'มอเตอร์สปอร์ต': 'F1, MotoGP และการแข่งรถในไทย', 'เทนนิส': 'เทนนิสรายการใหญ่', 'กอล์ฟ': 'กอล์ฟทัวร์อาชีพ', 'สนุกเกอร์': 'สนุกเกอร์รายการอาชีพ' };
// what a programme or a film about the sport is called
const SPORT_WORDS = { UCL: /champions league|แชมเปียนส์|ucl/i, LaLiga: /laliga|ลา ?ลี?กา|ลา ?ลิกา/i, 'Serie A': /serie a|calcio|เซเรีย/i,
  'Scottish Premiership': /scottish|spfl|สกอตติช/i, 'วอลเลย์บอล': /volley|วอลเลย์/i, 'มวยไทย': /มวย|muay|boxing|fight/i, 'แบดมินตัน': /badminton|แบดมินตัน|bwf/i,
  'มอเตอร์สปอร์ต': /\bF1\b|formula|moto ?gp|racing|แข่งรถ|grand prix/i, 'เทนนิส': /tennis|เทนนิส|wta|atp/i, 'กอล์ฟ': /golf|กอล์ฟ|lpga|pga/i, 'สนุกเกอร์': /snooker|สนุกเกอร์/i };
const RELATED_WORDS = { football: /ฟุตบอล|football|soccer|ลูกหนัง|ตะลุมบอน/i, 'มวยไทย': /มวย|muay|boxing|นักชก|ต่อยมวย|ong-bak|องค์บาก/i,
  'มอเตอร์สปอร์ต': /\bF1\b|formula|racing|แข่งรถ|ซิ่ง|rush|ford v ferrari|drive to survive/i, 'เทนนิส': /tennis|เทนนิส/i, 'กอล์ฟ': /golf|กอล์ฟ/i,
  'แบดมินตัน': /badminton|แบดมินตัน/i, 'วอลเลย์บอล': /volley|วอลเลย์|haikyu|ไฮคิว/i, 'สนุกเกอร์': /snooker|สนุกเกอร์/i };
let CAT_LOAD = {};
const loadCat = c => CAT_DATA[c] ? Promise.resolve(CAT_DATA[c]) : CAT_LOAD[c] || (CAT_LOAD[c] = fetch(`/api/now-home?cat=${c}`).then(r => r.json()).then(sh => (CAT_DATA[c] = sh)).catch(() => []));
const loadChannels = () => CHANNEL_GROUPS ? Promise.resolve() : fetch('/api/now-home?channels=1').then(r => r.json()).then(g => {
  CHANNEL_GROUPS = g; g.forEach(x => x.items.forEach(it => { const k = `${it.type}/${it.id}`; if (!TITLES.has(k)) TITLES.set(k, it); })); }).catch(() => {});
const loadTeams = () => TEAMS ? Promise.resolve() : fetch('/now-app/teams.json').then(r => r.json()).then(t => { TEAMS = t; }).catch(() => { TEAMS = {}; });
const allChannels = () => (CHANNEL_GROUPS || []).flatMap(g => g.items).filter((c, i, a) => a.findIndex(x => x.id === c.id) === i);
const teamBadge = (name, cls = '') => { const t = (TEAMS || {})[name], f = FLAGS[name.toLowerCase()];
  return t && t.badge ? `<span class="tm-badge ${cls}"><img src="/now-app/img/teams/${t.badge}" alt=""></span>`
    : f ? `<span class="tm-badge flag ${cls}"><img src="https://flagcdn.com/w160/${f}.png" alt=""></span>` : `<span class="tm-badge ${cls}">${crest(name)}</span>`; };
// a band in the sport's colour: logo or icon, the sport's name and line, and the channels its events are on
function sportBand(name, evs, sub) {
  const nums = [...new Set(evs.map(e => e.ch).filter(Boolean))].slice(0, 3), chs = allChannels();
  const label = n => { const c = chs.find(x => String(x.ch) === String(n)); return c ? `${esc(c.t.replace(/\s*-\s*Now$/i, ''))} (${esc(n)})` : `ช่อง ${esc(n)}`; };
  const mark = LEAGUE_LOGO[name] ? `<span class="sb-mark logo"><img src="/now-app/img/live/logos/${LEAGUE_LOGO[name]}" alt=""></span>`
    : (TEAMS || {})[name] ? teamBadge(name, 'sb-mark') : `<span class="sb-mark">${sportIc(name)}</span>`;
  return `<div class="sp-band" style="--tint:${LEAGUE_TINT[name] || LEAGUE_TINT[sub] || '#2a2a2e'}">${mark}<div><h2>${esc(name)}</h2>
    <p>${esc(SPORT_DESC[name] || (sub ? `ทีมใน ${sub}` : ''))}</p>${nums.length ? `<small>ดูได้ทาง ${nums.map(label).join(' · ')}</small>` : ''}</div></div>`;
}
function channelsNow(name, evs) {
  const re = SPORT_WORDS[name], nums = new Set(evs.map(e => String(e.ch))), now = Date.now();
  const list = allChannels().filter(c => c.prog && c.ps <= now && c.pe > now && ((re && re.test(c.prog)) || (nums.has(String(c.ch)) && re && re.test(c.t))));
  return list.length ? `<section class="shelf">${head('ช่องที่กำลังถ่ายทอด')}${row(list.slice(0, 8), tvCard)}</section>` : '';
}
function relatedRow(name) {
  const re = RELATED_WORDS[LEAGUE_LOGO[name] ? 'football' : name];
  if (!re) return '';
  const seen = new Set(), list = ['movie', 'series'].flatMap(c => (CAT_DATA[c] || []).flatMap(s => s.items))
    .filter(t => /^tvs-(movie|series)$/.test(t.type) && re.test(t.t) && !seen.has(t.id) && seen.add(t.id));
  list.forEach(t => { const k = `${t.type}/${t.id}`; if (!TITLES.has(k)) TITLES.set(k, t); });
  return list.length >= 3 ? `<section class="shelf">${head('หนังและซีรีส์ที่เกี่ยวข้อง')}${row(list.slice(0, 18), poster)}</section>` : '';
}
function teamsRow(name, evs) {
  if (!LEAGUE_LOGO[name]) return '';
  const names = [...new Set(evs.flatMap(e => matchOf(e.t).sides || []))];
  return names.length ? `<section class="shelf">${head('ทีม')}<div class="row tm-row">${names.map(n => `<button class="tm" data-team="${esc(n)}" data-league="${esc(name)}">${teamBadge(n)}<span>${esc(n)}</span></button>`).join('')}</div></section>` : '';
}
function openSportHub(name) {
  const body = sportPageShell(name);
  Promise.all([sportData().then(() => pastData(name)), loadChannels(), loadTeams(), loadCat('movie'), loadCat('series')]).then(() => {
    const now = Date.now(), evs = LIVE_FEED.filter(e => e.sport === name && (!e.end || e.end > now)), vod = vodFor(name);
    const hl = vod.filter(t => /ไฮไลท์|highlight/i.test(t.t)), full = vod.filter(t => !hl.includes(t)), league = !!LEAGUE_LOGO[name];
    // three rails: what's live and coming, then (leagues) past full matches and highlights, match by match
    const past = league ? pastRails(name) : pastRailAny(name);
    body.innerHTML = `${sportBand(name, evs)}${liveRail(evs, name)}${past}${channelsNow(name, evs)}${teamsRow(name, evs)}
      ${league ? (past ? '' : vodRow('ไฮไลท์และย้อนหลัง', vod)) : vodRow('รายการย้อนหลังทั้งหมด', vod)}
      ${league ? vodRow('ฟุตบอลรายการอื่น', footballRest()) : ''}${relatedRow(name)}${!evs.length && !vod.length ? '<p class="mp-err">ยังไม่มีรายการ</p>' : ''}`;
    body.querySelectorAll('[data-trim]').forEach(trimLogo); tvTick(body);
  });
}
// Past matches: each replay series' episodes (api/now-home.js?eps=, from the NOW website, played matches only, newest
// first) as rows: the series picture with the match date, the match, a play button, and a ไฮไลท์ button when the
// highlights series has the same match. A league page lists its latest; a team page the ones it played in.
const EPS = {}, PAST_EPS = new Map();
const loadEps = id => EPS[id] ? Promise.resolve(EPS[id]) : fetch(`/api/now-home?eps=${id}`).then(r => r.json()).catch(() => []).then(l => (EPS[id] = l));
const epMatch = t => t.replace(/\s*\(.*$/, '').trim();
const epDay = t => (t.match(/\((\d{1,2}\s*[ก-๙.]+)\)/) || [])[1] || '';
function pastData(name) {
  const vod = vodFor(name).slice(0, PAST_SERIES);
  return Promise.all(vod.map(t => loadEps(t.id)));
}
// a past match's picture, composed like the NOW app's episode cards (the feeds carry no per-match image): the series
// picture behind a panel with the match date, the two crests with a play button between, their names, and the
// FULL MATCH / HIGHLIGHTS bar
function epArt(sr, e, match, kind) {
  const sides = match.split(/\s+พบ\s+/), day = new Date(e.at).toLocaleDateString('en-GB', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
  const short = n => ((TEAMS || {})[n] || {}).en || n;
  const mid = sides.length === 2 ? `<span class="ep-vs">${teamBadge(sides[0])}<i>${playGlyph}</i>${teamBadge(sides[1])}</span>
    <span class="ep-names"><b>${esc(short(sides[0]))}</b><b>${esc(short(sides[1]))}</b></span>` : `<b class="ep-one">${esc(match)}</b>`;
  return `<span class="ev-pic ep-pic">${img(sr.land || sr.poster, '')}<span class="ep-box"><small>${esc(day)}</small>${mid}</span>
    <i class="ep-tag">${kind === 'hl' ? 'HIGHLIGHTS' : 'FULL MATCH'}</i></span>`;
}
const playGlyph = '<svg width="14" height="14" viewBox="0 0 24 24" fill="#1d2d8f"><path d="M8 5v14l11-7z"/></svg>';
// a rail of past matches as cards (the series picture with the match date, the competition, the match): kind 'full'
// for the full-match series' episodes, 'hl' for the highlights'; only = a team's name
function pastRail(name, only, kind) {
  const vod = vodFor(name).filter(t => /ไฮไลท์|highlight/i.test(t.t) === (kind === 'hl'));
  let list = vod.flatMap(sr => (EPS[sr.id] || []).map(e => ({ sr, e })));
  if (only) list = list.filter(x => x.e.t.includes(only));
  list.sort((a, b) => b.e.at - a.e.at);
  if (!list.length) return '';
  const cards = list.slice(0, 16).map(({ sr, e }) => {
    const m = epMatch(e.t), key = `${sr.id}|${e.id}`;
    PAST_EPS.set(key, { ...sr, t: kind === 'hl' ? `${m} (ไฮไลท์)` : m });
    return `<a class="ev-card" data-past="${key}">${epArt(sr, e, m, kind)}
      <span class="ev-comp">${kind === 'hl' ? 'ไฮไลท์' : 'เต็มแมตช์'}</span><span class="ev-t">${esc(m)}</span></a>`;
  }).join('');
  return `<section class="shelf">${head(kind === 'hl' ? 'ไฮไลท์' : 'ย้อนหลังเต็มแมตช์')}<div class="row">${cards}</div></section>`;
}
const pastRails = (name, only) => pastRail(name, only, 'full') + pastRail(name, only, 'hl');
// other sports: one ย้อนหลังล่าสุด rail of the latest episodes across the sport's replay series (fight nights, races,
// matches), the series picture with the date and the series name over the episode
const epClean = (e, sr) => e.t.replace(/\s*\([^)]*\)\s*/g, ' ').replace(sr.t, '').replace(/\s*:\s*$|^\s*:\s*/g, '').replace(/\s+/g, ' ').trim() || sr.t;
function pastRailAny(name) {
  const list = vodFor(name).slice(0, PAST_SERIES).flatMap(sr => (EPS[sr.id] || []).map(e => ({ sr, e }))).sort((a, b) => b.e.at - a.e.at).slice(0, 16);
  if (!list.length) return '';
  return `<section class="shelf">${head('ย้อนหลังล่าสุด')}<div class="row">${list.map(({ sr, e }) => {
    const key = `${sr.id}|${e.id}`, t = epClean(e, sr), day = new Date(e.at).toLocaleDateString('th-TH', { timeZone: TZ, day: 'numeric', month: 'short' });
    PAST_EPS.set(key, { ...sr, t: `${sr.t}: ${t}` });
    return `<a class="ev-card" data-past="${key}"><span class="ev-pic">${img(sr.land || sr.poster, '')}<i class="ev-time">${esc(day)}</i></span>
      <span class="ev-comp">${esc(t === sr.t ? 'ย้อนหลัง' : sr.t)}</span><span class="ev-t">${esc(t)}</span></a>`;   // a fight night is only its series and date
  }).join('')}</div></section>`;
}
const PAST_SERIES = 8;
// ไลฟ์สดและที่กำลังมา as a rail of picture cards, the ตารางแข่งขัน pill in its header
const liveRail = (evs, sport) => evs.length ? `<section class="shelf"><h2 class="shelf-h sp-h"><span>ไลฟ์สดและที่กำลังมา</span>${sport ? fixturesBtn(sport) : ''}</h2>${row(evs, evCard)}</section>` : '';
// a team's page: the band with its badge, its matches, the replays that name it
function openTeam(team, league) {
  const body = sportPageShell(team);
  Promise.all([sportData().then(() => pastData(league)), loadChannels(), loadTeams()]).then(() => {
    const now = Date.now(), en = ((TEAMS || {})[team] || {}).en || '';
    const evs = LIVE_FEED.filter(e => (!e.end || e.end > now) && (matchOf(e.t).sides || []).includes(team));
    const vod = vodFor(league).filter(t => t.t.includes(team) || (en && t.t.toLowerCase().includes(en.toLowerCase())));
    body.innerHTML = `${sportBand(team, evs, league)}
      ${liveRail(evs)}${pastRails(league, team)}`;   // no ตารางแข่งขัน pill on a team's page
  });
}
function openMore(page, preset = '') {
  if (page === 'sport') return openSportPage();
  if (CAT_PAGES[page]) return openCategory(page);
  if (page === 'live' && LOOK === 'apple') {
    const draw = openSchedule(preset);
    if (LIVE_FEED) return draw();
    return fetch('/api/now-home?live=1').then(r => r.json()).then(list => { liveMerge(list); draw(); }).catch(() => { liveMerge([]); draw(); });
  }
  const el = document.createElement('section'), title = page === 'tv' ? 'ทีวีสด' : 'ไลฟ์สดและที่กำลังมา';
  el.className = 'mpage';
  // the same title bar as ใหม่ 2's schedule (Figma): grey, the design's back arrow, the title centred
  el.innerHTML = `<header class="sc-top"><button class="sc-back" aria-label="กลับ">${scIc('back')}</button><h1>${title}</h1></header>${page === 'live' ? '<div class="mp-bar"></div>' : ''}
    <div class="mp-scroll">${page === 'tv' && CHANNEL_GROUPS ? tvGroups() : page === 'live' && LIVE_FEED ? '' : '<div class="loading"><i></i></div>'}</div>`;
  const body = el.querySelector('.mp-scroll'), bar = el.querySelector('.mp-bar');
  const fill = () => { body.querySelectorAll('[data-trim]').forEach(trimLogo); tvTick(body); };
  let sport = preset, day = '';
  // scroll-spy, as in the mini app: the day whose section sits at the top of the list is the current day; the
  // calendar button turns white whenever that's past today (scrolled down, or a tab whose events start later)
  const spy = () => {
    const calb = bar && bar.querySelector('.mp-calb');
    if (!calb) return;
    const top = body.getBoundingClientRect().top + 12;
    let cur = '';
    body.querySelectorAll('.mp-day').forEach(sec => { if (!cur || sec.getBoundingClientRect().top <= top) cur = sec.dataset.day; });
    day = cur;
    calb.classList.toggle('on', !!cur && cur !== DAY_KEY(Date.now()));
  };
  body.addEventListener('scroll', () => requestAnimationFrame(spy), { passive: true });
  const drawLive = () => {
    const evs = LIVE_FEED.filter(e => !sport || e.sport === sport);
    bar.innerHTML = liveFilters(LIVE_FEED, sport);
    bar.querySelector('.mp-calb').classList.toggle('on', !!day && day !== DAY_KEY(Date.now()));
    body.innerHTML = `<div class="mp-live">${liveDays(evs)}</div>`; body.scrollTop = 0;
    const on = bar.querySelector('.mp-chips .on'); on && on.scrollIntoView({ inline: 'nearest', block: 'nearest' });
    spy();   // a tab whose first event is after today (UCL on Wednesday) lights the calendar button straight away
  };
  const calendar = () => {
    const old = el.querySelector('.mp-cal');
    if (old) return old.remove();
    const has = new Set([...body.querySelectorAll('.mp-day')].map(d => d.dataset.day)), today = DAY_KEY(Date.now());
    const keys = Array.from({ length: 7 }, (_, i) => DAY_KEY(Date.now() + i * 864e5));
    bar.insertAdjacentHTML('beforeend', `<div class="mp-cal" role="listbox" aria-label="เลือกวันที่">${keys.map(k => `<button role="option" data-day="${k}"
      class="${k === (day || today) ? 'on' : has.has(k) ? '' : 'none'}">${k === today ? 'วันนี้' : thDay(k, { weekday: 'short', day: 'numeric', month: 'short' })}</button>`).join('')}</div>`);
  };
  el.addEventListener('click', e => {
    if (e.target.closest('.sc-back')) { el.classList.add('out'); return setTimeout(() => el.remove(), 250); }
    if (e.target.closest('.mp-calb')) return calendar();
    const pick = e.target.closest('.mp-cal [data-day]');
    if (pick) {
      day = pick.dataset.day; el.querySelector('.mp-cal').remove();
      bar.querySelector('.mp-calb').classList.toggle('on', day !== DAY_KEY(Date.now()));
      const sec = [...body.querySelectorAll('.mp-day')].find(d => d.dataset.day >= day);
      if (sec) body.scrollTo({ top: sec.offsetTop - 8, behavior: 'smooth' });
      return;
    }
    if (el.querySelector('.mp-cal') && !e.target.closest('.mp-cal')) el.querySelector('.mp-cal').remove();
    const tab = e.target.closest('[data-sport]');
    if (tab) { sport = tab.dataset.sport; day = ''; return drawLive(); }
    const a = e.target.closest('a[href*="/watch/"]'), d = a && TITLES.get(watchKey(a.getAttribute('href')));
    if (d) { e.preventDefault(); openDetail(d); }
  });
  document.querySelector('.phone').appendChild(el);
  fill();
  const keep = list => list.forEach(it => { const k = `${it.type}/${it.id}`; if (!TITLES.has(k)) TITLES.set(k, it); });
  if (page === 'live') {
    // the sport feed has the sports; the home row's events it doesn't have join in (live events aren't always sport:
    // award shows and concerts go under บันเทิง), so the page always holds everything the row showed
    const merge = list => { liveMerge(list); drawLive(); };
    if (LIVE_FEED) drawLive();
    else fetch('/api/now-home?live=1').then(r => r.json()).then(merge).catch(() => merge([]));
  }
  if (page === 'tv' && !CHANNEL_GROUPS) fetch('/api/now-home?channels=1').then(r => r.json()).then(g => {
    CHANNEL_GROUPS = g;
    g.forEach(x => keep(x.items));
    body.innerHTML = tvGroups(); fill();
  }).catch(() => { body.innerHTML = '<p class="mp-err">โหลดช่องไม่สำเร็จ</p>'; });
}
const lockIc = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
// minutes left and the progress bar, kept current every 30 s
let tvTimer;
function tvTick(root) {
  const now = Date.now();
  root.querySelectorAll('.tv-left').forEach(el => {
    const ps = +el.dataset.ps, pe = +el.dataset.pe, on = ps && pe && now >= ps && now < pe;
    el.innerHTML = on ? `<i>เหลือ ${Math.max(1, Math.ceil((pe - now) / 6e4))} นาที</i><u><s style="width:${(now - ps) / (pe - ps) * 100}%"></s></u>` : '';
  });
}
function liveRow(s, items) {
  const now = Date.now();
  if (!items.length) return '';
  return shelf(s, row(items, it => {
    const onNow = it.type === 'tvs-live' && it.start <= now;
    const label = `<span class="when">${it.type === 'tvs-live' ? '' : nowBadge(it)}<span class="${onNow ? 'live-pill' : ''}">${onNow ? 'LIVE' : when(it.start)}</span></span>`;
    return landCard(it, label);
  }));
}

// New looks: the feed's background-header shelf (today The Voice: "Presented by True 5G") as a brand band like
// Lemino's (hub-solo): the title's logo (from the hero item that carries it, cropped by trimLogo), the shelf's line and
// ดูทั้งหมด, scrolling out with its posters
function headerBand(s) {
  const logo = (s.items.map(i => TITLES.get(`${i.type}/${i.id}`)).find(t => t && t.logo) || {}).logo;
  return `<section class="shelf hub hub-solo hub-bgh"><div class="hub-body"><div class="hub-stage">
      <h2 class="hub-name">${logo ? `<img class="hub-logo" src="${esc(logo)}" alt="${esc(s.title)}" data-trim>` : `<span class="hub-logo wm-text">${esc(s.title)}</span>`}</h2>
      <p>${esc(s.tag || s.title)}</p><a class="hub-btn">ดูทั้งหมด</a></div>${row(s.items, poster)}</div></section>`;
}
function backgroundHeader(s) {
  return `<section class="shelf bgh">${img(s.bg).replace('<img', '<img class="bgh-img"')}
    <div class="bgh-body"><div class="bgh-tag">${esc(s.tag)}</div>${head(s.title)}${row(s.items, poster)}</div></section>`;
}
const ranking = s => shelf(s, row(s.items.slice(0, 10), (it, i) => `<div class="rank"><b>${i + 1}</b>${poster(it)}</div>`));

function netflix(s) {
  const b = s.items.find(it => it.ctx === 'not_entitled' && it.banner);
  return b ? `<section class="shelf"><a class="banner" href="${NETFLIX_URL}" target="_blank" rel="noopener">${img(b.banner, 'Netflix')}</a></section>` : '';
}

function shorts(s) {
  const cards = s.items.slice(0, 6);
  return `<section class="shelf shorts" ${colors(s)}>
    <h2 class="shelf-h">${bolt}${esc(s.title)}${s.more ? chev : ''}</h2>
    <div class="stack" data-stack>${cards.map(it => `<div class="sc">${img(it.poster, it.t)}<span>${esc(it.t)}</span></div>`).join('')}</div>
  </section>`;
}
// Card i sits behind card i-1, 43pt further right and 10% smaller, like the app's vertical-series deck.
function layoutStack(el) {
  [...el.children].forEach((c, i) => {
    c.style.transform = `translateX(${Math.min(i, 3) * 43}px) scale(${1 - Math.min(i, 3) * 0.1})`;
    c.style.zIndex = 10 - i;
    c.style.opacity = i > 3 ? 0 : 1;
  });
}

const onlyNow = s => `<section class="shelf onlynow">${head(s.title)}${row(s.items, it => `<a class="on-card" ${link(it)}>
  <div class="land">${nowBadge(it)}${img(it.land, it.t)}</div><h3>${esc(it.t)}</h3><p>${esc(it.syn)}</p></a>`)}</section>`;

const nest = s => `<section class="nest" ${colors(s)}><h2 class="shelf-h">${esc(s.title)}${s.more ? chev : ''}</h2>${row(s.items, poster)}</section>`;

const channels = s => `<section class="shelf"><h2 class="shelf-h">${esc(s.title)}${chev}</h2>${row(s.items, it => `<a class="chan" ${link(it)}>
  ${img(it.logo, it.t)}<span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ddd" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2" stroke-linecap="round"/></svg>${esc(it.ch)}</span></a>`)}</section>`;

// New look card shapes: only poster (2:3), landscape (16:9) and the square channel tile. The vertical-series deck and
// the oversized Only-on-NOW cards become ordinary rows; The Voice row uses full-size posters (CSS, body.look-new).
// Vertical series stand out by size (the one oversized poster row), an on-card "vertical" chip + title, and by opening
// a full-screen swipe player instead of a title page.
const phoneIcon = '<svg width="10" height="14" viewBox="0 0 10 14" fill="none" stroke="#fff" stroke-width="1.6"><rect x=".8" y=".8" width="8.4" height="12.4" rx="2"/><path d="M4 10.8h2" stroke-linecap="round"/></svg>';
let SHORTS = [];
function shortsRow(s) {
  SHORTS = s.items;
  return `<section class="shelf shorts" ${colors(s)}>
    <h2 class="shelf-h">${bolt}${esc(s.title)}${s.more ? chev : ''}</h2>
    <p class="shorts-sub">ดูจบไว ตอนละไม่กี่นาที · ปัดขึ้นดูเรื่องถัดไป</p>
    ${row(s.items, (it, i) => `<a class="poster vcard" data-v="${i}">${img(it.poster, it.t)}
      <span class="vchip">${phoneIcon}แนวตั้ง</span></a>`)}
  </section>`;
}

// Thai genre labels, as in scripts/build_titles.py (plus the short-series slugs)
const GENRE_TH = {
  action: 'แอ็กชัน', adventure: 'ผจญภัย', animation: 'แอนิเมชัน', comedy: 'คอมเมดี้', crime: 'อาชญากรรม', documentary: 'สารคดี',
  drama: 'ดราม่า', family: 'ครอบครัว', fantasy: 'แฟนตาซี', gameshow: 'เกมโชว์', horror: 'สยองขวัญ', music: 'ดนตรี',
  mystery: 'ลึกลับ', news: 'ข่าว', reality: 'เรียลลิตี้', romance: 'โรแมนซ์', 'ceo-romance': 'โรแมนซ์', 'sci-fi': 'ไซไฟ',
  sports: 'กีฬา', talkshow: 'ทอล์กโชว์', thriller: 'ระทึกขวัญ', varietyshow: 'วาไรตี้โชว์', war: 'สงคราม',
};
const icon = {
  heart: '<svg width="30" height="30" viewBox="0 0 24 24"><path d="M12 20.5s-7.5-4.6-9.2-9.3C1.6 7.8 4 4.5 7.3 4.5c2 0 3.6 1.1 4.7 2.7 1.1-1.6 2.7-2.7 4.7-2.7 3.3 0 5.7 3.3 4.5 6.7-1.7 4.7-9.2 9.3-9.2 9.3z"/></svg>',
  save: '<svg width="30" height="30" viewBox="0 0 24 24"><path d="M6 3.5h12v17l-6-4.2-6 4.2z"/></svg>',
  share: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"><path d="M14 4.5 21 11l-7 6.5V14c-5 0-8.5 1.5-11 5.5 1-5.5 4-10 11-11z"/></svg>',
  list: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h10"/></svg>',
};

// Full-screen vertical player: one series per screen, swipe (scroll-snap) up for the next. The feed has no clips for
// these, so the poster stands in for the video: a slow zoom and a progress bar suggest playback; tap pauses.
function openShorts(start) {
  const phone = document.querySelector('.phone');
  const el = document.createElement('div');
  el.className = 'vplayer';
  el.innerHTML = `<div class="vp-top"><button class="vp-close" aria-label="ปิด"><svg width="26" height="26" viewBox="0 0 24 24" stroke="#fff" stroke-width="2.4" stroke-linecap="round"><path d="M15 5l-7 7 7 7"/></svg></button><b>ซีรีส์แนวตั้ง</b></div>
    <div class="vp-track">${SHORTS.map(it => `<section class="vp-slide">
      <img src="${esc(it.poster)}" alt="">
      <span class="vp-paused"><svg width="64" height="64" viewBox="0 0 24 24"><path fill="#fff" d="M8 5v14l11-7z"/></svg></span>
      <div class="vp-rail">
        <button data-act="like">${icon.heart}<small>ถูกใจ</small></button>
        <button data-act="save">${icon.save}<small>บันทึก</small></button>
        <button>${icon.list}<small>ตอนทั้งหมด</small></button>
        <button>${icon.share}<small>แชร์</small></button>
      </div>
      <div class="vp-info">
        <span class="vp-ep">EP.1</span>${(it.genres || []).map(g => GENRE_TH[g]).filter(Boolean).slice(0, 1).map(g => `<span class="vp-ep">${g}</span>`).join('')}
        <h3>${esc(it.t)}</h3><p>${esc(it.syn)}</p>
      </div>
      <i class="vp-bar"><i></i></i>
    </section>`).join('')}</div>
    <div class="vp-hint">ปัดขึ้นเพื่อดูเรื่องถัดไป</div>`;
  phone.appendChild(el);
  const track = el.querySelector('.vp-track'), slides = [...el.querySelectorAll('.vp-slide')];
  // set after the first layout: Chrome re-snaps a just-inserted snap container back to its first slide
  requestAnimationFrame(() => { track.scrollTop = start * track.clientHeight; });
  const io = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('on', e.isIntersecting)), { root: track, threshold: 0.6 });
  slides.forEach(s => io.observe(s));
  const close = () => { io.disconnect(); el.classList.add('out'); setTimeout(() => el.remove(), 250); document.removeEventListener('keydown', key); };
  const key = e => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', key);
  el.querySelector('.vp-close').onclick = close;
  track.addEventListener('scroll', () => el.querySelector('.vp-hint').classList.add('gone'), { once: true, passive: true });
  el.addEventListener('click', e => {
    const b = e.target.closest('.vp-rail button');
    if (b) { if (b.dataset.act) b.classList.toggle('active'); return; }
    const s = e.target.closest('.vp-slide');
    if (s) s.classList.toggle('paused');
  });
}
// New look Only on NOW, Disney+ "Recommended For You"-style: tall poster cards (the feed's posters carry the title)
// with one details line on the card: age rating chip, year, genre. Plain rail name, no NOW badges (the whole rail is
// exclusive).
const EXCL_MAX = 12;
function exclMeta(it) {
  const bits = [it.year, (it.genres || []).map(g => GENRE_TH[g]).find(Boolean)].filter(Boolean).map(esc).join(' • ');
  return `${it.rate ? `<i class="rate">${esc(it.rate)}</i>` : ''}${bits}`;
}
function onlyNowRow(s) {
  const items = s.items.filter(it => it.poster).slice(0, EXCL_MAX);
  if (!items.length) return '';
  return shelf(s, `<div class="row excl-row">${items.map(it => `<a class="excl-card" ${link(it)}>${img(it.poster, it.t)}
    <span class="excl-meta">${exclMeta(it)}</span></a>`).join('')}</div>`, 'excl');
}
// New looks Top 10: plain poster-size cards with the rank inside the poster: MonoMax-style in ใหม่, Apple TV-style in
// ใหม่ 2 (CSS .rank-in b).
const rankingIn = s => shelf(s, row(s.items.slice(0, 10), (it, i) =>
  `<a class="poster rank-in" ${link(it)}>${nowBadge(it)}${img(it.poster || it.land, it.t)}<b>${i + 1}</b></a>`));
// New look partners: the coloured partner panels (iQIYI, WeTV, VIU) become one Disney+-style brand hub: brand chips,
// the chosen partner's mark and tagline over a backdrop in its colours, then its titles. Lemino isn't a partner, so it
// keeps its own section in the same style without the chips (`own`). Keyed by the feed's shelf title.
const PARTNERS = {
  // Lemino: white wordmark cut from its app icon, and the icon's own gradient as the section backdrop (CSS .hub-lemino)
  'Lemino Japanese Collection': { name: 'Lemino', logo: '/img/partners/lemino-white.png', tag: 'ซีรีส์และหนังญี่ปุ่นคัดพิเศษจาก Lemino', own: 'hub-lemino' },
  // white wordmarks: iQIYI cut from its app icon, VIU from the public-domain Commons SVG; no WeTV wordmark to hand yet,
  // so it is set as text
  // `ci` = brand colours [top-right, bottom-left], sampled from each partner's own icon / logo file (the feed's panel
  // colours are off-brand): iQIYI green, WeTV's icon blues, VIU's logo yellow
  iQIYI: { name: 'iQIYI', logo: '/img/partners/iqiyi-white.png', tag: 'ซีรีส์จีน ไทย และเอเชียสุดฮิตจาก iQIYI', ci: ['#00DC5A', '#00DC5A'] },
  'We TV': { name: 'WeTV', tag: 'ซีรีส์จีนย้อนยุคและโรแมนซ์จาก WeTV', ci: ['#48C0F8', '#0080F0'] },
  VIU: { name: 'viu', logo: '/img/partners/viu-white.svg', tag: 'ซีรีส์ไทยและเกาหลีจาก VIU', ci: ['#F5B919', '#F5B919'] },
};
let HUB = [];
const partner = s => PARTNERS[s.title] || { name: s.title, tag: '' };
const ci = s => partner(s).ci || s.colors;
const ciStyle = s => `style="--c1:${esc(ci(s)[0] || '#222')};--c2:${esc(ci(s)[1] || ci(s)[0] || '#111')}"`;
const wordmark = (p, cls) => p.logo ? `<img class="${cls}" src="${p.logo}" alt="${esc(p.name)}">` : `<span class="${cls} wm-text">${esc(p.name)}</span>`;
const hubStage = s => {
  const p = partner(s);
  return `<div class="hub-stage"><h2 class="hub-name">${wordmark(p, 'hub-logo')}</h2><p>${esc(p.tag)}</p>
    <a class="hub-btn">ดูทั้งหมด</a></div>${row(s.items, poster)}`;
};
const brandSection = s => `<section class="shelf hub hub-solo ${partner(s).own}" ${colors(s)}><div class="hub-body">${hubStage(s)}</div></section>`;
// Partners rotate on a timer so each gets equal airtime: the selected chip fills like a story bar (CSS animation,
// HUB_MS long) and its end moves to the next partner. The fill only runs while the section is on screen and nobody is
// touching or hovering it, so the time each partner gets is time actually seen. The first partner is random per page
// load so none always gets the first impression; a tap shows that partner and restarts its timer.
const HUB_MS = 6000;
function partnerHub(nests) {
  HUB = nests;
  const first = Math.floor(Math.random() * nests.length);
  return `<section class="shelf hub paused" ${ciStyle(nests[first]).replace(/"$/, `;--hub-ms:${HUB_MS}ms"`)}>
    <div class="hub-chips">${nests.map((s, i) => `<button class="${i === first ? 'on' : ''}" data-hub="${i}" aria-label="${esc(partner(s).name)}">${wordmark(partner(s), 'chip-logo')}</button>`).join('')}</div>
    <div class="hub-body">${hubStage(nests[first])}</div>
  </section>`;
}
function wireHub(screen) {
  const hub = screen.querySelector('.hub:not(.hub-solo)');
  if (!hub) return;
  const chips = hub.querySelector('.hub-chips'), buttons = [...chips.querySelectorAll('[data-hub]')], body = hub.querySelector('.hub-body');
  const show = i => {
    const s = HUB[i], b = buttons[i];
    buttons.forEach(x => x.classList.toggle('on', x === b));   // re-adding .on restarts the chip's fill
    chips.scrollTo({ left: b.offsetLeft - chips.offsetLeft - 20, behavior: 'smooth' });
    hub.style.setProperty('--c1', ci(s)[0] || '#222'); hub.style.setProperty('--c2', ci(s)[1] || ci(s)[0] || '#111');
    body.classList.add('fade');
    setTimeout(() => { body.innerHTML = hubStage(s); body.classList.remove('fade'); }, 180);
  };
  buttons.forEach((b, i) => b.addEventListener('click', () => show(i)));
  chips.addEventListener('animationend', e => {
    if (e.animationName === 'hub-timer') show((buttons.indexOf(e.target) + 1) % buttons.length);
  });
  // pause: off screen, or someone is touching / hovering the section
  let visible = false, held = false;
  const sync = () => hub.classList.toggle('paused', !visible || held);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); }, { root: screen, threshold: 0.5 }).observe(hub);
  hub.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { held = true; sync(); } });
  hub.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { held = false; sync(); } });
  hub.addEventListener('touchstart', () => { held = true; sync(); }, { passive: true });
  hub.addEventListener('touchend', () => { held = false; sync(); });
  hub.addEventListener('touchcancel', () => { held = false; sync(); });
}
const isLive = s => s.kind === 'coming_shelf' && s.items.some(it => it.type === 'tvs-live');

// Shelf kinds a page add-on brings with it (now-appCP's True Exclusive rail): kind -> (shelf, shelves) => html
const EXTRA_SHELVES = {};
function render(shelves) {
  LIVE_HERO = liveHero(shelves);
  const upcoming = shelves.find(isLive), hasLiveNow = shelves.some(s => s.kind === 'title_shelf');
  const nests = shelves.filter(s => s.kind === 'nest_shelf' && !partner(s).own);
  return shelves.map(s => {
    if (EXTRA_SHELVES[s.kind]) return EXTRA_SHELVES[s.kind](s, shelves);
    if (LOOK !== 'classic') {
      if (s.kind === 'hero_banner_shelf') return LOOK === 'apple' ? heroFade(s) : heroCards(s);
      if (s.kind === 'nest_shelf') return partner(s).own ? brandSection(s) : s === nests[0] ? partnerHub(nests) : '';
      if (s === upcoming) return hasLiveNow ? '' : liveMerged(null, upcoming);
      if (s.kind === 'title_shelf') return liveMerged(s, upcoming);
      if (s.kind === 'livetv_shelf') return liveTv(s);
      if (s.kind === 'short_shelf') return shortsRow(s);
      if (s.kind === 'only_now_shelf') return onlyNowRow(s);
      if (s.kind === 'ranking_shelf') return rankingIn(s);
      if (s.kind === 'background_header_shelf') return headerBand(s);
    }
    switch (s.kind) {
      case 'hero_banner_shelf': return hero(s);
      case 'continue': return continueWatching(s, shelves);
      case 'mylist': return myList(s, shelves);
      case 'title_shelf': return live(s, true);
      case 'coming_shelf': return live(s, false);
      case 'background_header_shelf': return backgroundHeader(s);
      case 'ranking_shelf': return ranking(s);
      case 'contextual_shelf': return netflix(s);
      case 'short_shelf': return shorts(s);
      case 'only_now_shelf': return onlyNow(s);
      case 'nest_shelf': return nest(s);
      case 'livetv_shelf': return channels(s);
      default: return s.items.length ? shelf(s, row(s.items, poster)) : '';
    }
  }).join('');
}

function onScroll(screen) {
  const phone = document.querySelector('.phone');
  // the header's pill row (ใหม่ / ใหม่ 2) folds away while scrolling down and comes back on any scroll up or near the
  // top; small jitters (under 6 px) don't count. The tab bar stays full size (it used to fold to the selected tab).
  let lastY = 0;
  screen.addEventListener('scroll', () => {
    const y = screen.scrollTop, d = y - lastY;
    phone.classList.toggle('scrolled', y > 40);
    if (y < 80 || d < -6) phone.classList.remove('pills-hide');
    else if (d > 6) phone.classList.add('pills-hide');
    if (y < 80 || Math.abs(d) > 6) lastY = y;
  }, { passive: true });
}

// The feed's title logos sit flush left in a wider transparent canvas, so centred they land small and off to the left.
// Each is read through /api/now-img (same origin, so its pixels are readable), cropped to its visible part once and
// swapped in as a data URL; the original stays if anything fails. As the tvs-now-dazn mini app does.
const LOGOS = new Map();
function trimLogo(el) {
  const url = el.getAttribute('src');
  if (!/^https:\/\/(tvs|cms)\.dmpcdn\.com\//.test(url)) return;
  if (!LOGOS.has(url)) LOGOS.set(url, new Promise(done => {
    const im = new Image();
    im.onload = () => {
      try {
        const w = im.naturalWidth, h = im.naturalHeight, c = document.createElement('canvas');
        c.width = w; c.height = h;
        const x = c.getContext('2d', { willReadFrequently: true });
        x.drawImage(im, 0, 0);
        const a = x.getImageData(0, 0, w, h).data;
        let t = h, l = w, r = -1, b = -1;
        for (let y = 0; y < h; y++) for (let i = 0; i < w; i++) if (a[(y * w + i) * 4 + 3] > 12) {
          if (i < l) l = i; if (i > r) r = i; if (y < t) t = y; if (y > b) b = y;
        }
        if (r < 0) return done(url);
        const o = document.createElement('canvas');
        o.width = r - l + 1; o.height = b - t + 1;
        o.getContext('2d').drawImage(c, l, t, o.width, o.height, 0, 0, o.width, o.height);
        done(o.toDataURL('image/png'));
      } catch (e) { done(url); }
    };
    im.onerror = () => done(url);
    im.src = `/api/now-img?u=${encodeURIComponent(url)}`;
  }));
  LOGOS.get(url).then(src => { if (src !== url) el.src = src; });
}

let heroTimer, countTimer;
function wire(screen) {
  clearInterval(heroTimer);
  const track = screen.querySelector('.hero-track');
  if (track) {
    const dots = [...screen.querySelectorAll('.dots i')];
    const at = () => Math.round(track.scrollLeft / track.clientWidth);
    track.addEventListener('scroll', () => dots.forEach((d, i) => d.classList.toggle('on', i === at())), { passive: true });
    heroTimer = setInterval(() => track.scrollTo({ left: ((at() + 1) % dots.length) * track.clientWidth, behavior: 'smooth' }), 5000);
    track.addEventListener('pointerdown', () => clearInterval(heroTimer), { once: true });
  }

  wireHub(screen);
  screen.querySelectorAll('.hc-logo, [data-trim]').forEach(trimLogo);
  tvTick(screen); clearInterval(tvTimer); tvTimer = setInterval(() => document.querySelectorAll('#screen, .mp-scroll').forEach(tvTick), 30000);
  screen.querySelectorAll('[data-more]').forEach(b => b.addEventListener('click', () => openMore(b.dataset.more)));
  wireHeroCards(screen);
  wireHeroFade(screen);
  screen.querySelectorAll('[data-v]').forEach(a => a.addEventListener('click', () => openShorts(+a.dataset.v)));

  screen.querySelectorAll('[data-stack]').forEach(el => {
    layoutStack(el);
    el.addEventListener('click', () => { el.appendChild(el.firstElementChild); layoutStack(el); });
  });
}

// Tabs only move the selection pill (the other screens aren't built).
function tabs() {
  const bar = document.querySelector('.tabbar');
  const links = [...bar.querySelectorAll('a')];
  links.forEach((a, i) => a.addEventListener('click', () => {
    links.forEach(l => l.classList.toggle('on', l === a));
    bar.style.setProperty('--i', i);
  }));
}

// Desktop: scale the 393×852 frame to fit the window. The demo switch sits beside the phone when there's room at
// that size (frame bezel + gap + switch card), otherwise above it (body.demo-top, more top padding). Phones: full
// screen, no zoom.
function fitFrame() {
  const phone = document.querySelector('.phone'), demo = document.querySelector('.demo'), small = matchMedia('(max-width: 500px)');
  const zoomFor = pad => Math.min(1, (innerHeight - pad) / 852, (innerWidth - 40) / 393);
  const fit = () => {
    if (small.matches) { phone.style.transform = phone.style.margin = ''; document.body.classList.remove('demo-top'); return; }
    document.body.classList.remove('demo-top');
    let z = zoomFor(52);
    const side = (innerWidth - 393 * z) / 2 - 14 * z;          // free space left of the bezel
    if (side < demo.offsetWidth + 20 + 6) { document.body.classList.add('demo-top'); z = zoomFor(94); }
    // scale with a transform, not CSS zoom (zoom makes scroll-snapping jitter in Chrome); negative margins shrink the
    // layout box to the scaled size so the frame still centres and the switch sits beside it
    phone.style.transform = z < 1 ? `scale(${z})` : '';
    phone.style.margin = z < 1 ? `${(852 * z - 852) / 2}px ${(393 * z - 393) / 2}px` : '';
  };
  fit(); addEventListener('resize', fit);
  document.fonts.ready.then(fit);   // the switch card is narrower once Better Together has loaded
}

function clock() {
  const t = document.querySelector('.sb-time');
  const tick = () => { t.textContent = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); };
  tick(); setInterval(tick, 30000);
}

// Demo switch between the current home (เดิม), the tidied one (ใหม่) and the tidied one with an Apple TV-style hero
// (ใหม่ 2), like Showtime's: ?look=classic|new|apple in a link
// sets it, and the choice is remembered in this browser.
const LOOK_KEY = 'now-app-look';
// classic = the current app; new = the tidied home; apple = the tidied home with an Apple TV-style full-bleed hero
const LOOKS = ['classic', 'new', 'apple'];
// A page can pin one look with <body data-look> (the now-appCP concept is ใหม่ 2 only).
let LOOK = (() => {
  if (document.body.dataset.look) return document.body.dataset.look;
  const q = new URLSearchParams(location.search).get('look');
  let saved = null;
  try { if (q) localStorage.setItem(LOOK_KEY, q); saved = localStorage.getItem(LOOK_KEY); } catch (e) {}
  return LOOKS.includes(q || saved) ? q || saved : 'classic';
})();

// Header destinations. เดิม: the app's three outlined text pills. ใหม่: Disney+-style pill components (icon + label) in
// a sideways-scrolling row that has room for more destinations.
const navIcon = d => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const NAV = {
  classic: [['ภาพยนตร์'], ['ซีรีส์'], ['กีฬา']],
  new: [
    ['ภาพยนตร์', navIcon('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>'), 'movie'],
    ['ซีรีส์', navIcon('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="m8 3 4 4 4-4"/>'), 'series'],
    ['กีฬา', navIcon('<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3"/>'), 'sport'],
    ['ไลฟ์สด', navIcon('<circle cx="12" cy="12" r="2.5" fill="currentColor"/><path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14"/>'), 'live'],
  ],
};
// a destination with a page (third entry) opens it: ไลฟ์สด → the live & upcoming see more page (ใหม่ 2: the schedule)
const drawNav = () => {
  const bar = document.querySelector('.tb-pills');
  bar.innerHTML = NAV[LOOK === 'classic' ? 'classic' : 'new'].map(([label, icon, page]) => `<a${page ? ` data-nav="${page}"` : ''}>${icon || ''}<span>${label}</span></a>`).join('');
  if (!bar.wired) { bar.wired = true; bar.addEventListener('click', e => { const a = e.target.closest('[data-nav]'); if (a) openMore(a.dataset.nav); }); }
};

function lookToggle(onChange) {
  const buttons = document.querySelectorAll('.look button[data-l]');
  const paint = () => {
    document.body.classList.toggle('look-new', LOOK !== 'classic');
    document.body.classList.toggle('look-apple', LOOK === 'apple');
    buttons.forEach(b => b.classList.toggle('on', b.dataset.l === LOOK));
    drawNav();
  };
  buttons.forEach(b => b.onclick = () => {
    if (b.dataset.l === LOOK) return;
    LOOK = b.dataset.l;
    try { localStorage.setItem(LOOK_KEY, LOOK); } catch (e) {}
    const u = new URL(location.href);
    if (u.searchParams.has('look')) { u.searchParams.set('look', LOOK); history.replaceState(null, '', u.pathname + u.search); }
    paint(); onChange();
  });
  paint();
}

// ---------- content detail page ----------
// Tapping a title opens its detail page, as in the app: landscape art, title, rating / year / length / resolution,
// รับชมตอนนี้ (🔒 เริ่มรับชมเลย for a free user, which opens iap.js's Package page), genre, synopsis, รายการของฉัน and คุณน่าจะชอบ. Feed titles get their synopsis, length and genres from
// /api/now-home?details=1 (fetched once, after the home draws); TMDB hero titles carry their own. The hero's play
// buttons still play straight away, unless canPlayNow() says no (iap.js: a free user goes to the detail page first).
let canPlayNow = () => true;
const TITLES = new Map();
let DETAILS = null, DETAILS_MAP = {}, DETAILS_DONE = false;
const MY_LIST = new Set();
const watchKey = href => ((href || '').match(/\/watch\/([\w-]+)\/([\w-]+)/) || []).slice(1).join('/');
function indexTitles(shelves) {
  TMDB_HERO.forEach(h => TITLES.set(`${h.type}/${h.id}`, { id: h.id, type: h.type, t: h.t, land: h.bg, poster: h.art, rate: h.rate,
    year: h.year, genre: h.genre, syn: h.syn, dur: h.dur, series: h.series, tmdb: 1 }));
  shelves.forEach(s => s.items.forEach(it => {
    const k = `${it.type}/${it.id}`;
    if (/^tvs-/.test(it.type) && !TITLES.has(k)) TITLES.set(k, { ...it, shelf: s.id });
  }));
}
const loadDetails = () => DETAILS || (DETAILS = fetch('/api/now-home?details=1').then(r => r.json()).catch(() => ({}))
  .then(m => { DETAILS_MAP = m; DETAILS_DONE = true; return m; }));
const hm = min => min >= 60 ? `${Math.floor(min / 60)} ชม.${min % 60 ? ` ${min % 60} น.` : ''}` : `${min} น.`;
function detailOf(d, more = {}) {
  const x = { ...d, ...more, syn: d.syn || more.syn || '' };
  x.genreTh = x.genre || (x.genres || []).map(g => GENRE_TH[g]).filter(Boolean).slice(0, 2).join(' · ');
  return x;
}
// more like this: titles sharing a genre once the details are in, else the rest of the shelf it came from
function likes(d, more) {
  const pool = [...TITLES.values()].filter(t => t !== d && t.poster && /^tvs-(movie|series)$/.test(t.type));
  const g = new Set((more[d.id] || {}).genres || []);
  const same = g.size ? pool.filter(t => ((more[t.id] || {}).genres || []).some(x => g.has(x))) : [];
  const shelf = pool.filter(t => t.shelf && t.shelf === d.shelf);
  return [...new Set([...same, ...shelf, ...pool])].slice(0, 9);
}
const closeIcon = '<svg width="26" height="26" viewBox="0 0 24 24" stroke="#fff" stroke-width="2.2" stroke-linecap="round"><path d="M5 5l14 14M19 5 5 19"/></svg>';
const lockIcon = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.2" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/><circle cx="12" cy="16" r="1.2" fill="#000"/></svg>';
const shareIcon = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="m8.2 10.8 7.6-4.1M8.2 13.2l7.6 4.1"/></svg>';
const playDisc = '<svg width="26" height="26" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#000"/><path fill="#fff" d="m10 7.5 6 4.5-6 4.5z"/></svg>';
function detailHtml(d, more) {
  const x = detailOf(d, more[d.id]), live = d.type === 'tvs-live', mine = MY_LIST.has(d.id);
  const sport = live || (x.genres || []).includes('sports');
  const onAir = live && x.start <= Date.now() && (!x.end || x.end > Date.now());
  const day = live && x.start ? new Date(x.start).toLocaleDateString('th-TH-u-ca-gregory', { timeZone: TZ, day: 'numeric', month: 'long', year: 'numeric' }) : '';
  // a live event that hasn't started can't be watched yet: its button sets a reminder instead (shared with the
  // schedule's bells), for free users too
  const soon = live && x.start > Date.now(), reminded = REMINDERS.has(d.id);
  const meta = [x.rate && `<i class="dt-chip">${esc(x.rate)}</i>`, x.year && `<i class="dt-chip">${esc(x.year)}</i>`,
    live ? (x.start ? `<span>${x.ch ? `ช่อง ${esc(x.ch)} · ` : ''}${esc(when(x.start))} น.</span>` : '') : x.series ? '<span>ซีรีส์</span>' : x.dur ? `<span>${hm(x.dur)}</span>` : '',
    x.res && `<i class="dt-chip line">${esc(x.res)}</i>`].filter(Boolean).join('');
  return `<div class="dt-art">${img(x.land || x.poster, x.t).replace(' loading="lazy"', '')}<button class="dt-x" aria-label="ปิด">${closeIcon}</button></div>
    <div class="dt-body">
      ${live && day ? `<span class="dt-live">${onAir ? '<b>Live</b>' : ''}<i>${day}</i></span>` : ''}
      <h1>${esc(x.t)}</h1>
      ${meta ? `<div class="dt-meta">${meta}</div>` : ''}
      ${soon ? `<button class="dt-remind${reminded ? ' on' : ''}" aria-pressed="${reminded}">${bellIcon}${reminded ? 'ตั้งเตือนแล้ว' : 'ตั้งเตือน'}</button>
        ${reminded ? '<p class="dt-note">แจ้งเตือนก่อนเริ่ม 15 นาที</p>' : ''}`
      : `<a class="dt-play"${sport ? ' data-kind="sport"' : ''} ${link(d) || `href="${NOW_APP}/watch/${d.type}/${d.id}" target="_blank" rel="noopener"`}>${canPlayNow()
        ? `${playDisc}${onAir ? 'ดูสด' : 'รับชมตอนนี้'}` : `${lockIcon}เริ่มรับชมเลย`}</a>`}
      ${x.genreTh ? `<p class="dt-genre">${esc(x.genreTh)}</p>` : ''}
      ${x.syn ? `<p class="dt-syn">${esc(x.syn)}</p>` : DETAILS_DONE || x.tmdb ? '' : '<p class="dt-syn dt-wait"><i></i><i></i><i></i></p>'}
      <div class="dt-acts"><button data-mylist class="${mine ? 'on' : ''}">${mine
        ? '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>'
        : '<svg width="28" height="28" viewBox="0 0 24 24" stroke="#fff" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>'}รายการของฉัน</button>
        <button data-share>${shareIcon}แชร์</button></div>
    </div>
    ${live ? liveTabs(d, x) : `<nav class="dt-tabs"><a class="on">คุณน่าจะชอบ</a></nav>
    <div class="dt-pane"><div class="dt-grid">${likes(d, more).map(t => `<a class="poster" ${link(t)}>${nowBadge(t)}${img(t.poster, t.t)}</a>`).join('')}</div></div>`}`;
}
// A live event's page swaps คุณน่าจะชอบ (popular films and dramas, no use to someone waiting for a match) for its
// tabs: แมตช์อื่น (its competition's other events, else its sport's, as schedule rows with bells), ไฮไลท์และย้อนหลัง
// (the sport feed's replay shelves for its sport, api/now-home.js?vod=1) and its channel's day (the TV guide,
// ?ch=N, what's on now marked). Each loads the first time it's needed; openDetail repaints when it arrives.
let SPORT_VOD, CH_DAY = {};
// the channel tab (['ch', 'ช่อง']) is switched off for now; its pane and api/now-home.js?ch=N stay
const LIVE_TABS = [['more', 'แมตช์อื่น'], ['vod', 'ไฮไลท์และย้อนหลัง']];
const vodKey = e => {
  const t = `${e.sport || ''} ${e.t}`;
  return /มวยไทย|muay/i.test(t) ? 'muay' : /มอเตอร์|moto|F1\b|F2\b|race|endurance/i.test(t) ? 'motor' : /ฟุตซอล|futsal/i.test(t) ? 'futsal'
    : /แบดมินตัน|badminton|bwf/i.test(t) ? 'badminton' : /ฟุตบอล|football|ลีก|league|laliga|serie a|scottish|UCL/i.test(t) ? 'football' : 'more';
};
function liveTabs(d, x) {
  const tab = LIVE_TAB.get(d.id) || 'more', tabs = LIVE_TABS.filter(([k]) => k !== 'ch' || x.ch);
  const nav = `<nav class="dt-tabs dt-tabs3">${tabs.map(([k, l]) => `<a data-tab="${k}"${k === tab ? ' class="on"' : ''}>${k === 'ch' ? `${l} ${esc(x.ch)}` : l}</a>`).join('')}</nav>`;
  const wait = '<p class="dt-syn dt-wait dt-pad"><i></i><i></i><i></i></p>';
  let pane;
  if (tab === 'more') {
    const feed = LIVE_FEED || LIVE_EVENTS, me = feed.find(e => e.id === d.id) || d, comp = compOf(me).name, [c] = evTitle(me);
    const others = feed.filter(e => e.id !== d.id && (!e.end || e.end > Date.now()));
    // the same competition: its title prefix, or the same logo competition; never the catch-all buckets
    const same = others.filter(e => (c && evTitle(e)[0] === c) || (compOf(me).logo && compOf(e).name === comp));
    const list = (same.length ? same : others.filter(e => me.sport && e.sport === me.sport)).slice(0, 12);
    pane = !LIVE_FEED && !list.length ? wait : list.length
      ? `<p class="dt-sub">${same.length ? `ใน${esc(c || comp)}` : `${esc(me.sport || 'กีฬา')}อื่นๆ`}</p><div class="sc-list">${list.map(e => schedRow(e, false)).join('')}</div>`
      : '<p class="mp-err">ยังไม่มีรายการอื่น</p>';
  } else if (tab === 'vod') {
    const list = SPORT_VOD && SPORT_VOD[vodKey(LIVE_FEED && LIVE_FEED.find(e => e.id === d.id) || d)] || [];
    pane = !SPORT_VOD ? wait : list.length ? `<div class="dt-grid">${list.slice(0, 18).map(t => `<a class="poster" ${link(t)}>${img(t.poster, t.t)}</a>`).join('')}</div>`
      : '<p class="mp-err">ยังไม่มีไฮไลท์ของรายการนี้</p>';
  } else {
    const day = CH_DAY[x.ch], now = Date.now();
    pane = !day ? wait : day.length ? `<ol class="ch-day">${day.map(p => {
      // this event's own slot (the guide may start it a few minutes off the feed) is marked รายการนี้
      const on = p.start <= now && p.end > now, past = p.end <= now, me = x.start && Math.abs(p.start - x.start) < 15 * 6e4;
      return `<li class="${[on && 'on', past && 'past', me && 'me'].filter(Boolean).join(' ')}"><time>${hhmm(p.start)}</time><span>${esc(p.t)}</span>${
        on ? '<i class="live-b"><b></b>Live</i>' : me ? '<i class="ch-me">รายการนี้</i>' : ''}</li>`;
    }).join('')}</ol>` : '<p class="mp-err">ไม่มีผังรายการของช่องนี้</p>';
  }
  return `${nav}<div class="dt-pane">${pane}</div>`;
}
const LIVE_TAB = new Map();
// fetch what the open tab needs, then repaint
function liveTabData(d, x, repaint) {
  const tab = LIVE_TAB.get(d.id) || 'more';
  if (tab === 'more' && !LIVE_FEED) fetch('/api/now-home?live=1').then(r => r.json()).catch(() => []).then(l => { if (!LIVE_FEED) liveMerge(l); repaint(); });
  if (tab === 'vod' && !SPORT_VOD) fetch('/api/now-home?vod=1').then(r => r.json()).catch(() => ({})).then(v => {
    SPORT_VOD = v; Object.values(v).flat().forEach(t => { const k = `${t.type}/${t.id}`; if (!TITLES.has(k)) TITLES.set(k, t); }); repaint(); });
  if (tab === 'ch' && x.ch && !CH_DAY[x.ch]) fetch(`/api/now-home?ch=${encodeURIComponent(x.ch)}`).then(r => r.json()).catch(() => []).then(l => { CH_DAY[x.ch] = l; repaint(); });
}
// Opening a title grows its page out of the card that was tapped, as the TVS NOW mini app does (flow/motion.ts): the
// page scales up from the card's spot with rounded corners easing square, fading in over the first part, and shrinks
// back into the card on close. Only transform, opacity and border-radius move. The card is the last one pressed (any
// row, hero, poster or schedule row); with none, or under reduced motion, the page fades.
const GROW = 'cubic-bezier(0.22, 1, 0.36, 1)', GROW_RADIUS = 28;
let LAST_PRESS = null;
document.addEventListener('pointerdown', e => {
  const card = e.target.closest('.hc-card, .hf, .poster, .land-card, .ev-card, .tv-card, .on-card, .sc-row, .rank, .sc, a[href*="/watch/"]');
  LAST_PRESS = card ? { el: card.matches('.sc-row') ? card.querySelector('.sc-pic') : card.matches('.hf') ? card.querySelector('.hf-art.on') || card : card, at: Date.now() } : null;
  // start fetching the page's wide picture as the finger lands, so it's usually in by the time the page has grown
  const a = card && (card.matches('a[href]') ? card : card.querySelector('a[href*="/watch/"]'));
  const key = card && (card.dataset.watch || (card.matches('.hf') && (card.querySelector('.hf-art.on') || {}).dataset.watch) || (a && watchKey(a.getAttribute('href'))));
  const t = key && TITLES.get(key);
  if (t && (t.land || t.poster)) new Image().src = t.land || t.poster;
}, true);
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
function growFrom(layer, card) {
  const c = card.getBoundingClientRect(), box = layer.getBoundingClientRect(), z = box.width / layer.offsetWidth || 1;   // the phone frame may be scaled
  const scale = Math.min(0.9, Math.max(0.2, c.width / box.width));
  return {
    origin: `${(c.left + c.width / 2 - box.left) / z}px ${(c.top + c.height / 2 - box.top) / z}px`,
    small: { transform: `scale(${scale})`, borderRadius: `${GROW_RADIUS}px`, opacity: 0 },
    full: { transform: 'scale(1)', borderRadius: '16px 16px 0 0', opacity: 1 },
  };
}
function animateDetailIn(el) {
  const card = LAST_PRESS && Date.now() - LAST_PRESS.at < 1500 && LAST_PRESS.el.isConnected ? LAST_PRESS.el : null;
  el.style.animation = 'none';
  el.from = card;
  if (reducedMotion() || !card) return el.animate([{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' });
  const { origin, small, full } = growFrom(el, card);
  el.style.transformOrigin = origin;
  el.animate([small, { opacity: 1, offset: 0.4 }, full], { duration: 460, easing: GROW });
}
function closeDetail(el) {
  const card = el.from && el.from.isConnected && el.from.getBoundingClientRect().width ? el.from : null;
  if (reducedMotion() || !card) return el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 280, fill: 'forwards' }).finished.then(() => el.remove());
  const { origin, small, full } = growFrom(el, card);
  el.style.transformOrigin = origin;
  el.animate([full, { opacity: 1, offset: 0.55 }, small], { duration: 320, easing: 'cubic-bezier(0.4, 0, 0.6, 1)', fill: 'forwards' }).finished.then(() => el.remove());
}
function openDetail(d) {
  let el = document.querySelector('.phone > .detail');
  if (!el) {
    el = document.createElement('section');
    el.className = 'detail';
    el.innerHTML = '<div class="dt-scroll"></div>';
    el.addEventListener('click', e => {
      if (e.target.closest('.dt-x')) { if (!el.closing) { el.closing = true; closeDetail(el); } return; }
      if (e.target.closest('[data-share]') && navigator.share) return navigator.share({ title: el.dt.t, url: `${NOW_APP}/watch/${el.dt.type}/${el.dt.id}` }).catch(() => {});
      if (e.target.closest('.dt-remind')) { REMINDERS.has(el.dt.id) ? REMINDERS.delete(el.dt.id) : REMINDERS.add(el.dt.id); syncReminders(); return paint(true); }
      if (e.target.closest('.dt-play')) { e.preventDefault(); return nowPlayer(el.dt); }   // a free user never gets here (iap.js)
      const my = e.target.closest('[data-mylist]');
      if (my) { MY_LIST.has(el.dt.id) ? MY_LIST.delete(el.dt.id) : MY_LIST.add(el.dt.id); return paint(true); }
      const tab = e.target.closest('[data-tab]');
      if (tab) { LIVE_TAB.set(el.dt.id, tab.dataset.tab); return paint(true); }
      const bell = e.target.closest('[data-bell]');
      if (bell) { REMINDERS.has(bell.dataset.bell) ? REMINDERS.delete(bell.dataset.bell) : REMINDERS.add(bell.dataset.bell); syncReminders(); return; }
      const play = e.target.closest('[data-play]'), live = play && (LIVE_FEED || LIVE_EVENTS).find(x => x.id === play.dataset.play);
      if (live) { e.preventDefault(); return canPlayNow() ? nowPlayer(live) : (el.dt = live, paint(), el.firstChild.scrollTop = 0); }
      const a = e.target.closest('.dt-pane a[href]'), next = a && TITLES.get(watchKey(a.getAttribute('href')));
      if (next) { e.preventDefault(); el.dt = next; paint(); el.firstChild.scrollTop = 0; }
    });
    document.querySelector('.phone').appendChild(el);
    el.fresh = true;
  }
  // same title again (details arrived, My List toggled): swap the text parts only, so the art doesn't redraw
  const paint = same => {
    const d = el.dt, html = detailHtml(d, DETAILS_MAP);
    if (same) {
      const t = document.createElement('div');
      t.innerHTML = html;
      ['.dt-body', '.dt-tabs', '.dt-pane'].forEach(q => el.querySelector(q).replaceWith(t.querySelector(q)));
    } else el.firstChild.innerHTML = html;
    if (d.type === 'tvs-live') liveTabData(d, detailOf(d, DETAILS_MAP[d.id]), () => { if (el.dt === d && el.isConnected) paint(true); });
    if (!DETAILS_DONE && !d.tmdb) loadDetails().then(() => { if (el.dt === d && el.isConnected) paint(true); });
  };
  el.paint = paint;   // iap.js redraws the button once a package is bought
  el.dt = d;
  paint();
  el.firstChild.scrollTop = 0;
  if (el.fresh) { el.fresh = false; animateDetailIn(el); }
}
// Mock player: the watch buttons (hero, detail page) play here instead of opening the NOW web app. Like the app it
// turns to landscape: the player is drawn a quarter turn round to fill the phone. The art stands in for the video,
// the clock runs in real time, controls hide after 3 s and come back on a tap. Live titles sit at the live edge.
const npIcon = {
  back: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5 8 12l7 7"/></svg>',
  play: '<svg width="44" height="44" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>',
  pause: '<svg width="44" height="44" viewBox="0 0 24 24" fill="#fff"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
  skip: n => `<svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"${n > 0 ? ' style="transform:scaleX(-1)"' : ''}><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4.5 3.5v3.7h3.7"/><text x="12" y="15.2" fill="#fff" stroke="none" font-size="7" font-weight="700" text-anchor="middle" font-family="system-ui"${n > 0 ? ' transform="matrix(-1 0 0 1 24 0)"' : ''}>10</text></svg>`,
};
const npClock = sec => { sec = Math.max(0, Math.round(sec)); const h = Math.floor(sec / 3600), m = Math.floor(sec / 60) % 60, x = pad2(sec % 60); return h ? `${h}:${pad2(m)}:${x}` : `${m}:${x}`; };
function nowPlayer(d) {
  const live = d.type === 'tvs-live', len = (d.dur || (d.series ? 45 : 100)) * 60;
  let t = 0, playing = true, hide;
  const el = document.createElement('div');
  el.className = 'np';
  el.innerHTML = `<div class="np-land">
      <img class="np-art" src="${esc(d.land || d.poster || '')}" alt="">
      <div class="np-ui">
        <div class="np-top"><button class="np-x" aria-label="ปิด">${npIcon.back}</button>
          <div class="np-tt"><b>${esc(d.t)}</b>${d.series ? '<span>ซีซัน 1 · ตอนที่ 1</span>' : ''}</div>${live ? '<i class="np-live">LIVE</i>' : ''}</div>
        <div class="np-mid">${live ? '' : `<button data-skip="-10" aria-label="ย้อน 10 วินาที">${npIcon.skip(-1)}</button>`}<button class="np-pp" aria-label="เล่น/หยุด"></button>${live ? '' : `<button data-skip="10" aria-label="ข้าม 10 วินาที">${npIcon.skip(1)}</button>`}</div>
        <div class="np-bot"><span class="np-cur"></span><div class="np-bar"><i></i></div><span class="np-end"></span></div>
      </div>
    </div>`;
  const $ = q => el.querySelector(q);
  const paint = () => {
    $('.np-pp').innerHTML = playing ? npIcon.pause : npIcon.play;
    $('.np-bar i').style.width = live ? '100%' : `${100 * t / len}%`;
    $('.np-cur').textContent = live ? '' : npClock(t);
    $('.np-end').textContent = live ? '' : `-${npClock(len - t)}`;
  };
  const wake = () => { el.classList.remove('idle'); clearTimeout(hide); if (playing) hide = setTimeout(() => el.classList.add('idle'), 3000); };
  const timer = setInterval(() => { if (playing && !live) { t = Math.min(len, t + 1); if (t >= len) playing = false; paint(); } }, 1000);
  el.addEventListener('click', e => {
    if (e.target.closest('.np-x')) { clearInterval(timer); clearTimeout(hide); el.classList.add('out'); return setTimeout(() => el.remove(), 250); }
    if (el.classList.contains('idle')) return wake();   // the first tap only brings the controls back
    const sk = e.target.closest('[data-skip]'), bar = e.target.closest('.np-bar');
    if (e.target.closest('.np-pp')) playing = !playing;
    else if (sk) t = Math.min(len, Math.max(0, t + +sk.dataset.skip));
    else if (bar && !live) { const r = bar.getBoundingClientRect(); t = Math.round(len * (e.clientY - r.top) / r.height); }   // turned a quarter: the bar runs top to bottom on screen
    else if (!e.target.closest('button')) return el.classList.add('idle');
    paint(); wake();
  });
  paint(); wake();
  document.querySelector('.phone').appendChild(el);
}
// any title link on the home opens its detail page, and so does a tap on a ใหม่ / ใหม่ 2 hero poster outside its
// buttons; the hero's play buttons open the player, unless canPlayNow() says no
function wireDetails(screen) {
  screen.addEventListener('click', e => {
    const a = e.target.closest('a[href*="/watch/"]'), card = !a && e.target.closest('.hc-card, .hf');
    let key = '';
    if (card && !e.target.closest('.hero-ctas, .dots') && !card.moved)
      key = card.matches('.hf') ? card.querySelector('.hf-art.on').dataset.watch : card.dataset.watch;
    else if (a) key = watchKey(a.getAttribute('href'));
    const d = key && TITLES.get(key);
    if (!d) return;
    e.preventDefault(); e.stopPropagation();
    a && a.matches('.btn-play, .btn-live') && canPlayNow() ? nowPlayer(d) : openDetail(d);
  }, true);
}

(async () => {
  fitFrame();
  clock();
  tabs();
  const screen = document.getElementById('screen');
  onScroll(screen);
  try {
    const [shelves, hero] = await Promise.all([
      fetch('/api/now-home').then(r => r.json()),
      fetch('/api/now-hero').then(r => r.json()).catch(() => []),
      loadTeams(),   // club crests for the hero's match cards
    ]);
    TMDB_HERO = Array.isArray(hero) ? hero : [];
    if (!shelves.length) throw new Error('empty feed');
    indexTitles(shelves);
    wireDetails(screen);
    const draw = () => { screen.innerHTML = render(shelves); wire(screen); };
    document.dispatchEvent(new CustomEvent('now-home', { detail: shelves }));   // for page add-ons like now-appCP
    lookToggle(draw);
    draw();
    setTimeout(loadDetails, 1500);   // ready before the first tap, usually
  } catch (e) {
    console.error(e);
    screen.innerHTML = '<p class="err">โหลดหน้าแรกไม่สำเร็จ ลองใหม่อีกครั้ง</p>';
  }
})();
