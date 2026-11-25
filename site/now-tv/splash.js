// Launch splash: plays the style splash-markup.js put up (?splash=, demo bar สแปลช; default pop) and its sound. The motion
// is all CSS (splash.css); here: tune's static, the sound, ?tap and demo-bar replays.
// pop: toy shapes, N and W drop and squash, the O rolls in from off-screen and winks, confetti, the logo hops. Sound:
//   bubble pops, springy boings, a roll and a pop, glitter, the chime's run at double speed into the hop.
// tune: an old set switching on, static with a channel display ticking to NOW, the letters jittering in colour fringes
//   and locking one by one, a flash. Sound: the set's thump and whine, static, channel beeps, a click per letter, chime.
// dive: ribbons in three depths, the letters painted in by light, a pull back and a dive through the play button, light
//   rays, a ring and sparks on the reveal. Sound: whooshes, a boom and low chord, a suck before the dive, a rush
//   through it, a boom, bright chord, chime and glitter on the reveal.
// prestige: the brand gradient blooming out of black, light rays and bokeh, the letters rising out of a blur, a lens
//   flare settling in the play button. Sound: a drone, the light's shimmer, a soft boom and the chime on the button.
// flip: a wall of cards deals in on a tilt and flips corner to corner to real posters (the last launch's, saved here once
//   the feed is in, or the feed's on a first launch: the wall waits for them, `ready`), flips back from the centre to
//   slices of the brand gradient that close into one, and the logo pops in. Sound (sparse, no chime): a whoosh, card
//   flicks per wave, a shimmer, a soft thump as the gaps close, one warm chord and small pops for the logo.
// classic = Figma Splash Screen 13 → 14 (silent).
// The chime is the sonic logo every style but flip shares, a tiny piphat phrase in Thai seven-tone equal tuning (`th`, each step
// 1/7 octave, so its thirds and sixths sit between Western ones): the ranat ek (Thai xylophone) runs sol la do re do la
// sol la and lands on do in octaves, rolled (kro); the khong wong yai (gong circle) marks it underneath and the ching
// (small cymbals) rings on the landing. Pads under it are open do-sol drones in the same tuning. All sound is
// synthesised with Web Audio (no files). Browsers only allow it after a key press or click, so a launch is silent
// unless ?tap (a กด OK เพื่อเริ่ม screen first); clicking a style in the demo bar replays it with sound. ?sound=off mutes.
const SPLASHES = {
  pop: { f: .85, sound: popSound },
  tune: { f: .95, sound: tuneSound },
  dive: { f: .58, sound: diveSound },
  prestige: { f: .72, sound: prestigeSound },
  flip: { f: .57, sound: flipSound, ready: flipReady },
  classic: { f: 1 },
};
// every style lasts SPLASH_MS: each was designed longer, and plays sped up by its `f` (its CSS animations through
// playbackRate, its sound through spClock), so splash.css and the sound functions keep their design-time seconds
const SPLASH_MS = 2500;
const SP_Q = new URLSearchParams(location.search);
let SPLASH = SPLASHES[SP_Q.get('splash')] ? SP_Q.get('splash') : 'pop';
let SOUND = SP_Q.get('sound') !== 'off';
let SP_AC = null;   // declared before SPLASH_GO runs, which may already reach audio()
const SP_REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
// starts a splash element already on screen (once its style is `ready`, if it waits for anything): the noise and the
// sound; returns its length in ms, or a promise of it
function playSplash(el) {
  const s = SPLASHES[SPLASH];
  const start = () => {
    el.classList.remove('hold');
    if (s.f !== 1) el.getAnimations({ subtree: true }).forEach(a => { a.playbackRate = 1 / s.f; });
    if (SPLASH === 'tune' && !SP_REDUCED) noise(el.querySelector('.sp-noise'), 1250 * s.f);
    if (s.sound && SOUND) audio(ac => s.sound(ac, spClock(ac, performance.now(), s.f)));
    return SPLASH_MS;
  };
  if (!s.ready) return start();
  el.classList.add('hold');
  return s.ready(el).then(start);
}

// flip's posters: what's trending first, then the rest of the home's series and movies; saved for the next launch
const flipPosters = () => [...new Set([...TRENDING, ...FEED_ITEMS].map(x => x.poster).filter(Boolean))].slice(0, 36);
STARTED.then(() => { try { if (flipPosters().length) localStorage.setItem(SPLASH_POSTERS_KEY, JSON.stringify(flipPosters())); } catch { /* private mode */ } });
// the wall waits until its posters are in: the saved ones, or (first launch) the feed's; at most FLIP_WAIT_MS, then it
// plays with dark brand cards where posters are missing
const FLIP_WAIT_MS = 2500;
function flipReady(el) {
  const fill = () => {
    const list = flipPosters();
    if (list.length) el.querySelectorAll('.cf-b').forEach((b, i) => { if (!b.firstChild) b.innerHTML = `<img src="${esc(list[i % list.length])}" alt="">`; });
  };
  const loaded = () => Promise.all([...el.querySelectorAll('.cf-b img')].map(img => img.decode().catch(() => {})));
  const posters = el.querySelector('.cf-b img') ? loaded() : STARTED.then(() => { fill(); return loaded(); });
  return Promise.race([posters, new Promise(r => setTimeout(r, FLIP_WAIT_MS))]);
}

// TV static on a small canvas scaled up, with a slow rolling band, until the lock
function noise(cv, ms) {
  const g = cv.getContext('2d'), img = g.createImageData(cv.width, cv.height), d = img.data, t0 = performance.now();
  (function frame(now) {
    if (!cv.isConnected || now - t0 > ms) return;
    const roll = (now - t0) / 6;
    for (let y = 0, p = 0; y < cv.height; y++) {
      const band = 0.6 + 0.4 * Math.sin((y + roll) / 9);
      for (let x = 0; x < cv.width; x++, p += 4) { const v = Math.random() * 255 * band; d[p] = d[p + 1] = d[p + 2] = v; d[p + 3] = 255; }
    }
    g.putImageData(img, 0, 0);
    requestAnimationFrame(frame);
  })(t0);
}

// the audio context, once it may play (a still-suspended one would hold the sound back and play it late)
function audio(fn) {
  try { SP_AC = SP_AC || new (window.AudioContext || window.webkitAudioContext)(); } catch { return; }
  if (SP_AC.state === 'running') return fn(SP_AC);
  SP_AC.resume().then(() => fn(SP_AC), () => {});
}

// splash seconds → audio time. The context may come up late (lead): raw() keeps the true time so notes already due are
// skipped, at() clamps for sweeps that may start late
function spClock(ac, t0, f = 1) {
  const lead = (performance.now() - t0) / 1000;
  const raw = sec => ac.currentTime + sec * f - lead;
  return { lead, f, raw, at: sec => Math.max(ac.currentTime, raw(sec)) };
}

// the output: a gain into a limiter, with a send to a generated reverb (wet = how much)
function mix(ac, wet, secs = 2.6) {
  const bus = ac.createGain(), comp = ac.createDynamicsCompressor();
  bus.gain.value = 0.5; bus.connect(comp).connect(ac.destination);
  if (wet) {
    const cv = ac.createConvolver(), n = Math.round(ac.sampleRate * secs), ir = ac.createBuffer(2, n, ac.sampleRate), g = ac.createGain();
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3); }
    cv.buffer = ir; g.gain.value = wet; bus.connect(cv).connect(g).connect(comp);
  }
  return bus;
}

const noiseBuf = (ac, secs) => {
  const b = ac.createBuffer(1, Math.round(ac.sampleRate * secs), ac.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
};

// one struck wooden bar: a fundamental and two inharmonic overtones that die faster, plus the mallet's click
function bar(ac, out, f, t, v) {
  if (t < ac.currentTime) return;
  [[1, 1, 0.45], [3.93, 0.32, 0.12], [9.2, 0.1, 0.05]].forEach(([r, a, decay]) => {
    const o = ac.createOscillator(), g = ac.createGain();
    o.frequency.value = f * r;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v * a * 0.3, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    o.connect(g).connect(out); o.start(t); o.stop(t + decay + 0.05);
  });
  const n = ac.createBufferSource(), nb = ac.createBuffer(1, ac.sampleRate * 0.02, ac.sampleRate), d = nb.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const hp = ac.createBiquadFilter(), ng = ac.createGain();
  hp.type = 'highpass'; hp.frequency.value = 2500; ng.gain.value = v * 0.12;
  n.buffer = nb; n.connect(hp).connect(ng).connect(out); n.start(t);
}

// Thai seven-tone equal tuning: degree d above do (C4 = 0; 7 = do an octave up)
const th = d => 261.63 * Math.pow(2, d / 7);
const RUN = [11, 12, 14, 15, 14, 12, 11, 12];   // sol la do re do la sol la (ranat ek, from sol5)
// the sonic logo; `land` in splash seconds, the run starts RUN.length steps (of `step` s) before it
function chime(ac, out, c, land, v = 1, step = 0.085) {
  RUN.forEach((d, i) => bar(ac, out, th(d), c.raw(land - (RUN.length - i) * step), (0.42 + 0.03 * i) * v));
  for (let k = 0; k < 7; k++) {   // do6 with do5 under it, rolled and dying away
    const t = c.raw(land + k * 0.07), a = 0.9 * Math.pow(0.72, k) * v;
    bar(ac, out, th(14), t, a); bar(ac, out, th(7), t, a * 0.6);
  }
  gong(ac, out, th(4), c.raw(land - RUN.length * step), 0.45 * v);   // khong: sol4 under the run's start,
  gong(ac, out, th(7), c.raw(land - 4 * step), 0.4 * v);             // do5 halfway,
  gong(ac, out, th(0), c.raw(land), 0.6 * v); gong(ac, out, th(7), c.raw(land), 0.4 * v);   // do4 + do5 on the landing
  ching(ac, out, c.raw(land), 0.5 * v);
}

// a bossed gong of the khong wong: a soft-attacked, mostly harmonic tone that rings for a while
function gong(ac, out, f, t, v) {
  if (t < ac.currentTime) return;
  [[1, 1, 1.8], [2.01, 0.28, 0.9], [2.98, 0.1, 0.5], [4.2, 0.05, 0.3]].forEach(([r, a, decay]) => {
    const o = ac.createOscillator(), g = ac.createGain();
    o.frequency.value = f * r;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v * a * 0.3, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    o.connect(g).connect(out); o.start(t); o.stop(t + decay + 0.05);
  });
}

// the ching: two small thick cymbals struck open, a cluster of high inharmonic partials ringing on, plus the strike
function ching(ac, out, t, v) {
  if (t < ac.currentTime) return;
  [[2960, 1, 1.6], [3410, 0.7, 1.3], [4385, 0.6, 1.1], [5240, 0.45, 0.9], [6810, 0.3, 0.7], [8130, 0.2, 0.5]].forEach(([f, a, decay]) => {
    const o = ac.createOscillator(), g = ac.createGain();
    o.frequency.value = f;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v * a * 0.05, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    o.connect(g).connect(out); o.start(t); o.stop(t + decay + 0.05);
  });
  const n = ac.createBufferSource(), bp = ac.createBiquadFilter(), ng = ac.createGain();
  n.buffer = noiseBuf(ac, 0.08); bp.type = 'bandpass'; bp.frequency.value = 6000; bp.Q.value = 1.2;
  ng.gain.setValueAtTime(v * 0.35, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
  n.connect(bp).connect(ng).connect(out); n.start(t);
}

// a low hit: a sine dropping in pitch with a dull thud of filtered noise
function boom(ac, out, t, v = 1) {
  if (t < ac.currentTime) return;
  const o = ac.createOscillator(), g = ac.createGain();
  o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(36, t + 0.6);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.9 * v, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
  o.connect(g).connect(out); o.start(t); o.stop(t + 1.9);
  const n = ac.createBufferSource(), lp = ac.createBiquadFilter(), ng = ac.createGain();
  n.buffer = noiseBuf(ac, 0.5); lp.type = 'lowpass'; lp.frequency.value = 260;
  ng.gain.setValueAtTime(0.6 * v, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
  n.connect(lp).connect(ng).connect(out); n.start(t);
}

// a chord of detuned saws through a lowpass that opens as it swells (rise s), held, then released (fall s)
function swell(ac, out, t, rise, hold, fall, freqs, v = 1) {
  const lp = ac.createBiquadFilter(), g = ac.createGain();
  lp.type = 'lowpass'; lp.Q.value = 0.7;
  lp.frequency.setValueAtTime(220, t); lp.frequency.exponentialRampToValueAtTime(2600, t + rise);
  lp.frequency.exponentialRampToValueAtTime(600, t + rise + hold + fall);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16 * v, t + rise);
  g.gain.setValueAtTime(0.16 * v, t + rise + hold); g.gain.exponentialRampToValueAtTime(0.0001, t + rise + hold + fall);
  lp.connect(g).connect(out);
  freqs.forEach(f => [-7, 7].forEach(cents => {
    const o = ac.createOscillator();
    o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = cents;
    o.connect(lp); o.start(t); o.stop(t + rise + hold + fall + 0.1);
  }));
}

// air rushing past: noise through a band-pass sweeping from lo to hi Hz, swelling in and cut at the end
function whoosh(ac, out, t, dur, lo, hi, v = 1) {
  const n = ac.createBufferSource(), bp = ac.createBiquadFilter(), g = ac.createGain();
  n.buffer = noiseBuf(ac, dur + 0.1); bp.type = 'bandpass'; bp.Q.value = 0.9;
  bp.frequency.setValueAtTime(lo, t); bp.frequency.exponentialRampToValueAtTime(hi, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5 * v, t + dur * 0.85); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(bp).connect(g).connect(out); n.start(t); n.stop(t + dur + 0.05);
}

// a short beep (the channel display) and a click (a letter locking)
function beep(ac, out, f, t, v, len = 0.05) {
  if (t < ac.currentTime) return;
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = 'square'; o.frequency.value = f;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.06 * v, t + 0.004); g.gain.setValueAtTime(0.06 * v, t + len); g.gain.linearRampToValueAtTime(0, t + len + 0.01);
  o.connect(g).connect(out); o.start(t); o.stop(t + len + 0.02);
}
function click(ac, out, t, v) {
  if (t < ac.currentTime) return;
  const n = ac.createBufferSource(), hp = ac.createBiquadFilter(), g = ac.createGain();
  n.buffer = noiseBuf(ac, 0.03); hp.type = 'highpass'; hp.frequency.value = 2500;
  g.gain.setValueAtTime(0.7 * v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.025);
  n.connect(hp).connect(g).connect(out); n.start(t);
  beep(ac, out, 880, t, v * 1.5, 0.02);
}

// the set switching on (a thump and a short rising whine) → static sweeping up and crackling (0.3–1.25 s) with the channel
// display's beeps → a click per letter locking (1, 1.15, 1.3 s) → the chime on the flash (1.45 s)
function tuneSound(ac, c) {
  if (c.lead > 0.9 * c.f) return;   // too late for the run: stay silent rather than chime after the logo has landed
  const out = mix(ac, 0.12, 1.2);
  boom(ac, out, c.raw(0.02), 0.35);
  const w = ac.createOscillator(), wg = ac.createGain(), w0 = c.at(0.02);
  w.frequency.setValueAtTime(2500, w0); w.frequency.exponentialRampToValueAtTime(7000, w0 + 0.25);
  wg.gain.setValueAtTime(0.03, w0); wg.gain.exponentialRampToValueAtTime(0.0001, w0 + 0.4);
  w.connect(wg).connect(out); w.start(w0); w.stop(w0 + 0.45);
  const src = ac.createBufferSource(), bp = ac.createBiquadFilter(), ng = ac.createGain();
  src.buffer = noiseBuf(ac, 1.1); bp.type = 'bandpass'; bp.Q.value = 1.4;
  bp.frequency.setValueAtTime(700, c.at(0.3)); bp.frequency.exponentialRampToValueAtTime(3800, c.at(1.2));
  const crackle = Float32Array.from({ length: 40 }, (_, i) => (0.35 + Math.random() * 0.65) * 0.22 * Math.min(1, i / 4) * (1 - i / 40));
  ng.gain.setValueCurveAtTime(crackle, c.at(0.3), 0.95 * c.f);
  src.connect(bp).connect(ng).connect(out);
  src.start(c.at(0.3)); src.stop(c.at(1.3));
  [0.35, 0.55, 0.75].forEach(t => beep(ac, out, 1320, c.raw(t), 1));
  beep(ac, out, 1760, c.raw(0.95), 1); beep(ac, out, 1760, c.raw(1.03), 1);
  [1, 1.15, 1.3].forEach(t => click(ac, out, c.raw(t), 1));
  chime(ac, out, c, 1.45, 1, 0.065);
}

// ribbons whoosh in → a boom and low chord as the first letter is painted (0.95 s), a swish per letter → a suck as the
// mark pulls back (1.72 s) → a rush through the play button → on the reveal (2.95 s) a boom, a bright chord, the chime
// and glitter
function diveSound(ac, c) {
  if (c.lead > 2.2 * c.f) return;
  const out = mix(ac, 0.3);
  if (c.lead < 0.2 * c.f) whoosh(ac, out, c.raw(0.15), 0.9 * c.f, 300, 3000, 0.6);
  boom(ac, out, c.raw(0.95));
  if (c.lead < 1.1 * c.f) swell(ac, out, c.at(0.95), 0.9 * c.f, 0.3 * c.f, 0.8, [th(-14), th(-7), th(-3), th(0)], 0.9);
  [0.95, 1.08, 1.21].forEach(t => whoosh(ac, out, c.raw(t), 0.25 * c.f, 3000, 9000, 0.22));
  whoosh(ac, out, c.raw(1.7), 0.27 * c.f, 300, 2200, 0.4);   // the suck before the dive
  if (c.lead < 2.0 * c.f) whoosh(ac, out, c.raw(2.0), 0.95 * c.f, 250, 7000, 0.55);
  boom(ac, out, c.raw(2.95), 0.8);
  swell(ac, out, c.at(2.95), 0.05 * c.f, 0.4 * c.f, 1.0, [th(0), th(4), th(7), th(11)], 0.8);
  chime(ac, out, c, 2.95);
  [18, 21, 19, 22, 20, 23].forEach((d, i) => bar(ac, out, th(d), c.raw(3.0 + i * 0.05), 0.2));
}

// a drone opening slowly → the ranat run under the glint → a soft boom, the landing and the ching as the light reaches
// the play button (2.15 s) → long tail
function prestigeSound(ac, c) {
  if (c.lead > 1.3 * c.f) return;
  const out = mix(ac, 0.45, 3.2);
  swell(ac, out, c.at(0.2), 1.7 * c.f, 0.5 * c.f, 1.8, [th(-14), th(-7), th(-3), th(0), th(4)], 0.75);
  whoosh(ac, out, c.raw(1.45), 0.7 * c.f, 2500, 8000, 0.18);   // the light coming in
  boom(ac, out, c.raw(2.15), 0.5);
  chime(ac, out, c, 2.15, 0.85);
}

// a bubble: a sine gliding up fast and gone
function bloop(ac, out, f, t, v) {
  if (t < ac.currentTime) return;
  const o = ac.createOscillator(), g = ac.createGain();
  o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 2.2, t + 0.07);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.3 * v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
  o.connect(g).connect(out); o.start(t); o.stop(t + 0.15);
}

// a spring: a tone that drops onto its pitch and wobbles, the wobble dying away
function boing(ac, out, f, t, v) {
  if (t < ac.currentTime) return;
  const o = ac.createOscillator(), lfo = ac.createOscillator(), depth = ac.createGain(), g = ac.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(f * 1.7, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.06);
  lfo.frequency.value = 19; depth.gain.setValueAtTime(f * 0.28, t); depth.gain.exponentialRampToValueAtTime(0.5, t + 0.4);
  lfo.connect(depth).connect(o.frequency);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.32 * v, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
  o.connect(g).connect(out); o.start(t); lfo.start(t); o.stop(t + 0.5); lfo.stop(t + 0.5);
}

// a cork pop: a short bright noise burst over a tiny thump
function pop(ac, out, t, v) {
  if (t < ac.currentTime) return;
  const n = ac.createBufferSource(), bp = ac.createBiquadFilter(), ng = ac.createGain();
  n.buffer = noiseBuf(ac, 0.05); bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 1.1;
  ng.gain.setValueAtTime(0.9 * v, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
  n.connect(bp).connect(ng).connect(out); n.start(t);
  const o = ac.createOscillator(), g = ac.createGain();
  o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(70, t + 0.08);
  g.gain.setValueAtTime(0.5 * v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
  o.connect(g).connect(out); o.start(t); o.stop(t + 0.12);
}

// shapes bubble up → N, W land (boing) → the O rolls (a little rising whistle) and stops with a pop and
// glitter (1.25 s) → the run at double speed into the hop's landing (2.2 s), ching and all
function popSound(ac, c) {
  if (c.lead > 1.2 * c.f) return;
  const out = mix(ac, 0.2, 1.4);
  [[0, 9], [0.04, 11], [0.08, 12], [0.12, 14], [0.16, 16], [0.2, 15], [0.24, 18], [0.28, 19]].forEach(([t, d]) => bloop(ac, out, th(d), c.raw(t + 0.1), 0.6));
  boing(ac, out, th(-3), c.raw(0.54), 1);       // N lands
  boing(ac, out, th(0), c.raw(0.74), 1);        // W lands
  const o = ac.createOscillator(), g = ac.createGain(), t0 = c.at(0.5);   // the O rolling in
  o.type = 'sine'; o.frequency.setValueAtTime(th(7), t0); o.frequency.exponentialRampToValueAtTime(th(17), t0 + 0.65 * c.f);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.08, t0 + 0.3 * c.f); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.65 * c.f);
  o.connect(g).connect(out); o.start(t0); o.stop(t0 + 0.7 * c.f);
  pop(ac, out, c.raw(1.25), 1);                 // the wink and the confetti
  [18, 21, 19, 22, 20, 23].forEach((d, i) => bar(ac, out, th(d), c.raw(1.3 + i * 0.05), 0.22));   // glitter
  chime(ac, out, c, 2.2, 0.9, 0.055);
}

// a card flicked over: a short papery burst
function flick(ac, out, t, v) {
  if (t < ac.currentTime) return;
  const n = ac.createBufferSource(), bp = ac.createBiquadFilter(), g = ac.createGain();
  n.buffer = noiseBuf(ac, 0.04); bp.type = 'bandpass'; bp.frequency.value = 2200 + Math.random() * 1400; bp.Q.value = 1.6;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.4 * v, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);
  n.connect(bp).connect(g).connect(out); n.start(t);
}

// kept sparse, and the one style without the chime: cards dealt (a soft whoosh) → a light flick per diagonal of the
// first wave (0.5 s on) → a faint shimmer with the sheen (1.25 s) → a crisper flick per ring of the second wave (2.2 s
// on) → a soft thump as the gaps close (2.9 s) → one warm chord as the logo lands (3 s), with small pops
function flipSound(ac, c) {
  if (c.lead > 0.4 * c.f) return;
  const out = mix(ac, 0.22, 1.8);
  whoosh(ac, out, c.raw(0), 0.5 * c.f, 400, 2400, 0.25);
  for (let k = 0; k < 12; k++) flick(ac, out, c.raw(0.5 + k * 0.06), 0.35 + k * 0.02);
  whoosh(ac, out, c.raw(1.25), 0.9 * c.f, 5000, 9000, 0.08);
  for (let k = 0; k < 7; k++) flick(ac, out, c.raw(2.2 + k * 0.05), 0.7);
  boom(ac, out, c.raw(2.9), 0.35);
  swell(ac, out, c.at(3), 0.04 * c.f, 0.35 * c.f, 1.4, [th(-7), th(0), th(4), th(7)], 0.7);
  [3, 3.06, 3.12].forEach(t => pop(ac, out, c.raw(t), 0.25));
}

// demo bar: pick a style (replays it, with sound since it's a click) and mute / unmute
function setSplash(k) {
  SPLASH = k;
  const u = new URL(location.href); u.searchParams.set('splash', k); history.replaceState(null, '', u);
  markSplash();
  const el = document.createElement('div');
  el.className = `splash sp-${k} replay`;
  el.innerHTML = splashMarkup(k);
  $('#stage').appendChild(el);
  Promise.resolve(playSplash(el)).then(ms => setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, ms));
}
function toggleSound() {
  SOUND = !SOUND;
  const u = new URL(location.href); SOUND ? u.searchParams.delete('sound') : u.searchParams.set('sound', 'off'); history.replaceState(null, '', u);
  markSplash();
  if (SOUND) audio(() => {});   // the click unlocks audio for the next replay
}
function markSplash() {
  document.querySelectorAll('[data-splash]').forEach(b => b.classList.toggle('on', b.dataset.splash === SPLASH));
  const b = $('[data-sound]'); if (b) { b.classList.toggle('on', SOUND); b.textContent = SOUND ? 'เสียงเปิด' : 'เสียงปิด'; }
}
markSplash();

// resolves when the splash starts playing: at once, or with ?tap on the first OK / click. Last in the file: it starts
// the splash straight away, so everything above must already exist
const SPLASH_GO = new Promise(go => {
  const el = $('#splash');
  if (!SP_Q.has('tap')) return go(playSplash(el));
  el.classList.add('wait');
  el.insertAdjacentHTML('beforeend', '<p class="sp-tap">กด OK เพื่อเริ่ม</p>');
  const start = e => {
    if (e.type === 'keydown' && !/^(Enter|NumpadEnter| )$/.test(e.key) && e.keyCode !== 13) return;
    if (e.target.closest && e.target.closest('.demo')) return;
    removeEventListener('keydown', start, true); removeEventListener('click', start, true);
    e.stopPropagation(); e.preventDefault();
    el.classList.remove('wait'); el.querySelector('.sp-tap').remove();
    go(playSplash(el));
  };
  addEventListener('keydown', start, true); addEventListener('click', start, true);
});

