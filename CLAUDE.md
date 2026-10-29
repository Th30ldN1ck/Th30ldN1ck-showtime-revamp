# Showtime revamp demo

Prototype of the revamped Showtime section (truevisions.co.th/magazine). Vanilla HTML/CSS/JS, no build step.

## IMPORTANT: large files – never read them whole
- `data/truevisions_content_categories_2026.csv` is 32 MB (3,787 articles). Inspect only with scripts (pandas, `head`), never open or attach it.
- `site/data/index.json` (~2 MB) and `site/data/articles/*.json` (~18 MB) are generated. Don't read them; query them with a short script if needed.

## Layout
- `site/index.html` – page shell (header, footer). Bump the `?v=` on styles.css/app.js after edits: the dev server sends no cache headers, so open tabs keep stale files
- `site/styles.css` – all styling; colour tokens at the top in `:root`
- `site/app.js` – hash router + page renderers: `home()`, `section()`, `show()`, `article()`
  - `SECTIONS` = the five sections and their tabs; `SHOWS` = show hubs; `WATCH_URL` = target of every "Watch on NOW" button
- `scripts/build_data.py` – CSV → `site/data/` (category mapping lives in `map_row()` and `SHOWS`)
- `scripts/build_titles.py` – TVS NOW catalog feeds → `site/data/titles.json` (article → real title for the article page's title card; stdlib only). Card links go to the peacock-clone app at `NOW_APP` in app.js (https://tvs-newhomepage.vercel.app; point it at http://localhost:5173 to test unpushed clone changes): "ดูเลย" → `/play/<type>/<id>` (the clone's subscription gate: player or package checkout), more info → `/watch/<type>/<id>`
- Article → NOW title, in priority order: `scripts/title_links.csv` (editor corrections; `none` = no title) → a NOW title link pasted in the article body (`…/watch/tvs-series/<id>`) → the title's name in the headline → `scripts/title_aliases.csv` (franchise keywords, e.g. โคนัน → the Conan series). No confident link → the page shows a generic "browse this section on NOW" card (`BROWSE` in app.js), never a guessed title. Each build writes `reports/title_review.csv` (last 60 days) for editors to check. Show hubs use their `now` id in `SHOWS`.
- `site/artifact.html` – copy of index.html without html/head/body tags, used only for the claude.ai demo link

## Run
`cd site && python3 -m http.server 8000` → http://localhost:8000

## Rebuild data after changing the mapping
`python3 scripts/build_data.py data/truevisions_content_categories_2026.csv site/data`
then `python3 scripts/build_titles.py site/data` (also re-run it to refresh titles from the live catalog)

## Design rules
- Header: white sticky masthead modelled on the NOW Blog header in peacock-clone (`src/components/NowBlogHeader.jsx`) – logo row folds away on scroll on desktop, phones get one bar plus a tab drawer. The old magenta truevisions.co.th top bar was dropped.
- Page body keeps the current truevisions.co.th Showtime look: pink headings (#F2408E), white cards with pink/purple gradient borders, font Prompt (stand-in for the brand font).
- Brand CTA colours from the TVS NOW design system: magenta #FB008D, brand gradient #FB008D → #FF0000.
- Copy is Thai-first; keep English labels where the live site uses them (Highlight, Sports, See More).
