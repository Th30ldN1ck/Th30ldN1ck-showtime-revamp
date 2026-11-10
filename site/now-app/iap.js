// Free user: playing anything opens the in-app purchase flow, from the title's detail page (its เริ่มรับชมเลย).
// Shared by /now-app/ (its demo panel's ผู้ใช้ switch, ?user=member|free) and /now-appCP/ (the ดูในฐานะ switch's free
// persona, which sets isFree). Loads after app.js (uses esc), before cp.js.
// The flow is the NOW app's own design: a full-screen Package page (account, Entertainment / Sport, one card per
// package with its price button) -> the App Store's purchase sheet (double-click the side button) -> Apple's
// "You're all set." alert -> back on the title, which now plays. Prices, screens, partner apps and channel counts are
// the peacock clone's catalog (src/components/account/subscription/catalog.js), named the way the app sells them.
const PACKAGES = {
  ent: { name: 'Entertainment', about: 'Movies • Series • Variety • Anime', plans: [
    { id: 'ent-199', name: 'NOW ENT 199', price: 199, where: 'ALL DEVICES', rec: 1, screens: 1, apps: ['iqiyi'], channels: 24 },
    { id: 'ent-99', name: 'NOW ENT 99', price: 99, where: 'MOBILE ONLY', screens: 1, more: 'Movies, series, and more', channels: 24 },
    { id: 'ent-299', name: 'NOW ENT 299', price: 299, where: 'ALL DEVICES', screens: 2, apps: ['iqiyi', 'wetv', 'viu'], channels: 24 },
  ] },
  sport: { name: 'Sport', about: 'Thai League • UCL • F1 • MotoGP', plans: [
    { id: 'sport-499', name: 'NOW SPORT 499', price: 499, where: 'ALL DEVICES', rec: 1, screens: 1, more: 'Live football and world sport', channels: 18 },
    { id: 'sport-199', name: 'NOW SPORT 199', price: 199, where: 'MOBILE ONLY', screens: 1, more: 'Thai League and futsal', channels: 7 },
    { id: 'sport-699', name: 'NOW SPORT 699', price: 699, where: 'ALL DEVICES', screens: 2, more: 'Live football and world sport', channels: 18 },
  ] },
};
// the demo account on the Package page and in the App Store sheet
const ACCOUNT = { id: 'TO-103-560-888', mobile: '0966097705', apple: 'user@icloud.com' };
let SUB = null;   // the free user's package once bought
const USER_KEY = 'now-app-user';
let isFree = () => {
  const q = new URLSearchParams(location.search).get('user');
  let saved = null;
  try { if (q) localStorage.setItem(USER_KEY, q); saved = localStorage.getItem(USER_KEY); } catch (e) {}
  return (q || saved) === 'free';
};
const baht = n => `฿${n.toLocaleString('en-US')}`;
const iapAdd = el => document.querySelector('.phone').appendChild(el);
const iapIcon = {
  close: '<svg width="24" height="24" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 5l14 14M19 5 5 19"/></svg>',
  screen: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4.5" width="18" height="12" rx="1.5"/><path d="M9 20h6" stroke-linecap="round"/></svg>',
  ticket: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M3 9h18M7 5v4M11 5v4M15 5v4" stroke-linecap="round"/></svg>',
  remote: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="8" y="2.5" width="8" height="19" rx="2"/><circle cx="12" cy="7" r="1.3"/><path d="M10.5 11h3M10.5 14h3M10.5 17h3" stroke-linecap="round"/></svg>',
  side: '<svg width="52" height="52" viewBox="0 0 52 52" fill="none" stroke="#0a84ff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="26" cy="26" r="23"/><path d="M33 14v24M29 26H15M20 20l-6 6 6 6"/></svg>',
};
// what was tapped: its title and picture, and whether it's live or sport (-> the Sport tab)
function watchOf(el) {
  const hero = el.closest('.detail, .hf, .hc-card, .slide');   // the detail page, or the ใหม่ 2, ใหม่ and เดิม heroes
  const pic = hero ? hero.querySelector('.dt-art img, .hf-art.on img, .hc-art img, img') : el.querySelector('img');
  const name = hero ? hero.querySelector('.detail h1, .hf-slide.on .hc-logo, .hf-slide.on .hc-tt, .hc-logo, .hc-tt, h2') : pic;
  return { el, t: name ? (name.alt || name.textContent).trim() : '', img: pic ? pic.src : '',
    sport: /\/tvs-live\//.test(el.getAttribute('href') || '') || el.dataset.kind === 'sport' || !!el.closest('.btn-live, .live') };
}
// the purchase starts on the content detail page (app.js); on the home, a free user's play buttons open that page
// instead of playing (canPlayNow)
canPlayNow = () => !isFree() || !!SUB;
function gateFree(e) {
  if (canPlayNow()) return;
  const el = e.target.closest('.dt-play');
  if (!el) return;
  e.preventDefault(); e.stopPropagation();
  packagePage(watchOf(el));
}

// ---- the Package page ----
const planCard = (pkg, p) => `<article class="pk-card">
    <div class="pk-top"><span>${p.where}</span>${p.rec ? '<em>RECOMMENDED</em>' : ''}</div>
    <h3>${p.name}</h3>
    <p class="pk-about">${pkg.about}</p>
    <ul class="pk-feats">
      <li>${iapIcon.screen}Maximum screen ${p.screens} device${p.screens > 1 ? 's' : ''}</li>
      <li>${iapIcon.ticket}${p.apps ? `Watch Free on ${p.apps.map(a => `<img src="/img/packages/${a}.png" alt="${a}">`).join('')}` : p.more}</li>
      <li>${iapIcon.remote}${p.channels} Live TV channels</li>
    </ul>
    <button class="pk-buy" data-plan="${p.id}">${baht(p.price)}/month</button>
  </article>`;
function packagePage(w) {
  let tab = w.sport ? 'sport' : 'ent';
  const pg = document.createElement('section');
  pg.className = 'pk-page';
  pg.innerHTML = `<header class="pk-head"><h2>Package</h2><button class="pk-x" aria-label="ปิด">${iapIcon.close}</button></header>
    <div class="pk-scroll">
      <dl class="pk-acct"><div><dt>Account ID</dt><dd>${ACCOUNT.id}</dd></div><div><dt>Mobile number</dt><dd>${ACCOUNT.mobile}</dd></div></dl>
      <div class="pk-seg" role="tablist">${Object.entries(PACKAGES).map(([k, p]) => `<button data-tab="${k}">${p.name}</button>`).join('')}</div>
      <div class="pk-cards"></div>
    </div>`;
  const paint = () => {
    pg.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    pg.querySelector('.pk-cards').innerHTML = PACKAGES[tab].plans.map(p => planCard(PACKAGES[tab], p)).join('');
  };
  paint();
  const close = () => { pg.classList.add('out'); setTimeout(() => pg.remove(), 250); };
  pg.addEventListener('click', e => {
    const t = e.target.closest('[data-tab]'), b = e.target.closest('[data-plan]');
    if (e.target.closest('.pk-x')) return close();
    if (t && t.dataset.tab !== tab) { tab = t.dataset.tab; paint(); pg.querySelector('.pk-scroll').scrollTop = 0; }
    if (b) {
      const plan = PACKAGES[tab].plans.find(p => p.id === b.dataset.plan);
      appStoreSheet(plan, () => {
        SUB = plan;
        const dt = document.querySelector('.phone > .detail');
        if (dt) dt.paint(true);   // the title's button turns into ▶ รับชมตอนนี้
        close();
      });
    }
  });
  iapAdd(pg);
}

// ---- the App Store's purchase sheet: double-click the side button (here: tap the hint or the button glyph), then
// Apple's "You're all set." alert; OK takes you back to the title ----
function appStoreSheet(plan, done) {
  const start = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const sh = document.createElement('div');
  sh.className = 'as-sheet';
  sh.innerHTML = `<div class="as-card">
      <div class="as-top"><b>App Store</b><button class="as-x" aria-label="Cancel">${iapIcon.close}</button></div>
      <div class="as-box">
        <div class="as-item"><span class="as-icon"><img src="/img/now-mark.png" alt=""></span>
          <div><b>${plan.name}</b><span>TrueVisions NOW - Premium sport, movies... <i>13+</i></span><span>Subscription</span></div></div>
        <div class="as-price"><b>${baht(plan.price)}.00 per month</b><span>Starting on ${start}</span></div>
        <p class="as-fine">Cancel at any time in Settings &gt; Apple Account at least one day before each renewal date. Plan automatically renews until cancelled.</p>
        <p class="as-acct">Account: ${ACCOUNT.apple}</p>
      </div>
      <button class="as-confirm" data-pay>${iapIcon.side}<span>Confirm with Side Button</span></button>
    </div>
    <button class="as-side" data-pay aria-label="Side button"><span>Double Click<br>to Subscribe</span></button>`;
  let paying = false;
  sh.addEventListener('click', e => {
    if (e.target.closest('[data-ok]')) { sh.classList.add('out'); setTimeout(() => sh.remove(), 250); return done(); }
    if (e.target === sh || e.target.closest('.as-x')) return paying || sh.remove();
    if (!e.target.closest('[data-pay]') || paying) return;
    paying = true;
    sh.classList.add('paying');
    sh.querySelector('.as-confirm').innerHTML = '<span class="as-spin"></span><span>Processing…</span>';
    setTimeout(() => {
      sh.classList.add('paid');
      sh.insertAdjacentHTML('beforeend', `<div class="as-alert" role="alertdialog"><b>You’re all set.</b><p>Your purchase was successful.</p><button data-ok>OK</button></div>`);
    }, 1100);
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
