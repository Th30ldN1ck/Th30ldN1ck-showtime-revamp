const pptxgen = require('pptxgenjs');
const { applyTheme } = require('/Users/admin/.claude/skills/synced/fe8f028d-f329-407b-9e14-5865f9cc2301_596ea4d8-2382-45cc-a4c2-5abfa15725a5/pptx/scripts/apply_theme.js');

const THEME = {
  name: 'Showtime',
  headFontFace: 'Prompt',
  bodyFontFace: 'Prompt',
  colors: {
    dk1: '141414', lt1: 'FFFFFF', dk2: '5A5A5A', lt2: 'FAFAFA',
    accent1: 'FB008D', accent2: '9B3FB5', accent3: 'FFF0F7', accent4: 'F5EEFB',
    accent5: 'E2E2E2', accent6: 'C2187A', hlink: 'C2187A', folHlink: '9B3FB5',
  },
};
const HEX = { ink: '141414', muted: '5A5A5A', line: 'E2E2E2', magenta: 'FB008D', purple: '9B3FB5', tint: 'FFF0F7', lav: 'F5EEFB', dark: '141414' };
const SRC = 'Source: Showtime CMS export, 1 Jan – 27 Oct 2026 (3,787 articles; 3,470 after dropping TV listings and legal pages).';

const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9';
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = 'Showtime revamp: what changes for operations';
const C = pres.SchemeColor;

pres.defineSlideMaster({
  title: 'TITLE_DARK', background: { color: HEX.dark },
  objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: 0.6, y: 1.55, w: 8.8, h: 1.6, fontSize: 40, bold: true, color: C.background1, valign: 'bottom' }, text: '' } },
    { placeholder: { options: { name: 'body', type: 'body', x: 0.6, y: 3.3, w: 8.8, h: 1.0, fontSize: 18, color: 'D8D8D8', valign: 'top' }, text: '' } },
  ],
});
pres.defineSlideMaster({
  title: 'SECTION_DARK', background: { color: HEX.dark },
  objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: 0.6, y: 2.0, w: 8.8, h: 1.2, fontSize: 36, bold: true, color: C.background1, valign: 'middle' }, text: '' } },
    { placeholder: { options: { name: 'body', type: 'body', x: 0.6, y: 3.2, w: 8.8, h: 0.8, fontSize: 16, color: 'D8D8D8', valign: 'top' }, text: '' } },
  ],
});
pres.defineSlideMaster({
  title: 'CONTENT', background: { color: 'FAFAFA' },
  objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: 0.5, y: 0.3, w: 9.0, h: 1.05, fontSize: 26, bold: true, color: C.text1, valign: 'top' }, text: '' } },
  ],
  slideNumber: { x: 9.2, y: 5.25, w: 0.4, h: 0.25, fontSize: 9, color: '8A8A8A' },
});

const content = (title, section) => {
  const s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: section });
  s.addText(title, { placeholder: 'title' });
  return s;
};
const source = (s, text = SRC) => s.addText(text, { isTextBox: true, x: 0.5, y: 5.17, w: 8.5, h: 0.3, fontSize: 9, color: '8A8A8A', margin: 0, objectName: 'source' });
const numDot = (s, n, x, y, d = 0.5, fill = HEX.magenta) => {
  s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { type: 'none' }, objectName: `dot_${n}_${x}` });
  s.addText(String(n), { isTextBox: true, x, y, w: d, h: d, fontSize: 16, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', margin: 0 });
};
const card = (s, x, y, w, h, fill = HEX.tint, name = 'card') =>
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.12, fill: { color: fill }, line: { type: 'none' }, objectName: name });
const rowBorder = [{ type: 'none' }, { type: 'none' }, { pt: 1, color: HEX.line }, { type: 'none' }];
const table = (s, rows, opts) => s.addTable(rows.map((r, i) => r.map((t, j) => ({
  text: t, options: { bold: i === 0 || j === 0, color: i === 0 ? HEX.muted : HEX.ink, border: rowBorder, fontSize: i === 0 ? 12 : 13, valign: 'middle' },
}))), { margin: [4, 8, 4, 0], ...opts });

// 1 Title
pres.addSection({ title: 'Opening' });
let s = pres.addSlide({ masterName: 'TITLE_DARK', sectionTitle: 'Opening' });
s.addText('Showtime revamp: what changes for operations', { placeholder: 'title' });
s.addText('New article, home and section pages, built on the CMS as it is today', { placeholder: 'body' });
s.addText('October 2026 · For editorial, operations and management', { isTextBox: true, x: 0.6, y: 4.75, w: 8.8, h: 0.4, fontSize: 14, color: 'A8A8A8', margin: 0 });

// 2 Executive summary
s = content('Executive summary', 'Opening');
const summary = [
  ['The redesign only changes the website template', 'All 3,470 migrated articles appear in the new design with no editing.'],
  ['The CMS stays as it is', 'Every page, hub and top story uses fields editors already fill in.'],
  ['Show and sports hubs need no new tools', 'Editors create a subcategory, the same way True AF2026 was set up.'],
  ['Four decisions unblock launch', 'Permissions, hub settings owner, one-time tagging, and use of the recommended flag.'],
];
summary.forEach(([h, b], i) => {
  const y = 1.45 + i * 0.9;
  numDot(s, i + 1, 0.5, y + 0.05);
  s.addText([{ text: h, options: { bold: true, fontSize: 17, color: HEX.ink, breakLine: true } }, { text: b, options: { fontSize: 14, color: HEX.muted } }],
    { isTextBox: true, x: 1.2, y, w: 8.3, h: 0.8, margin: 0, valign: 'top', paraSpaceAfter: 2 });
});

// 3 Fields
pres.addSection({ title: 'What changes' });
s = content('Every part of the new pages comes from a field the CMS already stores', 'What changes');
table(s, [
  ['On the new site', 'CMS field used', 'Filled in today'],
  ['Headline, lead sentence, body', 'title, short_description, content', 'Every article'],
  ['Cover image and thumbnails', 'image_cover', 'Every article with a cover'],
  ['Section, subsection, hub', 'category, subcategory', 'Every article'],
  ['Date and "newest first" order', 'published_at', 'Every article'],
  ['Home page top stories', 'recommended (yes/no)', '22 articles flagged'],
  ['Hub description and image', 'subcategory meta description, background image', '75% of articles\' subcategories'],
], { x: 0.5, y: 1.5, w: 9.0, colW: [3.0, 3.6, 2.4], rowH: 0.42 });
source(s);

// 4 Migration cleanup
s = content('Old articles migrate unchanged; the template fixes legacy formatting when it shows them', 'What changes');
const stats = [
  ['76%', 'of articles contain empty spacer paragraphs', 'Hidden on display, so gaps between paragraphs stay even'],
  ['10%', 'have a summary that repeats the first paragraph', 'The lead sentence is skipped on those, so nothing reads twice'],
  ['<1%', 'carry inline styling from the old editor', 'The new design overrides it; 15 articles in total'],
];
stats.forEach(([n, l, b], i) => {
  const x = 0.5 + i * 3.08;
  card(s, x, 1.55, 2.84, 3.3, i === 0 ? HEX.tint : 'FFFFFF', `stat_${i}`);
  s.addText(n, { isTextBox: true, x: x + 0.2, y: 1.75, w: 2.44, h: 0.95, fontSize: 48, bold: true, color: HEX.magenta, margin: 0 });
  s.addText(l, { isTextBox: true, x: x + 0.2, y: 2.75, w: 2.44, h: 0.8, fontSize: 15, bold: true, color: HEX.ink, margin: 0, valign: 'top' });
  s.addText(b, { isTextBox: true, x: x + 0.2, y: 3.6, w: 2.44, h: 1.1, fontSize: 13, color: HEX.muted, margin: 0, valign: 'top' });
});
source(s, 'Source: Showtime CMS export, 3,470 articles. Nothing in the stored articles is changed; fixes apply only when a page is shown.');

// 5 Section divider
pres.addSection({ title: 'Hubs' });
s = pres.addSlide({ masterName: 'SECTION_DARK', sectionTitle: 'Hubs' });
s.addText('Show and sports hubs', { placeholder: 'title' });
s.addText('One page per show or competition, filled and rotated automatically', { placeholder: 'body' });

// 6 Hub flow
s = content('A hub is a CMS subcategory plus a few settings; the site builds the rest', 'Hubs');
const steps = [
  ['Create a subcategory', 'For example "The Voice Thailand 2027" under Entertainment'],
  ['Add name, description and image', 'Using the subcategory fields the CMS already has'],
  ['Tag articles to it', 'When publishing, as editors did for True AF2026'],
  ['The site builds the hub', 'Page, Shows tab, home tile and watch button, with no code change'],
];
steps.forEach(([h, b], i) => {
  const x = 0.5 + i * 2.3;
  card(s, x, 1.6, 2.1, 2.75, i === 3 ? HEX.lav : HEX.tint, `step_${i}`);
  numDot(s, i + 1, x + 0.2, 1.8, 0.5, i === 3 ? HEX.purple : HEX.magenta);
  s.addText(h, { isTextBox: true, x: x + 0.2, y: 2.45, w: 1.75, h: 0.75, fontSize: 15, bold: true, color: HEX.ink, margin: 0, valign: 'top' });
  s.addText(b, { isTextBox: true, x: x + 0.2, y: 3.2, w: 1.75, h: 1.05, fontSize: 12, color: HEX.muted, margin: 0, valign: 'top' });
  if (i < 3) s.addText('→', { isTextBox: true, x: x + 2.1, y: 2.75, w: 0.2, h: 0.4, fontSize: 16, color: HEX.muted, align: 'center', margin: 0 });
});
s.addText([{ text: 'Editors do steps 1 to 3. ', options: { bold: true } }, { text: 'Step 4 is automatic.' }],
  { isTextBox: true, x: 0.5, y: 4.6, w: 9, h: 0.4, fontSize: 14, color: HEX.ink, margin: 0 });

// 7 Rotation
s = content('Hubs rotate on their own, based on the date of their newest article', 'Hubs');
const stages = [
  ['On air', 'ออกอากาศอยู่', 'New article in the last 14 days', 'Home page Shows row, listed first', HEX.magenta],
  ['Season ended', 'จบซีซันแล้ว', 'No new article for 14 to 90 days', 'Home page only if there is room; Shows page', HEX.purple],
  ['Archive', 'Archive', 'No new article for 90+ days', 'Shows page "past seasons" list; links keep working', '8A8A8A'],
];
stages.forEach(([en, th, rule, where, col], i) => {
  const x = 0.5 + i * 3.08;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.55, w: 2.84, h: 0.55, rectRadius: 0.27, fill: { color: col }, line: { type: 'none' }, objectName: `pill_${i}` });
  s.addText(`${en} · ${th}`, { isTextBox: true, x, y: 1.55, w: 2.84, h: 0.55, fontSize: 14, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', margin: 0 });
  if (i < 2) s.addText('→', { isTextBox: true, x: x + 2.84, y: 1.62, w: 0.24, h: 0.4, fontSize: 16, color: HEX.muted, align: 'center', margin: 0 });
  s.addText([{ text: 'Rule', options: { fontSize: 11, bold: true, color: '8A8A8A', breakLine: true } }, { text: rule, options: { fontSize: 15, color: HEX.ink } }],
    { isTextBox: true, x, y: 2.35, w: 2.84, h: 0.9, margin: 0, valign: 'top' });
  s.addText([{ text: 'Where it appears', options: { fontSize: 11, bold: true, color: '8A8A8A', breakLine: true } }, { text: where, options: { fontSize: 15, color: HEX.ink } }],
    { isTextBox: true, x, y: 3.3, w: 2.84, h: 1.0, margin: 0, valign: 'top' });
});
card(s, 0.5, 4.45, 9.0, 0.6, HEX.lav, 'override');
s.addText([{ text: 'Manual override: ', options: { bold: true } }, { text: 'editors can still set a status by hand, for example to promote a premiere before its first article.' }],
  { isTextBox: true, x: 0.7, y: 4.45, w: 8.6, h: 0.6, fontSize: 13, color: HEX.ink, margin: 0, valign: 'middle' });

// 8 Sports
s = content('Sports needs hubs most: Football alone holds 1,191 articles in one subcategory', 'Hubs');
card(s, 0.5, 1.55, 3.0, 3.3, HEX.tint, 'football');
s.addText('1,191', { isTextBox: true, x: 0.7, y: 1.8, w: 2.6, h: 0.95, fontSize: 48, bold: true, color: HEX.magenta, margin: 0 });
s.addText('Football articles today, with no way to browse by competition', { isTextBox: true, x: 0.7, y: 2.8, w: 2.6, h: 0.9, fontSize: 14, bold: true, color: HEX.ink, margin: 0, valign: 'top' });
s.addText('Next largest: Racing 222, Tennis 121', { isTextBox: true, x: 0.7, y: 3.85, w: 2.6, h: 0.6, fontSize: 12, color: HEX.muted, margin: 0, valign: 'top' });
const groups = [
  ['Season-long leagues', 'Premier League, Thai League, F1 2026, MotoGP', 'On air for most of the year'],
  ['Short tournaments', 'Wimbledon, World Cup, Olympics', 'On air for a few weeks, then archived automatically'],
];
groups.forEach(([h, ex, note], i) => {
  const y = 1.55 + i * 1.2;
  s.addText([{ text: h, options: { bold: true, fontSize: 16, color: HEX.ink, breakLine: true } }, { text: ex, options: { fontSize: 14, color: HEX.ink, breakLine: true } }, { text: note, options: { fontSize: 12, color: HEX.muted } }],
    { isTextBox: true, x: 3.9, y, w: 5.6, h: 1.05, margin: 0, valign: 'top' });
});
card(s, 3.9, 4.05, 5.6, 0.8, HEX.lav, 'sportsnote');
s.addText([{ text: 'One difference: ', options: { bold: true } }, { text: 'the watch button points to the live channel or sports package on TrueVisions NOW, not a single title.' }],
  { isTextBox: true, x: 4.1, y: 4.05, w: 5.2, h: 0.8, fontSize: 13, color: HEX.ink, margin: 0, valign: 'middle' });
source(s, 'Source: Showtime CMS export, sports subcategories after dropping TV listings.');

// 9 CMS vs website
pres.addSection({ title: 'Requirements' });
s = content('The CMS covers everything except two settings, which live on the website side', 'Requirements');
table(s, [
  ['Need', 'Supported in the CMS today?', 'Where it lives'],
  ['Create a show or competition', 'Yes: categories and subcategories', 'CMS'],
  ['Hub name, description, image', 'Yes: subcategory fields', 'CMS'],
  ['Turn a hub off', 'Yes: published / unpublished', 'CMS'],
  ['Editor-picked top stories', 'Yes: recommended flag', 'CMS'],
  ['On air / ended / archive', 'Not needed: worked out from article dates', 'Website, automatic'],
  ['TrueVisions NOW link per hub', 'No field', 'Website settings file'],
  ['Competition belongs to a sport', 'No: only two category levels', 'Website settings file'],
], { x: 0.5, y: 1.5, w: 9.0, colW: [2.9, 3.7, 2.4], rowH: 0.4 });
s.addText('Not possible without new data: "most read" lists (view counts are empty) and topic tags (none stored).',
  { isTextBox: true, x: 0.5, y: 4.85, w: 9.0, h: 0.3, fontSize: 12, color: HEX.muted, margin: 0 });

// 10 Migration
s = content('About 140 past show articles need a one-time tag before launch', 'Requirements');
const mig = [['116', 'True AF2026', 'Already in its own CMS category'], ['41', 'True AF2026', 'Found by headline keywords'], ['67', 'AGT', 'Found by headline keywords'], ['29', 'The Voice', 'Found by headline keywords']];
mig.forEach(([n, show, how], i) => {
  const x = 0.5 + i * 2.3;
  card(s, x, 1.55, 2.1, 1.75, i === 0 ? 'FFFFFF' : HEX.tint, `mig_${i}`);
  s.addText(n, { isTextBox: true, x: x + 0.2, y: 1.7, w: 1.7, h: 0.7, fontSize: 36, bold: true, color: i === 0 ? '8A8A8A' : HEX.magenta, margin: 0 });
  s.addText([{ text: show, options: { bold: true, fontSize: 14, color: HEX.ink, breakLine: true } }, { text: how, options: { fontSize: 12, color: HEX.muted } }],
    { isTextBox: true, x: x + 0.2, y: 2.45, w: 1.75, h: 0.8, margin: 0, valign: 'top' });
});
const flow = ['Keyword match drafts a list per hub', 'An editor checks the list', 'Bulk-tag the confirmed articles in the CMS'];
flow.forEach((t, i) => {
  const x = 0.5 + i * 3.08;
  numDot(s, i + 1, x, 3.7, 0.45);
  s.addText(t, { isTextBox: true, x: x + 0.6, y: 3.62, w: 2.3, h: 0.65, fontSize: 14, color: HEX.ink, margin: 0, valign: 'middle' });
});
s.addText('After tagging, the keyword rules are removed and hubs rely only on CMS tags.',
  { isTextBox: true, x: 0.5, y: 4.55, w: 9.0, h: 0.35, fontSize: 13, color: HEX.muted, margin: 0 });
source(s);

// 11 Next steps
pres.addSection({ title: 'Next steps' });
s = content('Next steps', 'Next steps');
table(s, [
  ['Decision', 'Why it matters', 'Who decides'],
  ['Can editors create subcategories themselves?', 'Decides whether new hubs need an admin', 'CMS owner'],
  ['Can subcategory images be shown publicly, one per show?', 'Most subcategories share one generic image today', 'CMS owner'],
  ['Who keeps the hub settings file?', 'Holds NOW links and sport mapping, a few edits per season', 'Product and web team'],
  ['Approve the one-time tagging of about 140 articles', 'The Voice, AGT and part of True AF are not tagged yet', 'Editorial lead'],
  ['Use the recommended flag for home top stories?', 'Gives editors control; today the newest stories are picked', 'Editorial lead'],
], { x: 0.5, y: 1.5, w: 9.0, colW: [3.5, 3.6, 1.9], rowH: 0.52 });

(async () => {
  await pres.writeFile({ fileName: 'showtime-operations.pptx' });
  await applyTheme('showtime-operations.pptx', THEME);
  console.log('written');
})();
