"""
Build the Showtime demo's data files from the CMS export.

Usage:
    python scripts/build_data.py data/truevisions_content_categories_2026.csv site/data

Outputs:
    site/data/index.json          – metadata for every article (no body)
    site/data/articles/<n>.json   – article bodies, 100 per file, keyed by id

Mapping rules (old CMS categories -> new Showtime IA) live in SECTION_MAP / sub_for().
"""
import json
import re
import sys
from pathlib import Path

import pandas as pd
from bs4 import BeautifulSoup

SITE = "https://www.truevisions.co.th"
CHUNK = 100

# Show hubs detected from titles (Entertainment + True AF only)
SHOWS = [
    ("the-voice", re.compile(r"the\s*voice", re.I)),
    ("agt", re.compile(r"\bAGT\b|got talent", re.I)),
    ("true-af-2026", re.compile(r"AF\s?20|TRUE\s?AF|Academy Fantasia|นักล่าฝัน|เอเอฟ", re.I)),
]
ACTIVE_SPORTS = {"Football", "Racing", "Tennis", "Badminton"}
DROP_CATS = {"Term", "Partner & Hotel", "TV Guide"}
SCHEDULE = re.compile(r"โปรแกรมถ่ายทอดสด")


def old_cat(r):
    return r["category_name"] if isinstance(r["category_name"], str) else r["subcategory_parent_category_name"]


def map_row(r):
    cat = old_cat(r)
    sub = r["subcategory_name"] if isinstance(r["subcategory_name"], str) else None
    title = str(r["title"])
    if not isinstance(cat, str) or cat in DROP_CATS:
        return None
    if cat == "Sports":
        if SCHEDULE.search(title):
            return None  # TV listings belong in the EPG
        return "sports", (sub.lower() if sub in ACTIVE_SPORTS else "more")
    if cat == "Movie & Series":
        return "movies-series", (sub.lower() if sub else "series")
    if cat in ("Entertainment", "True AF2026"):
        if cat == "True AF2026":
            return "shows", "true-af-2026"
        for key, rx in SHOWS:
            if rx.search(title):
                return "shows", key
        return "shows", "entertainment"
    if cat == "Kids":
        return "kids", "kids"
    if cat == "Knowledge":
        return "knowledge", "knowledge"
    if cat == "News":
        return "knowledge", "news"
    return None


def abs_url(u):
    if not isinstance(u, str) or not u or "example.com" in u:
        return None
    return SITE + u if u.startswith("/") else u


def clean_text(html, n=None):
    t = BeautifulSoup(str(html), "html.parser").get_text(" ", strip=True)
    t = re.sub(r"\s+", " ", t.replace("\xa0", " ")).strip()
    return t[:n].rstrip() + "…" if n and len(t) > n else t


def clean_html(html):
    soup = BeautifulSoup(str(html), "html.parser")
    for t in soup(["script", "style", "link", "meta"]):
        t.decompose()
    for t in soup.find_all(True):
        if t.name == "img":
            src = t.get("src", "")
            if src.startswith("data:"):
                t.decompose()
                continue
            t.attrs = {"src": abs_url(src) or src, "alt": t.get("alt", ""), "loading": "lazy"}
        elif t.name == "iframe":
            m = re.search(r"youtube\.com/embed/([\w-]+)", t.get("src", ""))
            if not m:
                t.decompose()
                continue
            t.attrs = {"src": f"https://www.youtube.com/embed/{m.group(1)}", "allowfullscreen": "", "loading": "lazy"}
        elif t.name == "a":
            href = t.get("href", "")
            t.attrs = {"href": abs_url(href) or href, "target": "_blank", "rel": "noopener"}
        else:
            t.attrs = {}
    return str(soup).strip()


def main(src, out):
    out = Path(out)
    (out / "articles").mkdir(parents=True, exist_ok=True)
    df = pd.read_csv(src, low_memory=False)
    df = df[df["status"].str.lower().eq("published") & df["published_at"].notna()]

    rows = []
    for _, r in df.iterrows():
        m = map_row(r)
        if not m:
            continue
        rows.append({"r": r, "section": m[0], "sub": m[1]})
    rows.sort(key=lambda x: -x["r"]["published_at"])

    index, chunks = [], {}
    for i, x in enumerate(rows):
        r = x["r"]
        c = i // CHUNK
        aid = str(r["slug"])
        index.append({
            "id": aid,
            "t": str(r["title"]).strip(),
            "s": clean_text(r["short_description"], 180) if isinstance(r["short_description"], str) else "",
            "sec": x["section"],
            "sub": x["sub"],
            "d": int(r["published_at"]),
            "img": abs_url(r["image_cover"]),
            "rec": bool(r["recommended:boolean"] is True or str(r["recommended:boolean"]).lower() == "true"),
            "old": f"{SITE}/{r['category_slug'] if isinstance(r['category_slug'], str) else r['subcategory_parent_category_slug']}/{aid}/",
            "c": c,
        })
        chunks.setdefault(c, {})[aid] = clean_html(r["content"])

    (out / "index.json").write_text(json.dumps(index, ensure_ascii=False, separators=(",", ":")), "utf-8")
    for c, d in chunks.items():
        (out / "articles" / f"{c}.json").write_text(json.dumps(d, ensure_ascii=False, separators=(",", ":")), "utf-8")

    counts = pd.Series([f"{a['sec']}/{a['sub']}" for a in index]).value_counts()
    print(f"{len(index)} articles kept of {len(df)} published; {len(chunks)} body files")
    print(counts.to_string())


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
