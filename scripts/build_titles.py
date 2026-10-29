"""
Link Showtime articles to real TrueVisions NOW titles for the article page's "watch" card.

Usage:
    python3 scripts/build_titles.py site/data

Reads the same TVS NOW catalog feeds the peacock-clone app serves through its /api/tvs-* proxies
(they have no CORS header, so the static demo can't fetch them in the browser) and writes
site/data/titles.json:
    titles  – id -> card fields (Thai title/synopsis, art, rating, year, episodes, badge, type)
    art     – article id -> title id, only where the link is confident (see below)
    shelf   – "section/sub" -> [title ids], shown as a generic "browse on NOW" row, never as "this title"

An article's title comes from, in order:
    1. scripts/title_links.csv – editor corrections (article_id,title_id; title_id "none" = no title)
    2. a TVS NOW title link pasted in the article body (…/watch/tvs-series/<id> or …/tvs-movie/<id>)
    3. the title's name appearing in the article headline
    4. scripts/title_aliases.csv – a short keyword for a franchise (โคนัน -> the Conan series), for titles
       whose catalog names are too long to appear in a headline
It also writes reports/title_review.csv: recent articles with what they were linked to, for an editor
to check; corrected rows go into title_links.csv.

Standard library only. Needs data/index.json and data/articles/ from build_data.py first.
"""
import csv
import json
import re
import sys
import urllib.request
from collections import Counter
from pathlib import Path

CDN = "https://tvs.dmpcdn.com"
FEEDS = {
    "home": "/mobile/v1/th/homepage_adult_th.json",
    "movies": "/tvapp/v1/th/movie_category_adult_th.json",
    "series": "/tvapp/v1/th/series_category_adult_th.json",
    "sports": "/tvapp/v1/th/sport_category_adult_th.json",
    # English variants only contribute alternate names for matching (same ids).
    "movies_en": "/tvapp/v1/th/movie_category_adult_en.json",
    "series_en": "/tvapp/v1/th/series_category_adult_en.json",
}

# Shelf names as in peacock-clone src/lib/tvsCatalog.js; the clone's AlsoOnTvn falls back the same way.
FALLBACK = {
    "sports/football": ("sports", "[TV] Base Shelf - Football Highlights-Adult-Teen"),
    "sports/racing": ("sports", "[TV] Cate Sport Base Shelf - Motorsports"),
    "sports/tennis": ("sports", "[TV] Base Shelf - More Sports - Adult - Teen - Kids"),
    "sports/badminton": ("sports", "[TV] Cate Sport Base Shelf - Badminton"),
    "sports/more": ("sports", "[TV] Base Shelf - More Sports - Adult - Teen - Kids"),
    "movies-series/movies": ("movies", "[Mobile] Featured Movies Adult - Teen Category"),
    "movies-series/series": ("series", "[TV] Cate Series -Featured Series Adult - Teen"),
    "shows/entertainment": ("series", "[TV] Cat Series - Reality - Adult - Teen"),
    "shows/the-voice": ("series", "[TV] Cat Series - Reality - Adult - Teen"),
    "shows/agt": ("series", "[TV] Cat Series - Reality - Adult - Teen"),
    "shows/true-af-2026": ("series", "[TV] Cat Series - Reality - Adult - Teen"),
    "kids/kids": ("home", "[Mobile+TV] Doraemon The Movie -Adult-Teen"),
    "knowledge/knowledge": ("home", "[Mobile+TV] Documentary  -Adult-Teen"),
    "knowledge/news": ("home", "[Mobile+TV] Documentary  -Adult-Teen"),
}
# Show hub titles, the `now` ids in SHOWS in site/app.js; always written so hub pages have their art.
SHOW_TITLES = {"80vMxY9qaaAE", "2E9VKzwNPW3Q", "ad5yoYRkyK8d"}
BODY_LINK = re.compile(r"/(?:watch|play)/(tvs-movie|tvs-series)/([A-Za-z0-9]{8,16})")
REVIEW_DAYS = 60
ROOT = Path(__file__).resolve().parent.parent
GENRE_TH = {
    "action": "แอ็กชัน", "adventure": "ผจญภัย", "animation": "แอนิเมชัน", "comedy": "คอมเมดี้",
    "crime": "อาชญากรรม", "documentary": "สารคดี", "drama": "ดราม่า", "family": "ครอบครัว",
    "fantasy": "แฟนตาซี", "gameshow": "เกมโชว์", "horror": "สยองขวัญ", "music": "ดนตรี",
    "mystery": "ลึกลับ", "news": "ข่าว", "reality": "เรียลลิตี้", "romance": "โรแมนซ์",
    "sci-fi": "ไซไฟ", "sports": "กีฬา", "talkshow": "ทอล์กโชว์", "thriller": "ระทึกขวัญ",
    "varietyshow": "วาไรตี้โชว์", "war": "สงคราม",
}
THAI = re.compile(r"[฀-๿]")


def fetch(path):
    req = urllib.request.Request(CDN + path, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def norm(s):
    return re.sub(r"[\s\-–:!?\"'“”‘’.,()]+", " ", s.lower()).strip()


def usable_name(k):
    # Short names cause false hits ("เฉือน", "Monster"): Thai needs 6+ chars, a lone English word 8+.
    if THAI.search(k):
        return len(k.replace(" ", "")) >= 6
    return len(k) >= 8 if " " not in k else len(k) >= 5


def card(d):
    tl = d.get("thumb_list") or {}
    series = d.get("movie_type") == "series"
    badge = {"only_now": "only", "true_original": "original"}.get(d.get("exclusive_badge_type"))
    genre = (d.get("genres") or [None])[0]
    dur = int(d["duration"]) if str(d.get("duration") or "").isdigit() else 0
    return {
        "t": d["title"].strip(),
        "type": "tvs-series" if series else "tvs-movie",
        "syn": (d.get("synopsis") or "").strip(),
        "img": tl.get("landscape_image") or tl.get("ott_landscape") or d.get("thumb"),
        "rate": d.get("rate") or "",
        "yr": d.get("release_year") or "",
        "eps": int(d["ep_total"]) if series and str(d.get("ep_total") or "").isdigit() else 0,
        "min": dur if not series else 0,
        "g": GENRE_TH.get(genre, "") if genre else "",
        "badge": badge,
    }


def main(out):
    out = Path(out)
    feeds = {k: fetch(p) for k, p in FEEDS.items()}
    entries, names = {}, {}
    for key, shelves in feeds.items():
        for shelf in shelves:
            for e in shelf.get("items") or []:
                d = e.get("data") or {}
                if not d.get("id") or not d.get("title") or d.get("content_type") != "movie":
                    continue
                if not key.endswith("_en"):
                    entries.setdefault(d["id"], d)
                names.setdefault(d["id"], set()).add(norm(d["title"]))
    lookup = sorted(((k, i) for i, ns in names.items() if i in entries for k in ns if usable_name(k)), key=lambda x: -len(x[0]))

    index = json.loads((out / "index.json").read_text("utf-8"))
    bodies = {}
    for f in (out / "articles").glob("*.json"):
        bodies.update(json.loads(f.read_text("utf-8")))
    fixes = {}
    fix_file = ROOT / "scripts" / "title_links.csv"
    if fix_file.exists():
        with fix_file.open(encoding="utf-8-sig") as fh:
            for row in csv.DictReader(fh):
                if row.get("article_id") and row.get("title_id"):
                    fixes[row["article_id"].strip()] = row["title_id"].strip()

    aliases = []
    alias_file = ROOT / "scripts" / "title_aliases.csv"
    if alias_file.exists():
        with alias_file.open(encoding="utf-8-sig") as fh:
            aliases = [(norm(r["keyword"]), r["title_id"].strip()) for r in csv.DictReader(fh) if r.get("keyword") and r.get("title_id")]

    def by_alias(a):
        t = " " + norm(a["t"]) + " "
        return next((i for k, i in aliases if k in t), None)

    def by_name(a):
        if a["sec"] == "sports":
            return None  # sports news names clubs and players, not catalog titles
        t = " " + norm(a["t"]) + " "
        for k, i in lookup:
            if k in t and re.search(r"(?<![a-z0-9])" + re.escape(k) + r"(?![a-z0-9])", t):
                return i
        return None

    art, source, unknown = {}, {}, []
    for a in index:
        tid, src = None, None
        if a["id"] in fixes:
            tid, src = fixes[a["id"]], "correction"
        else:
            m = BODY_LINK.search(bodies.get(a["id"]) or "")
            if m:
                tid, src = m.group(2), "body link"
            else:
                tid, src = by_name(a), "name match"
                if not tid:
                    tid, src = by_alias(a), "keyword"
        if tid and tid != "none" and tid not in entries:
            unknown.append((a["id"], tid, src))
            tid = None
        source[a["id"]] = src if tid and tid != "none" else ("correction: none" if tid == "none" else "no match")
        if tid and tid != "none":
            art[a["id"]] = tid
        elif tid == "none":
            art[a["id"]] = None  # an editor said no title fits: the page shows the generic card

    shelf = {}
    for sub, (feed, shelf_name) in FALLBACK.items():
        found = next((s for s in feeds[feed] if s.get("name") == shelf_name), None)
        ids = [e["data"]["id"] for e in (found or {}).get("items") or [] if (e.get("data") or {}).get("id") in entries][:6]
        if not ids:
            print(f"warning: no shelf items for {sub} ({shelf_name})")
        shelf[sub] = ids

    used = {i for i in art.values() if i} | {i for ids in shelf.values() for i in ids} | (SHOW_TITLES & set(entries))
    titles = {i: card(entries[i]) for i in used}
    (out / "titles.json").write_text(json.dumps({"titles": titles, "art": art, "shelf": shelf}, ensure_ascii=False, separators=(",", ":")), "utf-8")

    newest = max(a["d"] for a in index)
    recent = [a for a in index if newest - a["d"] < REVIEW_DAYS * 864e5]
    (ROOT / "reports").mkdir(exist_ok=True)
    with (ROOT / "reports" / "title_review.csv").open("w", encoding="utf-8-sig", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(["article_id", "title_id", "linked_title", "how", "date", "section", "headline", "old_url"])
        for a in recent:
            tid = art.get(a["id"]) or ""
            w.writerow([a["id"], tid, titles[tid]["t"] if tid else "", source[a["id"]],
                        __import__("datetime").datetime.fromtimestamp(a["d"] / 1000).strftime("%Y-%m-%d"),
                        f"{a['sec']}/{a['sub']}", a["t"], a.get("old", "")])

    print(f"{sum(1 for i in art.values() if i)} of {len(index)} articles linked to a title: {dict(Counter(source[i] for i in art))}")
    print(f"{len(titles)} titles written; review sheet: reports/title_review.csv ({len(recent)} articles from the last {REVIEW_DAYS} days)")
    for aid, tid, src in unknown:
        print(f"warning: article {aid} points at title {tid} ({src}), which isn't in the catalog feeds")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "site/data")
