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
// title's own logo, large and centred), HeroMeta and HeroActions. Slides come from TMDB's trending titles
// (api/now-hero.js: textless posters + tightly cropped logos, opening in the NOW prototype's TMDB title pages); if TMDB
// isn't available the NOW feed's hero items are used, with their textless landscape art and title_logo. The carousel
// loops endlessly: one clone of the last slide sits before the first and one of the first after the last, and landing
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
    art: it.poster, bg: it.land || it.poster, t: it.t, href: link(it), cls: 'hc-live', noTitle: true, start: it.start, end: it.end,
    ch: it.ch,
  }));
}
// VOD slides (TMDB, or the feed's hero if TMDB isn't available) with a live slide after every two of them
function heroSlides(s) {
  const vod = TMDB_HERO.length
    ? TMDB_HERO.map(h => ({ art: h.art, bg: h.bg, logo: h.logo, t: h.t, href: `href="${NOW_APP}/watch/${h.type}/${h.id}" target="_blank" rel="noopener"`,
        badge: esc(h.tag || ''), meta: metaLine(h.rate, [h.year, h.genre]), cls: 'hc-tall',
        // ใหม่ 2 (Apple-style): "ภาพยนตร์ · สยองขวัญ · 2026" then the rating chip
        metaA: `${[h.type === 'tv' ? 'ซีรีส์' : 'ภาพยนตร์', h.genre, h.year].filter(Boolean).map(esc).join(' · ')}${h.rate ? ` <i class="rate">${esc(h.rate)}</i>` : ''}` }))
    : s.items.filter(it => /^tvs-/.test(it.type) && it.land).slice(0, HERO_SLIDES).map(it => ({ art: it.land, bg: it.land, logo: it.logo, t: it.t,
        href: link(it), badge: feedBadge(it), meta: exclMeta(it), cls: 'hc-feed' }));
  const out = [];
  vod.forEach((h, i) => { out.push(h); if (i % 2 === 0 && LIVE_HERO[i / 2]) out.push(LIVE_HERO[i / 2]); });
  return out;
}

// Live cards (Netflix live-event style): no badge, one centred status line, then two equal buttons. Live now: channel
// and start time. Upcoming: a ticking countdown and the start day/time.
const pad2 = n => String(n).padStart(2, '0');
const hhmm = t => new Date(t).toLocaleTimeString('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
function liveStatus(h) {
  const ms = h.start - Date.now(), ch = h.ch ? `ช่อง ${esc(h.ch)} · ` : '';
  if (ms <= 0) return `${ch}เริ่มถ่ายทอดสดเมื่อ ${hhmm(h.start)} น.`;
  if (ms > 864e5) return `${ch}เริ่ม${esc(when(h.start))} น.`;
  const t = Math.floor(ms / 1000);
  return `เริ่มใน ${pad2(Math.floor(t / 3600))}:${pad2(Math.floor(t / 60) % 60)}:${pad2(t % 60)} · ${esc(when(h.start))} น.`;
}

const HeroArt = h => `<span class="hc-art">${img(h.art, '')}</span>`;
const HeroBadge = h => h.cls === 'hc-live' || !h.badge ? '' : `<i class="hc-badge">${h.badge}</i>`;
const HeroLogo = h => h.noTitle ? '' : h.logo ? `<img class="hc-logo" src="${esc(h.logo)}" alt="${esc(h.t)}">` : `<b class="hc-tt">${esc(h.t)}</b>`;
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
function HeroActions(h) {
  if (h.cls === 'hc-live') {
    const main = h.start <= Date.now()
      ? `<a class="btn-play btn-live" ${h.href}><b></b>ดูสด</a>`
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
    const card = r.closest('.hc-card'), bg = card.dataset.bg;
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
    ${slides.map((h, i) => `<div class="hf-art${i ? '' : ' on'}" data-watch="${esc(watchKey(h.href))}">${img(h.art, '')}</div>`).join('')}
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
  const reminded = new Set();
  let cur = 0, idle;
  const drawCtas = () => {
    ctas.innerHTML = HeroActions(HF_SLIDES[cur]);
    const r = ctas.querySelector('[data-remind]');
    if (r && reminded.has(cur)) { r.classList.add('set'); r.querySelector('span').textContent = 'ตั้งเตือนแล้ว'; }
  };
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
    reminded.has(cur) ? reminded.delete(cur) : reminded.add(cur);
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
// New look: one live row, what's on air first, then upcoming in start order (the feed splits these into two shelves).
function liveMerged(s, upcoming) {
  const now = Date.now(), seen = new Set();
  const onAir = s.items.filter(it => it.start <= now && it.end > now);
  const next = (upcoming ? upcoming.items : []).filter(it => it.start > now).sort((a, b) => a.start - b.start);
  const items = [...onAir, ...next].filter(it => !seen.has(it.id) && seen.add(it.id));
  return liveRow({ ...s, title: 'ไลฟ์สดและที่กำลังมา' }, items);
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
      if (s === upcoming && hasLiveNow) return '';
      if (s.kind === 'title_shelf') return liveMerged(s, upcoming);
      if (s.kind === 'short_shelf') return shortsRow(s);
      if (s.kind === 'only_now_shelf') return onlyNowRow(s);
      if (s.kind === 'ranking_shelf') return rankingIn(s);
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
  let lastY = 0;
  screen.addEventListener('scroll', () => {
    const y = screen.scrollTop;
    phone.classList.toggle('scrolled', y > 40);
    if (y - lastY > 8 && y > 400) phone.classList.add('min');
    else if (lastY - y > 8 || y < 400) phone.classList.remove('min');
    lastY = y;
  }, { passive: true });
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
  wireHeroCards(screen);
  wireHeroFade(screen);
  screen.querySelectorAll('[data-v]').forEach(a => a.addEventListener('click', () => openShorts(+a.dataset.v)));

  screen.querySelectorAll('[data-stack]').forEach(el => {
    layoutStack(el);
    el.addEventListener('click', () => { el.appendChild(el.firstElementChild); layoutStack(el); });
  });
}

// Tabs only move the selection pill (the other screens aren't built); a tap on the minimised bar expands it.
function tabs() {
  const bar = document.querySelector('.tabbar'), phone = document.querySelector('.phone');
  const links = [...bar.querySelectorAll('a')];
  links.forEach((a, i) => a.addEventListener('click', () => {
    if (phone.classList.contains('min')) return phone.classList.remove('min');
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
    ['ภาพยนตร์', navIcon('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>')],
    ['ซีรีส์', navIcon('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="m8 3 4 4 4-4"/>')],
    ['กีฬา', navIcon('<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3"/>')],
    ['ไลฟ์สด', navIcon('<circle cx="12" cy="12" r="2.5" fill="currentColor"/><path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14"/>')],
    ['ออริจินัล', navIcon('<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>')],
    ['เด็ก', navIcon('<path d="M12 3a6 6 0 0 0-6 6c0 3.5 3 6.5 6 7.5 3-1 6-4 6-7.5a6 6 0 0 0-6-6z"/><path d="M12 16.5V21M10.5 21h3"/>')],
  ],
};
const drawNav = () => {
  document.querySelector('.tb-pills').innerHTML = NAV[LOOK === 'classic' ? 'classic' : 'new'].map(([label, icon]) => `<a>${icon || ''}<span>${label}</span></a>`).join('');
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
  const day = live && x.start ? new Date(x.start).toLocaleDateString('en-GB', { timeZone: TZ, day: 'numeric', month: 'long', year: 'numeric' }) : '';
  const meta = [x.rate && `<i class="dt-chip">${esc(x.rate)}</i>`, x.year && `<i class="dt-chip">${esc(x.year)}</i>`,
    live ? (x.start ? `<span>${x.ch ? `ช่อง ${esc(x.ch)} · ` : ''}${esc(when(x.start))} น.</span>` : '') : x.series ? '<span>ซีรีส์</span>' : x.dur ? `<span>${hm(x.dur)}</span>` : '',
    x.res && `<i class="dt-chip line">${esc(x.res)}</i>`].filter(Boolean).join('');
  return `<div class="dt-art">${img(x.land || x.poster, x.t)}<button class="dt-x" aria-label="ปิด">${closeIcon}</button></div>
    <div class="dt-body">
      ${live && day ? `<span class="dt-live">${onAir ? '<b>Live</b>' : ''}<i>${day}</i></span>` : ''}
      <h1>${esc(x.t)}</h1>
      ${meta ? `<div class="dt-meta">${meta}</div>` : ''}
      <a class="dt-play"${sport ? ' data-kind="sport"' : ''} ${link(d) || `href="${NOW_APP}/watch/${d.type}/${d.id}" target="_blank" rel="noopener"`}>${canPlayNow()
        ? `${playDisc}${onAir ? 'ดูสด' : 'รับชมตอนนี้'}` : `${lockIcon}เริ่มรับชมเลย`}</a>
      ${x.genreTh ? `<p class="dt-genre">${esc(x.genreTh)}</p>` : ''}
      ${x.syn ? `<p class="dt-syn">${esc(x.syn)}</p>` : DETAILS_DONE || x.tmdb ? '' : '<p class="dt-syn dt-wait"><i></i><i></i><i></i></p>'}
      <div class="dt-acts"><button data-mylist class="${mine ? 'on' : ''}">${mine
        ? '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>'
        : '<svg width="28" height="28" viewBox="0 0 24 24" stroke="#fff" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>'}รายการของฉัน</button>
        <button data-share>${shareIcon}แชร์</button></div>
    </div>
    <nav class="dt-tabs"><a class="on">คุณน่าจะชอบ</a></nav>
    <div class="dt-grid">${likes(d, more).map(t => `<a class="poster" ${link(t)}>${nowBadge(t)}${img(t.poster, t.t)}</a>`).join('')}</div>`;
}
function openDetail(d) {
  let el = document.querySelector('.phone > .detail');
  if (!el) {
    el = document.createElement('section');
    el.className = 'detail';
    el.innerHTML = '<div class="dt-scroll"></div>';
    el.addEventListener('click', e => {
      if (e.target.closest('.dt-x')) { el.classList.add('out'); return setTimeout(() => el.remove(), 250); }
      if (e.target.closest('[data-share]') && navigator.share) return navigator.share({ title: el.dt.t, url: `${NOW_APP}/watch/${el.dt.type}/${el.dt.id}` }).catch(() => {});
      if (e.target.closest('.dt-play')) { e.preventDefault(); return nowPlayer(el.dt); }   // a free user never gets here (iap.js)
      const my = e.target.closest('[data-mylist]');
      if (my) { MY_LIST.has(el.dt.id) ? MY_LIST.delete(el.dt.id) : MY_LIST.add(el.dt.id); return paint(true); }
      const a = e.target.closest('.dt-grid a[href]'), next = a && TITLES.get(watchKey(a.getAttribute('href')));
      if (next) { e.preventDefault(); el.dt = next; paint(); el.firstChild.scrollTop = 0; }
    });
    document.querySelector('.phone').appendChild(el);
  }
  // same title again (details arrived, My List toggled): swap the text parts only, so the art doesn't redraw
  const paint = same => {
    const d = el.dt, html = detailHtml(d, DETAILS_MAP);
    if (same) {
      const t = document.createElement('div');
      t.innerHTML = html;
      ['.dt-body', '.dt-grid'].forEach(q => el.querySelector(q).replaceWith(t.querySelector(q)));
    } else el.firstChild.innerHTML = html;
    if (!DETAILS_DONE && !d.tmdb) loadDetails().then(() => { if (el.dt === d && el.isConnected) paint(true); });
  };
  el.paint = paint;   // iap.js redraws the button once a package is bought
  el.dt = d;
  paint();
  el.firstChild.scrollTop = 0;
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
