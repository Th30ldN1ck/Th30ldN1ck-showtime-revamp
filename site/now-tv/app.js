// TVS NOW smart-TV home (Figma: Customer File 01 TrueVisions Now, TV_Homepage): the live NOW home feed
// (api/now-home.js, the same one /now-app/ draws) laid out as the TV design's shelves, driven by the remote:
// arrow keys move the focus, Enter/OK confirms, Back/Escape goes back. The focused title fills the hero.
const NOW_APP = 'https://tvs-newhomepage.vercel.app';
const TZ = 'Asia/Bangkok';
const W = 1920, H = 1080;
const ROW_TOP = 556;     // where the focused shelf sits, under the hero (prototype frames)
const ROW_MAX = 20;      // cards per shelf: TV browsers are slow
const HERO_MS = 250;     // hero waits for the focus to settle before it swaps

const esc = s => String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const img = (src, alt = '') => src ? `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy">` : '';
const $ = s => document.querySelector(s);

const GENRE_TH = {
  action: 'แอ็กชัน', adventure: 'ผจญภัย', animation: 'แอนิเมชัน', comedy: 'คอมเมดี้', crime: 'อาชญากรรม', documentary: 'สารคดี',
  drama: 'ดราม่า', family: 'ครอบครัว', fantasy: 'แฟนตาซี', gameshow: 'เกมโชว์', horror: 'สยองขวัญ', music: 'ดนตรี',
  mystery: 'ลึกลับ', news: 'ข่าว', reality: 'เรียลลิตี้', romance: 'โรแมนซ์', 'ceo-romance': 'โรแมนซ์', 'sci-fi': 'ไซไฟ',
  sports: 'กีฬา', talkshow: 'ทอล์กโชว์', thriller: 'ระทึกขวัญ', varietyshow: 'วาไรตี้โชว์', war: 'สงคราม',
};
const NEW_DAYS = 21;

// "วันนี้ | 21:30", "พรุ่งนี้ | 19:30", else "8 พ.ย. | 21:30" (the design's "4 Mar | 21:30", Bangkok time)
const dayKey = t => new Date(t).toLocaleDateString('en-CA', { timeZone: TZ });
function airTime(t) {
  const time = new Date(t).toLocaleTimeString('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
  const days = Math.round((Date.parse(dayKey(t)) - Date.parse(dayKey(Date.now()))) / 864e5);
  const day = days === 0 ? 'วันนี้' : days === 1 ? 'พรุ่งนี้' : new Date(t).toLocaleDateString('th-TH', { timeZone: TZ, day: 'numeric', month: 'short' });
  return `${day} | ${time}`;
}
const length = m => m >= 60 ? `${Math.floor(m / 60)} ชม.${m % 60 ? ` ${m % 60} นาที` : ''}` : m ? `${m} นาที` : '';

// ---- cards: each returns its markup; the shelf keeps the item next to it for the hero and Enter
const onlyNow = it => it.now ? '<i class="only-now"><img src="img/only-now.svg" width="42.229" height="14.143" alt="NOW"></i>' : '';
const isNew = it => it.pub && Date.now() - it.pub < NEW_DAYS * 864e5;
const poster = it => `<div class="card p"><div class="art">${onlyNow(it)}${img(it.poster, it.t)}${isNew(it) ? '<i class="tag">มาใหม่</i>' : ''}</div></div>`;
const channel = it => `<div class="card ch"><div class="art">${it.pay ? '<i class="crown"><img src="img/crown.svg" width="28" height="28" alt=""></i>' : ''}${img(it.logo || it.land, it.t)}</div></div>`;
const live = it => `<div class="card l"><div class="art">${img(it.land, it.t)}</div><p class="cap">${esc(it.t)}</p></div>`;
const upcoming = it => `<div class="card l"><div class="art">${img(it.land, it.t)}${it.start ? `<i class="when">${esc(airTime(it.start))}</i>` : ''}</div>
  <div class="remind"><span><img src="img/bell.svg" width="20" height="20" alt="">เตือนฉัน</span><span><img src="img/check.svg" width="20" height="20" alt="">ตั้งเตือนแล้ว</span></div><p class="cap">${esc(it.t)}</p></div>`;
const onlyNowCard = it => `<div class="card l"><div class="art">${img(it.land, it.t)}</div>
  <div class="on-text"><b>${esc(it.t)}</b><span>${esc(it.syn)}</span></div></div>`;
const resume = it => `<div class="card l"><div class="art">${img(it.land, it.t)}
  <div class="seek"><span>${esc(it.left)}</span><span class="bar"><b style="width:${it.pct}%"></b></span></div></div><p class="cap">${esc(it.t)} [ ${esc(it.ep)} ]</p></div>`;
const ranked = (it, i) => `<div class="card rk"><b>${i + 1}</b><div class="art">${img(it.poster, it.t)}</div></div>`;

// ---- the feed's shelves in the TV design's order: NOW for you, My Lists, Live TV, Continue Watching, Trending,
// Live NOW, Upcoming, Only on TrueVisions NOW, partner shelves, the rest, then the Look Around NOW boxes
const LOOK_AROUND = { 'Cartoon Network': ['rgb(45,61,10)', 'rgb(28,28,15)'], 'สารคดี': ['rgb(106,94,86)', 'rgb(17,13,11)'] };
const SKIP = new Set(['hero_banner_shelf', 'continue', 'mylist', 'short_shelf', 'contextual_shelf', 'background_header_shelf']);

function plan(feed) {
  const by = t => feed.find(s => s.title === t) || { items: [] };
  const kind = k => feed.filter(s => s.kind === k);
  const titles = (kind('hero_banner_shelf')[0] || { items: [] }).items.filter(it => /^tvs-/.test(it.type) && it.poster);
  const used = new Set();
  const out = [];
  const add = (s, title, card, items, extra = {}) => {
    if (!s) return;
    used.add(s);
    items = (items || s.items).slice(0, ROW_MAX);
    if (items.length) out.push({ title: title || s.title, card, items, ...extra });
  };
  add({ items: titles }, 'NOW for you', poster);
  // the feed leaves My List and Continue Watching empty (the app fills them per user): borrow titles, as /now-app/ does
  add(kind('mylist')[0], '', poster, by('ภาพยนตร์แนะนำ').items.slice(1, 3));
  add(kind('livetv_shelf')[0], 'ทีวีสด', channel);
  const left = [['เหลือ 1 ชม. 37 นาที', 14, 'EP.2'], ['เหลือ 15 นาที', 80, 'EP.3'], ['เหลือ 42 นาที', 35, 'EP.1']];
  add(kind('continue')[0], '', resume, by('รายการทีวีแนะนำ').items.filter(it => it.land).slice(3, 6)
    .map((it, i) => ({ ...it, left: left[i][0], pct: left[i][1], ep: left[i][2] })));
  const ranks = kind('ranking_shelf');
  add(ranks[0], '', ranked, null, { rank: true });
  add(kind('title_shelf')[0], '', live);
  const coming = kind('coming_shelf');
  add(coming.find(s => s.items.some(it => it.type === 'tvs-live')), '', upcoming);
  add(kind('only_now_shelf')[0], '', onlyNowCard, (kind('only_now_shelf')[0] || { items: [] }).items.filter(it => it.land));
  kind('nest_shelf').forEach(s => add(s, '', poster, s.items.filter(it => it.poster)));
  add(ranks[1], '', ranked, null, { rank: true });
  coming.filter(s => !used.has(s)).forEach(s => add(s, '', upcoming, s.items.filter(it => it.land)));
  feed.filter(s => !used.has(s) && !SKIP.has(s.kind) && !LOOK_AROUND[s.title])
    .forEach(s => add(s, '', poster, s.items.filter(it => it.poster)));
  Object.keys(LOOK_AROUND).forEach(t => add(feed.find(s => s.title === t), '', poster, by(t).items.filter(it => it.poster), { box: LOOK_AROUND[t] }));
  return out;
}

// ---- drawing
const NAV = [
  ['search', 'ค้นหา', 'nav-search'], ['home', 'หน้าแรก', 'nav-home', 'nav-home-on'], ['live', 'ทีวีสด', 'nav-live'],
  ['new', 'ใหม่บน NOW', 'nav-new'], ['movies', 'ภาพยนตร์', 'nav-movies'], ['series', 'ซีรีส์', 'nav-series'],
  ['sports', 'กีฬา', 'nav-sports'], ['mylist', 'รายการของฉัน', 'nav-mylist'],
];
function drawNav() {
  const icon = (off, on) => `<i class="ic" style="--ic-off:url(img/${off}.svg)${on ? `;--ic-on:url(img/${on}.svg)` : ''}"></i>`;
  $('#nav').innerHTML = `<div class="nav-head"><div class="acct" data-nav="profile"><img src="img/avatar.png" alt=""><div><b>Natalia</b><span>เปลี่ยนโปรไฟล์</span></div></div></div>
    <div class="nav-items">${NAV.map(([id, label, off, on]) => `<a class="ni${id === 'home' ? ' cur' : ''}" data-nav="${id}">${icon(off, on)}<span>${label}</span></a>`).join('')}</div>
    <div class="nav-foot"><a class="ni2" data-nav="help">ช่วยเหลือและการตั้งค่า</a><a class="ni2" data-nav="exit">ออกจากแอป</a></div>`;
}

let ROWS = [];
function drawRows(shelves) {
  $('#rows').innerHTML = shelves.map(s => `<section class="shelf${s.box ? ' box' : ''}"${s.box ? ` style="--c1:${s.box[0]};--c2:${s.box[1]}"` : ''}>
    <h2>${esc(s.title)}</h2><div class="track${s.rank ? ' rank' : ''}">${s.items.map(s.card).join('')}</div></section>`).join('');
  ROWS = [...document.querySelectorAll('.shelf')].map((el, i) => ({
    el, track: el.querySelector('.track'), cards: [...el.querySelectorAll('.card')], items: shelves[i].items, title: shelves[i].title, idx: 0, x: 0,
  }));
}

// ---- hero: genre, title, chips and synopsis of whatever has focus; details (synopsis, length, rating) arrive after the home
let DETAILS = {};
let heroTimer, heroSrc = '';
function hero(it, shelf) {
  clearTimeout(heroTimer);
  heroTimer = setTimeout(() => {
    const d = DETAILS[it.id] || {};
    const genres = d.genres || it.genres || [];
    const g = genres.map(x => GENRE_TH[x] || x).find(Boolean);
    const info = $('.hero-info');
    info.classList.add('fade');
    setTimeout(() => {
      $('.hi-cat').textContent = it.type === 'tvs-live' ? (it.ch ? `ช่อง ${it.ch}` : 'ทีวีสด') : g || shelf;
      $('.hi-title h1').textContent = it.t;
      const live = it.type === 'tvs-live' && it.start && it.start <= Date.now() && (!it.end || it.end > Date.now());
      const chips = [
        live && '<i class="live">LIVE</i>',
        (d.rate || it.rate) && `<i>${esc(d.rate || it.rate)}</i>`,
        (d.year || it.year) && `<i>${esc(d.year || it.year)}</i>`,
        d.res && `<i class="line">${esc(d.res)}</i>`,
        !d.series && d.dur && `<span>${length(d.dur)}</span>`,
        d.series && '<span>ซีรีส์</span>',
        it.type === 'tvs-live' && it.start && !live && `<span>${esc(airTime(it.start))}</span>`,
      ];
      $('.hi-chips').innerHTML = chips.filter(Boolean).join('');
      $('.hi-syn').textContent = d.syn || it.syn || '';
      info.classList.remove('fade');
    }, 150);
    // channel logos don't stretch to a backdrop: channels keep the hero dark
    const src = it.type === 'tvs-live' && !it.start ? '' : it.land || it.poster || '';
    if (src === heroSrc) return;
    heroSrc = src;
    const [a, b] = document.querySelectorAll('.hero-bg img');
    const next = a.classList.contains('on') ? b : a, prev = next === a ? b : a;
    prev.classList.remove('on');
    if (!src) return;
    next.onload = () => { if (heroSrc === src) next.classList.add('on'); };
    next.src = src;
  }, HERO_MS);
}

// ---- focus: one shelf card or one nav entry at a time
const F = { area: 'rows', r: 0, n: 1 };
let scale = 1;

function navEls() { return [...document.querySelectorAll('#nav [data-nav]')]; }
function paint() {
  document.querySelectorAll('.focus').forEach(el => el.classList.remove('focus'));
  const nav = F.area === 'nav';
  $('#nav').classList.toggle('open', nav);
  $('#stage').classList.toggle('nav-dim', nav);
  if (nav) { navEls()[F.n].classList.add('focus'); return; }
  const row = ROWS[F.r];
  if (!row) return;
  const card = row.cards[row.idx];
  card.classList.add('focus');
  // the focused card lines up at the shelf's left edge; the shelf stops when its end is in view
  const left = row.track.getBoundingClientRect().left / scale - row.x;
  const room = W - left - 40;
  row.x = -Math.max(0, Math.min(card.offsetLeft - row.cards[0].offsetLeft, row.track.scrollWidth - room));
  row.track.style.transform = `translateX(${row.x}px)`;
  $('#rows').style.transform = `translateY(${ROW_TOP - row.el.offsetTop}px)`;
  ROWS.forEach((r, i) => r.el.classList.toggle('above', i < F.r));
  hero(row.items[row.idx], row.title);
}

function move(dx, dy) {
  if (OV) return OV.move(dx, dy);
  if (DT.open) return detailMove(dx, dy);
  if (F.area === 'nav') {
    if (dx > 0) { F.area = 'rows'; return paint(); }
    F.n = Math.max(0, Math.min(navEls().length - 1, F.n + dy));
    return paint();
  }
  const row = ROWS[F.r];
  if (dx) {
    if (row.idx + dx < 0) { F.area = 'nav'; F.n = navEls().findIndex(el => el.classList.contains('cur')); return paint(); }
    row.idx = Math.min(row.cards.length - 1, row.idx + dx);
  }
  if (dy) F.r = Math.max(0, Math.min(ROWS.length - 1, F.r + dy));
  paint();
}

let toastTimer;
// a toast belongs to the screen it was shown on: any new screen clears it
const clearToast = () => { clearTimeout(toastTimer); $('#toast').classList.remove('on'); };
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('on'), 2400);
}

const REMINDERS = new Set();
function ok() {
  if (OV) return OV.ok();
  if (DT.open) return detailOk();
  if (F.area === 'nav') {
    const id = navEls()[F.n].dataset.nav;
    if (id === 'home') { F.area = 'rows'; return paint(); }
    return toast(id === 'exit' ? 'ต้นแบบนี้ปิดแอปไม่ได้ กด Back เพื่อกลับไปหน้าแรก' : 'หน้านี้ยังไม่มีในต้นแบบ มีแค่หน้าแรก');
  }
  const row = ROWS[F.r], it = row.items[row.idx], card = row.cards[row.idx];
  const remind = card.querySelector('.remind');
  if (remind) {
    const on = !REMINDERS.has(it.id);
    on ? REMINDERS.add(it.id) : REMINDERS.delete(it.id);
    remind.classList.toggle('set', on);
    return toast(on ? `ตั้งเตือน ${it.t} แล้ว` : `ยกเลิกการเตือน ${it.t}`);
  }
  if (/^tvs-(series|movie)$/.test(it.type)) return openDetail(it);
  if (it.type === 'tvs-live') return player(it);   // channels surf; a locked one offers the plans in the player
  if (/^tvs-/.test(it.type)) window.open(`${NOW_APP}/watch/${it.type}/${it.id}`, '_blank', 'noopener');
}

function back() {
  if (OV) return OV.back();
  if (DT.open) return detailBack();
  if (F.area === 'nav') F.area = 'rows';
  else if (F.r > 0 || ROWS[0].idx > 0) { F.r = 0; ROWS[0].idx = 0; }
  else { F.area = 'nav'; F.n = navEls().findIndex(el => el.classList.contains('cur')); }
  paint();
}

// arrows, Enter/OK, and Back on desktop keyboards, Tizen (10009) and webOS (461) remotes
const KEYS = { ArrowLeft: () => move(-1, 0), ArrowRight: () => move(1, 0), ArrowUp: () => move(0, -1), ArrowDown: () => move(0, 1),
  Enter: ok, NumpadEnter: ok, Escape: back, Backspace: back, GoBack: back, BrowserBack: back };
const CODES = { 10009: back, 461: back };
// screen captures: ?clean hides the demo bar, H toggles it (and the setting sticks in the URL)
if (new URLSearchParams(location.search).has('clean')) document.body.classList.add('clean');
document.addEventListener('keydown', e => {
  if (e.key === 'h' || e.key === 'H') {
    const on = document.body.classList.toggle('clean'), u = new URL(location.href);
    on ? u.searchParams.set('clean', '') : u.searchParams.delete('clean');
    return history.replaceState(null, '', u.toString().replace('clean=', 'clean'));
  }
  if (/^\d$/.test(e.key) && typeof OV !== 'undefined' && OV && OV.digit) { e.preventDefault(); return OV.digit(e.key); }   // remote number keys (PIN)
  const fn = KEYS[e.key] || CODES[e.keyCode];
  if (!fn || !ROWS.length || $('#splash')) return;
  e.preventDefault();
  fn();
});
// a remote's pointer (LG Magic Remote) or a mouse: clicking a card or nav entry focuses and confirms it
document.addEventListener('click', e => {
  // the demo bar (mouse only): its keys press the remote's, and the cases bar switches the demo account
  const key = e.target.closest('[data-key]');
  if (key) return ROWS.length && !$('#splash') && { back, ok, left: () => move(-1, 0), right: () => move(1, 0), up: () => move(0, -1), down: () => move(0, 1) }[key.dataset.key]();
  const tc = e.target.closest('[data-telco]');
  if (tc) return setTelco(tc.dataset.telco);
  const ck = e.target.closest('[data-checkout]');
  if (ck) return setCheckout(ck.dataset.checkout);
  const sm = e.target.closest('[data-summary]');
  if (sm) return setSummary(sm.dataset.summary);
  const bd = e.target.closest('[data-bind]');
  if (bd) return setBind(bd.dataset.bind);
  if (e.target.closest('[data-restart]')) return location.reload();
  if (e.target.closest('[data-scan]')) return scanLogin ? scanLogin() : toast('ไม่ได้อยู่ที่หน้าเข้าสู่ระบบ');
  if (e.target.closest('.demo')) return;
  // in an overlay, clicking an entry focuses and confirms it
  const f = OV && e.target.closest('[data-f]');
  if (f && OV.el.contains(f)) { OV.i = OV.items().indexOf(f); OV.paint(); return OV.ok(); }
  if (DT.open || OV) return;
  const n = e.target.closest('[data-nav]'), card = e.target.closest('.card');
  if (n) { F.area = 'nav'; F.n = navEls().indexOf(n); paint(); return ok(); }
  if (!card) return;
  F.area = 'rows';
  F.r = ROWS.findIndex(r => r.cards.includes(card));
  ROWS[F.r].idx = ROWS[F.r].cards.indexOf(card);
  paint();
  ok();
});

// the 1920x1080 design scaled to the screen (TV browsers run at 1280 or 1920 wide), letterboxed
function fit() {
  scale = Math.min(innerWidth / W, innerHeight / H);
  const s = $('#stage');
  s.style.transform = `scale(${scale})`;
  s.style.left = `${(innerWidth - W * scale) / 2}px`;
  s.style.top = `${(innerHeight - H * scale) / 2}px`;
}
addEventListener('resize', () => { fit(); if (ROWS.length) paint(); });

async function start() {
  fit();
  drawNav();
  $('#rows').innerHTML = '<p class="loading">กำลังโหลด…</p>';
  const feed = await fetch('/api/now-home').then(r => r.json()).catch(() => []);
  const shelves = plan(feed);
  if (!shelves.length) { $('#rows').innerHTML = '<p class="loading">โหลดหน้าแรกไม่สำเร็จ ลองใหม่อีกครั้ง</p>'; return; }
  FEED_ITEMS = feed.flatMap(s => s.items).filter(x => /^tvs-(series|movie)$/.test(x.type));
  // surfing goes by channel number, like a TV remote
  CHANNELS = [...(feed.find(s => s.kind === 'livetv_shelf') || { items: [] }).items].sort((p, q) => (+p.ch || 0) - (+q.ch || 0));
  // paid live events only, never channels: a channel's art is just its logo (it showed up as a title's "picture")
  LIVE_EVENTS = feed.flatMap(s => s.items).filter(x => x.type === 'tvs-live' && x.start && x.pay && x.land && !CHANNELS.some(c => c.id === x.id));
  // what's trending, for the poster stack behind a title being bought: the Top 10 TV and movie shelves, interleaved
  const tops = feed.filter(s => s.kind === 'ranking_shelf').map(s => s.items);
  TRENDING = Array.from({ length: Math.max(0, ...tops.map(t => t.length)) }, (_, i) => tops.map(t => t[i])).flat().filter(x => x && x.poster);
  drawRows(shelves);
  paint();
  DETAILS = await fetch('/api/now-home?details=1').then(r => r.json()).catch(() => ({}));
  if (F.area === 'rows') hero(ROWS[F.r].items[ROWS[F.r].idx], ROWS[F.r].title);
}
const STARTED = start();   // subscribe.js holds the splash until this settles
