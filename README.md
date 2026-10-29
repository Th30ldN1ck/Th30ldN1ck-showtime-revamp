# Showtime revamp – demo site

A clickable prototype of the revamped Showtime section (truevisions.co.th/magazine), built from the CMS export.

## Run it
```
cd site
python3 -m http.server 8000
# open http://localhost:8000
```
Opened locally, images and YouTube videos load from truevisions.co.th as on the live site.

## Rebuild the data
```
pip install pandas beautifulsoup4
python3 scripts/build_data.py data/truevisions_content_categories_2026.csv site/data
```

## What changed vs the current Showtime
- Five sections: Sports, Movies & Series, Shows (new), Kids, Knowledge
- Shows hubs: The Voice Thailand 2026, AGT, True AF 2026 (archive), auto-detected from titles
- Dead sports tabs (American Games, Snooker, Boxing, Volleyball, Golf) merged into "กีฬาอื่นๆ"
- 296 daily "โปรแกรมถ่ายทอดสด" schedule posts removed (link to ผังรายการ/EPG instead)
- "Watch on TrueVisions NOW" buttons on every article and show hub
  (all point to WATCH_URL in site/app.js until real deep links exist)
- Term / Partner & Hotel / TV Guide one-offs and drafts dropped

## Files
- `scripts/build_data.py` – CSV → `site/data/index.json` + `site/data/articles/<n>.json`
- `site/index.html`, `site/styles.css`, `site/app.js` – the site (vanilla JS, no build step)
- `site/artifact.html` – same page without the html/head/body wrapper, used for the shared demo link
