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
const RANK = { ais: 0, cp: 1, true: 2 };
const PERSONAS = {
  true: {
    linked: { 'True 5G': true, 'ALL member': true, TrueMoney: false },
    game: { points: 2480, next: 3000, level: 12, tier: 'RED', nextTier: 'BLACK', streak: 4, today: 4, watched: 42, mult: 2 },
  },
  cp: {
    linked: { 'ALL member': true, 'True 5G': false, TrueMoney: false },
    game: { points: 640, next: 1000, level: 3, tier: 'CP', nextTier: 'RED', streak: 1, today: 1, watched: 18, mult: 1 },
  },
  ais: {},
};
const AS_KEY = 'now-cp-as';
let AS = (() => {
  const q = new URLSearchParams(location.search).get('as');
  let saved = null;
  try { if (q) localStorage.setItem(AS_KEY, q); saved = localStorage.getItem(AS_KEY); } catch (e) {}
  return (q || saved) in PERSONAS ? q || saved : 'true';
})();
const can = need => RANK[AS] >= need;
const GAME = () => PERSONAS[AS].game;
const onlyFor = need => need === 2 ? 'เฉพาะลูกค้าทรู' : 'เฉพาะลูกค้าทรูและสมาชิก CP';
const onlyForShort = need => need === 2 ? 'เฉพาะลูกค้าทรู' : 'ลูกค้าทรู · CP';   // for poster tags and benefit tiles
const lockMark = `<span class="lk">${I.lock}</span>`;

// ---------- game layer (in-memory: a demo, nothing is saved) ----------
// a week of check-ins: days before `today` are done, the 7th is a bigger gift
const CHECKIN = [10, 10, 10, 20, 10, 10, 100];
const QUESTS = [
  { i: I.play, t: 'ดูซีรีส์พรีเมียม 3 ตอน', n: 2, of: 3, r: '+50 แต้ม' },
  { i: I.ball, t: 'ดูไลฟ์กีฬา 1 แมตช์', n: 0, of: 1, r: 'ปลดล็อก 4K 1 วัน' },
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
  { id: '4k', i: I.hd, t: '4K ทั้งสุดสัปดาห์', s: 'ทุกเรื่อง ทุกจอ ศ.–อา. นี้', need: 2 },
  { id: 'cafe', logo: '7eleven.svg', t: 'คูปอง All Café 25 บาท', s: 'ใช้ได้ที่ 7-Eleven ทุกสาขา', need: 1, cost: 300 },
  { id: 'tmn', logo: 'truemoney.png', icon: true, t: 'ลด 50 บาท แพ็กเกจ NOW', s: 'เมื่อจ่ายผ่าน TrueMoney', need: 1, cost: 500 },
];
const USED = new Set();
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
  : `<a class="poster locked" ${joinAttrs(it)}>${ciTag(onlyForShort(need))}${img(it.poster || it.land, it.t)}${lockMark}</a>`;

const checkins = g => CHECKIN.map((p, d) => {
  const state = g && d < g.today ? 'done' : g && d === g.today ? 'today' : '';
  return `<button class="ck ${state}" ${state === 'today' ? 'data-checkin' : 'disabled'}>
    <i>${state === 'done' ? I.check : d === 6 ? I.gift : `+${p}`}</i><span>${state === 'today' ? 'วันนี้' : `วันที่ ${d + 1}`}</span></button>`;
}).join('');

// the ways in, for anyone not yet on True: switch network (everything) or join ALL member free (the CP level)
const joinButtons = () => `<div class="pv-join">
    ${AS !== 'true' ? `<button class="pv-cta" data-join="true"><b>ย้ายมาทรู เบอร์เดิม</b><span>ออนไลน์ 15 นาที · ปลดล็อกทุกสิทธิ์</span></button>` : ''}
    ${AS === 'ais' ? `<button class="pv-cta2" data-join="cp"><b>สมัคร ALL member ฟรี</b><span>ดูซีรีส์พรีเมียมได้เลย</span></button>` : ''}
  </div>`;

// The CI membership card: tier, TruePoint and the level bar, and the memberships linked to this account
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
  if (!can(r.need)) return `<a class="rw off" data-join-sheet data-t="${r.t}">${pic}<b>${r.t}</b><span>${r.s}</span>
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
      <div><span>${g ? 'สิทธิพิเศษของคุณ' : 'สิทธิ์ที่คุณยังไม่ได้รับ'}</span><h1>True Privilege</h1></div>
    </header>
    ${card()}
    ${AS === 'cp' ? `<button class="pv-up" data-join="true">${I.crown}<span><b>ย้ายมาทรู ปลดล็อกอีก 2 สิทธิ์</b>ดูก่อนใคร 7 วัน และ 4K · ข้ามไประดับ RED ทันที</span></button>` : ''}
    <section class="pv-sec">
      <h2>${g ? 'ใช้สิทธิ์ได้เลย' : 'ลูกค้าทรูใช้อะไรเดือนนี้'}${g ? `<small>${REWARDS.filter(r => can(r.need) && !USED.has(r.id)).length} สิทธิ์ พร้อมใช้</small>` : ''}</h2>
      <div class="row pv-rewards">${REWARDS.map(reward).join('')}</div>
    </section>
    ${soon.length ? `<section class="pv-sec pv-rail"><h2>ดูก่อนใคร เฉพาะลูกค้าทรู</h2>${row(soon, it => pvPoster(it, 'ก่อน 7 วัน', 2))}</section>` : ''}
    ${orig.length ? `<section class="pv-sec pv-rail"><h2>ฟรีสำหรับลูกค้าทรูและสมาชิก CP</h2>${row(orig, it => pvPoster(it, 'ฟรี', 1))}</section>` : ''}
    <section class="pv-sec">
      <h2>สิทธิ์ทั่วเครือ CP</h2>
      <button class="pv-scan" data-scan>${swoosh('scan')}${I.qr}<span><b>สแกนรับสิทธิ์</b>QR จากโฆษณาในร้าน 7-Eleven หรือบนใบเสร็จ</span></button>
      <div class="pv-cp">${CP.map(p => `<a ${p.scan ? 'data-scan' : ''}>
        <i class="${p.mark ? 'mark' : 'icon'}"><img src="/img/cp/${p.mark || p.icon}" alt=""></i>
        <span><b>${esc(p.t)}</b>${esc(p.k)}</span><em>${p.a}</em></a>`).join('')}</div>
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
        <div class="pv-quests">${QUESTS.map(q => `<a ${q.scan && g ? 'data-scan' : ''}>
          <i class="q-ico">${q.i}</i>
          <span class="q-body"><b>${q.t}</b><span class="pv-bar"><i style="width:${g ? pct(q.n, q.of) : 0}"></i></span></span>
          <span class="q-side"><em>${q.r}</em><small>${g ? q.n : 0}/${q.of}</small></span></a>`).join('')}</div>
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
let HBO_TITLES = [], RAIL = null;
const hboReady = fetch('/api/now-hbo').then(r => r.json()).then(d => { HBO_TITLES = Array.isArray(d) ? d : []; }).catch(() => {});
const txHref = it => it.type === 'tv' || it.type === 'movie' ? `href="${NOW_APP}/watch/${it.type}/${it.id}" target="_blank" rel="noopener"` : link(it);
const txCard = it => can(1)
  ? `<a class="poster tx-card" ${txHref(it)}>${ciTag('TRUE EXCLUSIVE')}${img(it.poster, it.t)}</a>`
  : `<a class="poster tx-card locked" ${joinAttrs(it)}>${ciTag(onlyFor(1))}${img(it.poster, it.t)}${lockMark}</a>`;
let watching = 12436;
EXTRA_SHELVES.true_exclusive = s => {
  const q = QUESTS[0];
  const strip = can(1)
    ? `<a class="tx-quest" data-priv-open><b>ภารกิจ</b><span>${q.t}</span><em>${q.n}/${q.of} · ${q.r}</em><span class="pv-bar"><i style="width:${pct(q.n, q.of)}"></i></span></a>`
    : `<a class="tx-quest tx-proof" data-join-sheet data-t="True Exclusive"><i class="live"></i><span>ลูกค้าทรู <b data-watching>${num(watching)}</b> คนกำลังดูอยู่ตอนนี้</span><em>ย้ายมาทรู ›</em></a>`;
  return `<section class="shelf tx">
    ${swoosh('tx')}
    <h2 class="shelf-h tx-h">${I.crown}<span>True Exclusive<small>ซีรีส์พรีเมียม ดูได้เฉพาะลูกค้าทรูและสมาชิกเครือ CP</small></span>
      <a class="tx-all" data-priv-open>ทั้งหมด</a></h2>
    ${strip}
    ${row(s.items, txCard)}
  </section>`;
};
function addTrueExclusive(shelves) {
  if (HBO_TITLES.length) return insertRail(shelves, HBO_TITLES);
  // the feed came first: draw the fallback now and swap in HBO if it arrives
  hboReady.then(() => {
    const r = document.querySelector('.tx .row');
    if (!RAIL || !HBO_TITLES.length) return;
    RAIL.items = HBO_TITLES;
    if (r) r.innerHTML = HBO_TITLES.map(txCard).join('');
    drawStore();
  });
  const seen = new Set(), items = [];
  PREMIUM_SHELVES.forEach(t => (shelves.find(s => s.title === t) || { items: [] }).items.forEach(it => {
    if (it.poster && !seen.has(it.id) && items.length < 12) { seen.add(it.id); items.push(it); }
  }));
  insertRail(shelves, items);
}
function insertRail(shelves, items) {
  const at = shelves.findIndex(s => s.kind === 'hero_banner_shelf') + 1;
  if (items.length) shelves.splice(at, 0, RAIL = { kind: 'true_exclusive', title: 'True Exclusive', items });
}

// ---------- the 7-Eleven loop: an ad in store → scan → claim → pay if needed → play ----------
// The in-store poster (beside the phone in the demo panel) advertises the rail's first premium title. Scanning it gives
// anyone episode 1 free; True and CP members can watch the whole thing, everyone else can buy the season on the spot
// with ALL member points, TrueMoney or at the 7-Eleven counter, or switch to True.
const storeItem = () => (RAIL && RAIL.items[0]) || null;
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
    <small>กดที่โปสเตอร์เพื่อจำลองการสแกน</small>`;
  el.querySelector('[data-store-scan]').onclick = () => scanSheet();
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
    if (e.target.closest('[data-play]')) { sheet.remove(); return player(it, { preview: !member }); }
    if (e.target === sheet || e.target.closest('.pv-later')) sheet.remove();
  });
  document.querySelector('.phone').appendChild(sheet);
}

// ---------- mock player ----------
// Demo time runs fast (1 second = 2 minutes). Members' minutes go to the watch meter and points toast as they land;
// a preview stops at the end of episode 1 with the ways to keep watching.
const EP_MIN = 50, MIN_PER_SEC = 2, PREVIEW_END = 24;
const plClock = m => `${Math.floor(m)}:00`;
function player(it, { preview }) {
  const el = document.createElement('div'), member = can(1);
  let min = 0, playing = true, timer;
  el.className = 'pl';
  el.innerHTML = `<div class="pl-video">
      <img class="pl-bg" src="${esc(it.poster)}" alt=""><img class="pl-art" src="${esc(it.poster)}" alt="">
      <button class="pl-x" aria-label="ปิด"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg></button>
      <span class="pl-badge">${preview ? 'ตอนแรกฟรี' : AS === 'true' ? 'ลูกค้าทรู · 4K' : 'สมาชิก CP'}</span>
      <button class="pl-pp" aria-label="เล่น/หยุด"></button>
      <div class="pl-bottom"><span class="pl-time">0:00 / ${EP_MIN}:00</span><div class="pl-bar"><i></i></div></div>
    </div>
    <div class="pl-info">
      <span class="pl-src"><img src="/img/cp/7eleven.svg" alt="">จากโฆษณา 7-Eleven</span>
      <h3>${esc(it.t)}</h3>
      <p>ซีซัน 1 · ตอนที่ 1</p>
      ${member ? `<div class="pl-earn">${I.flame}<span>สะสมแต้มอยู่ · วันนี้ <b data-pl-min>${GAME().watched}</b> นาที</span><em>${GAME().mult > 1 ? 'x2' : ''}</em></div>`
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
    if (member) {
      addWatch(MIN_PER_SEC).forEach(([m, p]) => toast(`<b>+${p} TruePoint</b><span>ดูครบ ${m < 60 ? `${m} นาที` : `${m / 60} ชม.`} วันนี้</span>`));
      const pm = $('[data-pl-min]'); if (pm) pm.textContent = GAME().watched;
    }
    if (preview && min >= PREVIEW_END) { playing = false; paywall(); }
    if (min >= EP_MIN) playing = false;
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
        <a data-pay="tmn"><i><img src="/img/cp/truemoney.png" alt=""></i><span><b>จ่าย ฿149 ผ่าน TrueMoney</b>ยืนยันด้วยนิ้วเดียว</span></a>
        <a data-pay="counter"><i class="mark"><img src="/img/cp/7eleven.svg" alt=""></i><span><b>จ่ายที่เคาน์เตอร์ 7-Eleven</b>แสดงบาร์โค้ดให้พนักงาน</span></a>
        <button class="pv-cta" data-pay="true"><b>ย้ายมาทรู ดูฟรีทุกตอน</b><span>พร้อมดูก่อนใคร 7 วัน และสะสมแต้ม</span></button>
      </div>`;
    const unlock = msg => {
      pw.remove(); preview = false;
      $('.pl-badge').textContent = AS === 'true' ? 'ลูกค้าทรู · 4K' : 'ซื้อทั้งซีซันแล้ว';
      toast(`<b>${msg}</b><span>ดูต่อได้เลย</span>`); playing = true; paint();
    };
    pw.addEventListener('click', e => {
      const b = e.target.closest('[data-pay]'); if (!b) return;
      if (b.dataset.pay === 'true') { join('true'); return setTimeout(() => unlock('ปลดล็อกทุกตอนแล้ว'), 1900); }
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
  $('.pl-x').onclick = () => { clearInterval(timer); el.remove(); };
  document.querySelector('.phone').appendChild(el);
  paint();
  timer = setInterval(tick, 1000);
}

// The way in, from anything locked: a bottom sheet with what you tapped, switch to True or join ALL member free
function joinSheet(el) {
  const sheet = document.createElement('div'), t = el.dataset.t || 'True Exclusive', pic = el.dataset.img;
  sheet.className = 'pv-sheet';
  sheet.innerHTML = `<div class="pv-sheet-card">
      ${pic ? `<img src="${esc(pic)}" alt="">` : `<i class="pv-sheet-ico">${I.crown}</i>`}
      <h3>ดู ${esc(t)} ได้ทันที</h3>
      <p>${AS === 'ais' ? 'สิทธิ์นี้สำหรับลูกค้าทรูและสมาชิกเครือ CP' : 'สิทธิ์นี้สำหรับลูกค้าทรู'}</p>
      ${joinButtons()}
      <button class="pv-later">ไว้ทีหลัง</button>
    </div>`;
  sheet.addEventListener('click', e => {
    const j = e.target.closest('[data-join]');
    if (j) join(j.dataset.join);
    if (j || e.target === sheet || e.target.closest('.pv-later')) sheet.remove();
  });
  document.querySelector('.phone').appendChild(sheet);
}

// Joining: a full-screen CI moment, then the app redraws as the new member
function join(as) {
  const done = document.createElement('div');
  done.className = 'pv-welcome';
  done.innerHTML = `${swoosh('welcome')}<i>${I.crown}</i>
    <h3>${as === 'true' ? 'ยินดีต้อนรับสู่ทรู' : 'ยินดีต้อนรับสู่ ALL\u00a0member'}</h3>
    <p>${as === 'true' ? 'ปลดล็อกซีรีส์พรีเมียม ดูก่อนใคร และ 4K แล้ว' : 'ปลดล็อกซีรีส์พรีเมียมแล้ว'}</p>`;
  done.onclick = () => done.remove();
  document.querySelector('.phone').appendChild(done);
  setTimeout(() => done.classList.add('out'), 1800);
  setTimeout(() => done.remove(), 2300);
  setAs(as);
}

let SHELVES = [];
function setAs(as) {
  AS = as;
  try { localStorage.setItem(AS_KEY, as); } catch (e) {}
  const u = new URL(location.href);
  if (u.searchParams.has('as')) { u.searchParams.set('as', as); history.replaceState(null, '', u.pathname + u.search); }
  paintAs();
}
// redraw what depends on who's watching: the switch, the privilege space and the rail (the hero is left alone)
function paintAs() {
  document.body.dataset.as = AS;
  document.querySelectorAll('.persona button').forEach(b => b.classList.toggle('on', b.dataset.as === AS));
  if (!SHELVES.length) return;
  document.getElementById('priv').innerHTML = privilege(SHELVES);
  const tx = document.querySelector('.tx');
  if (tx && RAIL) tx.outerHTML = EXTRA_SHELVES.true_exclusive(RAIL);
}

(() => {
  const space = document.getElementById('priv'), phone = document.querySelector('.phone');
  document.querySelectorAll('.persona button').forEach(b => b.onclick = () => b.dataset.as !== AS && setAs(b.dataset.as));
  paintAs();
  // fires before app.js's first draw, so the rail added to the feed here is drawn with the rest of the home
  document.addEventListener('now-home', e => {
    SHELVES = e.detail;
    space.innerHTML = privilege(SHELVES);
    addTrueExclusive(SHELVES);
    drawStore();
  });
  space.addEventListener('click', e => {
    const ck = e.target.closest('[data-checkin]'), j = e.target.closest('[data-join]'), lk = e.target.closest('[data-join-sheet]');
    if (ck) return checkIn(ck);
    if (e.target.closest('[data-watch]')) return watchMore();
    const use = e.target.closest('[data-use]');
    if (use) return useReward(use);
    if (j) return join(j.dataset.join);
    if (lk) return joinSheet(lk);
    if (e.target.closest('[data-scan]')) scanSheet();
  });
  space.addEventListener('scroll', () => phone.classList.toggle('priv-scrolled', space.scrollTop > 10), { passive: true });
  document.getElementById('screen').addEventListener('click', e => {
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
