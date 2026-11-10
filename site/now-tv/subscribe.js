// Launch flow for /now-tv/ user tests: the splash (Figma: Fix issues, Splash Screen 1124:27052) on every launch, then a
// welcome popup (join, or browse first), the package picker, and a checkout whose main source of funds is the viewer's
// TrueOnline internet bill (or a TrueMoney QR). Shares app.js's globals; while an overlay is up, app.js hands it the
// remote keys (`OV`).
const SPLASH_MS = 2500;      // shortest splash, even when the feed is already in
// the current NOW packages that play on a TV; the sport family from the clone catalog's Sport tiers. Each card reads top to
// bottom in the same order so they compare by position: who it's for (`who`, own icon `ic` and colour `hex`), price,
// screens (drawn as TVs), two lines on what's in it (`lines`; ENT299 starts "ทุกอย่างใน ENT199" instead of repeating
// it), partner apps (/img/packages/, optional tier label under the icon)
const TV_PLANS = [
  { id: 'ent199', name: 'ENT199', who: 'สำหรับคุณคนเดียว', ic: 'solo', price: 199, screens: 1, apps: [['netflix', 'Mobile']], lines: ['หนัง ซีรีส์ อนิเมะ', '13 ช่องชั้นนำ'] },
  { id: 'ent299', name: 'ENT299', who: 'สำหรับครอบครัว', ic: 'family', price: 299, screens: 2, rec: 'ยอดนิยม', apps: [['netflix', 'Mobile'], ['iqiyi'], ['wetv']], lines: ['ทุกอย่างใน ENT199', 'เพิ่ม iQIYI และ WeTV'] },
  // Football ฿199 (Thai League + futsal; football titles only), Sport ฿499, Sport 2 screens ฿699
  { id: 'football', name: 'FOOTBALL199', hex: '#2bd576', ic: 'sport', who: 'สำหรับแฟนบอลไทย', price: 199, screens: 1, sport: 1, foot: 1, apps: [], lines: ['ไทยลีกและฟุตซอล', '12 ช่องฟุตบอล'] },
  { id: 'sports', name: 'SPORTS499', hex: '#3b9dff', ic: 'trophy', who: 'สำหรับคอกีฬา', price: 499, screens: 1, sport: 1, rec: 'ยอดนิยม', apps: [], lines: ['กีฬาสดทุกลีก', 'มวยไทยทุกสัปดาห์'] },
  { id: 'sports2', name: 'SPORTS699', who: 'ดูพร้อมกัน 2 จอ', hex: '#a66bff', ic: 'screens', price: 699, screens: 2, sport: 1, apps: [], lines: ['กีฬาสดทุกลีก', 'ดูคนละแมตช์ได้'] },
  { id: 'max', name: 'MAX', who: 'บันเทิงและกีฬาครบ', price: 1599, screens: 4, rec: 'พรีเมียม', gold: 1, apps: [['netflix', 'Basic'], ['iqiyi'], ['wetv'], ['viu']], lines: ['รวม ENT + SPORTS', '60 ช่องชั้นนำ'] },
];
// the lines a pass lists (checkout): what's in it, then screens
const featsOf = p => [...p.lines, `ดูได้ ${p.screens} จอ`];
const TV_IC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="2.5" y="4" width="19" height="13" rx="2"/><path d="M8 21h8"/></svg>';
// Thai words the browser would split mid-word at a line end ("อนิ / เมะ")
const keep = t => esc(t).replace(/อนิเมะสุดฮิต|อนิเมะ/, w => `<span class="nw">${w}</span>`);
const cost = p => `${thb(p.price)}/เดือน`;
const TRUEONLINE = { account: '103-560-888', name: 'อินเทอร์เน็ตบ้าน True Online' };
const QR_MINUTES = 5;        // the QR's countdown
const QR_PAID_MS = 8000;     // the test has no real payment: the QR "gets paid" after this long
const thb = n => `฿${n.toLocaleString('en-US')}`;
const check = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';

let OV = null;          // the overlay that has the remote: { el, items(), i, ok(), back(), cols }
let SUB = null;         // the plan bought in this session

// an overlay: its focusable entries are [data-f] in order; arrows move along them (left/right too, for button rows)
function overlay(html, cls, handlers) {
  const el = document.createElement('section');
  el.className = `ov ${cls}`;
  el.innerHTML = html;
  $('#stage').appendChild(el);
  const ov = { el, i: 0, ...handlers };
  ov.items = () => [...el.querySelectorAll('[data-f]')];
  ov.paint = () => { ov.items().forEach((x, j) => x.classList.toggle('focus', j === ov.i)); if (ov.onFocus) ov.onFocus(ov.i); };
  ov.move = (dx, dy) => { ov.i = Math.max(0, Math.min(ov.items().length - 1, ov.i + (dx || dy))); ov.paint(); };
  ov.close = () => { el.classList.add('out'); setTimeout(() => el.remove(), 250); if (OV === ov) OV = ov.under || null; if (OV) OV.paint(); };
  ov.under = OV;
  // later overlays always stack on top (the player under the plans it opened, the plans under checkout)
  for (let o = OV, n = 1; ; o = o.under, n++) if (!o) { el.style.zIndex = 20 + n; break; }
  OV = ov;
  requestAnimationFrame(() => el.classList.add('on'));
  ov.paint();
  return ov;
}
const closeAll = () => { while (OV) OV.close(); };

// ---- splash: shown by index.html from the first frame; leaves once the home is drawn and SPLASH_MS has passed
function endSplash(ready) {
  const t0 = performance.now();
  ready.then(() => setTimeout(() => {
    // the login screen goes up under the splash before it fades, so the home never shows through for a frame
    if (!LOGGED_IN) login();
    $('#splash').classList.add('out');
    setTimeout(() => { $('#splash').remove(); if (LOGGED_IN && !OV) welcome(); }, 400);
  }, Math.max(0, SPLASH_MS - (performance.now() - t0))));
}

// ---- login (Figma: Fix issues, Login บน TrueID Box 1167:30596): the TrueID account already signed in on the box
// (left card, "sign in with this account") or หรือ another TrueID by scanning a QR with the NOW app (right card, counts
// down 05:00, then an error tile that OK refreshes); เปลี่ยนภาษา switches the copy TH/EN. ?account=none = no account on
// the box: the left card connects one instead. The phone "scans" QR_PAID_MS after the QR card is first focused, or at
// once with OK / a click on it / the demo bar's สแกน QR. Every launch starts signed out unless ?login=skip
let LOGGED_IN = new URLSearchParams(location.search).get('login') === 'skip';
const BOX_ACCOUNT = new URLSearchParams(location.search).get('account') !== 'none';
const LOGIN_COPY = {
  th: { title: BOX_ACCOUNT ? 'เลือกบัญชีเพื่อเข้าสู่ระบบ' : 'เข้าสู่ระบบด้วยบัญชี TrueID',
    desc: BOX_ACCOUNT ? 'เราพบบัญชี TrueID ที่เข้าสู่ระบบบนกล่องนี้' : 'กรุณาเชื่อมต่อบัญชี TrueID บนกล่องนี้เพื่อเข้าสู่ระบบ',
    btn: BOX_ACCOUNT ? 'เข้าสู่ระบบด้วยบัญชีนี้' : 'เชื่อมต่อด้วยทรูไอดี', hint: 'กด OK เพื่อดำเนินการต่อ', or: 'หรือ',
    qr: BOX_ACCOUNT ? 'ใช้บัญชี TrueID อื่น' : 'สแกนเพื่อเข้าสู่ระบบ', qrDesc: 'สแกน QR Code ด้วยแอป TrueVisions NOW<br>(เมนูตั้งค่า > สแกน QR Code)',
    err: 'QR Code หมดอายุ กด OK เพื่อรับใหม่', lang: 'เปลี่ยนภาษา', ok: 'เข้าสู่ระบบสำเร็จ', wait: 'กำลังเข้าสู่ระบบ…', need: 'เข้าสู่ระบบก่อนเพื่อเริ่มใช้งาน' },
  en: { title: BOX_ACCOUNT ? 'Select an account to sign in' : 'Sign in with TrueID',
    desc: BOX_ACCOUNT ? 'We found a TrueID account signed in on this box' : 'Connect a TrueID account on this device to sign in',
    btn: BOX_ACCOUNT ? 'Sign in with this account' : 'Connect with TrueID', hint: 'Press OK to continue', or: 'Or',
    qr: BOX_ACCOUNT ? 'Switch TrueID account' : 'Sign in with QR Code', qrDesc: 'Scan with your TrueVisions NOW app<br>(Settings menu > Scan QR Code)',
    err: 'QR code expired. Press OK to refresh.', lang: 'Language', ok: 'Logged in', wait: 'Signing in…', need: 'Please log in to continue' },
};
let scanLogin = null;   // the open login's "phone scanned the QR" (the demo bar's สแกน QR)
function login() {
  let lang = 'th', left = QR_MINUTES * 60, busy = false, scanT = 0, lastCard = 0;
  const ov = overlay(`<div class="login"><div class="lg-bg"><img src="img/login-bg.png" alt=""></div>
    <img class="lg-logo" src="img/splash-logo.svg" width="158" height="89.15" alt="TrueVisions NOW">
    <div class="lg-cards">
      <div class="lg-card lg-acct" data-f><div class="lg-head"><h2 data-c="title"></h2><p data-c="desc"></p></div>
        <div class="lg-box">${BOX_ACCOUNT ? `<div class="lg-id"><img src="img/trueid.png" width="80" height="80" alt=""><div><span>TrueID</span><b>094*******</b></div></div>` : ''}
          <span class="lg-btn" data-c="btn"></span></div>
        <div class="lg-hint"><i>OK</i><span data-c="hint"></span></div></div>
      <div class="lg-or"><i></i><span data-c="or"></span><i></i></div>
      <div class="lg-card lg-qr" data-f><div class="lg-head"><h3 data-c="qr"></h3><p data-c="qrDesc"></p></div>
        <div class="lg-code"><div class="lg-tile">${qrSvg(77)}<div class="lg-err"><img src="img/refresh.svg" width="59" height="59" alt=""><span data-c="err"></span></div>
          <i class="lg-done">${check}</i></div><span class="lg-time">05:00</span></div></div>
    </div>
    <div class="lg-lang" data-f><img src="img/language.svg" width="24" height="24" alt=""><span data-c="lang"></span></div></div>`, 'loginov', {
    ok() {
      if (busy) return;
      if (ov.i === 2) { lang = lang === 'th' ? 'en' : 'th'; return copy(); }
      if (ov.i === 0) { busy = true; ov.el.querySelector('.lg-btn').textContent = LOGIN_COPY[lang].wait; return setTimeout(() => finish(), 900); }
      if (!left) return refresh();
      scan();
    },
    back() { toast(LOGIN_COPY[lang].need); },
    // the two cards side by side, the language button under them; up returns to the card you came from
    move(dx, dy) {
      if (dy > 0) ov.i = 2; else if (dy < 0) ov.i = lastCard; else if (ov.i < 2 && dx) ov.i = dx > 0 ? 1 : 0;
      ov.paint();
    },
    onFocus(i) {
      if (i < 2) lastCard = i;
      if (i === 1 && !scanT && left) scanT = setTimeout(scan, QR_PAID_MS);   // the viewer picked the QR: the phone scans it
    },
  });
  const copy = () => ov.el.querySelectorAll('[data-c]').forEach(e => { e.innerHTML = LOGIN_COPY[lang][e.dataset.c]; });
  const clock = () => { ov.el.querySelector('.lg-time').textContent = `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`; };
  const refresh = () => { left = QR_MINUTES * 60; ov.el.querySelector('.lg-qr').classList.remove('expired'); clock(); };
  const tick = setInterval(() => {
    if (busy || !left) return;
    left--; clock();
    if (!left) { ov.el.querySelector('.lg-qr').classList.add('expired'); clearTimeout(scanT); scanT = 0; }
  }, 1000);
  const finish = () => { clearInterval(tick); clearTimeout(scanT); scanLogin = null; LOGGED_IN = true; ov.close(); welcome(); };
  // the phone scans: the QR card ticks, then the app opens
  function scan() {
    if (busy || OV !== ov) return;
    busy = true;
    if (!left) refresh();
    ov.i = 1; ov.paint();
    ov.el.querySelector('.lg-qr').classList.add('ok');
    ov.el.querySelector('.lg-time').textContent = LOGIN_COPY[lang].ok;
    setTimeout(finish, 1400);
  }
  scanLogin = scan;
  copy();
}

const FREE_PLAN = { id: 'free', name: 'NOW Free', price: 0, feats: [] };   // everyone without a telco bundle starts here

// ---- shared purchase UI: every buy/claim screen is a pass for what you get (left) and a header, a panel and a CTA row
// (right); every scan uses the same QR block (tile, title, three steps, waiting + expiry line)
function passCard(p) {
  return `<div class="pass ${p.cls}"${p.hex ? ` style="--tier:${p.hex}"` : ''}><div class="pass-top"><i class="pk-ic">${p.ic}</i><img src="img/now-logo.svg" width="70" height="38.866" alt="NOW"></div>
    <b class="pass-name">${p.name}</b>
    <div class="pass-price"><b>${p.price}</b><span>${p.unit}</span></div>
    <ul>${p.feats.map(f => `<li>${check}<span>${keep(f)}</span></li>`).join('')}</ul>
    <div class="pass-cut"></div><p class="pass-foot">${p.foot}</p></div>`;
}
function qrBlock({ seed, logo, title, steps }) {
  return `<div class="qrb"><div class="qrp-code">${qrSvg(seed)}<img src="${logo}" alt=""></div>
    <div class="qrb-info"><b>${title}</b><ol>${steps.map(([k, t]) => `<li><i>${STEP_IC[k]}</i><span>${t}</span></li>`).join('')}</ol>
      <span class="qr-time"><i class="spin"></i><em></em></span></div></div>`;
}
// the QR block's status line: a spinner and the QR's expiry countdown; returns the interval
function qrWait(root) {
  let left = QR_MINUTES * 60;
  const tick = () => { const t = root.querySelector('.qr-time em'); if (t) t.textContent = `QR หมดอายุใน ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`; left--; };
  tick();
  return setInterval(tick, 1000);
}

// ---- Telco Privilege: the TrueID account's telco bundles, checked in the background at sign-in. The demo account's
// bundles: ?telco=one|many|none
const TELCO_PACKS = [
  { name: 'สิทธิ์ลูกค้าทรูมูฟ เอช 5G', src: 'มือถือ True 5G Max Speed 1199 · 096-609-7705', plan: 'ent299' },
  { name: 'สิทธิ์ทรูออนไลน์ Gigatex', src: `อินเทอร์เน็ตบ้าน 1 Gbps · บัญชี ${TRUEONLINE.account}`, plan: 'max' },
];
const telcoFor = q => q === 'many' ? TELCO_PACKS : q === 'none' ? [] : TELCO_PACKS.slice(0, 1);
let TELCO_CASE = new URLSearchParams(location.search).get('telco') || 'one', TELCO = telcoFor(TELCO_CASE);
// the demo bar's case switch: kept in the URL so เริ่มใหม่ (reload) keeps it
function setTelco(q) {
  TELCO_CASE = q; TELCO = telcoFor(q);
  const u = new URL(location.href); u.searchParams.set('telco', q); history.replaceState(null, '', u);
  document.querySelectorAll('[data-telco]').forEach(b => b.classList.toggle('on', b.dataset.telco === q));
  toast(`เคสทดสอบ: ${q === 'many' ? 'บัญชีมี 2 สิทธิ์' : q === 'none' ? 'บัญชีไม่มีสิทธิ์' : 'บัญชีมี 1 สิทธิ์'} · มีผลเมื่อกดเริ่มใหม่`);
}
document.querySelectorAll('[data-telco]').forEach(b => b.classList.toggle('on', b.dataset.telco === TELCO_CASE));
const packPlan = p => TV_PLANS.find(x => x.id === p.plan);
const kindOf = pl => pl.gold ? 'max' : pl.sport ? 'sport' : 'ent';
// after sign-in the TrueID account is checked in the background: a bundle is switched on by itself and announced in a
// popup (the telco photo at left); with more than one the widest plan is the one that counts (MAX covers everything). No
// bundle -> no popup at all: the viewer starts on the free tier (with ads) and meets the plans when a title needs one
function welcome() {
  if (!TELCO.length) { SUB = FREE_PLAN; return toast('คุณกำลังดูแบบฟรี มีโฆษณาคั่น · สมัครแพ็กเกจได้ทุกเมื่อ'); }
  SUB = TELCO.map(packPlan).sort((p, q) => q.price - p.price)[0];
  const row = p => { const pl = packPlan(p), k = kindOf(pl);
    return `<div class="trow on" style="--tier:${tierOf(pl)}"><i class="pk-ic">${planIc(pl)}</i>
      <div class="trow-main"><b>${p.name}</b><div class="chips"><span class="ok">${check}${esc(p.src)}</span></div></div>
      <div class="trow-price"><b>${pl.name}</b><span>ฟรีตามสิทธิ์</span></div></div>`; };
  overlay(`<div class="of-card welcome priv-hi"><div class="wl-art" data-tier="telco"><img class="wl-photo telco" src="img/welcome-telco.jpg" alt="">
      <div class="wl-hi"><img src="img/splash-logo.svg" width="112" height="63" alt="TrueVisions NOW"><h2>สิทธิ์ของคุณ<br>พร้อมแล้ว</h2>
        <p class="wl-line">ลูกค้าทรู-ดีแทค ดูฟรี ไม่มีโฆษณา</p></div></div>
      <div class="wl-pick"><h3>เปิดใช้บนทีวีเครื่องนี้ให้แล้ว</h3>${TELCO.map(row).join('')}
        <div class="obtn buy" data-f>เริ่มดูเลย</div><p class="wl-note">จัดการสิทธิ์ได้ในการตั้งค่า</p></div></div>`, 'offer', {
    ok() { this.close(); },
    back() { this.close(); },
  });
}
// ---- package picker: cards carry a tier colour and icon (ENT white, ENT299 magenta, SPORTS green, MAX gold); the focused
// plan's tier colour lights the page
const TIER_HEX = { max: '#f5c518', sport: '#2bd576', ent: '#fb008d' };
const PLAN_IC = {
  ent: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><rect x="4" y="7" width="24" height="16" rx="2.5"/><path d="M11 27h10"/><path d="m14 11.5 5 3.5-5 3.5z" fill="currentColor"/></svg>',
  sport: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><circle cx="16" cy="16" r="11.5"/><path d="m16 10 5 3.6-1.9 5.9h-6.2L11 13.6z"/><path d="M16 4.5V10M21 13.6l5.5-1.8M19.1 19.5l3.4 4.7M12.9 19.5l-3.4 4.7M11 13.6l-5.5-1.8"/></svg>',
  max: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="m5 11 6 5 5-8 5 8 6-5-2.5 13h-17z"/><path d="M8 27.5h16"/></svg>',
  solo: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="16" cy="11" r="5.5"/><path d="M6 27c1.2-5.5 5-8.5 10-8.5s8.8 3 10 8.5"/></svg>',
  trophy: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 5h12v7a6 6 0 0 1-12 0z"/><path d="M10 7H5.5c0 4 2 6.5 5 6.8M22 7h4.5c0 4-2 6.5-5 6.8"/><path d="M16 18v5M11 27h10M12.5 23h7"/></svg>',
  screens: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><rect x="3" y="6" width="17" height="12" rx="2"/><rect x="12" y="13" width="17" height="12" rx="2" fill="#141418"/><path d="M17 29h7"/></svg>',
  family: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="10" r="4"/><circle cx="22" cy="11.5" r="3.2"/><path d="M3.5 26c.9-5 3.6-7.6 7.5-7.6s6.6 2.6 7.5 7.6"/><path d="M18.5 19.6c1-.8 2.2-1.2 3.5-1.2 3.2 0 5.4 2.3 6.2 6.6"/></svg>',
};
const planIc = p => PLAN_IC[p.ic || kindOf(p)];
// each plan's own colour, so plans of one family (the three sport ones) still tell apart: `hex` on the plan, else its kind's
const tierOf = p => p.hex || (p.rec && !p.gold && !p.sport ? '#fb008d' : p.gold || p.sport ? TIER_HEX[kindOf(p)] : '#d1d1d1');
// the plans that unlock a title: sport (live events, sports genre) -> SPORTS and MAX; everything else -> ENT199, ENT299
// and MAX. No title (the launch popup) -> every plan
// channels are sport by name (the feed has no genre for them); live events count as sport
const SPORT_CH = /sport|bein|spotv|tennis|golf|premier|football|motogp|ball|ฟุตบอล|มวย/i;
// (channels can carry a start date too, so a channel is told apart by being on the Live TV shelf, not by `start`)
const isChannel = it => CHANNELS.some(c => c.id === it.id);
const isSport = it => it.type === 'tvs-live' ? (it.start && !isChannel(it) ? true : SPORT_CH.test(it.t)) : ((DETAILS[it.id] || {}).genres || it.genres || []).includes('sports');
// the Football plan only unlocks football (Thai League, futsal...), by title
const FOOTBALL = /football|ฟุตบอล|ฟุตซอล|futsal|ไทยลีก|thai league|premier league|\bbein\b|\bball\b|\buefa\b|คัพ ออฟ เนชันส์|cup of nations/i;
const plansFor = it => it ? TV_PLANS.filter(p => p.gold || !!p.sport === isSport(it) && (!p.foot || FOOTBALL.test(it.t))) : TV_PLANS;
// the viewer's pack unlocks this title; the free pack plays everything but sport and paid channels, with ads
const covers = it => (it.type === 'tvs-live' && !it.pay) || !!SUB && (   // free-to-air channels need no pack
  SUB === FREE_PLAN ? !isSport(it) && !it.pay : plansFor(it).includes(SUB));
const PK_FIT = 3;      // plan cards that fit beside the poster; more scroll as a carousel
let BUY_FOR = null;     // the title the viewer was trying to watch when the purchase flow opened
// opened from a title, its poster stays on the left so the viewer keeps sight of what they're buying for; the plans
// take the rest. Focus starts on ENT299, or SPORTS for sport
function packages(it) {
  BUY_FOR = it || null;
  const plans = plansFor(it);
  const card = p => `<div class="pk${p.gold ? ' gold' : ''}${p.sport ? ' sport' : ''}${p.rec ? ' has-rec' : ''}" style="--tier:${tierOf(p)}" data-f>${p.rec ? `<i class="pk-rec">${p.rec}</i>` : ''}<i class="pk-mark">${planIc(p)}</i>
      <div class="pk-body"><i class="pk-ic">${planIc(p)}</i><b class="pk-name">${p.name}</b><span class="pk-who">${p.who}</span>
      <div class="pk-price"><b>${thb(p.price)}</b><span>/เดือน</span></div>
      <div class="pk-screens">${TV_IC.repeat(p.screens)}<span>${p.screens > 1 ? `ดูพร้อมกัน ${p.screens} จอ` : 'ดูได้ 1 จอ'}</span></div>
      <ul>${p.lines.map(f => `<li>${check}<span>${keep(f)}</span></li>`).join('')}</ul>
      <div class="pk-apps">${p.apps.map(([a, tier]) => `<span><img src="/img/packages/${a}.${a === 'netflix' ? 'svg' : 'png'}" alt="${a}">${tier ? `<em>${tier}</em>` : ''}</span>`).join('')}</div>
      <div class="pk-go">เลือก ${p.name}<i>›</i></div></div></div>`;
  // the title's poster, whole, in a column at left with its name and genre right under it; a blur of it tints the page
  const ov = overlay(`<div class="ov-page packs-page${it ? ' for' : ''}"${it ? ` style="--art:url('${titleArt(it).art}')"` : ''}>${it ? titleSide(it) : ''}
    <div class="pk-head"><h2>เลือกแพ็กเกจ</h2><p class="ov-sub">ไม่มีโฆษณา · ยกเลิกได้ทุกเมื่อ</p></div>
    ${it ? '<div class="pk-view">' : ''}<div class="pk-row n${plans.length}">${plans.map(card).join('')}</div>${it ? '</div>' : ''}
    ${it && plans.length > PK_FIT ? `<div class="pk-dots">${plans.map(() => '<i></i>').join('')}</div>` : ''}</div>`, 'packs', {
    ok() { checkout(plans[this.i]); },
    back() { this.close(); },
  });
  // the page glows in the focused plan's tier colour
  // the page glows in the focused plan's tier colour; past PK_FIT cards the row slides so the focused one and its
  // neighbours show (focus on the 2nd..: one card of context on its left)
  ov.onFocus = i => {
    const tier = getComputedStyle(ov.items()[i]).getPropertyValue('--tier');
    ov.el.querySelector('.packs-page').style.setProperty('--glow', tier);
    const view = ov.el.querySelector('.pk-view'), n = plans.length;
    if (!view || n <= PK_FIT) return;
    const shift = Math.max(0, Math.min(i - 1, n - PK_FIT)), step = ov.items()[0].offsetWidth + 24;
    view.querySelector('.pk-row').style.transform = `translateX(${-shift * step}px)`;
    view.classList.toggle('more-l', shift > 0);
    view.classList.toggle('more-r', shift < n - PK_FIT);
    const dots = ov.el.querySelector('.pk-dots');
    dots.style.top = `${view.offsetTop + view.offsetHeight - 8}px`;
    dots.style.setProperty('--dot', tier);
    dots.querySelectorAll('i').forEach((d, j) => d.classList.toggle('on', j === i));
  };
  ov.i = Math.max(0, plans.findIndex(p => p.id === (it && isSport(it) ? 'sports' : 'ent299')));
  ov.paint();
}
// the title being bought for: its poster (live titles: landscape art) and what it is
function titleArt(it) {
  const d = DETAILS[it.id] || {};
  return { wide: it.type === 'tvs-live' || !it.poster, art: it.type === 'tvs-live' ? artFor(it) : it.poster || it.land,
    what: it.type === 'tvs-live' ? (isChannel(it) ? 'ช่องทีวี' : 'ถ่ายทอดสด') : (d.genres || it.genres || []).slice(0, 2).map(g => GENRE_TH[g] || g).join(' · ') };
}
// the poster column (plans page, and checkout's left side in the title summary); `head` goes above the poster, `foot`
// under the name
function titleSide(it, foot = '', head = '') {
  const { art, wide, what } = titleArt(it);
  return `<div class="pk-side${wide ? ' wide' : ''}">${head}<img src="${art}" alt=""><span>สมัครเพื่อดู</span><b>${esc(it.t).split(' ').map(w => `<span class="nw">${w}</span>`).join(' ')}</b>${what ? `<em>${esc(what)}</em>` : ''}${foot}</div>`;
}
// art for a live title: events have their own; channels have none in the feed, so sport channels borrow a live sport
// event's and the rest a feed title's (k picks which, so neighbouring channels differ)
function artFor(c, k = CHANNELS.findIndex(x => x.id === c.id)) {
  if (!isChannel(c)) return c.land || c.poster;
  const pool = SPORT_CH.test(c.t) ? LIVE_EVENTS : FEED_ITEMS.filter(x => x.land);
  return (pool[(Math.max(0, k) * 7 + 3) % Math.max(1, pool.length)] || {}).land || c.land;
}

// ---- checkout: the plan as a NOW pass at left; at right a preview of next month's TrueOnline bill with the plan added,
// the primary CTA (focused) confirms it, focusing the secondary swaps the preview for a TrueMoney QR, T&C a minor link. TrueMoney shows its QR in place with a countdown and three steps (scan, pay, watch); the test marks it paid.
const STEP_IC = {
  scan: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><rect x="13" y="4" width="22" height="40" rx="4"/><path d="M19 15h4v4h-4zM25 15h4v4h-4zM19 21h4v4h-4zM27 23v2h2"/><path d="M21 38h6"/></svg>',
  pay: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><rect x="13" y="4" width="22" height="40" rx="4"/><path d="m18 22 4 4 8-8"/><path d="M18 33h12"/></svg>',
  watch: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="8" width="40" height="26" rx="3"/><path d="M16 42h16"/><path d="m21 16 8 5-8 5z" fill="currentColor"/></svg>',
};
// the other ways to pay: each is a QR on the TV, scanned with the phone (a card is typed on the phone's payment page, not
// with the remote)
const PAY_ALT = [
  { id: 'truemoney', t: 'TrueMoney', logo: '/img/cp/truemoney.png', seed: 1, done: 'TrueMoney', hint: 'สแกน QR บนจอด้วยแอป TrueMoney',
    steps: [['scan', 'สแกนด้วยแอป TrueMoney'], ['pay', 'ยืนยันบนมือถือ'], ['watch', 'ดูบนทีวีได้ทันที']] },
  { id: 'promptpay', sub: 'ทุกธนาคาร', t: 'พร้อมเพย์', logo: 'img/pay-promptpay.svg', seed: 2, done: 'พร้อมเพย์', hint: 'สแกน QR บนจอด้วยแอปธนาคาร',
    steps: [['scan', 'สแกนด้วยแอปธนาคาร'], ['pay', 'ยืนยันในแอป'], ['watch', 'ดูบนทีวีได้ทันที']] },
  { id: 'card', sub: 'กรอกบนมือถือ', t: 'บัตรเครดิต / เดบิต', logo: 'img/pay-card.svg', seed: 3, done: 'บัตรเครดิต/เดบิต', hint: 'สแกน QR เพื่อกรอกบัตรบนมือถือ',
    steps: [['scan', 'สแกนเพื่อเปิดหน้าชำระเงิน'], ['pay', 'กรอกบัตรและ OTP'], ['watch', 'ดูบนทีวีได้ทันที']] },
];
// two checkout styles for user tests (demo bar ชำระเงิน, ?checkout=list|simple):
//   list   = the plan pass + one column of payment rows; the focused row opens in place (bill or QR)
//   simple = one decision: the plan and a big ยืนยัน · เพิ่มในบิลทรูออนไลน์; "ชำระด้วยวิธีอื่น" opens the other methods
//            as a list on their own screen
//   pin    = simple, then a 4-digit TrueID PIN on an on-screen keypad before the bill is charged (Roku Pay / carrier billing)
//   approve= simple, then "confirm on your phone": a TrueID app push to approve, a QR as fallback (Apple TV's pattern)
//   handoff= no payment on the TV at all: one QR, the whole purchase finishes on the phone (Max / Netflix sign-in pattern)
const CHECKOUT_STYLES = { list: 'รายการ', simple: 'ขั้นตอนเดียว', pin: 'ยืนยัน PIN', approve: 'ยืนยันบนมือถือ', handoff: 'สมัครบนมือถือ' };
let CHECKOUT_STYLE = CHECKOUT_STYLES[new URLSearchParams(location.search).get('checkout')] ? new URLSearchParams(location.search).get('checkout') : 'list';
function setCheckout(v) {
  CHECKOUT_STYLE = v;
  const u = new URL(location.href); u.searchParams.set('checkout', v); history.replaceState(null, '', u);
  document.querySelectorAll('[data-checkout]').forEach(b => b.classList.toggle('on', b.dataset.checkout === v));
  toast(`เคสทดสอบ: หน้าชำระเงินแบบ${CHECKOUT_STYLES[v]}`);
}
document.querySelectorAll('[data-checkout]').forEach(b => b.classList.toggle('on', b.dataset.checkout === CHECKOUT_STYLE));

const BILL_METHOD = { id: 'trueonline', logo: '/img/cp/true.png', t: 'บิลทรูออนไลน์', sub: `บัญชี ${TRUEONLINE.account}`, tag: 'แนะนำ' };
const planPass = plan => { const k = kindOf(plan);
  return passCard({ cls: `${k}${plan.rec && !plan.gold ? ' rec' : ''}`, ic: planIc(plan), hex: plan.hex, name: plan.name, price: thb(plan.price), unit: '/เดือน',
    feats: featsOf(plan), foot: 'ต่ออายุทุกเดือน · ยกเลิกได้ทุกเมื่อ' }); };
// checkout's left side, a test option (demo bar ฝั่งซ้าย, ?summary=pass|title): pass = the plan's NOW pass with its
// benefits; title = the title being bought for carries on from the plans page, the plan shrunk to one line under it
// (they've just picked it, no need to sell it again). With no title it's always the pass
const SUMMARIES = { pass: 'บัตรแพ็กเกจ', title: 'เรื่องที่เลือก' };
let SUMMARY = SUMMARIES[new URLSearchParams(location.search).get('summary')] ? new URLSearchParams(location.search).get('summary') : 'pass';
function setSummary(v) {
  SUMMARY = v;
  const u = new URL(location.href); u.searchParams.set('summary', v); history.replaceState(null, '', u);
  document.querySelectorAll('[data-summary]').forEach(b => b.classList.toggle('on', b.dataset.summary === v));
  toast(`เคสทดสอบ: หน้าชำระเงินแสดง${SUMMARIES[v]}`);
}
document.querySelectorAll('[data-summary]').forEach(b => b.classList.toggle('on', b.dataset.summary === SUMMARY));
// the plan as one line in its colour (title summary, PIN, approve-on-phone)
const planChip = plan => `<div class="co-plan" style="--tier:${tierOf(plan)}"><i class="pk-ic">${planIc(plan)}</i><b>${plan.name}</b><span>${cost(plan)}</span></div>`;
const titleMode = () => SUMMARY === 'title' && BUY_FOR;
const coSide = plan => titleMode() ? `<div class="co-title">${titleSide(BUY_FOR)}</div>` : planPass(plan);
// the checkout's heading; in title mode the plan and price sit right under it, unboxed (on a TV the top is read first:
// what you pay, then how)
const coHead = (plan, title) => `<h2>${title}</h2>${titleMode() ? `<div class="co-plan bare" style="--tier:${tierOf(plan)}"><i class="pk-ic">${planIc(plan)}</i><b>${plan.name}</b><span>${cost(plan)}</span></div>` : ''}`;
const termsToast = () => toast('ต่ออายุอัตโนมัติทุกเดือน ยกเลิกได้ทุกเมื่อในการตั้งค่าบัญชี ไม่มีค่าธรรมเนียม');
// fills `el` with what a method does (the bill + confirm bar, or its QR) and starts the QR's wait; returns a stop function
function payBody(el, plan, id, finish) {
  const alt = PAY_ALT.find(p => p.id === id);
  if (!alt) {
    el.innerHTML = `<div class="pgo">กด OK เพื่อยืนยัน · รวมในบิลรอบถัดไป</div>`;
    return () => {};
  }
  el.innerHTML = qrBlock({ seed: plan.price + alt.seed, logo: alt.logo, title: `สแกนจ่าย ${thb(plan.price)}`, steps: alt.steps });
  const timer = qrWait(el), paid = setTimeout(() => finish(alt.id), QR_PAID_MS);
  return () => { clearInterval(timer); clearTimeout(paid); };
}
const methodHead = m => `<div class="prow-head"><img src="${m.logo}" alt=""><span><b>${m.t}</b>${m.sub ? `<em>${m.sub}</em>` : ''}</span>${m.tag ? `<i class="prow-tag">${m.tag}</i>` : ''}<i class="prow-arrow">›</i></div>`;
function checkout(plan) {
  if (CHECKOUT_STYLE === 'handoff') return checkoutHandoff(plan);
  if (CHECKOUT_STYLE !== 'list') return checkoutSimple(plan, CHECKOUT_STYLE === 'pin' ? pinConfirm : CHECKOUT_STYLE === 'approve' ? phoneApprove : null);
  return checkoutList(plan, [BILL_METHOD, ...PAY_ALT]);
}

// list: one column of payment rows; the focused row opens in place, so the eye stays on the focus
function checkoutList(plan, methods, title = 'เลือกวิธีชำระเงิน') {
  let pay = null, stop = () => {};
  const ov = overlay(`<div class="ov-page co">${coSide(plan)}
    <div class="co-main">${coHead(plan, title)}
      <div class="plist">${methods.map(m => `<div class="prow ${m.id === 'trueonline' ? 'main' : ''}" data-f data-pay="${m.id}">${methodHead(m)}<div class="prow-body"></div></div>`).join('')}</div>
      <a class="co-terms" data-f data-terms>อ่านเงื่อนไขการใช้บริการ</a></div></div>`, 'checkout', {
    ok() {
      const x = this.items()[this.i];
      if (x.dataset.terms) return termsToast();
      if (x.dataset.pay === 'trueonline') return finish('trueonline');
      toast(PAY_ALT.find(p => p.id === x.dataset.pay).hint);
    },
    back() { stop(); this.close(); },
  });
  const finish = how => { stop(); if (OV === ov) { ov.close(); while (OV && OV.el.classList.contains('checkout')) OV.close(); done(plan, how); } };
  ov.onFocus = i => {
    const p = ov.items()[i].dataset.pay || null;
    if (p === pay) return;
    pay = p; stop(); stop = () => {};
    ov.el.querySelectorAll('.prow-body').forEach(b => { b.innerHTML = ''; });
    if (p) stop = payBody(ov.el.querySelector(`[data-pay="${p}"] .prow-body`), plan, p, finish);
  };
  ov.paint();
}

// simple: the plan, one big confirm on the bill, and a quiet way out to the other methods
function checkoutSimple(plan, confirm) {
  const ov = overlay(`<div class="ov-page co co-simple">${coSide(plan)}
    <div class="co-main">${coHead(plan, 'ยืนยันการสมัคร')}
      <div class="sbill"><div class="bill-head"><img src="/img/cp/true.png" alt=""><div><b>รวมในบิลทรูออนไลน์รอบถัดไป</b><span>บัญชี ${TRUEONLINE.account}</span></div></div></div>
      <div class="obtn buy sgo" data-f>ยืนยัน</div>
      <div class="obtn alt sgo" data-f>ชำระด้วยวิธีอื่น</div>
      <a class="co-terms" data-f data-terms>อ่านเงื่อนไขการใช้บริการ</a></div></div>`, 'checkout', {
    ok() {
      if (this.i === 0) { if (confirm) return confirm(plan); this.close(); return done(plan, 'trueonline'); }
      if (this.i === 1) return checkoutList(plan, PAY_ALT, 'ชำระด้วยวิธีอื่น');
      termsToast();
    },
    back() { this.close(); },
  });
}

// the step after ยืนยัน in the pin/approve styles closes every checkout screen and celebrates
const buyOnBill = plan => { while (OV && /checkout|confirm/.test(OV.el.className)) OV.close(); done(plan, 'trueonline'); };

// pin: 4 digits on a 3×4 keypad (arrows move, OK presses; the remote's number keys type directly). Any 4 digits pass
// in the test
function pinConfirm(plan) {
  let pin = '';
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'];
  const ov = overlay(`<div class="cf-card"><img src="/img/cp/true.png" alt="" class="cf-logo"><h2>ใส่ PIN TrueID เพื่อยืนยัน</h2>
      ${planChip(plan)}<p class="cf-bill">รวมในบิลทรูออนไลน์ · บัญชี ${TRUEONLINE.account}</p>
      <div class="pin-dots">${[0, 1, 2, 3].map(() => '<i></i>').join('')}</div>
      <div class="pad">${keys.map(k => `<div class="pk-key${k === 'ok' ? ' go' : ''}" data-f data-k="${k}">${k === 'del' ? '⌫' : k === 'ok' ? 'ยืนยัน' : k}</div>`).join('')}</div>
      <span class="cf-note">ลืม PIN? ตั้งใหม่ในแอป TrueID (ทดสอบ: เลขใดก็ได้)</span></div>`, 'confirm', {
    ok() { press(keys[this.i]); },
    back() { this.close(); },
  });
  ov.move = (dx, dy) => { const n = ov.i + dx + dy * 3; if (n >= 0 && n < keys.length) { ov.i = n; ov.paint(); } };
  ov.digit = d => press(d);
  const dots = () => ov.el.querySelectorAll('.pin-dots i').forEach((d, j) => d.classList.toggle('on', j < pin.length));
  const press = k => {
    if (k === 'del') pin = pin.slice(0, -1);
    else if (k === 'ok') { if (pin.length < 4) return toast('ใส่ PIN ให้ครบ 4 หลัก'); }
    else if (pin.length < 4) pin += k;
    dots();
    if (pin.length === 4) { ov.el.querySelector('.pin-dots').classList.add('ok'); setTimeout(() => { if (OV === ov) buyOnBill(plan); }, 500); }
  };
  ov.i = 4; ov.paint();
}

// approve: the TV waits while the phone gets a TrueID push; a QR opens the same approval if the push doesn't arrive
function phoneApprove(plan) {
  // the phone mock shows what arrives; the text side: what to do, the wait, then (under a rule) the QR fallback and cancel
  const ov = overlay(`<div class="cf-card wide"><div class="ap-phone"><div class="ap-push"><img src="/img/cp/true.png" alt=""><div><b>TrueID</b>
      <span>ยืนยันสมัคร NOW ${plan.name}<br>${cost(plan)}</span></div></div><div class="ap-btns"><i>ปฏิเสธ</i><i class="y">อนุมัติ</i></div></div>
    <div class="ap-text"><h2>ยืนยันบนมือถือของคุณ</h2>${planChip(plan)}<p>กด <b>อนุมัติ</b> ในแอป TrueID บน <b>096-•••-7705</b></p>
      <span class="qr-time"><i class="spin"></i><em>กำลังรอการอนุมัติ…</em></span>
      <div class="ap-or"><div class="qrp-code">${qrSvg(55)}<img src="/img/cp/true.png" alt=""></div><span>ไม่ได้รับแจ้งเตือน?<br>สแกน QR นี้ด้วยแอป TrueID แทน</span></div>
      <div class="obtn alt" data-f>ยกเลิก</div></div></div>`, 'confirm', {
    ok() { clearTimeout(t); this.close(); },
    back() { clearTimeout(t); this.close(); },
  });
  const t = setTimeout(() => { if (OV !== ov) return; ov.el.querySelector('.ap-btns .y').classList.add('tap'); setTimeout(() => { if (OV === ov) buyOnBill(plan); }, 700); }, QR_PAID_MS);
}

// handoff: the plan is picked; everything else (sign-in, method, payment) happens on the phone
function checkoutHandoff(plan) {
  const ov = overlay(`<div class="ov-page co co-hand">${coSide(plan)}
    <div class="co-main">${coHead(plan, 'สมัครต่อบนมือถือ')}
      <div class="co-panel">${qrBlock({ seed: plan.price + 9, logo: 'img/now-app-icon.svg', title: 'สแกนด้วยกล้องมือถือ',
        steps: [['scan', 'สแกน QR'], ['pay', 'เลือกวิธีชำระและยืนยัน'], ['watch', 'ทีวีเริ่มเล่นเอง']] })}</div>
      <div class="co-ctas"><div class="cta alt" data-f><b>ส่งลิงก์ทาง SMS</b></div></div>
      <a class="co-terms" data-f data-terms>อ่านเงื่อนไขการใช้บริการ</a></div></div>`, 'checkout', {
    ok() { if (this.i === 0) return toast('ส่งลิงก์ทาง SMS แล้ว เปิดลิงก์บนมือถือเพื่อสมัครต่อ'); termsToast(); },
    back() { clearInterval(w); clearTimeout(t); this.close(); },
  });
  const w = qrWait(ov.el);
  const t = setTimeout(() => { clearInterval(w); if (OV === ov) { ov.close(); done(plan, 'trueonline'); } }, QR_PAID_MS);
}

// a QR-looking pattern (not a real code), as in now-appCP: three finder squares and seeded noise
function qrSvg(seed = 7) {
  let x = seed, cells = '';
  const rnd = () => (x = (x * 9301 + 49297) % 233280) / 233280;
  const finder = (r, c) => r < 7 && c < 7 || r < 7 && c > 13 || r > 13 && c < 7;
  for (let r = 0; r < 21; r++) for (let c = 0; c < 21; c++) if (!finder(r, c) && rnd() > .52) cells += `M${c} ${r}h1v1h-1z`;
  const box = (x, y) => `<path d="M${x} ${y}h7v7h-7zM${x + 1} ${y + 1}v5h5v-5zM${x + 2} ${y + 2}h3v3h-3z" fill-rule="evenodd"/>`;
  return `<svg viewBox="-1 -1 23 23" aria-hidden="true"><rect x="-1" y="-1" width="23" height="23" fill="#fff"/><g fill="#111"><path d="${cells}"/>${box(0, 0)}${box(14, 0)}${box(0, 14)}</g></svg>`;
}

// success: the check draws itself, rings ripple out, confetti bursts from the badge (then a smaller second shower), the copy rises in, and the
// plan's own icon and colour join the brand ones. Plain CSS animations (each piece gets its own --vars), cheap on TV chips.
const CONFETTI = 70;
const WATCH_IN = 8;      // seconds before a title bought from its page starts by itself
const CONFETTI_COLORS = ['#fb008d', '#ff0000', '#f5c518', '#ffffff', '#c23bb8'];
function confetti(tier, delay = 0, n = CONFETTI) {
  const colors = [...CONFETTI_COLORS, tier, tier];
  return Array.from({ length: n }, (_, i) => {
    const a = Math.random() * Math.PI * 2, d = 260 + Math.random() * 520;
    return `<i style="--x:${Math.round(Math.cos(a) * d)}px;--y:${Math.round(Math.sin(a) * d * .7 - 160)}px;--r:${Math.round(Math.random() * 720 - 360)}deg;`
      + `--c:${colors[i % colors.length]};--w:${8 + Math.round(Math.random() * 10)}px;--h:${i % 3 ? 18 : 10}px;--t:${(delay + Math.random() * .25).toFixed(2)}s;--f:${(2.2 + Math.random() * 1.4).toFixed(2)}s"></i>`;
  }).join('');
}
function done(plan, pay) {
  SUB = plan;
  const alt = PAY_ALT.find(p => p.id === pay);
  const how = alt ? `ชำระ ${cost(plan)} ด้วย${alt.done}แล้ว` : `${cost(plan)} รวมในบิลทรูออนไลน์รอบถัดไป`;
  const tier = tierOf(plan);
  // bought for a title: its art, blurred and dark, stays behind the celebration so the flow ends where it started
  const ov = overlay(`${BUY_FOR ? `<i class="done-bg" style="--art:url('${titleArt(BUY_FOR).art}')"></i>` : ''}<div class="done" style="--tier:${tier}">
    <div class="burst">${confetti(tier)}${confetti(tier, 1.6, 40)}</div>
    <div class="done-badge"><i class="ring"></i><i class="ring r2"></i>
      <i class="done-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path class="tick" d="m5 12.5 4.5 4.5L19 7.5"/></svg></i>
      <i class="done-plan">${planIc(plan)}</i></div>
    <h2 class="rise" style="--d:.55s">ยินดีต้อนรับสู่ ${plan.name}!</h2>
    <p class="rise" style="--d:.7s">${how}</p>
    <div class="obtn buy rise${BUY_FOR ? ' count' : ''}" style="--d:.85s;--s:${WATCH_IN}s" data-f>${BUY_FOR
      ? `<span>เริ่มดู ${esc(BUY_FOR.t)}</span><em class="cd">${WATCH_IN}</em>` : 'เริ่มดูเลย'}</div></div>`, 'success', {
    ok() { go(true); },
    back() { go(false); },
  });
  // bought for a title: the button counts down and the title starts playing on OK or when it reaches 0; Back just closes
  const it = BUY_FOR;
  let left = WATCH_IN, tick = 0;
  const go = play => { clearInterval(tick); finished(); if (play && it) player(it); };
  if (it) tick = setInterval(() => {
    const cd = ov.el.querySelector('.cd');
    if (--left <= 0) return go(true);
    if (cd) cd.textContent = left;
  }, 1000);
}
// back to where the flow started; a detail page underneath redraws so its watch button no longer asks to subscribe
function finished() {
  closeAll();
  if (DT.open) drawDetail();
}

// ---- a mock player: the title's art as the picture (slow zoom), title bar, seek bar with real-time clock. OK pauses,
// left/right seek 10 s, Back closes; the controls fade after a few seconds and come back on any key. Live titles show LIVE
// and their place in the broadcast instead of a seek bar.
const PLAYER_HIDE_MS = 4000;
const PLAY_IC = '<svg viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>';
const SKIP_IC = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5.5v13l9-6.5zM16 5h2.5v14H16z"/></svg>';
const PAUSE_IC = '<svg viewBox="0 0 24 24" fill="#fff"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
const clock = s => `${Math.floor(s / 3600) ? Math.floor(s / 3600) + ':' : ''}${String(Math.floor(s / 60) % 60).padStart(Math.floor(s / 3600) ? 2 : 1, '0')}:${String(s % 60).padStart(2, '0')}`;
const AD_SECONDS = 30;
const AD_SKIP_AFTER = 5;   // the skip button unlocks after this many seconds (the focus stays where the viewer left it)
// a made-up commercial (fictional brand ZAA lychee soda): a 6 s spot in three CSS beats, played 5 times over AD_SECONDS:
// the can drops in through bubbles, the tagline lands, then the end card
const FAKE_AD = `<div class="cm">
  <div class="cm-bubbles">${Array.from({ length: 24 }, (_, i) => `<i style="--x:${(i * 37) % 100}%;--s:${10 + (i * 7) % 26}px;--d:${(i * 0.23 % 3).toFixed(2)}s;--t:${(2.4 + (i * 13 % 10) / 10).toFixed(1)}s"></i>`).join('')}</div>
  <div class="cm-can"><i class="cm-lid"></i><b>ZAA</b><span>LYCHEE SODA</span><i class="cm-fruit"></i></div>
  <i class="cm-splash"></i>
  <div class="cm-line"><b>ซ่าสุดใจ</b><b>ทุกจิบ!</b></div>
  <div class="cm-end"><b>ZAA</b><span>โซดาลิ้นจี่ ซ่าสดชื่น · มีจำหน่ายแล้ววันนี้</span></div>
</div>`;
function player(it) {
  if (SUB === FREE_PLAN && !player.adFor && covers(it)) {   // free pack: one ad break before what it can play
    player.adFor = it;
    let n = AD_SECONDS;
    // top left: the ad's time left and what plays after it; bottom right: subscribe, and one skip button that counts
    // down until it unlocks
    const ov = overlay(`<div class="ad">${FAKE_AD}<div class="ad-top"><i class="ad-tag">โฆษณา · <b>${clock(n)}</b></i><span class="ad-left">ต่อไป <em>${esc(it.t)}</em></span></div>
      <div class="ad-bar"><div class="obtn buy" data-f>ดูแบบไม่มีโฆษณา · สมัครเลย</div><div class="ad-skip">ข้ามได้ใน <b>${AD_SKIP_AFTER}</b></div></div>
      <div class="ad-prog"><i></i></div></div>`, 'player', {
      // OK on the subscribe button: the plans for this title; the ad waits underneath, and a purchase plays the
      // title straight after its celebration, with no ad. OK on ข้ามโฆษณา: the title now
      ok() { if (ov.items()[ov.i].classList.contains('ad-skip')) return end(); packages(it); },
      back() { clearInterval(t); player.adFor = null; this.close(); },
    });
    const skip = ov.el.querySelector('.ad-skip');
    const end = () => { clearInterval(t); ov.close(); player(it); player.adFor = null; };
    const t = setInterval(() => {
      if (!ov.el.isConnected || ov.el.classList.contains('out')) { player.adFor = null; return clearInterval(t); }
      ov.el.classList.toggle('held', OV !== ov);
      if (OV !== ov) return;   // paused (with the commercial) while the purchase flow is on top
      if (--n <= 0) return end();
      const gone = AD_SECONDS - n;
      ov.el.querySelector('.ad-tag b').textContent = clock(n);
      ov.el.querySelector('.ad-prog i').style.width = `${gone / AD_SECONDS * 100}%`;
      if (gone < AD_SKIP_AFTER) skip.querySelector('b').textContent = AD_SKIP_AFTER - gone;
      else if (!skip.hasAttribute('data-f')) { skip.setAttribute('data-f', ''); skip.innerHTML = `ข้ามโฆษณา ${SKIP_IC}`; }
    }, 1000);
    return;
  }
  // a channel from the Live TV shelf surfs: ↑/↓ change channel; a channel the viewer's pack doesn't cover blurs and
  // offers สมัครเพื่อรับชม (OK opens the plans for it)
  const surfing = it.type === 'tvs-live' && isChannel(it);
  let ci = surfing ? CHANNELS.findIndex(c => c.id === it.id) : 0;
  let cur = it, d, live, len, at, sub, paused = false, hideT = 0;
  const ov = overlay(`<div class="pl${surfing ? ' surf' : ''}">
    <div class="pl-pic"><img alt=""></div><img class="pl-bug" alt="">
    <div class="pl-ui">
      <div class="pl-top"><b></b><span></span></div>
      <i class="pl-mid"></i>
      <div class="pl-bot"><i class="pl-live">LIVE</i><span class="pl-at"></span>
        <div class="pl-bar"><i class="pl-fill"></i><i class="pl-knob"></i></div><span class="pl-len"></span>${surfing ? '<span class="pl-hint">↑ ↓ เปลี่ยนช่อง</span>' : ''}</div>
    </div>
    <div class="pl-lock"><i class="pl-lock-ic">${LOCK_IC}</i><b>ช่องนี้สำหรับสมาชิก</b><span class="pl-lock-for"></span>
      <div class="obtn buy" data-f>สมัครเพื่อรับชม</div></div>
    <b class="pl-num"></b></div>`, 'player', {
    ok() { if (!covers(cur)) return packages(cur); paused = !paused; show(true); },
    back() { clearInterval(tick); clearTimeout(hideT); this.close(); },
  });
  const el = ov.el.querySelector('.pl');
  const picFor = (c, k) => surfing ? artFor(c, k) : c.land || c.poster;
  const load = (c, k) => {
    cur = c; d = DETAILS[c.id] || {}; live = c.type === 'tvs-live';
    len = live ? Math.max(60, ((c.end || 0) - (c.start || 0)) / 1000) || 7200 : (d.dur || 45) * 60;
    at = live && c.start ? Math.max(0, Math.min(len - 1, (Date.now() - c.start) / 1000)) : 0;
    sub = live ? (c.ch ? `ช่อง ${c.ch}` : 'ถ่ายทอดสด') : d.series || c.type === 'tvs-series' ? 'ตอนที่ 1' : (d.year || '');
    el.querySelector('.pl-pic img').src = picFor(c, k) || '';
    el.querySelector('.pl-pic').classList.toggle('moving', !live);
    el.querySelector('.pl-top b').textContent = c.t;
    el.querySelector('.pl-top span').textContent = sub;
    const bug = el.querySelector('.pl-bug');
    bug.hidden = !(surfing && c.logo); if (surfing) bug.src = c.logo || '';
    el.querySelector('.pl-len').textContent = live ? '' : clock(len);
    el.classList.toggle('live', live);
    el.classList.toggle('chan', live && isChannel(c));
    const locked = !covers(c);
    el.classList.toggle('locked', locked);
    if (locked) el.querySelector('.pl-lock-for').textContent = `ดูได้กับแพ็กเกจ${isSport(c) ? 'กีฬา' : 'บันเทิง'} เริ่มต้น ${cost(plansFor(c).sort((p, q) => p.price - q.price)[0])}`;
    if (surfing) {   // the channel number flashes top-right, like a TV
      const num = el.querySelector('.pl-num');
      num.textContent = c.ch || '';
      num.classList.remove('on'); void num.offsetWidth; num.classList.add('on');
      el.classList.remove('zap'); void el.offsetWidth; el.classList.add('zap');
    }
    ov.paint();
  };
  ov.move = (dx, dy) => {
    if (dy && surfing) { ci = (ci + dy + CHANNELS.length) % CHANNELS.length; paused = false; load(CHANNELS[ci], ci); }
    else if (dx && !live) at = Math.max(0, Math.min(len - 1, at + dx * 10));
    show();
  };
  const draw = () => {
    el.querySelector('.pl-at').textContent = live ? new Date().toLocaleTimeString('th-TH', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }) : clock(Math.floor(at));
    const pct = at / len * 100;
    el.querySelector('.pl-fill').style.width = `${pct}%`;
    el.querySelector('.pl-knob').style.left = `${pct}%`;
    el.querySelector('.pl-mid').innerHTML = paused ? PAUSE_IC : PLAY_IC;
    el.classList.toggle('paused', paused);
    el.querySelector('.pl-pic').style.animationPlayState = paused ? 'paused' : 'running';
  };
  // controls show on any key, flash the play/pause mark on OK, and fade after PLAYER_HIDE_MS while playing (not on a lock)
  const show = flash => {
    el.classList.remove('idle');
    if (flash) { el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }
    clearTimeout(hideT);
    hideT = setTimeout(() => { if (!paused && covers(cur)) el.classList.add('idle'); }, PLAYER_HIDE_MS);
    draw();
  };
  const tick = setInterval(() => { if (!paused && at < len - 1) at++; draw(); }, 1000);
  load(it, ci);
  show();
}
const LOCK_IC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
let CHANNELS = [], LIVE_EVENTS = [];   // app.js fills these from the feed: the Live TV shelf, and paid live events' art
endSplash(STARTED);
