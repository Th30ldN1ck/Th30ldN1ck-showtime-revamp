/* Showtime revamp demo – vanilla JS, hash router, data from data/index.json + data/articles/<n>.json */
(() => {
  'use strict';

  // Where "Watch on NOW" buttons go. Real deep links per title/channel are TBD with the app team.
  const WATCH_URL = 'https://www.truevisions.co.th/';

  const SECTIONS = [
    { key: 'sports', name: 'Sports', th: 'ข่าวกีฬา ผลบอล พรีวิวก่อนเกม', icon: 'ball',
      subs: [['football', 'Football'], ['racing', 'Racing'], ['tennis', 'Tennis'], ['badminton', 'Badminton'], ['more', 'กีฬาอื่นๆ']] },
    { key: 'movies-series', name: 'Movies & Series', th: 'หนังและซีรีส์ใหม่บน TrueVisions NOW', icon: 'film',
      subs: [['series', 'Series'], ['movies', 'Movies']] },
    { key: 'shows', name: 'Shows', th: 'รายการโชว์ เรียลลิตี้ และข่าวบันเทิง', icon: 'star', isNew: true,
      subs: [['the-voice', 'The Voice'], ['agt', 'AGT'], ['true-af-2026', 'True AF 2026'], ['entertainment', 'บันเทิง']] },
    { key: 'kids', name: 'Kids', th: 'การ์ตูนและรายการเด็ก', icon: 'kid', subs: [] },
    { key: 'knowledge', name: 'Knowledge', th: 'สารคดี ความรู้ และข่าว', icon: 'book',
      subs: [['knowledge', 'Knowledge'], ['news', 'News']] },
  ];
  const SEC = Object.fromEntries(SECTIONS.map(s => [s.key, s]));
  const SUBNAME = Object.fromEntries(SECTIONS.flatMap(s => s.subs.map(([k, n]) => [s.key + '/' + k, n])));

  // Show hubs: one page per show. In production each hub's articles come from its own CMS subcategory
  // (as True AF2026 already does). `now` is the show's TVS NOW title id, kept on the website side since the
  // CMS has no field for it; its catalog artwork is the hub's image, so no article photo is reused.
  const SHOWS = {
    'the-voice': { name: 'The Voice Thailand 2026', now: '80vMxY9qaaAE',
      blurb: 'ทุกความเคลื่อนไหวจากเวทีเก้าอี้แดง ผู้เข้าแข่งขัน โค้ช และไฮไลต์ประจำสัปดาห์' },
    'agt': { name: "America's Got Talent", now: '2E9VKzwNPW3Q',
      blurb: 'ไฮไลต์ ผลการแข่งขัน และเรื่องราวของผู้เข้าแข่งขัน AGT 2026' },
    'true-af-2026': { name: 'True AF 2026', now: 'ad5yoYRkyK8d',
      blurb: 'รวมทุกเรื่องราวของนักล่าฝัน True Academy Fantasia 2026 ตั้งแต่ออดิชันจนถึงคอนเสิร์ตสุดท้าย' },
  };
  // status comes from the newest article: on air within 14 days, season over until 90 days, then archive
  const HUB_LABEL = { live: 'ออกอากาศอยู่', ended: 'จบซีซันแล้ว', archive: 'Archive' };
  let HUBS = {};

  const ICONS = {
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>',
    news: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/></svg>',
    ball: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7l4 3-1.5 4.5h-5L8 10z"/></svg>',
    film: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9l5 3-5 3z"/></svg>',
    kid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="9" r="4"/><path d="M5 20c1.5-4 12.5-4 14 0"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z"/><path d="M4 19V5"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4l13 8-13 8z"/></svg>',
  };

  const app = document.getElementById('app');
  let DATA = [], BYID = {};
  const chunkCache = {};

  // ---------- helpers ----------
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dfmt = new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  const tfmt = new Intl.DateTimeFormat('th-TH', { hour: 'numeric', minute: '2-digit' });
  const fmtDate = ms => { const d = new Date(ms); return `${dfmt.format(d)} ${tfmt.format(d)} น.`; };
  const fmtLong = ms => new Intl.DateTimeFormat('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(ms));
  const label = a => a.sec === 'shows' && SHOWS[a.sub] ? SHOWS[a.sub].name : (SUBNAME[a.sec + '/' + a.sub] || SEC[a.sec].name);
  const href = a => `#a-${a.id}`;

  function thumb(a, extra = '') {
    const name = esc(label(a)).replace(/'/g, '');
    const ph = `<div class="ph">${name}</div>`;
    const img = a.img ? `<img src="${esc(a.img)}" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'ph',textContent:'${name}'}))">` : ph;
    return `<div class="thumb">${img}${extra}</div>`;
  }

  const of = (sec, sub) => DATA.filter(a => a.sec === sec && (!sub || a.sub === sub));

  function buildHubs(titles = {}) {
    const today = DATA[0].d, day = 864e5;
    Object.entries(SHOWS).forEach(([key, cfg]) => {
      const items = of('shows', key);
      if (!items.length) return;
      const age = (today - items[0].d) / day;
      const t = titles[cfg.now];
      HUBS[key] = { ...cfg, key, items, href: '#show-' + key, art: t?.img, watch: t && `${NOW_APP}/watch/${t.type}/${cfg.now}`, status: age < 14 ? 'live' : age < 90 ? 'ended' : 'archive' };
    });
  }
  const STATUS_ORDER = { live: 0, ended: 1, archive: 2 };
  // on-air hubs first, then most recently active
  const hubsOf = test => Object.values(HUBS).filter(test).sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || b.items[0].d - a.items[0].d);
  const hubLabel = h => HUB_LABEL[h.status];
  const hubArt = h => h.art || h.items.find(a => a.img)?.img;
  const hubTile = h => { const art = hubArt(h);
    return `<a class="hub" href="${h.href}">${art ? `<img src="${esc(art)}" alt="" loading="lazy" onerror="this.remove()">` : ''}<span class="tag ${h.status}">${hubLabel(h)}</span><h3>${esc(h.name)}</h3><div class="meta">${h.items.length} เรื่อง · ล่าสุด ${dfmt.format(new Date(h.items[0].d))}</div></a>`; };
  // active hubs as tiles, archived ones as a short list of links
  const hubList = (list, title, more = '') => {
    const active = list.filter(h => h.status !== 'archive'), past = list.filter(h => h.status === 'archive');
    return (active.length ? `${hhead(title, more)}<div class="hubs even">${active.map(hubTile).join('')}</div>` : '') +
      (past.length ? `<nav class="ptabs past"><span>ที่ผ่านมา</span>${past.map(h => `<a href="${h.href}">${esc(h.name)}</a>`).join('')}</nav>` : '');
  };

  function setSubnav(active) {
    const items = [['', 'หน้าแรก', 'home'], ...SECTIONS.map(s => [s.key, s.name, s.icon, s.isNew])];
    document.getElementById('subnav-in').innerHTML = items.map(([k, n, icon, isNew]) =>
      `<a href="${k ? '#' + k : '#home'}" class="${k === active ? 'on' : ''} ${isNew ? 'new' : ''}">${ICONS[icon]}<span>${esc(n)}</span></a>`).join('');
  }

  // ---------- pages ----------
  // Home: fixed top stories, then rows. Every story appears once (picked in order, newest first), and
  // everything is chosen from date/section/cover, so no editorial flags are needed.
  const hhead = (title, more = '', sub = '') => `<div class="hhead"><h2>${esc(title)}</h2>${sub ? `<span>${esc(sub)}</span>` : ''}${more ? `<a href="${more}"${more.startsWith('http') ? ' ' + ext : ''}>ดูทั้งหมด <i>→</i></a>` : ''}</div>`;
  const story = (a, cls = '') => `<a class="story ${cls}" href="${href(a)}">${thumb(a)}<span class="rcard-k">${esc(label(a))}</span><b class="clamp${cls ? 3 : 2}">${esc(a.t)}</b>${cls && a.s ? `<p class="clamp2">${esc(a.s)}</p>` : ''}<span class="rcard-d">${dfmt.format(new Date(a.d))}</span></a>`;

  const citem = a => `<a class="citem" href="${href(a)}">${thumb(a)}<span><span class="rcard-k">${esc(label(a))}</span><b class="clamp2">${esc(a.t)}</b><span class="rcard-d">${dfmt.format(new Date(a.d))}</span></span></a>`;

  function home() {
    setSubnav('');
    const used = new Set();
    const take = (list, n) => { const out = list.filter(x => x.img && !used.has(x)).slice(0, n); out.forEach(x => used.add(x)); return out; };
    const [lead, ...top] = take(DATA.filter(a => a.sec !== 'sports'), 5);
    const hubs = hubsOf(h => h.status !== 'archive').slice(0, 3).map(hubTile).join('');
    const latest = take(DATA, 8);
    const feat = (k, n) => [SEC[k], take(of(k), n)];
    const block = ([s, [first, ...rest]], flip) => first ? `${hhead(s.name, '#' + s.key)}<div class="feat${flip ? ' flip' : ''}">${story(first, 'mid')}<div class="clist">${rest.map(citem).join('')}</div></div>` : '';
    const half = ([s, [first, ...rest]]) => first ? `<div>${hhead(s.name, '#' + s.key)}${story(first, 'mid')}<div class="clist">${rest.map(citem).join('')}</div></div>` : '';

    app.innerHTML = `
      <section class="top">
        ${story(lead, 'lead')}
        <div class="top-side">${top.map(a => story(a)).join('')}</div>
      </section>
      ${hhead('Shows', '#shows', 'รายการโชว์ที่คุณติดตาม')}
      <div class="hubs even">${hubs}</div>
      ${hhead('ล่าสุด')}
      <div class="grid g4 cards">${latest.map(rcard).join('')}</div>
      <div id="now-row"></div>
      ${block(feat('sports', 4))}
      ${block(feat('movies-series', 4), true)}
      <div class="pair">${half(feat('kids', 3))}${half(feat('knowledge', 3))}</div>`;

    nowRow().then(html => { const el = document.getElementById('now-row'); if (el && html) el.outerHTML = html; });
  }

  // titles Showtime wrote about most recently, linking to their NOW detail pages
  async function nowRow() {
    try {
      titlesPromise ||= fetch('data/titles.json').then(r => r.json());
      const { titles, art } = await titlesPromise;
      const ids = [...new Set(DATA.map(a => art[a.id]).filter(id => id && titles[id]?.img))].slice(0, 8);
      if (!ids.length) return '';
      return `<section class="now-row">${hhead('ดูบน TrueVisions NOW', NOW_APP, 'เรื่องที่เพิ่งพูดถึงใน Showtime')}<div class="row now">${ids.map(id => {
        const t = titles[id];
        return `<a class="ntile" href="${NOW_APP}/watch/${t.type}/${id}" ${ext}><span class="ntile-img"><img src="${esc(t.img)}" alt="" loading="lazy" onerror="this.remove()">${t.badge === 'only' ? '<em>ดูได้ที่เดียว</em>' : ''}</span><b class="clamp1">${esc(t.t)}</b><span class="rcard-d">${esc(titleMeta(t).join(' · '))}</span></a>`;
      }).join('')}</div></section>`;
    } catch (e) {
      return '';
    }
  }

  function pagedGrid(items, per = 24) {
    if (!items.length) return '<div class="empty">ยังไม่มีบทความในหมวดนี้</div>';
    const id = 'g' + Math.random().toString(36).slice(2);
    setTimeout(() => {
      const g = document.getElementById(id), btn = document.getElementById(id + 'b');
      if (!g || !btn) return;
      let shown = per;
      btn.onclick = () => { g.insertAdjacentHTML('beforeend', items.slice(shown, shown + per).map(rcard).join('')); shown += per; if (shown >= items.length) btn.remove(); else btn.textContent = `โหลดเพิ่ม (${items.length - shown})`; };
    });
    return `<div class="grid g4 cards" id="${id}">${items.slice(0, per).map(rcard).join('')}</div>${items.length > per ? `<button class="more-btn" id="${id}b">โหลดเพิ่ม (${items.length - per})</button>` : ''}`;
  }

  // feature story + compact list, shared by the home sections and the section/show pages
  const featBlock = ([first, ...rest]) => first ? `<div class="feat">${story(first, 'mid')}<div class="clist">${rest.map(citem).join('')}</div></div>` : '';
  const pageHead = (title, sub, count, kicker = '') => `<header class="phead">${kicker}<h1>${esc(title)}</h1><p>${esc(sub)}${count != null ? ` <span>· ${count.toLocaleString()} เรื่อง</span>` : ''}</p></header>`;

  function section(secKey, sub) {
    const s = SEC[secKey];
    if (!s) return notFound();
    setSubnav(secKey);
    const all = of(secKey), items = sub ? of(secKey, sub) : all;
    const subName = sub && (SUBNAME[secKey + '/' + sub] || sub);
    const tabs = s.subs.length ? `<nav class="ptabs"><a class="${sub ? '' : 'on'}" href="#${secKey}">ทั้งหมด <span>${all.length}</span></a>${s.subs.map(([k, n]) => `<a class="${k === sub ? 'on' : ''}" href="${secKey === 'shows' && SHOWS[k] ? '#show-' + k : `#${secKey}-${k}`}">${esc(n)} <span>${of(secKey, k).length}</span></a>`).join('')}</nav>` : '';
    const kicker = sub ? `<nav class="art-kicker"><a href="#${secKey}">${esc(s.name)}</a></nav>` : '';
    let body;
    if (secKey === 'shows' && !sub) {
      const ent = of('shows', 'entertainment').filter(a => a.img);
      body = `${hubList(hubsOf(() => true), 'รายการ')}${hhead('ข่าวบันเทิงล่าสุด')}${featBlock(ent.slice(0, 4))}${hhead('ทั้งหมด')}${pagedGrid(ent.slice(4))}`;
    } else {
      const withImg = items.filter(a => a.img), top = withImg.slice(0, 4);
      body = items.length > 8 ? `${featBlock(top)}${hhead('ล่าสุด')}${pagedGrid(items.filter(a => !top.includes(a)))}` : pagedGrid(items);
    }
    app.innerHTML = `${pageHead(sub ? subName : s.name, s.th, items.length, kicker)}${tabs}${body}`;
  }

  function hubPage(key) {
    const h = HUBS[key];
    if (!h) return notFound();
    setSubnav('shows');
    const items = h.items, withImg = items.filter(a => a.img), top = withImg.slice(0, 4);
    // without catalog art, take a photo from further down so the header doesn't repeat the first story
    const art = h.art || (withImg[4] || withImg[0])?.img;
    const cta = h.status === 'live' ? 'ดูตอนล่าสุดบน TrueVisions NOW' : 'ดูย้อนหลังบน TrueVisions NOW';
    app.innerHTML = `<section class="page-hero">${art ? `<img src="${esc(art)}" alt="" onerror="this.remove()">` : ''}
        <nav class="art-kicker"><a href="#shows">Shows</a><i>/</i><span>${hubLabel(h)}</span></nav>
        <h1>${esc(h.name)}</h1><p>${esc(h.blurb)}</p>
        <div class="row-cta"><a class="tbtn primary" href="${h.watch || NOW_APP}" ${ext}>${ICONS.play}<span>${cta}</span></a><span>${items.length} เรื่อง · ล่าสุด ${dfmt.format(new Date(items[0].d))}</span></div>
      </section>
      ${featBlock(top)}
      ${items.length > 4 ? hhead('ทั้งหมด') + pagedGrid(items.filter(a => !top.includes(a))) : ''}`;
  }

  // Article page: narrow reading column with wide cover/title card. Everything here is derived from the
  // migrated fields (title, summary, section, date, cover, body HTML), so old articles need no editing.
  const SOCIAL = [
    ['Facebook', 'https://www.facebook.com/Truevisions'],
    ['X', 'https://twitter.com/TrueVisions'],
    ['LINE', 'https://lin.ee/1RdWmS1PZ'],
    ['YouTube', 'https://www.youtube.com/user/TrueVisionsOfficial'],
  ];
  const SHARE_ICONS = {
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 15V3M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/></svg>',
    fb: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-7.5H16l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.4H8v3h2.5V21z"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.3L5.3 21H2.2l7.2-8.3L2 3h6.3l4.4 5.8zm-1.1 16.2h1.7L7.4 4.7H5.6z"/></svg>',
    line: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C6.5 3 2 6.6 2 11c0 3.9 3.5 7.2 8.3 7.9.3.1.8.2.9.5.1.3.1.7 0 1l-.1.9c0 .3-.2 1 .9.5s6-3.5 8.2-6.1c1.5-1.6 2.2-3.2 2.2-4.7C22 6.6 17.5 3 12 3z"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/></svg>',
  };
  const shareBar = a => {
    const u = encodeURIComponent(a.old);
    return `<div class="share">
      ${navigator.share ? `<button class="sh native" type="button" aria-label="แชร์">${SHARE_ICONS.share}<span>แชร์</span></button>` : ''}
      <a class="sh" href="https://www.facebook.com/sharer/sharer.php?u=${u}" target="_blank" rel="noopener" aria-label="แชร์ไปที่ Facebook">${SHARE_ICONS.fb}</a>
      <a class="sh" href="https://twitter.com/intent/tweet?url=${u}&text=${encodeURIComponent(a.t)}" target="_blank" rel="noopener" aria-label="แชร์ไปที่ X">${SHARE_ICONS.x}</a>
      <a class="sh" href="https://social-plugins.line.me/lineit/share?url=${u}" target="_blank" rel="noopener" aria-label="แชร์ไปที่ LINE">${SHARE_ICONS.line}</a>
      <button class="sh copy" type="button" aria-label="คัดลอกลิงก์">${SHARE_ICONS.link}</button></div>`;
  };
  // lighter card for the article's "อ่านต่อ" grid, matching the article's single accent
  const rcard = a => `<a class="rcard" href="${href(a)}">${thumb(a)}<span class="rcard-k">${esc(label(a))}</span><b class="clamp2">${esc(a.t)}</b><span class="rcard-d">${dfmt.format(new Date(a.d))}</span></a>`;
  const plain = s => String(s || '').replace(/\s+/g, ' ').trim();

  // Tudum-style title card linking into the TVS NOW app prototype (peacock-clone, deployed on Vercel).
  // data/titles.json is built from the same catalog feeds by scripts/build_titles.py.
  // /play/ is the app's gate: player for signed-in subscribers (Back lands on the /watch/ more-info page),
  // package checkout for everyone else.
  // Local peacock-clone dev server until /play is deployed; live: https://tvs-newhomepage.vercel.app
  const NOW_APP = 'http://localhost:5173';
  const BADGE = { only: ['ดูได้ที่เดียว', 'TrueVisions NOW'], original: ['Original', 'TrueVisions'] };
  const INFO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/></svg>';
  let titlesPromise;

  // Generic card per section, used when no title is confidently linked: names the section on NOW, never a title.
  const BROWSE = {
    'movies-series/movies': ['หนังใหม่บน TrueVisions NOW', '/browse/movies'],
    'movies-series/series': ['ซีรีส์ใหม่บน TrueVisions NOW', '/browse/series'],
    shows: ['เรียลลิตี้และวาไรตี้บน TrueVisions NOW', '/what-to-watch'],
    kids: ['การ์ตูนและหนังครอบครัวบน TrueVisions NOW', '/browse/kids-family'],
    knowledge: ['สารคดีบน TrueVisions NOW', '/what-to-watch'],
    'sports/football': ['ดูฟุตบอลสดบน TrueVisions NOW', '/browse/sports/football'],
    'sports/racing': ['ดู F1 และ MotoGP บน TrueVisions NOW', '/browse/sports/f1-motogp'],
    'sports/tennis': ['ดูเทนนิสบน TrueVisions NOW', '/browse/sports/tennis'],
    sports: ['ดูกีฬาสดบน TrueVisions NOW', '/browse/sports'],
  };
  const titleLinks = (tid, t) => ({ ...t, id: tid,
    play: `${NOW_APP}/play/${t.type}/${tid}?title=${encodeURIComponent(t.t)}&img=${encodeURIComponent(t.img || '')}`,
    info: `${NOW_APP}/watch/${t.type}/${tid}` });

  // titles.json `art` holds only confident links (editor correction, NOW link in the body, or the title's
  // name in the headline); a null entry means an editor ruled out every title.
  async function titleFor(a) {
    try {
      titlesPromise ||= fetch('data/titles.json').then(r => r.json());
      const { titles, art, shelf } = await titlesPromise;
      const tid = a.id in art ? art[a.id] : HUBS[a.sub]?.now;
      if (tid && titles[tid]) return titleLinks(tid, titles[tid]);
      const key = `${a.sec}/${a.sub}`, [heading, path] = BROWSE[key] || BROWSE[a.sec] || ['ดูต่อบน TrueVisions NOW', ''];
      const picks = (shelf[key] || []).filter(i => titles[i]?.img).slice(0, 3).map(i => titleLinks(i, titles[i]));
      return { generic: true, heading, href: NOW_APP + path, picks };
    } catch (e) {
      return null;
    }
  }

  const ext = 'target="_blank" rel="noopener"';

  function titleMeta(t) {
    const runtime = t.min ? (t.min >= 60 ? `${Math.floor(t.min / 60)} ชม. ` : '') + (t.min % 60 ? `${t.min % 60} นาที` : '') : '';
    return [t.eps ? `${t.eps} ตอน` : runtime, t.rate, t.yr].filter(Boolean);
  }

  function titleCard(t) {
    const meta = [...titleMeta(t), t.g].filter(Boolean);
    const badge = BADGE[t.badge];
    return `<section class="tcard">
      <div class="tcard-bg" style="background-image:url('${esc(t.img)}')"></div>
      <a class="tcard-img" href="${t.play}" ${ext} aria-label="ดู ${esc(t.t)}"><img src="${esc(t.img)}" alt="" loading="lazy" onerror="this.remove()"><span class="tcard-play">${ICONS.play}</span>${badge ? `<span class="tcard-badge"><b>${badge[0]}</b><span>${badge[1]}</span></span>` : ''}</a>
      <div class="tcard-info">
        <span class="tcard-kicker">ดูเรื่องนี้บน TrueVisions NOW</span>
        <h3 class="clamp2"><a href="${t.info}" ${ext}>${esc(t.t)}</a></h3>
        ${meta.length ? `<div class="tcard-meta">${meta.map(m => `<span>${esc(m)}</span>`).join('')}</div>` : ''}
        <p class="clamp3">${esc(t.syn || `ดู ${t.t} ได้แล้วบน TrueVisions NOW ทั้งไฮไลต์และย้อนหลัง`)}</p>
        <div class="tcard-btns">
          <a class="tbtn primary" href="${t.play}" ${ext}>${ICONS.play}<span>ดูเลย</span></a>
          <a class="tbtn" href="${t.info}" ${ext}>${INFO}<span>ข้อมูลเพิ่มเติม</span></a>
        </div>
        <p class="tcard-price">เริ่มต้น <b>฿99</b>/เดือน</p>
      </div>
    </section>`;
  }

  const genericCard = g => `<section class="tcard tgen">
      <div class="tgen-shelf">${g.picks.map(t => `<a class="tgen-pick" href="${t.info}" ${ext}><span class="tgen-img"><img src="${esc(t.img)}" alt="" loading="lazy" onerror="this.remove()"></span><b class="clamp1">${esc(t.t)}</b></a>`).join('')}</div>
      <div class="tcard-info">
        <span class="tcard-kicker">ดูต่อบน TrueVisions NOW</span>
        <h3>${esc(g.heading)}</h3>
        <p>ดูได้ทุกที่ ทุกอุปกรณ์ ทั้งมือถือ แท็บเล็ต และสมาร์ททีวี</p>
        <div class="tcard-btns"><a class="tbtn primary" href="${g.href}" ${ext}>${ICONS.play}<span>เลือกดูบน NOW</span></a></div>
        <p class="tcard-price">เริ่มต้น <b>฿99</b>/เดือน</p>
      </div>
    </section>`;

  // phone-only bar between the cover and the full card
  const titleBar = t => `<div class="tbar" id="tbar">
      <a class="tbar-link" href="${t.play}" ${ext}><img src="${esc(t.img)}" alt="" onerror="this.remove()"><span class="tbar-txt"><span class="tbar-kicker">${t.badge === 'only' ? 'ดูได้ที่เดียวบน NOW' : 'ดูบน TrueVisions NOW'}</span><b>${esc(t.t)}</b></span><span class="tbtn primary">${ICONS.play}<span>ดูเลย</span></span></a>
      <button class="tbar-x" aria-label="ปิด" onclick="this.parentNode.remove()">×</button>
    </div>`;

  window.addEventListener('scroll', () => {
    const bar = document.getElementById('tbar');
    if (!bar) return;
    const start = document.querySelector('.art-cover') || document.querySelector('.art-title');
    const card = document.querySelector('.tcard');
    const show = start && start.getBoundingClientRect().bottom < 0 && (!card || card.getBoundingClientRect().top > innerHeight);
    bar.classList.toggle('show', !!show);
  }, { passive: true });

  async function article(id) {
    const a = BYID[id];
    if (!a) return notFound();
    setSubnav(a.sec);
    const s = SEC[a.sec];
    const subHref = a.sec === 'shows' && SHOWS[a.sub] ? `#show-${a.sub}` : `#${a.sec}-${a.sub}`;
    const sameSub = DATA.filter(x => x.sec === a.sec && x.sub === a.sub && x.id !== a.id);
    const inline = sameSub.find(x => x.img) || sameSub[0];
    const readNext = [...sameSub.filter(x => x !== inline), ...DATA.filter(x => x.sec === a.sec && x.sub !== a.sub)].filter(x => x.img).slice(0, 8);
    const topics = [[s.name, `#${a.sec}`], [label(a), subHref], ['TrueVisions NOW', WATCH_URL]]
      .filter(([t], i, arr) => arr.findIndex(([u]) => u === t) === i);

    app.innerHTML = `<div class="art">
        <article class="art-main">
          <header class="art-head">
            <nav class="art-kicker" aria-label="หมวด"><a href="#${a.sec}">${esc(s.name)}</a>${label(a) !== s.name ? `<i>/</i><a href="${subHref}">${esc(label(a))}</a>` : ''}</nav>
            <h1 class="art-title">${esc(a.t)}</h1>
            ${a.s ? `<p class="art-lead" id="lead">${esc(a.s)}</p>` : ''}
            <div class="art-meta">
              <span>${fmtDate(a.d)}</span><span id="readtime"></span>
              ${shareBar(a)}
            </div>
          </header>
          ${a.img ? `<figure class="art-cover">${thumb(a)}</figure>` : ''}
          <div class="art-body" id="body"><p class="muted">กำลังโหลดเนื้อหา…</p></div>
          <div id="title-card"></div>
          <div class="art-topics"><span>หัวข้อ</span>${topics.map(([t, h]) => `<a href="${h}"${h.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${esc(t)}</a>`).join('')}</div>
          <div class="follow"><span>ติดตาม TrueVisions</span><div>${SOCIAL.map(([n, u]) => `<a href="${u}" target="_blank" rel="noopener">${n}</a>`).join('')}</div></div>
        </article>
      </div>
      ${readNext.length ? `<section class="art-more"><h2 class="art-h2">อ่านต่อ</h2><div class="grid g4">${readNext.map(rcard).join('')}</div></section>` : ''}`;

    const copy = app.querySelector('.sh.copy');
    copy.onclick = () => navigator.clipboard?.writeText(a.old).then(() => { copy.classList.add('done'); setTimeout(() => copy.classList.remove('done'), 1500); });
    const native = app.querySelector('.sh.native');
    if (native) native.onclick = () => navigator.share({ title: a.t, url: a.old }).catch(() => {});

    window.scrollTo(0, 0);
    titleFor(a).then(t => {
      const el = document.getElementById('title-card');
      if (!t || !el || location.hash !== `#a-${id}`) return;
      if (t.generic) { el.outerHTML = genericCard(t); return; }
      el.outerHTML = titleCard(t);
      app.insertAdjacentHTML('beforeend', titleBar(t));
    });
    try {
      if (!chunkCache[a.c]) chunkCache[a.c] = fetch(`data/articles/${a.c}.json`).then(r => r.json());
      const html = (await chunkCache[a.c])[a.id];
      const el = document.getElementById('body');
      if (el && location.hash === `#a-${id}`) {
        el.innerHTML = html || '<p class="muted">ไม่มีเนื้อหา</p>';
        // the old CMS saved spacer paragraphs (76% of articles); drop them here rather than in the data
        el.querySelectorAll('p').forEach(p => { if (!p.textContent.trim() && !p.querySelector('img,iframe,video')) p.remove(); });
        const mins = Math.max(1, Math.round(el.textContent.replace(/\s+/g, '').length / 600));
        document.getElementById('readtime').textContent = `อ่าน ${mins} นาที`;
        const paras = [...el.children].filter(p => p.tagName === 'P' && p.textContent.trim().length > 40);
        // ~10% of summaries are just the opening paragraph; don't show it twice
        const lead = document.getElementById('lead');
        if (lead && paras[0] && plain(paras[0].textContent).includes(plain(a.s).slice(0, 40))) lead.remove();
        if (inline && paras.length >= 4) paras[Math.floor(paras.length / 2)].insertAdjacentHTML('afterend',
          `<a class="art-inline" href="${href(inline)}">${inline.img ? thumb(inline) : ''}<span class="art-inline-txt"><span class="art-inline-k">อ่านต่อ <i>→</i></span><b class="clamp2">${esc(inline.t)}</b><span class="art-inline-d">${esc(label(inline))} · ${dfmt.format(new Date(inline.d))}</span></span></a>`);
        el.querySelectorAll('img').forEach(i => i.onerror = () => i.remove());
        if (window.self !== window.top) el.querySelectorAll('iframe').forEach(f => {
          const a = document.createElement('a'); a.href = f.src.replace('/embed/', '/watch?v='); a.target = '_blank'; a.rel = 'noopener';
          a.className = 'tbtn primary'; a.innerHTML = ICONS.play + '<span>ดูวิดีโอบน YouTube</span>'; f.replaceWith(a);
        });
      }
    } catch (e) {
      const el = document.getElementById('body');
      if (el) el.innerHTML = '<p class="muted">โหลดเนื้อหาไม่สำเร็จ</p>';
    }
  }

  function notFound() { setSubnav(''); app.innerHTML = '<div class="empty">ไม่พบหน้านี้ · <a href="#home" style="color:var(--pink)">กลับหน้าแรก</a></div>'; }

  function route() {
    const h = decodeURIComponent(location.hash.replace(/^#/, ''));
    closeMenu();
    if (!h || h === 'home') home();
    else if (h.startsWith('a-')) article(h.slice(2));
    else if (h.startsWith('show-')) hubPage(h.slice(5));
    else {
      const sec = SECTIONS.map(s => s.key).sort((a, b) => b.length - a.length).find(k => h === k || h.startsWith(k + '-'));
      if (sec) section(sec, h.length > sec.length ? h.slice(sec.length + 1) : undefined);
      else notFound();
    }
    if (!h.startsWith('a-')) window.scrollTo(0, 0);
  }

  const mast = document.getElementById('mast'), burger = document.getElementById('burger');
  function closeMenu() { mast.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }
  burger.onclick = () => burger.setAttribute('aria-expanded', mast.classList.toggle('open'));
  document.getElementById('now-link').href = NOW_APP;
  // hysteresis so folding the logo row (which shifts the page) can't flip the state back
  window.addEventListener('scroll', () => {
    if (scrollY > 80) mast.classList.add('scrolled');
    else if (scrollY < 10) mast.classList.remove('scrolled');
  }, { passive: true });

  titlesPromise = fetch('data/titles.json').then(r => r.json());
  Promise.all([fetch('data/index.json').then(r => r.json()), titlesPromise.catch(() => ({}))]).then(([d, t]) => {
    DATA = d; BYID = Object.fromEntries(d.map(a => [a.id, a]));
    buildHubs(t.titles);
    document.getElementById('mast-date').textContent = fmtLong(DATA[0].d);
    window.addEventListener('hashchange', route);
    route();
  }).catch(() => { app.innerHTML = '<div class="empty">โหลดข้อมูลไม่สำเร็จ</div>'; });
})();
