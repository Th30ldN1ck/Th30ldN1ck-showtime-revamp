// Content detail page for /now-tv/ (Figma: Fix issues, Cases 1114:23623): title block and a menu on the left, and per
// menu entry a panel on the right: episodes by season, คุณน่าจะชอบ, credits. Shares app.js's globals (esc, img, DETAILS,
// toast...). Feed fields come from api/now-home.js; episodes, cast and director from api/now-detail.js (TMDB).
const NEW_EP_DAYS = 21;
const ROW_H = 256;          // a list row: 232 art + 24 gap
const MENU_H = 76;          // a menu button: 68 + 8 gap
const SIMILAR_MAX = 16;
// "indicator moves down to the 3rd item and stays; the list moves up after that" (design note)
const scrollRows = (i, n, shown) => Math.min(Math.max(0, i - 2), Math.max(0, n - shown));

const RATE_TH = {
  G: 'ทุกเพศทุกวัย', PG: 'ควรได้รับคำแนะนำจากผู้ปกครอง', 'PG-13': 'ไม่เหมาะสำหรับเด็กอายุต่ำกว่า 13 ปี',
  R: 'จำกัดอายุผู้ชม (ต่ำกว่า 17 ปีควรมีผู้ปกครอง)', 'NC-17': 'เฉพาะผู้ใหญ่เท่านั้น (18 ปีขึ้นไป)', '18+': 'เฉพาะผู้ใหญ่เท่านั้น (18 ปีขึ้นไป)',
};
const LANG_TH = { TH: 'ไทย', EN: 'อังกฤษ', KO: 'เกาหลี', JP: 'ญี่ปุ่น', CN: 'จีน', MY: 'มลายู', OTHER: 'ภาษาอื่น' };
const thDate = t => new Date(t).toLocaleDateString('th-TH', { timeZone: TZ, day: 'numeric', month: 'short' });
const today = () => dayKey(Date.now());

const DT = { open: false, view: 'menu', m: 0, l: 0, s: 0, c: 0, side: 'list', stack: [] };
const TMDB = new Map();
const MY_LIST = new Set();
let FEED_ITEMS = [];

// ---- data
const mi = id => `<i class="mi" style="--m:url(img/${id.endsWith('.svg') ? id : `m-${id}.svg`})"></i>`;
function menu() {
  const { it, d, tm } = DT, series = it.type === 'tvs-series';
  const inList = MY_LIST.has(it.id);
  return [
    // free pack on a title it plays with ads: the way out of the ads sits above watch (the focus still opens on watch)
    SUB === FREE_PLAN && covers(it) && { id: 'sub', icon: 'crown.svg', label: 'ดูแบบไม่มีโฆษณา · สมัครเลย', cls: 'buy' },
    { id: 'watch', icon: 'play', label: `${series ? 'ดูตอนที่ 1' : 'รับชมตอนนี้'}${!covers(DT.it) ? ' · สมัครแพ็กเกจ' : SUB === FREE_PLAN ? ' · มีโฆษณา' : ''}` },
    series && tm && (tm.seasons || []).length && { id: 'eps', icon: 'episodes', label: 'ตอนเพิ่มเติม' },
    similar().length && { id: 'sim', icon: 'stacks', label: 'คุณน่าจะชอบ' },
    ((d.aud || []).length || (d.sub || []).length) && { id: 'audio', icon: 'subtitles', label: 'เสียงและคำบรรยาย' },
    { id: 'list', icon: inList ? 'remove' : 'add', label: inList ? 'ลบออกจากรายการของฉัน' : 'เพิ่มในรายการของฉัน' },
    { id: 'credits', icon: 'info', label: 'เครดิตและข้อมูลเพิ่มเติม' },
  ].filter(Boolean);
}
// titles of the same kind sharing the first genre, from every shelf of the home feed
function similar() {
  const { it, d } = DT, g = (d.genres || [])[0];
  if (!g) return [];
  const seen = new Set([it.id]);
  return FEED_ITEMS.filter(x => {
    if (seen.has(x.id) || x.type !== it.type || !x.land) return false;
    seen.add(x.id);
    return ((DETAILS[x.id] || {}).genres || []).includes(g);
  }).slice(0, SIMILAR_MAX);
}
function credits() {
  const { d, tm } = DT;
  return [
    (tm && tm.director || []).length && { h: 'ผู้กำกับ', body: tm.director.map(esc).join('<br>') },
    (tm && tm.cast || []).length && { h: 'นักแสดง', body: tm.cast.map(esc).join('<br>') },
    (d.genres || []).length && { h: 'ประเภท', body: d.genres.map(g => esc(GENRE_TH[g] || g)).join('<br>') },
    d.rate && { h: 'ระดับความเหมาะสมของเนื้อหา', body: `<i class="chip">${esc(d.rate)}</i><br>${esc(RATE_TH[d.rate] || '')}` },
  ].filter(Boolean);
}
const seasons = () => (DT.tm && DT.tm.seasons) || [];
const epsOf = s => (seasons()[s] || { eps: [] }).eps;

// ---- drawing
function chips(x, d) {
  const n = seasons().length, eps = epsOf(n - 1).length;
  const tail = d.series ? (n > 1 ? `${n} ซีซั่น` : eps ? `${eps} ตอน` : 'ซีรีส์') : length(d.dur);
  return [d.rate && `<i>${esc(d.rate)}</i>`, (d.year || x.year) && `<i>${esc(d.year || x.year)}</i>`, d.res && `<i class="line">${esc(d.res)}</i>`, tail && `<span>${esc(tail)}</span>`]
    .filter(Boolean).join('');
}
function newLine() {
  const last = DT.tm && DT.tm.last;
  if (!last || !last.air || last.air > today() || Date.now() - Date.parse(last.air) > NEW_EP_DAYS * 864e5) return '';
  return `<div class="dt-new"><i>ใหม่</i>ตอนที่ ${last.n}</div>`;
}
function info() {
  const { it, d, view } = DT, g = (d.genres || []).map(x => GENRE_TH[x] || x)[0] || '';
  return `<div class="dt-info"><div class="hi-title"><span class="hi-cat">${esc(g)}</span><h1>${esc(it.t)}</h1></div>
    <div class="hi-chips">${chips(it, d)}</div>${view === 'menu' ? `${newLine()}<p class="dt-syn">${esc(d.syn || it.syn || '')}</p>` : ''}</div>`;
}
const btn = (label, extra = '', cls = '') => `<div class="dbtn ${cls}">${label}${extra}</div>`;
function left() {
  const { view, it } = DT;
  if (view === 'menu') return `<div class="dm-win"><div class="dm-list">${menu().map(x => btn(`${mi(x.icon)}<span>${esc(x.label)}</span>`, '', x.cls)).join('')}</div></div>`;
  if (view === 'eps') {
    const ss = seasons();
    if (ss.length === 1) return `<div class="dm-list">${btn(`<span>${esc(it.t)}</span>`, `<em>${ss[0].eps.length} ตอน</em>`, 'box')}</div>`;
    return `<div class="dm-list">${ss.map(s => btn(`<span>ซีซั่น ${s.n}</span>`, `<em>${s.eps.length} ตอน</em>`)).join('')}</div>`;
  }
  if (view === 'sim') return `<div class="dm-list">${btn('<span>คุณน่าจะชอบ</span>', `<em>${similar().length} เรื่อง</em>`, 'box')}</div>`;
  return `<div class="dm-list">${credits().map(c => btn(`<span>${c.h}</span>`)).join('')}</div>`;
}
const generic = (t, n) => !t || /^(episode|ตอนที่|ep\.?)\s*\d+$/i.test(t.trim()) || t.trim() === String(n);
function epRow(e) {
  const soon = e.air && e.air > today();
  const title = `ตอนที่ ${e.n}${generic(e.t, e.n) ? '' : ` · ${esc(e.t)}`}`;
  return `<div class="drow${soon ? ' soon' : ''}"><div class="art">${img(e.img || DT.it.land, '')}</div><div class="dr-text"><b>${title}</b>${soon
    ? `<span class="dr-soon">ออกอากาศ ${esc(thDate(e.air))}</span>`
    : `${e.syn ? `<p>${esc(e.syn)}</p>` : ''}${e.dur ? `<span class="dr-len">(${length(e.dur)})</span>` : ''}`}</div></div>`;
}
function simRow(x) {
  const d = DETAILS[x.id] || {};
  return `<div class="drow sim"><div class="art">${onlyNow(x)}${img(x.land, x.t)}</div><div class="dr-text"><b>${esc(x.t)}</b>
    <div class="hi-chips">${[d.rate && `<i>${esc(d.rate)}</i>`, d.year && `<i>${esc(d.year)}</i>`, d.res && `<i class="line">${esc(d.res)}</i>`,
    `<span>${d.series ? 'ซีรีส์' : esc(length(d.dur))}</span>`].filter(Boolean).join('')}</div><p>${esc(d.syn || x.syn || '')}</p></div></div>`;
}
function right() {
  const { view, tm } = DT;
  if (view === 'eps') return tm ? `<div class="dl">${epsOf(DT.s).map(epRow).join('')}</div>` : '<i class="spin"></i>';
  if (view === 'sim') return `<div class="dl">${similar().map(simRow).join('')}</div>`;
  if (view === 'credits') return `<div class="dc">${credits().map(c => `<section><h3>${c.h}</h3><p>${c.body}</p></section>`).join('')}</div>`;
  return '';
}

function drawDetail() {
  const el = $('#detail'), { it, view } = DT;
  el.className = `dt v-${view}`;
  const bg = el.querySelector('.dt-bg img');
  if (bg.dataset.src !== it.land) { bg.dataset.src = it.land || ''; bg.src = it.land || ''; }
  el.querySelector('.dt-left').innerHTML = info() + left();
  el.querySelector('.dt-right').innerHTML = right();
  paintDetail();
}

// focus only moves classes and offsets, so images don't reload on every key
function paintDetail() {
  const el = $('#detail'), { view } = DT;
  el.querySelectorAll('.focus, .sel').forEach(x => x.classList.remove('focus', 'sel'));
  const btns = [...el.querySelectorAll('.dt-left .dbtn')], rows = [...el.querySelectorAll('.drow')];
  if (view === 'menu') {
    btns[DT.m] && btns[DT.m].classList.add('focus');
    const list = el.querySelector('.dm-win .dm-list');
    if (list) list.style.transform = `translateY(${-scrollRows(DT.m, btns.length, 4) * MENU_H}px)`;
    return;
  }
  if (view === 'credits') {
    btns[DT.c] && btns[DT.c].classList.add('focus');
    const sec = el.querySelectorAll('.dc section')[DT.c];
    if (sec) el.querySelector('.dc').style.transform = `translateY(${-sec.offsetTop}px)`;
    return;
  }
  const leftFocus = view === 'eps' && DT.side === 'left';
  const b = btns[view === 'eps' && btns.length > 1 ? DT.s : 0];
  if (b) b.classList.add(leftFocus ? 'focus' : 'sel');
  if (rows[DT.l] && !leftFocus) rows[DT.l].classList.add('focus');
  const list = el.querySelector('.dl');
  if (list) list.style.transform = `translateY(${-scrollRows(DT.l, rows.length, 4) * ROW_H}px)`;
}

// ---- open / close
function openDetail(it, push) {
  if (push && DT.open) DT.stack.push({ it: DT.it, m: DT.m });
  Object.assign(DT, { open: true, it, d: DETAILS[it.id] || {}, tm: TMDB.get(it.id) || null, view: 'menu', m: 0, l: 0, s: 0, c: 0, side: 'list' });
  DT.m = menu().findIndex(x => x.id === 'watch');   // the page opens on watch, even with subscribe above it
  $('#stage').classList.add('detail-on');
  drawDetail();
  if (TMDB.has(it.id)) return;
  const q = new URLSearchParams({ t: it.t, y: DT.d.year || '', s: it.type === 'tvs-series' ? 1 : 0 });
  fetch(`/api/now-detail?${q}`).then(r => r.json()).catch(() => ({})).then(tm => {
    TMDB.set(it.id, tm);
    if (!DT.open || DT.it !== it) return;
    // "ตอนเพิ่มเติม" can appear in the menu now: keep the focus on the entry it was on
    const cur = DT.view === 'menu' && menu()[DT.m].id;
    DT.tm = tm;
    if (cur) DT.m = Math.max(0, menu().findIndex(x => x.id === cur));
    drawDetail();
  });
}
function closeDetail() {
  const prev = DT.stack.pop();
  if (prev) { openDetail(prev.it); DT.m = prev.m; return paintDetail(); }
  DT.open = false;
  $('#stage').classList.remove('detail-on');
  paint();
}

// ---- remote
function detailMove(dx, dy) {
  const { view } = DT;
  if (view === 'menu') {
    const items = menu();
    if (dy) DT.m = Math.max(0, Math.min(items.length - 1, DT.m + dy));
    if (dx > 0 && ['eps', 'sim', 'credits'].includes(items[DT.m].id)) return detailOk();
    return paintDetail();
  }
  if (view === 'credits') { if (dy) DT.c = Math.max(0, Math.min(credits().length - 1, DT.c + dy)); return paintDetail(); }
  if (view === 'eps' && DT.side === 'left') {
    if (dx > 0) { DT.side = 'list'; return paintDetail(); }
    if (dy) { DT.s = Math.max(0, Math.min(seasons().length - 1, DT.s + dy)); DT.l = 0; return drawDetail(); }
    return;
  }
  if (dx < 0 && view === 'eps' && seasons().length > 1) { DT.side = 'left'; return paintDetail(); }
  const n = view === 'eps' ? epsOf(DT.s).length : similar().length;
  if (dy) DT.l = Math.max(0, Math.min(n - 1, DT.l + dy));
  paintDetail();
}
// without a package that covers it (skipped the launch popup, or e.g. ENT for a sport title) watching opens the purchase flow, with the plans for this title
const watch = it => covers(it) ? player(it) : packages(it);
function detailOk() {
  const { view, it, d } = DT;
  if (view === 'menu') {
    const x = menu()[DT.m];
    if (x.id === 'sub') return packages(it);
    if (x.id === 'watch') return watch(it);
    if (x.id === 'list') {
      const on = !MY_LIST.has(it.id);
      on ? MY_LIST.add(it.id) : MY_LIST.delete(it.id);
      drawDetail();
      return toast(on ? 'เพิ่มในรายการของฉันแล้ว' : 'ลบออกจากรายการของฉันแล้ว');
    }
    if (x.id === 'audio') {
      const langs = a => (a || []).map(c => LANG_TH[c] || c).join(', ') || '–';
      return toast(`เสียง: ${langs(d.aud)} · คำบรรยาย: ${langs(d.sub)}`);
    }
    Object.assign(DT, { view: x.id, l: 0, c: 0, side: x.id === 'eps' && seasons().length > 1 ? 'left' : 'list' });
    return drawDetail();
  }
  if (view === 'eps' && DT.side === 'left') { DT.side = 'list'; return paintDetail(); }
  if (view === 'eps') {
    const e = epsOf(DT.s)[DT.l];
    return e && e.air > today() ? toast(`ตอนที่ ${e.n} ออกอากาศ ${thDate(e.air)}`) : watch(it);
  }
  if (view === 'sim') return openDetail(similar()[DT.l], true);
}
function detailBack() {
  if (DT.view !== 'menu') { DT.view = 'menu'; return drawDetail(); }
  closeDetail();
}
