// Free user: playing anything opens the in-app purchase flow, from the title's detail page. Shared by /now-app/ (its demo panel's ผู้ใช้
// switch, ?user=member|free) and /now-appCP/ (the ดูในฐานะ switch's free persona, which sets isFree). Loads after
// app.js (uses esc), before cp.js.
// The packages are the peacock clone's subscription catalog (src/components/account/subscription/catalog.js: the three
// base packages, their tiers and channel line-ups; Thai copy from its translate.js), and the paywall follows its
// checkout (PackageDetail.jsx): the title you tapped, "included in" its package, that package's tiers plus MAX, annual
// billing at 25% off, and what's included with what a higher tier adds dimmed. Paid through the App Store's own sheet
// (double-click the side button, Face ID), then a NOW confirmation that plays what was tapped.
const PLATFORMS = [['tv', 'ทีวี'], ['tablet', 'แท็บเล็ต'], ['web', 'เว็บ'], ['mobile', 'มือถือ']];
const ALL = PLATFORMS.map(p => p[0]), PHONE = ['mobile'];
const MOVIES = 'หนังและซีรีส์', ALL_SPORT = ['ไทยลีก', 'ฟุตซอล', 'UCL', 'F1', 'MotoGP', 'กีฬาทั่วโลก'];
const PACKAGES = [
  { id: 'ent', name: 'Entertainment', tiers: [
    { id: 'ent-mobile', name: 'Mobile', hl: 'เฉพาะมือถือ', price: 99, content: [MOVIES], channels: 30, partners: [], screens: 1, platform: PHONE },
    { id: 'ent-standard', name: 'Standard', hl: 'ทุกอุปกรณ์', price: 199, content: [MOVIES], channels: 40, partners: ['iQIYI'], screens: 1, platform: ALL },
    { id: 'ent-premium', name: 'Premium', hl: '+ WeTV และ Viu', price: 299, content: [MOVIES], channels: 40, partners: ['iQIYI', 'WeTV', 'Viu'], screens: 2, platform: ALL, popular: 1 },
  ] },
  { id: 'sport', name: 'Sport', gate: 'sport-full', tiers: [
    { id: 'sport-football', name: 'Football', hl: 'เฉพาะมือถือ', price: 199, content: ['ไทยลีก', 'ฟุตซอล'], channels: 12, screens: 1, platform: PHONE },
    { id: 'sport-full', name: 'Sport', hl: '+ กีฬาทั่วโลก', price: 499, content: ALL_SPORT, channels: 120, screens: 1, platform: ALL, popular: 1 },
    { id: 'sport-2ccu', name: '2 หน้าจอ', hl: '+ หน้าจอที่ 2', price: 699, content: ALL_SPORT, channels: 120, screens: 2, platform: ALL },
  ] },
  { id: 'max', name: 'Max', gate: 'max-full', tiers: [
    { id: 'max-starter', name: 'Starter', hl: '1 หน้าจอ', price: 349, content: [MOVIES, 'ไทยลีก', 'ฟุตซอล'], channels: 60, partners: ['iQIYI'], screens: 1, platform: ALL, popular: 1 },
    { id: 'max-full', name: 'MAX', hl: 'ปลดล็อกทุกอย่าง', price: 1599, content: [MOVIES, ...ALL_SPORT], channels: 160, partners: ['iQIYI', 'WeTV', 'Viu'], screens: 4, platform: ALL },
  ] },
];
// the line-ups behind the counts (the clone's CHANNELS); * = only from the package's gate tier up
const CHANNELS = {
  ent: 'True Film 1|True Film 2|True Movies Hits|Rock X Stream|Rock Action|True Thai Film|True Film Asia|True Asian More|True Series|AXN HD|True X-Zyte|KBS World HD|CCM|Arirang|True Spark Play|Nick Jr|Dreamworks|Cartoon Network|Food Network|Fashion TV HD|Asian Food|True Explore Wild|True Explore Life|True Explore Sci',
  sport: 'True Premier Football 3|True Premier Football 4|True Premier Football 5|beIN SPORTS 1|beIN SPORTS 2*|beIN SPORTS 3|True Ball Thai 1|True Ball Thai 2|True Sport 1*|True Sport 2*|True Sport 3*|True Sport 4*|True Sport 5*|True Sport 7*|True Tennis*|Golf Channel HD*|SPOTV1*|SPOTV2*',
  max: 'True Film 1|True Film 2|True Movies Hits|Rock X Stream|Rock Action|True Thai Film|True Film Asia|True Asian More|True Series|AXN HD|True X-Zyte|Rock Entertainment*|Lifetime*|KBS World HD|CCM|Arirang|True Spark Play|Nick Jr|Dreamworks|Cartoon Network|Food Network|Fashion TV HD|Asian Food|BBC Lifestyle*|True Explore Wild|True Explore Life|True Explore Sci|Discovery Asia*|History Channel HD*|CI*|Discovery Channel*|TLC*|Animal Planet*|DW English*|CNN HD*|Phoenix InfoNews*|BBC World News*|CNBC*|CCTV4*|TV5Monde*|Aljazeera*|ABC Australia*|NHK World TV*|CGTN*|Russia Today*|True Premier Football 3|True Premier Football 4|True Premier Football 5|beIN SPORTS 1|beIN SPORTS 2*|beIN SPORTS 3|True Sport 1*|True Sport 2*|True Sport 3*|True Sport 4*|True Sport 5*|True Sport 7*|True Tennis*|Golf Channel HD*|SPOTV1*|SPOTV2*',
};
const PARTNER_ICON = { iQIYI: 'iqiyi', WeTV: 'wetv', Viu: 'viu' };
const ANNUAL_OFF = 0.25;   // the clone's annual rate: 25% off, the year charged upfront
let SUB = null;   // the free user's package once bought: { pkg, tier, annual }
const USER_KEY = 'now-app-user';
let isFree = () => {
  const q = new URLSearchParams(location.search).get('user');
  let saved = null;
  try { if (q) localStorage.setItem(USER_KEY, q); saved = localStorage.getItem(USER_KEY); } catch (e) {}
  return (q || saved) === 'free';
};
const baht = n => `฿${n.toLocaleString('en-US')}`;
const iapCheck = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
const iapAdd = el => document.querySelector('.phone').appendChild(el);
// what was tapped: its title and picture (the hero's current slide for its buttons), and whether it's live (-> Sport)
function watchOf(el) {
  const hero = el.closest('.detail, .hf, .hc-card, .slide');   // the detail page, or the ใหม่ 2, ใหม่ and เดิม heroes
  const pic = hero ? hero.querySelector('.dt-art img, .hf-art.on img, .hc-art img, img') : el.querySelector('img');
  const name = hero ? hero.querySelector('.detail h1, .hf-slide.on .hc-logo, .hf-slide.on .hc-tt, .hc-logo, .hc-tt, h2') : pic;
  return { el, t: name ? (name.alt || name.textContent).trim() : '', img: pic ? pic.src : '',
    live: /\/tvs-live\//.test(el.getAttribute('href') || '') || !!el.closest('.btn-live, .live') };
}
// the purchase starts on the content detail page (app.js): its สมัครเลย; on the home, a free user's play buttons
// open that page instead of playing (canPlayNow)
canPlayNow = () => !isFree() || !!SUB;
function gateFree(e) {
  if (canPlayNow()) return;
  const el = e.target.closest('.dt-play');
  if (!el) return;
  e.preventDefault(); e.stopPropagation();
  iapSheet(watchOf(el));
}
// what a choice costs: the per-month headline, and what the App Store charges (a year upfront when annual)
const priceOf = (tier, annual) => {
  const m = annual ? Math.round(tier.price * (1 - ANNUAL_OFF)) : tier.price;
  return { m, charge: annual ? m * 12 : m, unit: annual ? 'ปี' : 'เดือน' };
};
const planName = (pkg, tier) => tier.name.toLowerCase() === pkg.name.toLowerCase() ? pkg.name : `${pkg.name} ${tier.name}`;
const pkgOf = tier => PACKAGES.find(p => p.tiers.includes(tier));
const dimIf = on => on ? '' : ' class="dim"';
// what's included at the chosen tier, everything the package's higher tiers add shown dimmed
function included(tier, showAll) {
  const pkg = pkgOf(tier), union = k => [...new Set(pkg.tiers.flatMap(t => t[k] || []))];
  const gateOk = !pkg.gate || tier.price >= pkg.tiers.find(t => t.id === pkg.gate).price;
  const chans = CHANNELS[pkg.id].split('|').map(c => ({ n: c.replace('*', ''), on: !c.endsWith('*') || gateOk })).filter(c => c.on);
  const row = (k, v) => `<div class="iap-row"><dt>${k}</dt><dd>${v}</dd></div>`;
  const partners = union('partners');
  return `<dl class="iap-inc">
    ${row('คอนเทนต์', union('content').map(c => `<span${dimIf(tier.content.includes(c))}>${c}</span>`).join('<i> · </i>'))}
    ${row('ช่องทีวี', `<span class="iap-chips">${(showAll ? chans : chans.slice(0, 5)).map(c => `<b>${c.n}</b>`).join('')}
      ${showAll ? '' : `<button data-all>ดูช่องทั้งหมด ${tier.channels} ช่อง ›</button>`}</span>`)}
    ${partners.length ? row('แอปพาร์ทเนอร์', `<span class="iap-chips">${partners.map(p => `<b class="iap-app${(tier.partners || []).includes(p) ? '' : ' dim'}"><img src="/img/packages/${PARTNER_ICON[p]}.png" alt="">${p}</b>`).join('')}</span>`) : ''}
    ${row('หน้าจอ', tier.screens)}
    ${row('อุปกรณ์', `<span class="iap-chips">${PLATFORMS.map(([k, l]) => `<b${tier.platform.includes(k) ? '' : ' class="dim"'}>${l}</b>`).join('')}</span>`)}
    ${row('คุณภาพ', 'HD')}
  </dl>`;
}
// the NOW paywall: the title you tapped and the package it's in, its tiers + MAX, annual billing, what's included
function iapSheet(w) {
  const pkg = PACKAGES[w.live ? 1 : 0], maxFull = PACKAGES[2].tiers[1];
  const chips = [...pkg.tiers, maxFull];
  let tier = pkg.tiers[0], annual = false, showAll = false;
  const sh = document.createElement('div');
  sh.className = 'iap';
  // the sheet is drawn once (it slides up once); a tier or billing change only updates what changed, so nothing
  // re-animates, reloads or jumps
  const chipPrice = t => `${baht(priceOf(t, annual).m)}<small>/เดือน</small>`;
  sh.innerHTML = `<div class="iap-card iap-pay">
    <button class="iap-x" aria-label="ปิด">✕</button>
    <div class="iap-body">
      <div class="iap-hero">${w.img ? `<img src="${esc(w.img)}" alt="">` : `<img src="/img/packages/${pkg.id}.jpg" alt="">`}
        <div><span>รวมอยู่ใน ${pkg.name}</span><h3>${esc(w.t || 'TrueVisions NOW')}</h3><small>${w.live ? 'ถ่ายทอดสด' : MOVIES}</small></div></div>
      <p class="iap-seg">เลือกแพ็กเกจของคุณ</p>
      <div class="iap-tiers">${chips.map(t => `<button data-tier="${t.id}">
        ${t === maxFull ? '<em class="max">พรีเมียม</em>' : t.popular ? '<em>ยอดนิยม</em>' : ''}
        <strong>${chipPrice(t)}</strong><b>${t.name}</b><small>${t.hl}</small></button>`).join('')}</div>
      <button class="iap-annual" data-annual role="switch"><i></i>ชำระรายปี · ประหยัด 25%</button>
      <p class="iap-seg">สิ่งที่รวมอยู่ในแพ็กเกจ</p>
      <div class="iap-incw"></div>
    </div>
    <div class="iap-foot">
      <div class="iap-sum"></div>
      <button class="iap-go" data-buy></button>
      <p class="iap-fine">ชำระผ่าน App Store · ต่ออายุอัตโนมัติจนกว่าจะยกเลิกในการตั้งค่า Apple ID · <a>กู้คืนการซื้อ</a></p>
    </div>
  </div>`;
  const $$ = q => sh.querySelector(q);
  const paint = () => {
    const p = priceOf(tier, annual);
    sh.querySelectorAll('[data-tier]').forEach(b => {
      const t = chips.find(x => x.id === b.dataset.tier);
      b.classList.toggle('on', t === tier);
      b.querySelector('strong').innerHTML = chipPrice(t);
    });
    $$('.iap-annual').setAttribute('aria-checked', annual);
    $$('.iap-annual i').classList.toggle('on', annual);
    $$('.iap-incw').innerHTML = included(tier, showAll);
    $$('.iap-sum').innerHTML = `<b>${planName(pkgOf(tier), tier)}</b><span><strong>${baht(p.m)}</strong>/เดือน${annual ? `<small>${baht(p.charge)} เรียกเก็บรายปี</small>` : ''}</span>`;
    $$('.iap-go').innerHTML = `<b>สมัคร ${baht(p.charge)}/${p.unit}</b>`;
  };
  paint();
  sh.addEventListener('click', e => {
    const t = e.target.closest('[data-tier]');
    if (e.target === sh || e.target.closest('.iap-x')) return sh.remove();
    if (t) { tier = chips.find(x => x.id === t.dataset.tier); return paint(); }
    if (e.target.closest('[data-annual]')) { annual = !annual; return paint(); }
    if (e.target.closest('[data-all]')) { showAll = true; return paint(); }
    if (e.target.closest('[data-buy]')) appStoreSheet(pkgOf(tier), tier, annual, () => { sh.remove(); SUB = { pkg: pkgOf(tier), tier, annual }; const dt = document.querySelector('.phone > .detail'); if (dt) dt.paint(true); iapDone(w); });
  });
  iapAdd(sh);
}
// the App Store's purchase sheet: double-click the side button (here: tap the hint or the sheet's confirm row), Face ID, done
function appStoreSheet(pkg, tier, annual, done) {
  const p = priceOf(tier, annual);
  const sh = document.createElement('div');
  sh.className = 'as-sheet';
  sh.innerHTML = `<div class="as-card">
      <div class="as-top"><b>App Store</b><button class="as-x" aria-label="ยกเลิก">✕</button></div>
      <div class="as-item"><img src="/img/tvs-logo.png" alt=""><div><b>TrueVisions NOW</b><span>${planName(pkg, tier)}</span><small>การสมัครสมาชิก</small></div></div>
      <dl class="as-rows">
        <div><dt>ราคา</dt><dd>${baht(p.charge)}.00 ต่อ${p.unit}</dd></div>
        <div><dt>บัญชี</dt><dd>user@icloud.com</dd></div>
      </dl>
      <p class="as-fine">ต่ออายุอัตโนมัติในราคา ${baht(p.charge)}.00/${p.unit} จนกว่าจะยกเลิก ยกเลิกได้อย่างน้อยหนึ่งวันก่อนวันต่ออายุในการตั้งค่า</p>
      <button class="as-confirm" data-pay><span class="as-side-ico"></span><b>ดับเบิลคลิกเพื่อชำระเงิน</b></button>
    </div>
    <button class="as-side" data-pay aria-label="ปุ่มด้านข้าง"><span>ดับเบิลคลิก<br>เพื่อชำระเงิน</span></button>`;
  let paying = false;
  sh.addEventListener('click', e => {
    if (e.target === sh || e.target.closest('.as-x')) return paying || sh.remove();
    if (!e.target.closest('[data-pay]') || paying) return;
    paying = true;
    const c = sh.querySelector('.as-confirm');
    sh.classList.add('paying');
    c.innerHTML = '<span class="as-face"></span><b>Face ID</b>';
    setTimeout(() => { sh.classList.add('paid'); c.innerHTML = `<span class="as-ok">${iapCheck}</span><b>เสร็จสิ้น</b>`; }, 1100);
    setTimeout(() => { sh.classList.add('out'); setTimeout(() => sh.remove(), 250); done(); }, 2000);
  });
  iapAdd(sh);
}
// bought: the package is on the account, and the play button plays what was tapped (a real tap, so the new tab opens)
function iapDone(w) {
  const href = w.el.getAttribute('href'), name = planName(SUB.pkg, SUB.tier), p = priceOf(SUB.tier, SUB.annual);
  const sh = document.createElement('div');
  sh.className = 'iap iap-done';
  sh.innerHTML = `<div class="iap-card">
    ${w.img ? `<img class="iap-done-pic" src="${esc(w.img)}" alt="">` : ''}
    <span class="iap-done-ok">${iapCheck}</span>
    <h3>สมัคร ${esc(name)} แล้ว</h3>
    <p>${baht(p.charge)}/${p.unit} · ดูได้ทันทีทุกอุปกรณ์ที่ลงชื่อเข้าใช้</p>
    ${href ? `<a class="iap-go" href="${esc(href)}" target="_blank" rel="noopener" data-play>` : '<button class="iap-go" data-play>'}<b>ดู ${esc(w.t || 'เลย')}</b>${href ? '</a>' : '</button>'}
    <button class="iap-later">ปิด</button>
  </div>`;
  sh.addEventListener('click', e => {
    if (e.target === sh || e.target.closest('.iap-later')) return sh.remove();
    if (!e.target.closest('[data-play]')) return;
    sh.remove();
    if (!href) w.el.click();
  });
  iapAdd(sh);
}

// the free user's play tap on a detail page goes to the purchase flow; now-app's demo switch flips the user
(() => {
  document.querySelector('.phone').addEventListener('click', gateFree, true);
  const buttons = document.querySelectorAll('.look button[data-u]');
  const paint = () => buttons.forEach(b => b.classList.toggle('on', (b.dataset.u === 'free') === isFree()));
  buttons.forEach(b => b.onclick = () => {
    try { localStorage.setItem(USER_KEY, b.dataset.u); } catch (e) {}
    const u = new URL(location.href);
    if (u.searchParams.has('user')) { u.searchParams.set('user', b.dataset.u); history.replaceState(null, '', u.pathname + u.search); }
    SUB = null;
    paint();
  });
  paint();
})();
