// TVS NOW × CP concept: the now-app home (ใหม่ 2) with "ใหม่บน NOW" moved up into the header pills, and its tab-bar
// slot given to True Privilege, a space for what being a True / CP customer unlocks, with a game layer (points and
// level, daily check-in, weekly quests). A "ดูในฐานะ" switch in the demo ribbon (?as=true|cp|ais) shows the same app
// to a True customer, a CP-group member who isn't on True, and someone on another network, who sees what they're
// missing and a way in. Uses app.js globals (NAV, EXTRA_SHELVES, esc, img, link, row, render, wire).
// Privilege wears the True | dtac CI: the red → magenta → violet → blue gradient and its light ribbon.

// app.js draws the pills once the feed has loaded, so this lands before the first draw
NAV.new.unshift(['ใหม่บน NOW', navIcon('<rect x="4" y="7" width="16" height="10" rx="1.5"/><path d="M6 4h12M6 20h12"/>')]);

const ico = (d, s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const I = {
  check: ico('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 12),
  crown: ico('<path d="M3.5 8.5 8 12l4-6.5 4 6.5 4.5-3.5-1.8 9.5H5.3z"/>'),
  play: ico('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m10 9 5 3-5 3z"/>'),
  ball: ico('<circle cx="12" cy="12" r="9"/><path d="m12 7 4 3-1.5 5h-5L8 10z"/>'),
  flame: ico('<path d="M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-3.5 2-5 1 1.5 2 2 2 2s-1-4 1-7z"/>'),
  gift: ico('<rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M3 9h18M12 9v11M12 9c-2-4-6-4-6-1.5S10 9 12 9c2 0 6 0 6-1.5S14 5 12 9"/>'),
  friends: ico('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6"/>'),
  hd: ico('<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M7 9.5v5M7 12h3M10 9.5v5M13.5 9.5v5h1.5a2.5 2.5 0 0 0 0-5z"/>'),
  lock: ico('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  qr: ico('<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><rect x="8" y="8" width="3" height="3"/><rect x="13" y="8" width="3" height="3"/><rect x="8" y="13" width="3" height="3"/><path d="M13 13h3v3M14.5 16h1.5"/>', 30),
};
// The CI's light ribbon (the streak across the True | dtac 5G key visual): a soft coloured glow with a white core
const swoosh = cls => `<svg class="swoosh" viewBox="0 0 400 120" preserveAspectRatio="none" aria-hidden="true">
  <defs><linearGradient id="sw-${cls}" x1="0" x2="1"><stop offset="0" stop-color="#ff3b4e" stop-opacity="0"/><stop offset=".3" stop-color="#ff3b8a"/><stop offset=".65" stop-color="#9fe3ff"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient></defs>
  <path d="M-10 90 C 90 20, 170 120, 260 60 S 380 10, 420 40" stroke="url(#sw-${cls})" stroke-width="18" fill="none" opacity=".45" filter="blur(6px)"/>
  <path d="M-10 90 C 90 20, 170 120, 260 60 S 380 10, 420 40" stroke="url(#sw-${cls})" stroke-width="5" fill="none"/>
  <path d="M-10 96 C 90 30, 170 126, 260 68 S 380 18, 420 48" stroke="#fff" stroke-width="1.2" fill="none" opacity=".8"/>
</svg>`;

// ---------- who's watching: the demo's "ดูในฐานะ" switch ----------
// Every privilege has a level it needs: 1 = CP-group members and True customers, 2 = True customers only.
// sim = a True prepaid content SIM (The Voice SIM, sold at 7-Eleven to people not on True): CP-level privileges plus its
// franchise, and it makes them a True customer. free = a NOW account with no package (any network): anything they
// play opens the in-app purchase flow (iapSheet)
const RANK = { ais: 0, free: 0, cp: 1, sim: 1, true: 2 };
const PERSONAS = {
  true: {
    linked: { 'True 5G': true, 'ALL member': true, TrueMoney: false }, since: 2019,
    game: { points: 2480, next: 3000, level: 12, tier: 'RED', nextTier: 'BLACK', streak: 4, today: 4, watched: 42, mult: 2 },
  },
  cp: {
    linked: { 'ALL member': true, 'True 5G': false, TrueMoney: false }, since: 2024,
    game: { points: 640, next: 1000, level: 3, tier: 'CP', nextTier: 'RED', streak: 1, today: 1, watched: 18, mult: 1 },
  },
  sim: {
    linked: { 'The Voice SIM': true, 'ALL member': false, TrueMoney: false }, since: 2026,
    game: { points: 120, next: 500, level: 1, tier: 'VOICE', nextTier: 'RED', streak: 0, today: 0, watched: 0, mult: 1 },
  },
  ais: {},
  free: {},
};
const AS_KEY = 'now-cp-as';
let AS = (() => {
  const q = new URLSearchParams(location.search).get('as');
  let saved = null;
  try { if (q) localStorage.setItem(AS_KEY, q); saved = localStorage.getItem(AS_KEY); } catch (e) {}
  return (q || saved) in PERSONAS ? q || saved : 'true';
})();
// ---------- test variants (demo panel, desktop): ?poster=full|blur and ?offer=privilege|price, remembered ----------
// Two of the framework's bets, switchable per test participant: locked posters shown in full or blurred (choice 6),
// and the privilege pitch or a plain price offer to non-members (choice 1)
const TEST = {};
[['poster', ['full', 'blur']], ['offer', ['privilege', 'price']]].forEach(([k, opts]) => {
  const q = new URLSearchParams(location.search).get(k);
  let saved = null;
  try { if (q) localStorage.setItem(`now-cp-${k}`, q); saved = localStorage.getItem(`now-cp-${k}`); } catch (e) {}
  TEST[k] = opts.includes(q || saved) ? q || saved : opts[0];
});
// ?clean hides the demo panel, so a test participant sees only the app (the variants still come from the link)
if (new URLSearchParams(location.search).has('clean')) document.body.classList.add('clean');
const PRICE_TXT = '฿149/เดือน';
let PAID = false;   // bought the package in the price variant: member-level content, no membership
const can = need => RANK[AS] >= need || (PAID && need <= 1);   // what you can watch
const member = need => RANK[AS] >= need;                         // the club's own perks: rewards, events, points
const priceFor = need => TEST.offer === 'price' && need <= 1 && !can(need);
const GAME = () => PERSONAS[AS].game;
const outsider = () => RANK[AS] === 0;   // neither True nor CP: other networks and free users
isFree = () => AS === 'free';   // iap.js's gate: the free persona gets the purchase flow
const onlyFor = need => need === 2 ? 'เฉพาะลูกค้าทรู' : 'เฉพาะลูกค้าทรูและสมาชิก CP';
const onlyForShort = need => need === 2 ? 'เฉพาะลูกค้าทรู' : 'ลูกค้าทรู · CP';   // for poster tags and benefit tiles
const lockMark = `<span class="lk">${I.lock}</span>`;

// ---------- game layer (in-memory: a demo, nothing is saved) ----------
// a week of check-ins: days before `today` are done, the 7th is a bigger gift
const CHECKIN = [10, 10, 10, 20, 10, 10, 100];
// This week's mission: finish the episode before the live show, for a coffee at 7-Eleven, not points nobody can price.
// Tied to what's airing (Thai-first), resumed in one tap from home; `at` = minutes watched of the player's EP_MIN
const MISSION = { ep: 4, at: 32, done: false };
const QUESTS = [
  { i: I.play, t: 'ดู The Voice EP.4 ให้จบก่อนไลฟ์วันอาทิตย์', mission: true, r: 'กาแฟ All Café ฟรี' },
  { i: I.ball, t: 'ดูไลฟ์กีฬา 1 แมตช์', n: 0, of: 1, r: 'ลุ้นตั๋วชมขอบสนาม' },
  { i: I.qr, t: 'สแกน QR ที่ 7-Eleven', n: 0, of: 1, r: 'แต้ม x2 7 วัน', scan: true },
  { i: I.friends, t: 'ชวนเพื่อนลูกค้าทรูมาดูด้วย', n: 1, of: 3, r: 'ดูก่อนใคร +3 วัน' },
];
// Watch to earn: minutes watched today pay out at each milestone, True customers at double rate (`mult`)
const WATCH = [[15, 5], [30, 10], [60, 20], [120, 40]];
const WATCH_MAX = WATCH[WATCH.length - 1][0];
// the stops sit evenly along the track, and the fill runs piecewise between them
const watchPos = min => {
  const at = [0, ...WATCH.map(([m]) => m)], i = at.findIndex((m, k) => k && min <= m);
  if (i < 0) return '100%';
  return `${((i - 1 + (min - at[i - 1]) / (at[i] - at[i - 1])) * 100 / WATCH.length).toFixed(1)}%`;
};
const earnedBy = (min, mult) => WATCH.filter(([m]) => m <= min).reduce((t, [, p]) => t + p * mult, 0);
const pct = (n, of) => `${Math.round(100 * Math.min(n, of) / of)}%`;
const num = n => n.toLocaleString('en-US');

// Ready to use this month: free ones are claimed, the rest are paid for with TruePoint (`cost`)
const REWARDS = [
  { id: 'movie', i: I.play, t: 'หนังใหม่ฟรี 1 เรื่อง', s: 'เลือกจากหนังเข้าใหม่เดือนนี้', need: 1 },
  // the whole home on one account: more people watching = harder to leave (was 4K, which most phones can't show)
  { id: 'family', i: I.friends, t: 'เพิ่มจอให้คนในบ้าน', s: 'ฟรี 1 เดือน · ดูพร้อมกัน 4 จอ', need: 2 },
  { id: 'cafe', logo: '7eleven.svg', t: 'คูปอง All Café 25 บาท', s: 'ใช้ได้ที่ 7-Eleven ทุกสาขา', need: 1, cost: 300 },
  { id: 'tmn', logo: 'truemoney.png', icon: true, t: 'ลด 50 บาท แพ็กเกจ NOW', s: 'เมื่อจ่ายผ่าน TrueMoney', need: 1, cost: 500 },
];
const USED = new Set();
// Members-only events, the club part money can't buy: limited seats, booked in the app. Pictures come from the feed's
// own shelves (`shelf`) or the rail's first premium title; dates are days from today.
const EVENTS = [
  { id: 'premiere', from: 'rail', kind: 'รอบฉายพิเศษ', t: 'ดูตอนแรกก่อนใครบนจอใหญ่', where: 'โรงภาพยนตร์ในกรุงเทพฯ', days: 9, seats: 38, need: 2 },
  { id: 'voice', shelf: 'The Voice Thailand 2026', kind: 'ชมสดในสตูดิโอ', t: 'The Voice Thailand 2026', where: 'รอบไลฟ์ · ทรูวิชั่นส์ สตูดิโอ', days: 12, seats: 120, need: 1 },
  { id: 'af', shelf: 'True Academy Fantasia 2026', kind: 'แฟนมีตติ้ง', t: 'True AF2026 Fan Meet', where: 'พบน้อง ๆ AF แบบใกล้ชิด', days: 16, seats: 60, need: 1 },
];
const BOOKED = new Set();
const dayTh = n => { const d = new Date(Date.now() + n * 864e5); return d.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' }); };
const eventPic = (e, shelves) => e.from === 'rail' ? (storeItem() || {}).poster : ((shelves.find(x => x.title === e.shelf) || { items: [] }).items.find(it => it.land) || {}).land;
const eventCard = (e, shelves) => {
  const pic = eventPic(e, shelves), booked = BOOKED.has(e.id), seats = e.seats - (booked ? 1 : 0);
  const top = `<span class="ev-pic">${pic ? `<img src="${esc(pic)}" alt="">` : ''}<i class="ev-kind">${e.kind}</i><i class="ev-date">${dayTh(e.days)}</i>${member(e.need) ? '' : lockMark}</span>
      <b>${e.t}</b><span class="ev-where">${e.where}</span>`;
  if (!member(e.need)) return `<a class="ev off" data-join-sheet data-club data-need="${e.need}" data-t="${esc(e.t)}"${pic ? ` data-img="${esc(pic)}"` : ''}>${top}<em class="ev-foot">${I.lock}${onlyFor(e.need)}</em></a>`;
  return `<div class="ev${booked ? ' booked' : ''}">${top}<em class="ev-foot"><small>เหลือ <b>${seats}</b> ที่</small>
      <button data-book="${e.id}" ${booked ? 'disabled' : ''}>${booked ? `${I.check}จองแล้ว` : 'จองที่นั่ง'}</button></em></div>`;
};
const monthEnd = () => { const d = new Date(); d.setMonth(d.getMonth() + 1, 0); return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }); };
// Ways into NOW from across the CP group, told as the benefit first and the partner second.
// Logos in site/img/cp: 7-Eleven from Wikimedia Commons, the ALL mark cropped from 7-Eleven TH's own member-card icon
// (7eleven.co.th), TrueMoney and True from their Thai App Store icons. `mark` sits on a white tile, `icon` fills it.
const CP = [
  { mark: '7eleven.svg', k: '7-Eleven', t: 'เห็นโฆษณาในร้าน สแกนแล้วดูฟรี 1 ตอน', a: 'สแกน', scan: true },
  { mark: 'allmember.svg', k: 'ALL member · แลกแต้มเช่าหนังใหม่', t: 'ดูครบ 5 ชม. รับ 50 แต้ม ALL member', a: 'ดูแต้ม' },
  { icon: 'truemoney.png', k: 'TrueMoney', t: 'จ่ายผ่านวอลเล็ต รับเงินคืน 10%', a: 'เชื่อมบัญชี' },
  { icon: 'true.png', k: 'True Shop', t: 'ซื้อมือถือใหม่ ดู NOW ฟรี 3 เดือน', a: 'ดูสิทธิ์' },
];

const ciTag = t => `<i class="pv-tag">${t}</i>`;
// a poster behind a privilege: open as usual, or blurred with a lock that offers the way in
const joinAttrs = it => `data-join-sheet data-t="${esc(it.t)}" data-img="${esc(it.poster || it.land)}"`;
const pvPoster = (it, tag, need) => can(need)
  ? `<a class="poster" ${link(it)}>${ciTag(tag)}${img(it.poster || it.land, it.t)}</a>`
  : `<a class="poster locked" ${joinAttrs(it)} data-need="${need}">${ciTag(priceFor(need) ? PRICE_TXT : onlyForShort(need))}${img(it.poster || it.land, it.t)}${lockMark}</a>`;

const checkins = g => CHECKIN.map((p, d) => {
  const state = g && d < g.today ? 'done' : g && d === g.today ? 'today' : '';
  return `<button class="ck ${state}" ${state === 'today' ? 'data-checkin' : 'disabled'}>
    <i>${state === 'done' ? I.check : d === 6 ? I.gift : `+${p}`}</i><span>${state === 'today' ? 'วันนี้' : `วันที่ ${d + 1}`}</span></button>`;
}).join('');

// the ways in, for anyone not yet on True postpaid: switch network or upgrade (everything), a Voice SIM from 7-Eleven
// (no switching), or join ALL member free (the CP level)
const SIM_BTN = `<button class="pv-cta2" data-sim><b>ซื้อ The Voice SIM ฿99</b><span>ไม่ต้องย้ายค่าย · eSIM ผ่านแอปทรู หรือรับที่ 7-Eleven</span></button>`;
// the SIM only unlocks The Voice, so it's offered for The Voice titles and on the card, not for other locked titles
const joinButtons = (t = '') => `<div class="pv-join">
    ${AS === 'sim' ? `<button class="pv-cta" data-join="true"><b>อัปเกรดเป็นทรูรายเดือน</b><span>ปลดล็อกดูก่อนใคร จอเพิ่มให้คนในบ้าน และแต้ม x2</span></button>`
      : AS !== 'true' ? `<button class="pv-cta" data-join="true"><b>ย้ายมาทรู เบอร์เดิม</b><span>ออนไลน์ 15 นาที · ปลดล็อกทุกสิทธิ์</span></button>` : ''}
    ${(outsider() || AS === 'cp') && (!t || /voice/i.test(t)) ? SIM_BTN : ''}
    ${outsider() ? `<button class="pv-cta2" data-join="cp"><b>สมัคร ALL member ฟรี</b><span>ดูซีรีส์พรีเมียมได้เลย</span></button>` : ''}
  </div>`;

// My entitlements: every right this account holds, the plan or membership it came from, the apps it plays on and its
// state. Rights come from many places (postpaid, a content SIM, ALL member) and play across NOW, TrueID and the TV box,
// so one list shows them together. Just joined → "กำลังเปิดใช้" for a moment, as activation crosses systems.
const SRC = {
  post: { name: 'True 5G รายเดือน', logo: 'true.png' },
  sim: { name: 'The Voice SIM', sim: true },
  all: { name: 'ALL member', logo: 'allmember.svg', mark: true },
};
const ENTITLEMENTS = {
  true: [
    { t: 'True Exclusive ทุกเรื่อง', src: 'post', on: ['NOW', 'TrueID', 'ทีวี'] },
    { t: 'ดูก่อนใคร 7 วัน', src: 'post', on: ['NOW', 'ทีวี'] },
    { t: 'ไม่มีโฆษณา', src: 'post', on: ['NOW', 'TrueID'] },
    { t: 'แต้ม ALL member ทุกครั้งที่ดู', src: 'all', on: ['NOW', '7-Eleven'] },
  ],
  cp: [
    { t: 'ซีรีส์พรีเมียม · ไม่มีโฆษณา', src: 'all', on: ['NOW', 'TrueID'] },
    { t: 'กิจกรรมเฉพาะสมาชิก', src: 'all', on: ['NOW'] },
  ],
  sim: [
    { t: 'The Voice ทุกรายการ · Teens · Celebrity', src: 'sim', on: ['NOW', 'TrueID'], until: 270 },
    { t: 'ดู The Voice ไม่เปลืองเน็ต', src: 'sim', on: ['NOW', 'TrueID'], until: 270 },
    { t: 'โหวตและดูหลังเวที', src: 'sim', on: ['NOW'], until: 270 },
  ],
};
let JOINED_AT = 0;
const ACTIVATE_MS = 6000;   // outlasts the welcome screen, so the switch to active is seen
// Info lists stay folded to one line; tap to see the detail
const CHEV = '<svg class="fold-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';
const srcIcon = k => { const x = SRC[k]; return x.sim ? '<i class="ent-src sim">SIM</i>' : `<i class="ent-src${x.mark ? ' mark' : ''}"><img src="/img/cp/${x.logo}" alt=""></i>`; };
// what you have, then what True postpaid would add, locked, so the list itself makes the case to move
function entitlements() {
  const list = ENTITLEMENTS[AS] || [];
  const locked = AS === 'true' ? [] : ENTITLEMENTS.true.filter(e => !(e.src === 'all' && AS === 'cp'));
  const busy = Date.now() - JOINED_AT < ACTIVATE_MS;
  const srcs = [...new Set(list.map(e => e.src))];
  const ent = e => `<div class="ent"${e.src === 'sim' ? ' data-voice' : ''}>${srcIcon(e.src)}
        <span class="ent-body"><b>${e.t}</b><small>จาก ${SRC[e.src].name}${e.until ? ` · ถึง ${dayTh(e.until)}` : ''}</small>
          <span class="ent-on">${e.on.map(a => `<i>${a}</i>`).join('')}</span></span>
        <em class="ent-state${busy ? ' busy' : ''}" data-ent-state>${busy ? 'กำลังเปิดใช้' : 'ใช้งานอยู่'}</em></div>`;
  const lockedEnt = e => `<a class="ent off" data-join-sheet data-need="2" data-t="${esc(e.t)}"><i class="ent-src lock">${I.lock}</i>
        <span class="ent-body"><b>${e.t}</b><small>${e.src === 'all' ? 'สมัคร ALL member ฟรี' : 'สำหรับลูกค้าทรูรายเดือน'}</small>
          <span class="ent-on">${e.on.map(a => `<i>${a}</i>`).join('')}</span></span>
        <em class="ent-go">${e.src === 'all' ? 'สมัคร' : 'ย้ายมาทรู'} ›</em></a>`;
  const note = [list.length ? `${list.length} สิทธิ์` : 'ยังไม่มีสิทธิ์', locked.length ? `<span class="fold-lk">${I.lock}ล็อกอยู่ ${locked.length}</span>` : 'ใช้ได้ทุกแอปในเครือ'].join(' · ');
  return `<details class="pv-sec pv-fold">
      <summary><span class="fold-ico">${srcs.length ? srcs.map(srcIcon).join('') : `<i class="ent-src lock">${I.lock}</i>`}</span>
        <span class="fold-t"><b>สิทธิ์ของฉัน</b>${note}</span>
        ${list.length ? `<em class="ent-state${busy ? ' busy' : ''}" data-ent-state>${busy ? 'กำลังเปิดใช้' : 'ใช้งานอยู่'}</em>` : ''}${CHEV}</summary>
      <div class="pv-ents">${list.map(ent).join('')}
        ${locked.length ? `<p class="ent-more">${AS === 'sim' ? 'อัปเกรดเป็นทรูรายเดือน' : 'ย้ายมาทรู'} ปลดล็อกเพิ่ม</p>${locked.map(lockedEnt).join('')}` : ''}</div>
    </details>`;
}

function card() {
  const g = GAME(), p = PERSONAS[AS];
  if (!g) return `<div class="pv-card off">
      <div class="pv-card-top"><b>TRUE PRIVILEGE</b><span>${I.lock}ยังไม่ได้รับสิทธิ์</span></div>
      <div class="pv-off-copy"><b>ลูกค้าทรูดูซีรีส์พรีเมียมได้ทุกเรื่อง</b>ดูก่อนใคร 7 วัน และสะสมแต้มทุกครั้งที่ดู · เฉลี่ย 2,480 แต้มต่อปี</div>
      ${joinButtons()}
    </div>`;
  return `<div class="pv-card">
      ${swoosh('card')}
      <div class="pv-card-top"><b>TRUE PRIVILEGE</b><span>LV.${g.level} · ${g.tier}</span></div>
      <div class="pv-points"><b data-points>${num(g.points)}</b> TruePoint</div>
      <div class="pv-xp"><i style="width:${pct(g.points, g.next)}" data-xp></i></div>
      <small class="pv-xp-note">อีก <b data-left>${num(Math.max(0, g.next - g.points))}</b> แต้ม สู่ระดับ ${g.nextTier}</small>
      <div class="pv-linked">${Object.entries(p.linked).map(([name, on]) => `<span class="${on ? 'on' : ''}">${on ? I.check : '+'}${esc(name)}</span>`).join('')}</div>
    </div>`;
}

const reward = r => {
  const used = USED.has(r.id), g = GAME();
  const pic = r.logo ? `<i class="rw-logo${r.icon ? ' icon' : ''}"><img src="/img/cp/${r.logo}" alt=""></i>` : `<i class="rw-ico">${r.i}</i>`;
  if (!member(r.need)) return `<a class="rw off" data-join-sheet data-club data-need="${r.need}" data-t="${r.t}">${pic}<b>${r.t}</b><span>${r.s}</span>
      <em class="rw-foot">${I.lock}${onlyFor(r.need)}</em></a>`;
  const short = r.cost && g.points < r.cost;
  return `<div class="rw${used ? ' used' : ''}">${pic}<b>${r.t}</b><span>${r.s}</span>
      <em class="rw-foot"><small>${r.cost ? `${num(r.cost)} แต้ม` : 'ฟรี'} · ถึง ${monthEnd()}</small>
      <button data-use="${r.id}" ${used || short ? 'disabled' : ''}>${used ? `${I.check}ใช้แล้ว` : short ? 'แต้มไม่พอ' : r.cost ? 'แลกเลย' : 'ใช้สิทธิ์'}</button></em></div>`;
};

function privilege(shelves) {
  const by = kind => shelves.find(s => s.kind === kind && s.items && s.items.length);
  const soon = (shelves.find(s => s.title === 'เร็วๆ นี้') || by('coming_shelf') || { items: [] }).items.filter(it => it.poster).slice(0, 10);
  const orig = (by('only_now_shelf') || { items: [] }).items.filter(it => it.poster).slice(0, 10);
  const g = GAME(), off = g ? '' : ' off', offNote = g ? '' : `<small>${I.lock}${onlyFor(1)}</small>`;
  return `<header class="pv-head">
      <div><span>${g ? `${PERSONAS[AS].since < new Date().getFullYear() ? 'ยินดีต้อนรับกลับสู่คลับ' : 'ยินดีต้อนรับสู่คลับ'} · สมาชิกตั้งแต่ ${PERSONAS[AS].since}` : 'คลับที่คุณยังไม่ได้เข้า'}</span><h1>True Privilege</h1></div>
    </header>
    ${card()}
    ${AS === 'cp' || AS === 'sim' ? `<button class="pv-up" data-join="true">${I.crown}<span><b>${AS === 'sim' ? 'อัปเกรดเป็นทรูรายเดือน' : 'ย้ายมาทรู'} ปลดล็อกอีก 2 สิทธิ์</b>ดูก่อนใคร 7 วัน และจอเพิ่มให้คนในบ้าน · ข้ามไประดับ RED ทันที</span></button>` : ''}
    ${entitlements()}
    ${RAIL ? `<section class="pv-sec pv-club">
      <h2>True Exclusive<small>${can(1) ? 'เฉพาะสมาชิกคลับ' : `${I.lock}${onlyFor(1)}`}</small></h2>
      ${row(RAIL.items, txCard)}
    </section>` : ''}
    <section class="pv-sec">
      <h2>กิจกรรมเฉพาะสมาชิก<small>ที่นั่งจำกัด</small></h2>
      <div class="row pv-events">${EVENTS.map(e => eventCard(e, shelves)).join('')}</div>
    </section>
    <section class="pv-sec">
      <h2>${g ? 'ใช้สิทธิ์ได้เลย' : 'ลูกค้าทรูใช้อะไรเดือนนี้'}${g ? `<small>${REWARDS.filter(r => can(r.need) && !USED.has(r.id)).length} สิทธิ์ พร้อมใช้</small>` : ''}</h2>
      <div class="row pv-rewards">${REWARDS.map(reward).join('')}</div>
    </section>
    ${soon.length ? `<section class="pv-sec pv-rail"><h2>ดูก่อนใคร เฉพาะลูกค้าทรู</h2>${row(soon, it => pvPoster(it, 'ก่อน 7 วัน', 2))}</section>` : ''}
    ${orig.length ? `<section class="pv-sec pv-rail"><h2>ฟรีสำหรับลูกค้าทรูและสมาชิก CP</h2>${row(orig, it => pvPoster(it, 'ฟรี', 1))}</section>` : ''}
    <section class="pv-sec">
      <h2>สิทธิ์ทั่วเครือ CP</h2>
      <button class="pv-scan" data-scan>${swoosh('scan')}${I.qr}<span><b>สแกนรับสิทธิ์</b>QR จากโฆษณาในร้าน 7-Eleven หรือบนใบเสร็จ</span></button>
      <details class="pv-fold" open>
        <summary><span class="fold-ico">${CP.map(p => `<i class="ent-src${p.mark ? ' mark' : ''}"><img src="/img/cp/${p.mark || p.icon}" alt=""></i>`).join('')}</span>
          <span class="fold-t"><b>พาร์ตเนอร์ในเครือ</b>${CP.length} แบรนด์ · 7-Eleven, ALL member, TrueMoney</span>${CHEV}</summary>
        <div class="pv-cp">${CP.map(p => `<a ${p.scan ? 'data-scan' : ''}>
          <i class="${p.mark ? 'mark' : 'icon'}"><img src="/img/cp/${p.mark || p.icon}" alt=""></i>
          <span><b>${esc(p.t)}</b>${esc(p.k)}</span><em>${p.a}</em></a>`).join('')}</div>
      </details>
    </section>
    <section class="pv-earn${off}">
      <header class="earn-h">
        <h2>สะสมแต้มเพิ่ม</h2>
        <p>${g ? 'เช็กอิน ดู และทำภารกิจ แต้มเข้าการ์ดทันที' : `${I.lock}${onlyFor(1)}`}</p>
      </header>
      <section class="pv-sub">
        <h3>เช็กอินรายวัน${g ? `<small>${I.flame}ต่อเนื่อง <b data-streak>${g.streak}</b> วัน</small>` : ''}</h3>
        <div class="pv-checkin">${checkins(g)}</div>
      </section>
      ${watchMeter(g)}
      <section class="pv-sub">
        <h3>ภารกิจสัปดาห์นี้${g ? '<small>รีเซ็ตในอีก 3 วัน</small>' : ''}</h3>
        <div class="pv-quests">${QUESTS.map(q => `<a ${q.scan && g ? 'data-scan' : q.mission && g && !MISSION.done ? 'data-mission' : ''}>
          <i class="q-ico">${q.mission && MISSION.done ? I.check : q.i}</i>
          <span class="q-body"><b>${q.t}</b><span class="pv-bar"><i style="width:${!g ? 0 : q.mission ? pct(MISSION.at, EP_MIN) : pct(q.n, q.of)}"></i></span></span>
          <span class="q-side"><em>${q.r}</em><small>${!g ? `0/${q.of || 1}` : q.mission ? MISSION.done ? 'สำเร็จแล้ว' : `เหลือ ${EP_MIN - MISSION.at} นาที` : `${q.n}/${q.of}`}</small></span></a>`).join('')}</div>
      </section>
    </section>
    <p class="pv-foot">ลูกค้าทรูและสมาชิกเครือ CP รับสิทธิ์อัตโนมัติ เมื่อเชื่อมบัญชีกับ TrueVisions NOW</p>`;
}

function watchMeter(g) {
  const mult = g ? g.mult : 2, min = g ? g.watched : 0;
  const note = !g ? '' : mult > 1 ? '<small class="wm-x">ลูกค้าทรูรับ x2</small>' : '<small>ย้ายมาทรูรับ x2</small>';
  return `<section class="pv-sub">
      <h3>ดูแล้วได้แต้ม${note}</h3>
      <div class="pv-meter">
        <div class="wm-top"><span><b data-min>${min}</b> นาทีวันนี้</span><span>ได้แล้ว <b data-earned>${earnedBy(min, mult)}</b> / ${earnedBy(WATCH_MAX, mult)} แต้ม</span></div>
        <div class="wm-track"><i class="wm-fill" data-fill style="width:${watchPos(min)}"></i>
          ${WATCH.map(([m, p]) => `<span class="wm-stop${min >= m ? ' hit' : ''}" data-stop="${m}" style="left:${watchPos(m)}"><em>+${p * mult}</em><i></i><small>${m < 60 ? `${m} นาที` : `${m / 60} ชม.`}</small></span>`).join('')}
        </div>
        ${g ? `<button class="wm-sim" data-watch>${I.play}จำลองการดู 15 นาที<small>เดโม</small></button>` : ''}
      </div>
    </section>`;
}

// Points arriving: the total counts up and the level bar fills
function addPoints(gain) {
  const space = document.getElementById('priv'), g = GAME(), from = g.points;
  g.points += gain;
  if (gain > 0) {   // spending doesn't take you back down a level
    space.querySelector('[data-xp]').style.width = pct(g.points, g.next);
    space.querySelector('[data-left]').textContent = num(Math.max(0, g.next - g.points));
  }
  const out = space.querySelector('[data-points]'), t0 = performance.now();
  const tick = t => {
    const k = Math.min(1, (t - t0) / 700);
    out.textContent = num(Math.round(from + gain * (1 - (1 - k) ** 3)));
    if (k < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
const floatUp = (el, text) => {
  const pop = document.createElement('b'); pop.className = 'ck-pop'; pop.textContent = text; el.appendChild(pop);
  setTimeout(() => pop.remove(), 900);
};

// Minutes watched (the meter's demo button, or the player): each milestone passed pays out on the meter and the card.
// Returns the payouts, so the player can toast them.
function addWatch(min) {
  const space = document.getElementById('priv'), g = GAME();
  if (!g || g.watched >= WATCH_MAX) return [];
  const was = g.watched;
  g.watched = Math.min(WATCH_MAX, was + min);
  const q = sel => space.querySelector(sel);
  if (q('[data-min]')) {
    q('[data-min]').textContent = g.watched;
    q('[data-fill]').style.width = watchPos(g.watched);
    q('[data-earned]').textContent = earnedBy(g.watched, g.mult);
    if (g.watched >= WATCH_MAX) q('[data-watch]').disabled = true;
  }
  const hits = WATCH.filter(([m]) => m > was && m <= g.watched).map(([m, p]) => [m, p * g.mult]);
  hits.forEach(([m, p]) => { const stop = q(`[data-stop="${m}"]`); if (stop) { stop.classList.add('hit'); floatUp(stop, `+${p}`); } });
  const gain = hits.reduce((t, [, p]) => t + p, 0);
  if (gain) addPoints(gain);
  return hits;
}
const watchMore = () => addWatch(15);

// Using a reward: free ones are claimed, point ones are paid for; the ticket flips to "ใช้แล้ว"
function useReward(btn) {
  const r = REWARDS.find(x => x.id === btn.dataset.use), space = document.getElementById('priv');
  USED.add(r.id);
  if (r.cost) addPoints(-r.cost);
  const t = btn.closest('.rw');
  t.classList.add('used'); btn.disabled = true; btn.innerHTML = `${I.check}ใช้แล้ว`;
  floatUp(t, r.cost ? `-${num(r.cost)}` : 'ใช้แล้ว');
  // other point rewards may now be out of reach
  space.querySelectorAll('[data-use]').forEach(b => {
    const x = REWARDS.find(y => y.id === b.dataset.use);
    if (!USED.has(x.id) && x.cost && GAME().points < x.cost) { b.disabled = true; b.textContent = 'แต้มไม่พอ'; }
  });
}

// Booking an event seat: the count drops by one and the button flips to "จองแล้ว"
function book(btn) {
  const e = EVENTS.find(x => x.id === btn.dataset.book), card = btn.closest('.ev');
  BOOKED.add(e.id);
  card.classList.add('booked'); btn.disabled = true; btn.innerHTML = `${I.check}จองแล้ว`;
  card.querySelector('.ev-foot small b').textContent = e.seats - 1;
  floatUp(card, 'จองแล้ว');
}

// Today's check-in: the day ticks over, the points count up, the level bar fills and a "+10" floats off the button
function checkIn(btn) {
  const g = GAME(), gain = CHECKIN[g.today];
  g.streak++; g.today++;
  btn.classList.replace('today', 'done'); btn.disabled = true; btn.removeAttribute('data-checkin');
  btn.querySelector('i').innerHTML = I.check; btn.querySelector('span').textContent = 'วันนี้';
  floatUp(btn, `+${gain}`);
  document.querySelector('[data-streak]').textContent = g.streak;
  addPoints(gain);
}

// Home: a True Exclusive rail straight under the hero, the S-tier titles only True / CP customers can watch. HBO
// series (api/now-hbo.js, TMDB) stand in for that premium slate (on screen it's just "ซีรีส์พรีเมียม", no HBO naming), opening the NOW prototype's title pages; without TMDB
// the feed's big movie shelves fill it. Members get this week's premium-series quest under the heading; everyone else sees the
// posters locked and how many True customers are watching right now, and a tap offers the way in.
const PREMIUM_SHELVES = ['ฮอลลีวูดฮิต', 'Top 10 ภาพยนตร์', 'ภาพยนตร์แนะนำ'];
// Two lineups for the premium rail, switched in the demo panel (?lineup=th|intl, remembered): Thai-first leads with
// The Voice, AF and NOW's Thai originals from the feed; international is the HBO slate above.
// The Voice isn't on the rail: it has its own section on home (voice_brand), so each says one thing
const THAI_SHELVES = [['True Academy Fantasia 2026', 2], ['ทรูวิชั่นส์นาว ออริจินัล', 10]];
const LINEUP_KEY = 'now-cp-lineup';
let LINEUP = (() => {
  const q = new URLSearchParams(location.search).get('lineup');
  let saved = null;
  try { if (q) localStorage.setItem(LINEUP_KEY, q); saved = localStorage.getItem(LINEUP_KEY); } catch (e) {}
  return ['th', 'intl'].includes(q || saved) ? q || saved : 'th';
})();
let HBO_TITLES = [], RAIL = null;
const hboReady = fetch('/api/now-hbo').then(r => r.json()).then(d => { HBO_TITLES = Array.isArray(d) ? d : []; }).catch(() => {});
const txHref = it => it.type === 'tv' || it.type === 'movie' ? `href="${NOW_APP}/watch/${it.type}/${it.id}" target="_blank" rel="noopener"` : link(it);
const txCard = it => /voice/i.test(it.t)
  ? `<a class="poster tx-card${can(1) ? '' : ' locked'}" data-voice>${ciTag(can(1) ? 'TRUE EXCLUSIVE' : priceFor(1) ? PRICE_TXT : 'ปลดล็อกดูเลย ›')}${img(it.poster, it.t)}${can(1) ? '' : lockMark}</a>`
  : can(1)
  ? `<a class="poster tx-card" ${txHref(it)}>${ciTag('TRUE EXCLUSIVE')}${img(it.poster, it.t)}</a>`
  : `<a class="poster tx-card locked" ${joinAttrs(it)}>${ciTag(priceFor(1) ? PRICE_TXT : 'ปลดล็อกดูเลย ›')}${img(it.poster, it.t)}${lockMark}</a>`;
let watching = 12436;
// the mission strip under the rail's heading: what to watch and the coffee; the whole strip resumes the episode; done = the coupon is waiting
const missionStrip = () => {
  const v = voiceItems(), pic = v.main ? `<img class="ms-pic" src="${esc(v.main.land || v.main.poster)}" alt="">` : '';
  if (MISSION.done) return `<a class="tx-quest ms done" data-priv-open>${pic}<span class="ms-txt"><b>ภารกิจสำเร็จ</b><strong>กาแฟ All Café ฟรี 1 แก้ว รอคุณอยู่</strong><small>แสดงคูปองที่ 7-Eleven ทุกสาขา · ถึง ${monthEnd()}</small></span><em class="ms-go">ใช้คูปอง ›</em></a>`;
  return `<a class="tx-quest ms" data-mission>${pic}<span class="ms-txt"><b>ภารกิจสัปดาห์นี้</b><strong>ดู The Voice EP.${MISSION.ep} ให้จบก่อนไลฟ์วันอาทิตย์</strong>
      <small><img src="/img/cp/7eleven.svg" alt="">รางวัล กาแฟ All Café ฟรี 1 แก้ว</small></span>
<span class="pv-bar"><i style="width:${pct(MISSION.at, EP_MIN)}"></i></span></a>`;
};
// resume the mission episode; finishing it completes the mission and puts the coffee in the rewards
function playMission() {
  player(episode(voiceItems(), MISSION.ep), { preview: false, sub: `Blind Auditions · ตอนที่ ${MISSION.ep} · ภารกิจสัปดาห์นี้`, start: MISSION.at,
    progress: m => { MISSION.at = Math.max(MISSION.at, m); },
    close: () => MISSION.done || paintAs(),   // the strip picks up where they stopped
    end: toast => {
      if (MISSION.done) return;
      MISSION.done = true;
      REWARDS.unshift({ id: 'mission', logo: '7eleven.svg', t: 'กาแฟ All Café ฟรี 1 แก้ว', s: 'รางวัลภารกิจ The Voice', need: 1 });
      toast(`<b>ภารกิจสำเร็จ</b><span>กาแฟ All Café ฟรี อยู่ในสิทธิ์ของคุณแล้ว</span>`);
      paintAs();
    } });
}
EXTRA_SHELVES.true_exclusive = s => {
  const strip = priceFor(1)
    ? `<a class="tx-quest tx-proof" data-join-sheet data-t="True Exclusive"><span>ดูทุกเรื่องใน True Exclusive <b>${PRICE_TXT}</b></span><em>สมัคร ›</em></a>`
    : member(1) ? missionStrip()
    : `<a class="tx-quest tx-proof" data-join-sheet data-t="True Exclusive"><i class="live"></i><span>ลูกค้าทรู <b data-watching>${num(watching)}</b> คนกำลังดูอยู่ตอนนี้</span><em>ย้ายมาทรู ›</em></a>`;
  return `<section class="shelf tx">
    ${swoosh('tx')}
    <h2 class="shelf-h tx-h">${I.crown}<span>True Exclusive<small>${LINEUP === 'th' ? 'The Voice, AF และออริจินัลไทย' : 'ซีรีส์พรีเมียม'}${TEST.offer === 'price' && !member(1) ? '' : ' ดูได้เฉพาะลูกค้าทรูและสมาชิกเครือ CP'}</small></span>
      <a class="tx-all" data-priv-open>ทั้งหมด</a></h2>
    ${strip}
    ${row(s.items, txCard)}
  </section>`;
};
function pick(shelves, wanted) {
  const seen = new Set(), items = [];
  wanted.forEach(([t, n]) => (shelves.find(s => s.title === t) || { items: [] }).items
    .filter(it => it.poster && /^tvs-/.test(it.type) && !/voice/i.test(it.t) && !seen.has(it.id)).slice(0, n)
    .forEach(it => { seen.add(it.id); items.push(it); }));
  return items;
}
const railItems = shelves => LINEUP === 'th' ? pick(shelves, THAI_SHELVES)
  : HBO_TITLES.length ? HBO_TITLES : pick(shelves, PREMIUM_SHELVES.map(t => [t, 12])).slice(0, 12);
function addTrueExclusive(shelves) {
  insertRail(shelves, railItems(shelves));
  // the feed came first: if the international lineup is showing, swap HBO in when it arrives
  hboReady.then(() => { if (RAIL && HBO_TITLES.length && LINEUP === 'intl') setLineup('intl'); });
}
function setLineup(l) {
  LINEUP = l;
  try { localStorage.setItem(LINEUP_KEY, l); } catch (e) {}
  const u = new URL(location.href);
  if (u.searchParams.has('lineup')) { u.searchParams.set('lineup', l); history.replaceState(null, '', u.pathname + u.search); }
  if (RAIL) RAIL.items = railItems(SHELVES);
  paintAs();
  drawStore();
}
function insertRail(shelves, items) {
  const at = shelves.findIndex(s => s.kind === 'hero_banner_shelf') + 1;
  if (items.length) shelves.splice(at, 0, RAIL = { kind: 'true_exclusive', title: 'True Exclusive', items });
  if (!shelves.some(s => s.kind === 'voice_brand')) shelves.splice(at + (items.length ? 1 : 0), 0, { kind: 'voice_brand', title: 'The Voice', items: [] });
}

// ---------- The Voice hub: the whole franchise in one place ----------
// The CEO's example: The Voice runs 7-9 months a year (the season, then Teens and Celebrity) with concerts in CP stores.
// The hub is where a fan lives for those months: the season by round, the coaches' teams and singers to follow,
// performance clips to share, live voting, predictions, the archive and the tour. What each viewer can do follows their
// rights: full episodes need a member (CP and up); performance clips are free to everyone (they're the sharing hook);
// voting, predictions, backstage, past seasons and free concert seats come with the Voice SIM or True postpaid.
// The feed has the franchise's art and nothing else, so coaches, singers, episodes and seasons are labelled examples.
const voiceAll = () => AS === 'true' || AS === 'sim';
const VOICE_STAGES = [['Blind Auditions', 'ต.ค.', 1], ['Battle', 'ธ.ค.'], ['Knockout', 'ม.ค.'], ['Live', 'ก.พ.'], ['Final', 'มี.ค.'],
  ['The Voice Teens', 'เม.ย.'], ['The Voice Celebrity', 'มิ.ย.']];
const COACHES = [{ n: 'โค้ช 1', c: '#e0112b' }, { n: 'โค้ช 2', c: '#8a2be2' }, { n: 'โค้ช 3', c: '#0095ff' }, { n: 'โค้ช 4', c: '#ff8a00' }];
const TEAM_SEATS = 12;
// [name, coach index, Blind Auditions episode, chairs turned]
const SINGERS = [['ฝน', 0, 1, 4], ['ต้นกล้า', 1, 1, 2], ['มายด์', 2, 1, 3], ['บีม', 3, 1, 1], ['พลอย', 0, 2, 2], ['ก้อง', 1, 2, 4],
  ['ฟ้า', 2, 2, 1], ['ภูมิ', 3, 2, 3], ['น้ำหวาน', 0, 3, 3], ['ปาล์ม', 1, 3, 1], ['จูน', 2, 3, 4], ['ตะวัน', 3, 3, 2],
  ['ข้าวหอม', 0, 4, 1], ['ดรีม', 1, 4, 3], ['นุ่น', 2, 4, 2], ['ปั้น', 3, 4, 4]].map(([n, coach, ep, turns], id) => ({ id, n, coach, ep, turns }));
const EP_NOTES = ['เปิดซีซัน เก้าอี้หันครบ 4 ตัวตั้งแต่คนแรก', 'โค้ชแย่งตัวกันดุเดือด ทีมแรกเริ่มเต็ม', 'คืนแห่งเพลงลูกทุ่ง และการบล็อกครั้งแรก', 'ที่นั่งสุดท้ายก่อนปิดทีมรอบแรก', 'Blind Auditions ตอนสุดท้าย'];
const AIRED = 4;
const EP_LEN = ['1 ชม. 30 น.', '1 ชม. 30 น.', '1 ชม. 36 น.', '1 ชม. 33 น.'];   // Blind Auditions episodes out so far, one a week on Sundays; EP.5 is next
const sunday = k => { const d = new Date(), back = d.getDay(); return dayTh(-back + 7 * k); };   // k = 0 → the last Sunday
const VOICE_CLIPS = ['ห้องโค้ช: เลือกทีม', 'ซ้อมก่อนขึ้นเวที', 'นาทีหันเก้าอี้', 'หลังเวที EP.1'];
const PAST = ['2025', '2024', '2023', '2022'];
const VOICE_TOUR = [['กรุงเทพฯ', '7-Eleven', 20], ['เชียงใหม่', "Lotus's", 34], ['ขอนแก่น', 'Makro', 48], ['หาดใหญ่', "Lotus's", 62]];
// the prize is a front-row seat at the Bangkok show and meeting the coaches backstage (members already get a seat free)
const PRED = { q: 'EP.5 จะมีกี่คนที่เก้าอี้หันครบ 4 ตัว', opts: ['ไม่มี', '1 คน', '2 คน', '3 คนขึ้นไป'], answer: 2, tour: 0 };
const VH = { round: 0, follow: new Set(), liked: new Set(), pick: null, revealed: false, tickets: new Set(), front: new Set() };
const lockNote = `<small>${I.lock}The Voice SIM หรือลูกค้าทรู</small>`;
const avatar = s => `<i class="sg-av" style="--c:${COACHES[s.coach].c}">${s.n[0]}</i>`;
function voiceItems() {
  const all = SHELVES.flatMap(s => s.items || []);
  const find = re => all.find(it => re.test(it.t) && it.poster && /^tvs-/.test(it.type));
  const art = [...new Set(all.filter(it => /voice/i.test(it.t) && it.poster).map(it => it.poster))];
  return { main: find(/^The Voice 2026$/i), hl: find(/The Voice 2026 Highlight/i), live: all.find(it => it.type === 'tvs-live' && /voice/i.test(it.t)), art };
}
const landArt = v => [v.main, v.hl, v.live].filter(x => x && x.land).map(x => x.land);
const clips = v => { const art = landArt(v); return art.length ? VOICE_CLIPS.map((t, i) => ({ t, land: art[i % art.length], poster: art[i % art.length] })) : []; };
// performances: one short per singer who has aired, newest first
const performances = v => SINGERS.filter(s => s.ep <= AIRED).sort((a, b) => b.ep - a.ep || a.id - b.id)
  .map((s, i) => ({ s, pic: v.art[i % Math.max(1, v.art.length)] }));
const episode = (v, n) => ({ id: `ep${n}`, t: `The Voice 2026 EP.${n}`, poster: (v.main || {}).poster, land: (v.main || {}).land });

function voiceAccess() {
  if (AS === 'true') return `<div class="vh-access on">${I.check}<span><b>ลูกค้าทรูดูได้ทุกรายการ</b>ทั้งซีซัน Teens, Celebrity, โหวต และหลังเวที</span></div>`;
  if (AS === 'sim') return `<div class="vh-access on sim"><i class="sim-ico">SIM</i><span><b>The Voice SIM ครอบคลุมทุกรายการ</b>ถึง ${dayTh(270)} · อัปเกรดเป็นรายเดือนได้ทุกเมื่อ</span></div>`;
  return `<div class="vh-access">
      <span><b>${can(1) ? 'คุณดูรายการหลักได้แล้ว' : 'ดู The Voice ได้ทั้งแฟรนไชส์'}</b>${can(1) ? 'ปลดล็อกโหวต ทายผล หลังเวที และซีซันก่อน' : 'ทุกตอน โหวต ทายผล และที่นั่งคอนเสิร์ตฟรี 9 เดือน'}</span>
      <button class="pv-cta" data-sim><b>The Voice SIM ฿99</b><span>ไม่ต้องย้ายค่าย · eSIM ผ่านแอปทรู หรือรับที่ 7-Eleven</span></button>
      <button class="pv-cta2" data-join="true"><b>${AS === 'cp' ? 'หรือย้ายมาทรู' : 'หรือย้ายมาทรู เบอร์เดิม'}</b><span>ได้ทุกสิทธิ์ ไม่ใช่แค่ The Voice</span></button>
    </div>`;
}
// 1. the season: the timeline doubles as the round picker, the round's episodes below
function seasonSec(v) {
  const now = VOICE_STAGES.findIndex(st => st[2]), r = VH.round, [name, month] = VOICE_STAGES[r];
  let list;
  if (r === now) {
    // the NOW app's episode list: thumbnail with EP label and play, then ตอนที่ n, the title, the running time
    list = Array.from({ length: AIRED + 1 }, (_, i) => i + 1).map(n => {
      const next = n > AIRED, open = can(1), ep = episode(v, n);
      return `<div class="vh-ep${next ? ' next' : ''}">
        <a class="vh-ep-pic${open || next ? '' : ' locked'}" ${next ? '' : open ? `data-vh-ep="${n}"` : joinAttrs({ t: 'The Voice 2026', poster: ep.poster })}>${ep.land ? img(ep.land, ep.t) : ''}
          <b class="vh-ep-no">EP.${n}</b><i class="vh-ep-play">${next ? '' : open ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="#111"><path d="M8 5v14l11-7z"/></svg>' : I.lock}</i></a>
        <span><small>ตอนที่ ${n}</small><b>EP.${String(n).padStart(2, '0')} | The Voice 2026</b>
          <em>${next ? `ออกอากาศ ${sunday(1)} 20:30 น.` : EP_LEN[n - 1]}</em></span></div>`;
    }).join('');
  } else list = `<p class="vh-empty">${r < now ? `รอบ ${name} จบแล้ว` : `รอบ ${name} เริ่ม ${month}`}</p>`;
  return `<section class="vh-sec"><h2>ซีซันนี้<small>แตะรอบเพื่อดูตอน</small></h2>
      <ol class="vh-line">${VOICE_STAGES.map(([t, m], i) => `<li class="${i < now ? 'done' : i === now ? 'now' : ''}${i >= 5 ? ' spin' : ''}${i === r ? ' sel' : ''}" data-round="${i}"><i></i><b>${t}</b><small>${i === now ? '<em>ตอนนี้</em>' : m}</small></li>`).join('')}</ol>
      <h3 class="vh-eps-h">${r === now ? 'ซีซั่น 1' : ''}</h3><div class="vh-eps">${list}</div>
    </section>`;
}
// 2. coaches and their teams, filling as the Blind Auditions run
function teamsSec() {
  return `<section class="vh-sec"><h2>ทีมโค้ช<small>ชื่อโค้ชและผู้เข้าแข่งขันเป็นตัวอย่าง</small></h2>
      <div class="vh-teams">${COACHES.map((c, i) => { const team = SINGERS.filter(s => s.coach === i);
        return `<a class="vh-team" data-team="${i}" style="--c:${c.c}"><i class="co-av">${i + 1}</i><b>${c.n}</b>
          <span class="vh-seats"><i style="width:${100 * team.length / TEAM_SEATS}%"></i></span><small>${team.length}/${TEAM_SEATS} ที่นั่ง</small>
          <span class="vh-faces">${team.slice(0, 4).map(avatar).join('')}</span></a>`; }).join('')}</div>
    </section>`;
}
// 3. singers you follow: their next time on stage
function followSec() {
  if (!VH.follow.size) return '';
  return `<section class="vh-sec"><h2>ศิลปินที่คุณติดตาม</h2>
      <div class="row vh-follow">${[...VH.follow].map(id => SINGERS[id]).map(s => `<a data-singer="${s.id}">${avatar(s)}<b>${s.n}</b><small>ขึ้นเวทีถัดไป Battle · ธ.ค.</small></a>`).join('')}</div>
    </section>`;
}
// 4. performances as vertical shorts, free for everyone and made to be shared
function shortsSec(v) {
  return `<section class="vh-sec"><h2>การแสดง<small>ดูฟรี · แชร์ได้</small></h2>
      <div class="row vh-shorts">${performances(v).slice(0, 10).map((p, i) => `<a class="vh-short" data-short="${i}">${p.pic ? img(p.pic, p.s.n) : ''}
        <span><b>${p.s.n}</b>ทีม${COACHES[p.s.coach].n} · EP.${p.s.ep}</span></a>`).join('')}</div>
    </section>`;
}
// 5 + 6. predictions and the live vote (SIM / True)
function playSec() {
  const all = voiceAll(), g = GAME();
  const pred = !all ? '' : VH.revealed
    ? (VH.pick === PRED.answer ? `<p class="vh-pred-res win">${I.check}<span><b>ทายถูก! คุณได้ที่นั่งแถวหน้า</b>${VOICE_TOUR[PRED.tour][0]} ${dayTh(VOICE_TOUR[PRED.tour][2])} · พบโค้ชหลังเวที · บัตรอยู่ในทัวร์ด้านล่าง</span></p>`
      : `<p class="vh-pred-res">เฉลย: ${PRED.opts[PRED.answer]} · ทายใหม่ได้ทุกตอน</p>`)
    : VH.pick !== null ? `<p class="vh-pred-res">ทายแล้ว: ${PRED.opts[VH.pick]} · ประกาศผลหลัง EP.5 <button class="vh-demo" data-pred-reveal>จำลอง: ประกาศผล</button></p>`
    : '';
  return `<section class="vh-sec"><h2>ทายผลและโหวต${all ? '' : lockNote}</h2>
      <div class="vh-pred${all ? '' : ' off'}" ${all ? '' : 'data-sim'}>
        <span class="vh-prize">${I.gift}ทายถูก ลุ้นแถวหน้าคอนเสิร์ต + พบโค้ช</span>
        <b>${PRED.q}</b>
        <div class="vh-opts">${PRED.opts.map((o, i) => `<button ${all && VH.pick === null ? `data-pred="${i}"` : 'disabled'} class="${VH.pick === i ? 'on' : ''}">${o}</button>`).join('')}</div>
        ${pred}
      </div>
      <div class="vh-extras">
        <a class="${all ? '' : 'off'}" ${all ? 'data-live-vote' : 'data-sim'}><i>${I.check}</i><span><b>โหวตในรอบไลฟ์</b>โหวตในแอประหว่างดู ผลขึ้นทันที</span>${all ? '<em>ลองดู ›</em>' : lockMark}</a>
        <a class="${all ? '' : 'off'}" ${all ? '' : 'data-sim'}><i>${I.friends}</i><span><b>ไลฟ์ถามตอบกับโค้ช</b>หลังจบตอน ทุกวันอาทิตย์</span>${all ? '' : lockMark}</a>
      </div>
    </section>`;
}
function backstageSec(v) {
  const all = voiceAll();
  return `<section class="vh-sec"><h2>หลังเวที${all ? '<small>คลิปใหม่ทุกสัปดาห์</small>' : lockNote}</h2>
      <div class="row vh-clips">${clips(v).map((c, i) => `<a class="vh-clip${all ? '' : ' locked'}" ${all ? `data-vh-clip="${i}"` : 'data-sim'}>
        <span>${img(c.land, c.t)}<i>${all ? I.play : I.lock}</i></span><b>${c.t}</b></a>`).join('')}</div>
    </section>`;
}
// 7. the archive
function pastSec(v) {
  const all = voiceAll(), art = landArt(v);
  return `<section class="vh-sec"><h2>ซีซันก่อนหน้า${all ? '<small>ตัวอย่าง</small>' : lockNote}</h2>
      <div class="row vh-clips">${PAST.map((y, i) => `<a class="vh-clip vh-past${all ? '' : ' locked'}" ${all ? `data-past="${y}"` : 'data-sim'}>
        <span>${art.length ? img(art[(i + 1) % art.length], y) : ''}<em>The Voice ${y}</em><i>${all ? I.play : I.lock}</i></span><b>ซีซัน ${y} · ครบทุกตอน</b></a>`).join('')}</div>
    </section>`;
}
// 8. the tour: free seats with the SIM or True, otherwise a ticket bought with points, TrueMoney or at the counter
function tourSec() {
  const all = voiceAll();
  return `<section class="vh-sec"><h2>ทัวร์คอนเสิร์ต<small>กับร้านในเครือ CP</small></h2>
      <div class="vh-tour">${VOICE_TOUR.map(([city, shop, d], i) => `<a data-tour="${i}"><span class="vh-date">${dayTh(d)}</span><span><b>${city}</b>ลานกิจกรรม ${shop}</span>
        <em>${VH.front.has(i) ? `${I.check}แถวหน้า` : VH.tickets.has(i) ? `${I.check}มีบัตรแล้ว` : all ? 'จองฟรี' : '฿390'}</em></a>`).join('')}</div>
      <p class="vh-note">${all ? 'ที่นั่งฟรีสำหรับลูกค้าทรูและ The Voice SIM' : 'มี The Voice SIM หรือเป็นลูกค้าทรู จองที่นั่งฟรี'}</p>
    </section>`;
}
function voiceHubHtml() {
  const v = voiceItems(), hero = v.main || v.hl || {};
  return `<button class="vh-x" data-vh-x aria-label="ปิด"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"><path d="m15 6-6 6 6 6"/></svg></button>
    <header class="vh-hero">${hero.land ? `<img class="vh-bg" src="${esc(hero.land)}" alt="">` : ''}
      <div class="vh-hero-t">${hero.logo ? `<img class="vh-logo" src="${esc(hero.logo)}" alt="The Voice">` : '<h1>The Voice</h1>'}
        <p>The Voice Thailand 2026 · ทั้งแฟรนไชส์ 9 เดือน</p></div>
    </header>
    ${voiceAccess()}
    ${followSec()}
    ${v.live ? `<section class="vh-sec"><div class="vh-live"><i class="live"></i><span><b>ไลฟ์ครั้งถัดไป</b>${new Date(v.live.start).toLocaleString('th-TH', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} น.</span>
</div></section>` : ''}
    ${seasonSec(v)}
    ${teamsSec()}
    ${shortsSec(v)}
    ${playSec()}
    ${backstageSec(v)}
    ${pastSec(v)}
    ${tourSec()}`;
}

// ---- the hub's sheets and overlays ----
const phoneAdd = el => document.querySelector('.phone').appendChild(el);
function sheet(html, onClick) {
  const sh = document.createElement('div');
  sh.className = 'pv-sheet';
  sh.innerHTML = `<div class="pv-sheet-card vh-sheet">${html}<button class="pv-later">ปิด</button></div>`;
  sh.addEventListener('click', e => {
    if (e.target === sh || e.target.closest('.pv-later')) return sh.remove();
    if (onClick) onClick(e, sh);
  });
  return phoneAdd(sh);
}
const followBtn = s => `<button class="pv-cta${VH.follow.has(s.id) ? '2' : ''}" data-follow="${s.id}"><b>${VH.follow.has(s.id) ? 'ติดตามอยู่' : 'ติดตาม'}</b><span>${VH.follow.has(s.id) ? 'แจ้งเตือนทุกครั้งที่ขึ้นเวที' : 'รู้ทันทีเมื่อขึ้นเวทีครั้งถัดไป'}</span></button>`;
function toggleFollow(id) { VH.follow.has(id) ? VH.follow.delete(id) : VH.follow.add(id); paintHub(); }
// a singer: their journey through the rounds, their performance, follow
function singerSheet(id) {
  const s = SINGERS[id], c = COACHES[s.coach];
  const steps = [['Blind Auditions', `EP.${s.ep} · เก้าอี้หัน ${s.turns} ตัว · เลือกทีม${c.n}`, 'done'], ['Battle', 'ธ.ค.', 'next'], ['Knockout', 'ม.ค.', ''], ['Live', 'ก.พ.', '']];
  const draw = () => `${avatar(s).replace('sg-av', 'sg-av big')}<h3>${s.n}</h3><p>ทีม${c.n} · ตัวอย่าง</p>
    <ol class="sg-path">${steps.map(([r, t, st]) => `<li class="${st}"><b>${r}</b>${t}</li>`).join('')}</ol>
    <div class="pv-join">${followBtn(s)}<button class="pv-cta2" data-short-of="${s.id}"><b>ดูการแสดงรอบ Blind</b><span>ดูฟรี · แชร์ได้</span></button></div>`;
  sheet(draw(), (e, sh) => {
    if (e.target.closest('[data-follow]')) { toggleFollow(s.id); sh.querySelector('.vh-sheet').innerHTML = `${draw()}<button class="pv-later">ปิด</button>`; }
    if (e.target.closest('[data-short-of]')) { sh.remove(); voiceShorts(performances(voiceItems()).findIndex(p => p.s.id === s.id)); }
  });
}
function teamSheet(i) {
  const c = COACHES[i], team = SINGERS.filter(s => s.coach === i);
  sheet(`<i class="co-av big" style="--c:${c.c}">${i + 1}</i><h3>ทีม${c.n}</h3><p>${team.length}/${TEAM_SEATS} ที่นั่ง · Blind Auditions ยังไม่จบ</p>
    <div class="vh-roster">${team.map(s => `<a data-singer="${s.id}">${avatar(s)}<span><b>${s.n}</b>EP.${s.ep} · เก้าอี้หัน ${s.turns} ตัว</span><em>${VH.follow.has(s.id) ? 'ติดตามอยู่' : 'ดู ›'}</em></a>`).join('')}</div>`,
    (e, sh) => { const a = e.target.closest('[data-singer]'); if (a) { sh.remove(); singerSheet(+a.dataset.singer); } });
}
// performances: a vertical viewer, tap the sides to move, share out to LINE / TikTok with a link back to NOW
function voiceShorts(start = 0) {
  const list = performances(voiceItems());
  if (!list.length) return;
  let i = Math.max(0, start), t;
  const el = document.createElement('div');
  el.className = 'sv';
  const draw = () => {
    const p = list[i], s = p.s, c = COACHES[s.coach];
    el.innerHTML = `<div class="sv-bars">${list.map((_, k) => `<i class="${k < i ? 'done' : k === i ? 'on' : ''}"></i>`).join('')}</div>
      <button class="sv-x" aria-label="ปิด">✕</button>
      ${p.pic ? `<img class="sv-pic" src="${esc(p.pic)}" alt="">` : ''}
      <a class="sv-prev" aria-label="ก่อนหน้า"></a><a class="sv-next" aria-label="ถัดไป"></a>
      <div class="sv-side">
        <button data-like class="${VH.liked.has(s.id) ? 'on' : ''}"><svg width="26" height="26" viewBox="0 0 24 24" fill="${VH.liked.has(s.id) ? '#ff3b6b' : 'none'}" stroke="#fff" stroke-width="2"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg><small>${num(1200 + s.id * 317 + (VH.liked.has(s.id) ? 1 : 0))}</small></button>
        <button data-share><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 5h5v5M19 5l-8 8M18 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4"/></svg><small>แชร์</small></button>
      </div>
      <div class="sv-info"><span class="sv-who" data-singer="${s.id}">${avatar(s)}<b>${s.n}</b><em>ทีม${c.n}</em></span>
        <p>การแสดงรอบ Blind Auditions · EP.${s.ep} · เก้าอี้หัน ${s.turns} ตัว</p>
        <button class="sv-follow${VH.follow.has(s.id) ? ' on' : ''}" data-follow="${s.id}">${VH.follow.has(s.id) ? 'ติดตามอยู่' : '+ ติดตาม'}</button>
        <button class="sv-full" data-sv-full>ดูเต็มตอน EP.${s.ep} ›</button></div>`;
    clearTimeout(t); t = setTimeout(() => { if (el.isConnected && !el.querySelector('.sv-share') && i < list.length - 1) { i++; draw(); } }, 6000);
  };
  el.addEventListener('click', e => {
    const x = e.target;
    if (x.closest('.sv-x')) { clearTimeout(t); return el.remove(); }
    if (x.closest('.sv-share-x') || x === el.querySelector('.sv-share')) return el.querySelector('.sv-share').remove();
    if (x.closest('[data-copy]')) { x.closest('[data-copy]').textContent = 'คัดลอกแล้ว'; return; }
    if (x.closest('.sv-share')) return;
    const f = x.closest('[data-follow]'); if (f) { toggleFollow(+f.dataset.follow); return draw(); }
    if (x.closest('[data-like]')) { const id = list[i].s.id; VH.liked.has(id) ? VH.liked.delete(id) : VH.liked.add(id); return draw(); }
    if (x.closest('[data-singer]')) { clearTimeout(t); el.remove(); return singerSheet(+x.closest('[data-singer]').dataset.singer); }
    if (x.closest('[data-sv-full]')) {
      const s = list[i].s; clearTimeout(t); el.remove();
      return can(1) ? player(episode(voiceItems(), s.ep), { preview: false, sub: `Blind Auditions · ตอนที่ ${s.ep}` }) : joinSheet({ dataset: { t: 'The Voice 2026', img: (voiceItems().main || {}).poster } });
    }
    if (x.closest('[data-share]')) {
      clearTimeout(t);
      const s = list[i].s, sh = document.createElement('div');
      sh.className = 'sv-share';
      sh.innerHTML = `<div class="sv-share-card"><b>แชร์การแสดงของ${s.n}</b>
        <div class="sv-preview">${list[i].pic ? `<img src="${esc(list[i].pic)}" alt="">` : ''}<span><b>${s.n} · The Voice 2026</b>ดูเต็มตอนบน TrueVisions NOW</span></div>
        <div class="sv-apps"><a style="--c:#06c755">LINE</a><a style="--c:#111;box-shadow:inset 0 0 0 1px #444">TikTok</a><a style="--c:#1877f2">Facebook</a><a style="--c:#333" data-copy>คัดลอกลิงก์</a></div>
        <small>เพื่อนที่เปิดลิงก์ดูการแสดงนี้ได้ฟรี แล้วต่อไปที่ตอนเต็มบน NOW</small>
        <button class="pv-later sv-share-x">ปิด</button></div>`;
      return el.appendChild(sh);
    }
    if (x.closest('.sv-next') && i < list.length - 1) { i++; draw(); }
    else if (x.closest('.sv-prev') && i > 0) { i--; draw(); }
  });
  phoneAdd(el);
  draw();
}
// the live vote: what a live round looks like, the vote panel under the stream, the result as votes come in
function liveVote() {
  const v = voiceItems(), picks = COACHES.map((c, i) => SINGERS.find(s => s.coach === i));
  let voted = null, left = 179;
  const el = document.createElement('div');
  el.className = 'pl lv';
  const draw = () => {
    const share = [38, 24, 21, 17];
    el.innerHTML = `<div class="pl-video">${v.live && v.live.land ? `<img class="pl-bg" src="${esc(v.live.land)}" alt=""><img class="pl-art" src="${esc(v.live.land)}" alt="">` : ''}
        <button class="pl-x" aria-label="ปิด"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg></button>
        <span class="pl-badge lv-badge"><i class="live"></i>LIVE · ตัวอย่างรอบไลฟ์</span></div>
      <div class="pl-info">
        <h3>โหวตให้คนที่ใช่</h3>
        <p>${voted === null ? `ปิดโหวตใน ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')} · โหวตได้ 1 ครั้ง` : 'ขอบคุณที่โหวต · ผลสด'}</p>
        <div class="lv-opts">${picks.map((s, k) => `<button ${voted === null ? `data-vote="${k}"` : 'disabled'} class="${voted === k ? 'on' : ''}">
          ${avatar(s)}<span><b>${s.n}</b>ทีม${COACHES[s.coach].n}</span>${voted === null ? '<em>โหวต</em>' : `<em>${share[k]}%</em><i class="lv-bar" style="width:${share[k]}%"></i>`}</button>`).join('')}</div>
        <p class="pl-demo">ชื่อผู้เข้าแข่งขันเป็นตัวอย่าง</p>
      </div>`;
  };
  const timer = setInterval(() => { if (!el.isConnected) return clearInterval(timer); if (voted === null && left > 0) { left--; draw(); } }, 1000);
  el.addEventListener('click', e => {
    if (e.target.closest('.pl-x')) { clearInterval(timer); return el.remove(); }
    const b = e.target.closest('[data-vote]'); if (b) { voted = +b.dataset.vote; draw(); }
  });
  phoneAdd(el);
  draw();
}
// a concert seat: free with the SIM or True (a ticket QR), otherwise bought
function tourSheet(i) {
  const [city, shop, d] = VOICE_TOUR[i], when = `${dayTh(d)} · 18:00 น. · ลานกิจกรรม ${shop} ${city}`;
  const ticket = () => `<h3>บัตรของคุณ</h3><p>The Voice ทัวร์คอนเสิร์ต · ${when}${VH.front.has(i) ? '<br><b>ที่นั่งแถวหน้า · พบโค้ชหลังเวที</b> (รางวัลทายผล)' : ''}</p><div class="vh-ticket">${qrSvg(11 + i)}<small>แสดง QR นี้ที่ทางเข้า</small></div>`;
  if (VH.tickets.has(i)) return sheet(ticket());
  const give = (sh, msg) => { VH.tickets.add(i); paintHub(); sh.querySelector('.vh-sheet').innerHTML = `${ticket()}<p class="vh-got">${I.check}${msg}</p><button class="pv-later">ปิด</button>`; };
  if (voiceAll()) return sheet(`<h3>The Voice ทัวร์ ${city}</h3><p>${when}</p>
      <div class="pv-join"><button class="pv-cta" data-free><b>จองที่นั่งฟรี</b><span>สิทธิ์${AS === 'sim' ? ' The Voice SIM' : 'ลูกค้าทรู'} · 1 ที่ต่อบัญชี</span></button></div>`,
    (e, sh) => { if (e.target.closest('[data-free]')) give(sh, 'จองแล้ว · ฟรี'); });
  sheet(`<h3>The Voice ทัวร์ ${city}</h3><p>${when} · บัตร ฿390</p>
      <div class="pl-pay-card vh-buy">
        <a data-buy="all"><i class="mark"><img src="/img/cp/allmember.svg" alt=""></i><span><b>แลก 3,900 แต้ม ALL member</b>แต้มที่มีอยู่ 3,450 · ไม่พอ</span></a>
        <a data-buy="tmn"><i><img src="/img/cp/truemoney.png" alt=""></i><span><b>จ่าย ฿390 ผ่าน TrueMoney</b>ยืนยันด้วยนิ้วเดียว</span></a>
        <a data-buy="counter"><i class="mark"><img src="/img/cp/7eleven.svg" alt=""></i><span><b>จ่ายที่เคาน์เตอร์ 7-Eleven</b>แสดงบาร์โค้ดให้พนักงาน</span></a>
        <a data-sim><i class="sim-ico">SIM</i><span><b>หรือซื้อ The Voice SIM ฿99</b>ได้ที่นั่งฟรี พร้อมดูทุกรายการ</span></a>
      </div>`,
    (e, sh) => {
      const b = e.target.closest('[data-buy]');
      if (e.target.closest('[data-sim]')) { sh.remove(); return simSheet(); }
      if (!b || b.dataset.buy === 'all') return;
      if (b.dataset.buy === 'tmn') return give(sh, 'ชำระผ่าน TrueMoney แล้ว');
      sh.querySelector('.vh-sheet').innerHTML = `<h3>จ่ายที่เคาน์เตอร์ 7-Eleven</h3><p>แสดงบาร์โค้ดนี้ให้พนักงาน · ฿390</p>
        <div class="pl-barcode">${barcode()}<small>8 850999 390${String(i).padStart(3, '0')}</small></div>
        <div class="pv-join"><button class="pv-cta" data-paid><b>จำลอง: ชำระที่เคาน์เตอร์แล้ว</b><span>บัตรเข้าแอปทันทีเมื่อร้านยืนยัน</span></button></div><button class="pv-later">ปิด</button>`;
      sh.querySelector('[data-paid]').onclick = ev => { ev.stopPropagation(); give(sh, 'ชำระที่ 7-Eleven แล้ว'); };
    });
}
function predict(k) {
  VH.pick = k; paintHub();
}
function reveal() {   // the demo's guess at 2 wins; a real draw would pick among the right answers
  VH.revealed = true;
  if (VH.pick === PRED.answer) { VH.tickets.add(PRED.tour); VH.front.add(PRED.tour); }
  paintHub();
}
// On home: a brand section in the Lemino pattern (logo, line, ดูทั้งหมด, then the shows); everything in it opens the hub
EXTRA_SHELVES.voice_brand = () => {
  const v = voiceItems(), shows = [v.main, v.hl].filter(Boolean);
  if (!shows.length) return '';
  const tag = voiceAll() ? 'ดูได้ทุกรายการ' : can(1) ? 'ดูรายการหลักได้' : 'ไม่ต้องย้ายค่าย ดูได้ด้วย The Voice SIM';
  return `<section class="shelf hub hub-solo hub-voice">${swoosh('voice')}<div class="hub-body"><div class="hub-stage">
      <h2 class="hub-name">${v.main && v.main.logo ? `<img class="hub-logo vh-mark" src="${esc(v.main.logo)}" alt="The Voice">` : '<span class="hub-logo wm-text">The Voice</span>'}</h2>
      <p>ทั้งแฟรนไชส์ ซีซันนี้ Teens Celebrity และไลฟ์<small>${tag}</small></p>
      <a class="hub-btn" data-voice>ดูทั้งหมด</a></div>
      ${row([...shows, { soon: 'The Voice Teens', when: 'เม.ย.' }, { soon: 'The Voice Celebrity', when: 'มิ.ย.' }], it => it.soon
        ? `<a class="poster vh-soon" data-voice>${swoosh('soon')}<b>${it.soon}</b><small>เริ่ม ${it.when}</small></a>`
        : `<a class="poster${can(1) ? '' : ' locked'}" data-voice>${img(it.poster, it.t)}${can(1) ? '' : lockMark}</a>`)}
    </div></section>`;
};
function voiceHub() {
  let el = document.querySelector('.vh');
  if (!el) {
    el = document.createElement('div');
    el.className = 'vh';
    el.addEventListener('click', e => {
      const t = e.target, at = sel => t.closest(sel);
      if (at('[data-vh-x]')) return el.remove();
      if (at('[data-pred-reveal]')) return reveal();
      const pr = at('[data-pred]'); if (pr) return predict(+pr.dataset.pred);
      if (at('[data-sim]')) return simSheet();
      const j = at('[data-join]'); if (j) return join(j.dataset.join);
      const lk = at('[data-join-sheet]'); if (lk) return joinSheet(lk);
      const rd = at('[data-round]'); if (rd) { VH.round = +rd.dataset.round; return paintHub(); }
      const ep = at('[data-vh-ep]');
      if (ep) return player(episode(voiceItems(), +ep.dataset.vhEp), { preview: false, sub: `Blind Auditions · ตอนที่ ${ep.dataset.vhEp}` });
      const tm = at('[data-team]'); if (tm) return teamSheet(+tm.dataset.team);
      const sg = at('[data-singer]'); if (sg) return singerSheet(+sg.dataset.singer);
      const sh = at('[data-short]'); if (sh) return voiceShorts(+sh.dataset.short);
      if (at('[data-live-vote]')) return liveVote();
      const c = at('[data-vh-clip]');
      if (c) return player(clips(voiceItems())[+c.dataset.vhClip], { preview: false, sub: 'หลังเวที' });
      const ps = at('[data-past]');
      if (ps) { const v = voiceItems(); return player({ t: `The Voice ${ps.dataset.past}`, poster: (v.main || {}).poster }, { preview: false, sub: `ซีซัน ${ps.dataset.past} · ตอนที่ 1` }); }
      const to = at('[data-tour]'); if (to) return tourSheet(+to.dataset.tour);
    });
    document.querySelector('.phone').appendChild(el);
  }
  VH.round = VOICE_STAGES.findIndex(st => st[2]);
  el.innerHTML = voiceHubHtml();
  el.scrollTop = 0;
}
const paintHub = () => { const el = document.querySelector('.vh'); if (el) { const y = el.scrollTop; el.innerHTML = voiceHubHtml(); el.scrollTop = y; } };

// ---------- the 7-Eleven loop: an ad in store → scan → claim → pay if needed → play ----------
// The in-store poster (beside the phone in the demo panel) advertises the rail's first premium title. Scanning it gives
// anyone episode 1 free; True and CP members can watch the whole thing, everyone else can buy the season on the spot
// with ALL member points, TrueMoney or at the 7-Eleven counter, or switch to True.
// the Thai lineup's poster is The Voice (its SIM is sold at the same counter); the international one leads the rail
const storeItem = () => (LINEUP === 'th' && SHELVES.length && voiceItems().main) || (RAIL && RAIL.items[0]) || null;
// a QR-looking pattern (not a real code): three finder squares and seeded noise
function qrSvg(seed = 7) {
  let x = seed, cells = '';
  const rnd = () => (x = (x * 9301 + 49297) % 233280) / 233280;
  const finder = (r, c) => r < 7 && c < 7 || r < 7 && c > 13 || r > 13 && c < 7;
  for (let r = 0; r < 21; r++) for (let c = 0; c < 21; c++) if (!finder(r, c) && rnd() > .52) cells += `M${c} ${r}h1v1h-1z`;
  const box = (x, y) => `<path d="M${x} ${y}h7v7h-7zM${x + 1} ${y + 1}v5h5v-5zM${x + 2} ${y + 2}h3v3h-3z" fill-rule="evenodd"/>`;
  return `<svg viewBox="-1 -1 23 23" aria-hidden="true"><rect x="-1" y="-1" width="23" height="23" fill="#fff"/><g fill="#111"><path d="${cells}"/>${box(0, 0)}${box(14, 0)}${box(0, 14)}</g></svg>`;
}
// a barcode for paying at the counter
const barcode = () => `<svg viewBox="0 0 120 40" preserveAspectRatio="none" aria-hidden="true">${
  Array.from({ length: 48 }, (_, i) => `<rect x="${i * 2.5}" width="${[1, 1.5, .6, 2][(i * 7) % 4]}" height="40"/>`).join('')}</svg>`;

function drawStore() {
  const el = document.querySelector('.store'), it = storeItem();
  if (!el || !it) return;
  el.hidden = false;
  el.innerHTML = `<small>โปสเตอร์ในร้าน 7-Eleven</small>
    <button class="store-ad" data-store-scan>
      <i class="store-band"></i>
      <img src="${esc(it.poster)}" alt="">
      <span class="store-copy"><b>${esc(it.t)}</b>ดูได้แล้ววันนี้ บน TrueVisions NOW</span>
      <span class="store-qr">${qrSvg()}<em>สแกนดูตอนแรกฟรี</em></span>
    </button>
    <small>กดที่โปสเตอร์เพื่อจำลองการสแกน · <a data-print>พิมพ์สำหรับทดสอบ</a></small>`;
  el.querySelector('[data-store-scan]').onclick = () => scanSheet();
  el.querySelector('[data-print]').onclick = () => printPoster(it);
}
// A paper copy of the store poster for user tests (task 4 hands it over; ?clean hides the panel it lives in)
function printPoster(it) {
  const w = open('', '_blank');
  if (!w) return;
  w.document.write(`<!doctype html><html lang="th"><meta charset="utf-8"><title>โปสเตอร์ 7-Eleven</title>
    <style>@page { size: A5; margin: 0 } body { margin: 0; font: 16px 'Better Together', system-ui, sans-serif; }
      .p { width: 148mm; height: 210mm; display: flex; flex-direction: column; overflow: hidden; }
      .band { height: 7mm; background: linear-gradient(#f58220 0 33%, #00843d 33% 66%, #ee2737 66%); }
      .p img { flex: 1; min-height: 0; width: 100%; object-fit: cover; }
      .foot { display: flex; align-items: center; gap: 8mm; padding: 7mm 9mm; }
      .foot b { display: block; font-size: 26px; } .foot svg { width: 34mm; height: 34mm; flex: none; }
      .foot em { display: block; margin-top: 2mm; font-style: normal; font-weight: 700; color: #ee2737; }</style>
    <div class="p"><i class="band"></i><img src="${esc(it.poster)}" alt="">
      <div class="foot">${qrSvg()}<span><b>${esc(it.t)}</b>ดูได้แล้ววันนี้ บน TrueVisions NOW<em>สแกนดูตอนแรกฟรี</em></span></div></div>
    <script>document.images[0].onload = () => print();<\/script></html>`);
  w.document.close();
}

// Camera: the store poster in the viewfinder, the QR is "found" after a moment and the claim sheet slides up
function scanSheet() {
  const it = storeItem(), sheet = document.createElement('div');
  sheet.className = 'pv-scanner';
  sheet.innerHTML = `<button class="pv-x" aria-label="ปิด">✕</button>
    <div class="pv-view">${it ? `<img class="cam" src="${esc(it.poster)}" alt=""><span class="cam-qr">${qrSvg()}</span>` : ''}<i></i></div>
    <p><b>สแกนรับสิทธิ์</b>เล็งกล้องไปที่ QR บนโฆษณาในร้าน 7-Eleven หรือบนใบเสร็จ</p>`;
  let timer;
  sheet.querySelector('.pv-x').onclick = () => { clearTimeout(timer); sheet.remove(); };
  document.querySelector('.phone').appendChild(sheet);
  if (!it) return;
  timer = setTimeout(() => { sheet.querySelector('.pv-view').classList.add('found'); }, 1300);
  setTimeout(() => { if (sheet.isConnected) { sheet.remove(); claimSheet(it); } }, 2000);
}

// What the scan unlocked: members watch it all, anyone else gets episode 1 free
function claimSheet(it) {
  const member = can(1), sheet = document.createElement('div');
  sheet.className = 'pv-sheet';
  sheet.innerHTML = `<div class="pv-sheet-card">
      <span class="claim-src"><img src="/img/cp/7eleven.svg" alt="">พบสิทธิ์จากโฆษณา 7-Eleven</span>
      <img src="${esc(it.poster)}" alt="">
      <h3>${esc(it.t)}</h3>
      <p>${member ? `${AS === 'true' ? 'ลูกค้าทรู' : 'สมาชิก CP'}ดูได้ทุกตอน รับแต้มทุกนาทีที่ดู` : 'ตอนแรกดูฟรี ไม่ต้องสมัคร · ดูต่อจ่ายได้ทันที'}</p>
      <div class="pv-join"><button class="pv-cta" data-play><b>${member ? 'ดูเลย' : 'ดูตอนแรกฟรี'}</b><span>ซีซัน 1 · ตอนที่ 1</span></button></div>
      <button class="pv-later">ไว้ทีหลัง</button>
    </div>`;
  sheet.addEventListener('click', e => {
    if (e.target.closest('[data-play]')) { sheet.remove(); return player(it, { preview: !member, store: true }); }
    if (e.target === sheet || e.target.closest('.pv-later')) sheet.remove();
  });
  document.querySelector('.phone').appendChild(sheet);
}

// ---------- mock player ----------
// Demo time runs fast (1 second = 2 minutes). Members' minutes go to the watch meter and points toast as they land;
// a preview stops at the end of episode 1 with the ways to keep watching.
const EP_MIN = 50, MIN_PER_SEC = 2, PREVIEW_END = 24;
const plClock = m => `${Math.floor(m)}:00`;
function player(it, { preview, store, sub, start = 0, progress, end, close }) {
  const el = document.createElement('div'), member = can(1), g = GAME();   // a package buyer (price variant) earns no points
  let min = start, playing = true, timer;
  el.className = 'pl';
  el.innerHTML = `<div class="pl-video">
      <img class="pl-bg" src="${esc(it.poster)}" alt=""><img class="pl-art" src="${esc(it.poster)}" alt="">
      <button class="pl-x" aria-label="ปิด"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg></button>
      <span class="pl-badge">${preview ? 'ตอนแรกฟรี' : AS === 'true' ? 'ลูกค้าทรู' : AS === 'sim' ? 'The Voice SIM' : PAID ? 'NOW Premium' : 'สมาชิก CP'}</span>
      <button class="pl-pp" aria-label="เล่น/หยุด"></button>
      <div class="pl-bottom"><span class="pl-time">0:00 / ${EP_MIN}:00</span><div class="pl-bar"><i></i></div></div>
    </div>
    <div class="pl-info">
      ${store ? '<span class="pl-src"><img src="/img/cp/7eleven.svg" alt="">จากโฆษณา 7-Eleven</span>' : ''}
      <h3>${esc(it.t)}</h3>
      <p>${esc(sub || 'ซีซัน 1 · ตอนที่ 1')}</p>
      ${member && g ? `<div class="pl-earn">${I.flame}<span>สะสมแต้มอยู่ · วันนี้ <b data-pl-min>${GAME().watched}</b> นาที</span><em>${GAME().mult > 1 ? 'x2' : ''}</em></div>`
        : `<div class="pl-earn off">${I.lock}<span>ลูกค้าทรูได้แต้มทุกครั้งที่ดู</span></div>`}
      <p class="pl-demo">เดโม: 1 วินาที = ${MIN_PER_SEC} นาที</p>
    </div>
    <div class="pl-toasts"></div>`;
  const $ = s => el.querySelector(s), pp = $('.pl-pp');
  const paint = () => {
    $('.pl-bar i').style.width = `${100 * min / EP_MIN}%`;
    $('.pl-time').textContent = `${plClock(min)} / ${EP_MIN}:00`;
    pp.innerHTML = playing ? '<svg width="34" height="34" viewBox="0 0 24 24" fill="#fff"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>'
      : '<svg width="34" height="34" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>';
  };
  const toast = html => {
    const t = document.createElement('div'); t.className = 'pl-toast'; t.innerHTML = html;
    $('.pl-toasts').appendChild(t); setTimeout(() => t.classList.add('out'), 2600); setTimeout(() => t.remove(), 3000);
  };
  const tick = () => {
    if (!playing) return;
    min = Math.min(EP_MIN, min + MIN_PER_SEC);
    if (member && g) {
      addWatch(MIN_PER_SEC).forEach(([m, p]) => toast(`<b>+${p} TruePoint</b><span>ดูครบ ${m < 60 ? `${m} นาที` : `${m / 60} ชม.`} วันนี้</span>`));
      const pm = $('[data-pl-min]'); if (pm) pm.textContent = GAME().watched;
    }
    if (preview && min >= PREVIEW_END) { playing = false; paywall(); }
    if (progress) progress(min);
    if (min >= EP_MIN) { playing = false; if (end) end(toast); }
    paint();
  };
  // end of the free episode: buy the season right here, or switch to True
  const paywall = () => {
    const pw = document.createElement('div');
    pw.className = 'pl-pay';
    pw.innerHTML = `<div class="pl-pay-card">
        <h3>ตอนแรกจบแล้ว ดูต่อทั้งซีซัน</h3>
        <p>${esc(it.t)} · ซีซัน 1 ทุกตอน</p>
        <a data-pay="all"><i class="mark"><img src="/img/cp/allmember.svg" alt=""></i><span><b>แลก 1,200 แต้ม ALL member</b>แต้มที่มีอยู่ 3,450</span></a>
        <a data-pay="tmn"><i><img src="/img/cp/truemoney.png" alt=""></i><span>${TEST.offer === 'price'   // the price variant's one package, so ฿149 means one thing
          ? `<b>สมัคร NOW Premium ${PRICE_TXT}</b>ดู True Exclusive ทุกเรื่อง · จ่ายผ่าน TrueMoney` : '<b>จ่าย ฿149 ผ่าน TrueMoney</b>ยืนยันด้วยนิ้วเดียว'}</span></a>
        ${/voice/i.test(it.t) ? `<a data-pay="sim"><i class="sim-ico">SIM</i><span><b>ซื้อ The Voice SIM ฿99</b>ดู The Voice ทุกรายการ ไม่ต้องย้ายค่าย</span></a>` : ''}
        <a data-pay="counter"><i class="mark"><img src="/img/cp/7eleven.svg" alt=""></i><span><b>จ่ายที่เคาน์เตอร์ 7-Eleven</b>แสดงบาร์โค้ดให้พนักงาน</span></a>
        <button class="pv-cta" data-pay="true"><b>ย้ายมาทรู ดูฟรีทุกตอน</b><span>พร้อมดูก่อนใคร 7 วัน และสะสมแต้ม</span></button>
        <button class="pv-later" data-pay-later>ไว้ทีหลัง</button>
      </div>`;
    const unlock = msg => {
      pw.remove(); preview = false;
      $('.pl-badge').textContent = AS === 'true' ? 'ลูกค้าทรู' : AS === 'sim' ? 'The Voice SIM' : PAID ? 'NOW Premium' : 'ซื้อทั้งซีซันแล้ว';
      toast(`<b>${msg}</b><span>ดูต่อได้เลย</span>`); playing = true; paint();
    };
    pw.addEventListener('click', e => {
      if (e.target.closest('[data-pay-later]')) { clearInterval(timer); return el.remove(); }   // no way out = stuck
      const b = e.target.closest('[data-pay]'); if (!b) return;
      if (b.dataset.pay === 'true') { join('true'); return setTimeout(() => unlock('ปลดล็อกทุกตอนแล้ว'), 1900); }
      if (b.dataset.pay === 'sim') return simFlow(pw.querySelector('.pl-pay-card'), () => { join('sim'); setTimeout(() => unlock('เปิดสิทธิ์ The Voice แล้ว'), 1900); });
      if (b.dataset.pay === 'tmn' && TEST.offer === 'price') { PAID = true; paintAs(); return unlock('สมัคร NOW Premium แล้ว'); }
      if (b.dataset.pay !== 'counter') return unlock('ชำระเงินสำเร็จ');
      pw.querySelector('.pl-pay-card').innerHTML = `<h3>จ่ายที่เคาน์เตอร์ 7-Eleven</h3>
        <p>แสดงบาร์โค้ดนี้ให้พนักงาน · ฿149</p>
        <div class="pl-barcode">${barcode()}<small>8 850999 220147</small></div>
        <button class="pv-cta" data-paid><b>จำลอง: ชำระที่เคาน์เตอร์แล้ว</b><span>แอปปลดล็อกให้ทันทีเมื่อร้านยืนยัน</span></button>`;
      pw.querySelector('[data-paid]').onclick = ev => { ev.stopPropagation(); unlock('ชำระที่ 7-Eleven แล้ว'); };
    });
    el.appendChild(pw);
  };
  pp.onclick = () => { if (min < EP_MIN && !el.querySelector('.pl-pay')) { playing = !playing; paint(); } };
  $('.pl-x').onclick = () => { clearInterval(timer); el.remove(); if (close) close(); };
  document.querySelector('.phone').appendChild(el);
  paint();
  timer = setInterval(tick, 1000);
}

// Buying The Voice SIM from the app: an eSIM bought and installed through the True app (NOW hands off to it) (e-KYC with the ID card, as every Thai SIM
// needs), or reserved in the app and picked up at the nearest 7-Eleven. Either way the app sees the True SIM and opens the rights
function simFlow(card, done) {
  const step = html => { card.innerHTML = html; };
  step(`<h3>The Voice SIM ฿99</h3>
    <p>ซิมเติมเงินทรู ดู The Voice ทุกรายการ 9 เดือน · ใช้คู่กับเบอร์เดิมได้ ไม่ต้องย้ายค่าย</p>
    <a data-way="esim"><i><img src="/img/cp/true.png" alt=""></i><span><b>eSIM ผ่านแอปทรู · พร้อมใน 3 นาที</b>ซื้อและติดตั้งในแอปทรู ไม่ต้องไปร้าน</span></a>
    <a data-way="store"><i class="mark"><img src="/img/cp/7eleven.svg" alt=""></i><span><b>รับซิมที่ 7-Eleven ใกล้คุณ</b>จองในแอป จ่ายและรับซิมที่ร้าน</span></a>
    <small class="sim-note">${I.check}เครื่องนี้รองรับ eSIM · 2 ซิมในเครื่องเดียว</small>`);
  card.onclick = e => {
    e.stopPropagation();
    const way = e.target.closest('[data-way]');
    if (way && way.dataset.way === 'esim') return step(`<h3>eSIM The Voice</h3>
      <p>เปิดแอปทรูทำต่อ ประมาณ 3 นาที แล้วกลับมาดูที่นี่</p>
      <ol class="pl-steps"><li><b>จ่าย ฿99 ผ่าน TrueMoney</b>หรือบัตรเครดิต</li><li><b>ยืนยันตัวตน</b>ถ่ายบัตรประชาชนและสแกนหน้า ตามกฎ กสทช.</li><li><b>กด "เพิ่ม eSIM" ที่มือถือถาม</b>เบอร์เดิมยังใช้ได้ตามปกติ</li></ol>
      <button class="pv-cta" data-sim-go><b>ไปที่แอปทรู</b><span>จำลอง: ซื้อและติดตั้งเสร็จแล้ว</span></button>`);
    if (way) return step(`<h3>รับซิมที่ 7-Eleven</h3>
      <p>สาขาลาดพร้าว 71 · 350 ม. · เปิด 24 ชม. · จองไว้ให้ 3 วัน</p>
      <div class="pl-barcode">${barcode()}<small>8 850999 410992</small></div>
      <ol class="pl-steps"><li><b>แสดงบาร์โค้ดนี้ จ่าย ฿99</b>พร้อมบัตรประชาชน พนักงานลงทะเบียนซิมให้</li><li><b>ใส่ซิม</b>แอปเปิดสิทธิ์ให้อัตโนมัติ ไม่ต้องกรอกรหัส</li></ol>
      <button class="pv-cta" data-sim-go><b>จำลอง: รับซิมและใส่แล้ว</b><span>แอปตรวจพบซิมทรูและเปิดสิทธิ์</span></button>`);
    const go = e.target.closest('[data-sim-go]');
    if (go) {
      go.disabled = true;
      go.innerHTML = '<b>กำลังเปิดใช้ซิม…</b><span>ตรวจพบซิมทรูในเครื่อง</span>';
      setTimeout(done, 1200);
    }
  };
}
function simSheet() {
  const sheet = document.createElement('div');
  sheet.className = 'pv-sheet';
  sheet.innerHTML = '<div class="pl-pay-card"></div>';
  simFlow(sheet.firstChild, () => { sheet.remove(); join('sim'); });
  sheet.addEventListener('click', e => e.target === sheet && sheet.remove());
  document.querySelector('.phone').appendChild(sheet);
}

// The way in, from anything locked: a bottom sheet with what you tapped and the ways to join
// (the price variant: one package at one price instead, for anything the package covers)
function joinSheet(el) {
  const sheet = document.createElement('div'), t = el.dataset.t || 'True Exclusive', pic = el.dataset.img;
  const price = !('club' in el.dataset) && priceFor(+(el.dataset.need || 1));   // the package covers content, not the club
  sheet.className = 'pv-sheet';
  sheet.innerHTML = `<div class="pv-sheet-card">
      ${pic ? `<img src="${esc(pic)}" alt="">` : `<i class="pv-sheet-ico">${I.crown}</i>`}
      <h3>ดู ${esc(t)} ได้ทันที</h3>
      ${price ? `<p>แพ็กเกจ NOW Premium · ยกเลิกได้ทุกเมื่อ</p>
      <div class="pv-join"><button class="pv-cta" data-join="paid"><b>สมัคร ${PRICE_TXT}</b><span>ดู True Exclusive ได้ทุกเรื่อง</span></button></div>`
      : `<p>${outsider() ? 'สิทธิ์นี้สำหรับลูกค้าทรูและสมาชิกเครือ CP' : 'สิทธิ์นี้สำหรับลูกค้าทรู'}</p>
      ${joinButtons(t)}`}
      <button class="pv-later">ไว้ทีหลัง</button>
    </div>`;
  sheet.addEventListener('click', e => {
    const j = e.target.closest('[data-join]'), sim = e.target.closest('[data-sim]');
    if (j) join(j.dataset.join);
    if (sim) simSheet();
    if (j || sim || e.target === sheet || e.target.closest('.pv-later')) sheet.remove();
  });
  document.querySelector('.phone').appendChild(sheet);
}

// Joining: a full-screen CI moment, then the app redraws as the new member
function join(as) {
  const done = document.createElement('div');
  done.className = 'pv-welcome';
  const copy = {
    true: ['ยินดีต้อนรับสู่ทรู', 'ปลดล็อกซีรีส์พรีเมียม ดูก่อนใคร และจอเพิ่มให้คนในบ้านแล้ว'],
    sim: ['The Voice SIM พร้อมใช้', 'เปิดสิทธิ์ The Voice ทุกรายการแล้ว'],
    cp: ['ยินดีต้อนรับสู่ ALL\u00a0member', 'ปลดล็อกซีรีส์พรีเมียมแล้ว'],
    paid: ['สมัคร NOW Premium แล้ว', 'ดู True Exclusive ได้ทุกเรื่อง'],
  }[as];
  done.innerHTML = `${swoosh('welcome')}<i>${as === 'sim' ? '<b class="sim-big">SIM</b>' : I.crown}</i>
    <h3>${copy[0]}</h3>
    <p>${copy[1]}</p>`;
  done.onclick = () => done.remove();
  document.querySelector('.phone').appendChild(done);
  setTimeout(() => done.classList.add('out'), 1800);
  setTimeout(() => done.remove(), 2300);
  JOINED_AT = Date.now();
  if (as === 'paid') { PAID = true; paintAs(); } else setAs(as);
  // activation finishes across the systems: the entitlement states flip to active
  setTimeout(() => document.querySelectorAll('[data-ent-state]').forEach(el => { el.classList.remove('busy'); el.textContent = 'ใช้งานอยู่'; }), ACTIVATE_MS);
}

let SHELVES = [];
function setAs(as) {
  AS = as;
  PAID = false;
  SUB = null;   // iap.js: switching persona drops the free user's package
  try { localStorage.setItem(AS_KEY, as); } catch (e) {}
  const u = new URL(location.href);
  if (u.searchParams.has('as')) { u.searchParams.set('as', as); history.replaceState(null, '', u.pathname + u.search); }
  paintAs();
}
function setTest(k, v) {
  TEST[k] = v;
  try { localStorage.setItem(`now-cp-${k}`, v); } catch (e) {}
  const u = new URL(location.href);
  if (u.searchParams.has(k)) { u.searchParams.set(k, v); history.replaceState(null, '', u.pathname + u.search); }
  paintAs();
}
// redraw what depends on who's watching: the switch, the privilege space and the rail (the hero is left alone)
function paintAs() {
  document.body.dataset.as = AS;
  document.body.dataset.poster = TEST.poster;
  document.querySelectorAll('.persona button[data-test]').forEach(b => b.classList.toggle('on', TEST[b.dataset.test] === b.dataset.v));
  document.querySelectorAll('.persona button[data-as]').forEach(b => b.classList.toggle('on', b.dataset.as === AS));
  document.querySelectorAll('.persona button[data-lineup]').forEach(b => b.classList.toggle('on', b.dataset.lineup === LINEUP));
  if (!SHELVES.length) return;
  document.getElementById('priv').innerHTML = privilege(SHELVES);
  const tx = document.querySelector('.tx');
  if (tx && RAIL) tx.outerHTML = EXTRA_SHELVES.true_exclusive(RAIL);
  const vb = document.querySelector('.hub-voice');
  if (vb) vb.outerHTML = EXTRA_SHELVES.voice_brand();
  paintHub();
}

(() => {
  const space = document.getElementById('priv'), phone = document.querySelector('.phone');
  document.querySelectorAll('.persona button[data-as]').forEach(b => b.onclick = () => b.dataset.as !== AS && setAs(b.dataset.as));
  document.querySelectorAll('.persona button[data-lineup]').forEach(b => b.onclick = () => b.dataset.lineup !== LINEUP && setLineup(b.dataset.lineup));
  document.querySelectorAll('.persona button[data-test]').forEach(b => b.onclick = () => TEST[b.dataset.test] !== b.dataset.v && setTest(b.dataset.test, b.dataset.v));
  paintAs();
  // fires before app.js's first draw, so the rail added to the feed here is drawn with the rest of the home
  document.addEventListener('now-home', e => {
    SHELVES = e.detail;
    addTrueExclusive(SHELVES);
    space.innerHTML = privilege(SHELVES);
    drawStore();
  });
  space.addEventListener('click', e => {
    const ck = e.target.closest('[data-checkin]'), j = e.target.closest('[data-join]'), lk = e.target.closest('[data-join-sheet]');
    if (ck) return checkIn(ck);
    if (e.target.closest('[data-watch]')) return watchMore();
    const use = e.target.closest('[data-use]'), bk = e.target.closest('[data-book]');
    if (use) return useReward(use);
    if (bk) return book(bk);
    if (e.target.closest('[data-voice]')) return voiceHub();
    if (e.target.closest('[data-mission]')) return playMission();
    if (e.target.closest('[data-sim]')) return simSheet();
    if (j) return join(j.dataset.join);
    if (lk) return joinSheet(lk);
    if (e.target.closest('[data-scan]')) scanSheet();
  });
  space.addEventListener('scroll', () => phone.classList.toggle('priv-scrolled', space.scrollTop > 10), { passive: true });
  document.getElementById('screen').addEventListener('click', e => {
    if (e.target.closest('[data-voice]')) { e.preventDefault(); return voiceHub(); }
    if (e.target.closest('[data-mission]')) return playMission();
    const lk = e.target.closest('[data-join-sheet]');
    if (lk) { e.preventDefault(); return joinSheet(lk); }
    if (e.target.closest('[data-priv-open]')) document.querySelector('.tabbar a[data-priv]').click();
  });
  // the live count of True customers watching ticks along while it's on screen
  setInterval(() => {
    const el = document.querySelector('[data-watching]');
    if (el) el.textContent = num(watching += Math.round(Math.random() * 9) - 3);
  }, 2500);
  // app.js's tabs() moves the selection pill; this shows the privilege space for its tab and hides it for the others
  document.querySelectorAll('.tabbar a').forEach(a => a.addEventListener('click', () => {
    const open = a.hasAttribute('data-priv');
    space.hidden = !open;
    phone.classList.toggle('priv-open', open);
    if (open) { space.scrollTop = 0; phone.classList.remove('min'); }
  }));
})();
