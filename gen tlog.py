#!/usr/bin/env python3
"""
gen_tlog.py
scan tlog/ folder แล้ว build tlog/tlog.json

โครงสร้างที่รองรับ:
  tlog/translatesong/file.md        → catId=translatesong, series=None
  tlog/novel/isekaihippo/file.md    → catId=novel, series=isekaihippo
  tlog/retrogame/file.md            → catId=retrogame, series=None
  tlog/gacha/genshin/file.md        → catId=gacha, series=genshin
  tlog/random/file.md               → catId=random, series=None

front matter ที่รองรับ (ใส่ที่ต้นไฟล์ .md):
---
id: hippo-1-50
title: รีวิวตอน 1–50
date: 2025-05-10
tags: [isekai, hippo]
---

ถ้าไม่มี front matter จะใช้ชื่อไฟล์แทน
"""

import json
import os
import re
from pathlib import Path

TLOG_DIR = Path("tlog")
OUTPUT_FILE = TLOG_DIR / "tlog.json"
SKIP_DIRS = {"assets"}
EXTENSIONS = {".md", ".html", ".htm"}

# category metadata — icon และ desc
CAT_META = {
    "translatesong": {"name": "เพลงแปล", "icon": "🎵", "type": "misc"},
    "novel": {"name": "นิยาย", "icon": "📚", "type": "novel"},
    "retrogame": {"name": "Retro Game", "icon": "🕹️", "type": "game"},
    "gacha": {"name": "Gacha Game", "icon": "⚔️", "type": "game"},
    "random": {"name": "ไร้สาระทั่วไป", "icon": "🍺", "type": "misc"},
}


def parse_front_matter(text):
    meta = {}
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n", text, re.DOTALL)
    if not m:
        return meta
    for line in m.group(1).splitlines():
        if ":" not in line:
            continue
        key, _, val = line.partition(":")
        key = key.strip()
        val = val.strip()
        if val.startswith("[") and val.endswith("]"):
            val = [v.strip().strip("\"'") for v in val[1:-1].split(",") if v.strip()]
        meta[key] = val
    return meta


def scan():
    entries = []

    for path in sorted(TLOG_DIR.rglob("*")):
        if path.is_dir():
            continue

        rel = path.relative_to(TLOG_DIR)
        parts = rel.parts  # e.g. ('novel', 'isekaihippo', 'file.md')

        # skip root-level files, assets, hidden, tlog.json itself
        if len(parts) < 2:
            continue
        if any(p in SKIP_DIRS for p in parts):
            continue
        if rel.name.startswith(("_", ".")):
            continue
        if rel.name == "tlog.json":
            continue
        if path.suffix.lower() not in EXTENSIONS:
            continue

        # ── determine catId and series ──────────────────────────
        cat_id = parts[0]  # translatesong | novel | retrogame | gacha | random

        # categories with series subfolder: novel, gacha
        # depth: tlog/cat/series/file.md → len(parts)==3
        #        tlog/cat/file.md         → len(parts)==2
        if len(parts) == 3:
            series_id = parts[1]
            series_name = series_id.replace("-", " ").replace("_", " ").title()
        else:
            series_id = None
            series_name = None

        # ── read front matter ────────────────────────────────────
        text = path.read_text(encoding="utf-8", errors="ignore")
        fm = parse_front_matter(text)

        file_stem = path.stem
        slug = f"{cat_id}-{series_id + '-' if series_id else ''}{file_stem}"

        # ── build catName: series name if exists, else cat name ──
        cat_info = CAT_META.get(
            cat_id, {"name": cat_id.title(), "icon": "📄", "type": "misc"}
        )
        cat_name = series_name or cat_info["name"]
        cat_icon = cat_info["icon"]
        cat_type = cat_info["type"]
        # catId for grouping: use series slug if present (e.g. "novel-isekaihippo")
        group_id = f"{cat_id}-{series_id}" if series_id else cat_id

        rel_str = str(rel).replace("\\", "/")

        entry = {
            "catId": group_id,
            "catName": cat_name,
            "catIcon": cat_icon,
            "catType": cat_type,
            "catDesc": f"{cat_info['name']}{' › ' + series_name if series_name else ''}",
            "id": fm.get("id") or slug,
            "title": fm.get("title")
            or file_stem.replace("-", " ").replace("_", " ").title(),
            "date": fm.get("date") or "",
            "tags": fm.get("tags") or [],
            "file": f"tlog/{rel_str}",
        }
        entries.append(entry)

    # sort by date desc within each group
    def sort_key(e):
        d = e["date"] or "0000-00-00"
        return (e["catId"], -int(d.replace("-", "") or 0), e["title"])

    entries.sort(key=sort_key)
    return entries


if __name__ == "__main__":
    entries = scan()
    OUTPUT_FILE.write_text(
        json.dumps(entries, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"✓ generated tlog.json — {len(entries)} entries")
    cats = {}
    for e in entries:
        cats.setdefault(e["catId"], []).append(e["title"])
    for cat, titles in cats.items():
        print(f"  [{cat}] {len(titles)} entries")
        for t in titles:
            print(f"    · {t}")
