#!/usr/bin/env python3
"""
gen_articles.py
scan ไฟล์ทุกอันใน article/ แล้ว build article/articles.json

รองรับ front matter แบบนี้ที่ต้นไฟล์ .md หรือ .html:
---
id: my-post
title: ชื่อบทความ
date: 2025-06-27
tags: [ai, dev]
---

ถ้าไม่มี front matter จะใช้ชื่อไฟล์แทน
ไฟล์ที่ขึ้นต้นด้วย _ หรืออยู่ใน assets/ จะถูก skip
"""

import json
import os
import re
from datetime import datetime
from pathlib import Path

ARTICLE_DIR = Path("article")
OUTPUT_FILE = ARTICLE_DIR / "articles.json"
SKIP_DIRS = {"assets"}
EXTENSIONS = {".md", ".html", ".htm"}


def parse_front_matter(text):
    """ดึง YAML front matter แบบง่ายๆ ไม่ต้องลง lib"""
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
        # parse list  [a, b, c]
        if val.startswith("[") and val.endswith("]"):
            val = [v.strip().strip("\"'") for v in val[1:-1].split(",") if v.strip()]
        meta[key] = val
    return meta


def slug_from_path(rel_path):
    """article/foo/bar.md → foo-bar"""
    parts = list(rel_path.parts)
    name = rel_path.stem
    # prepend subfolder if nested
    if len(parts) > 1:
        return f"{parts[0]}-{name}"
    return name


def scan():
    articles = []

    for path in sorted(ARTICLE_DIR.rglob("*")):
        # skip directories
        if path.is_dir():
            continue
        # skip assets and hidden
        rel = path.relative_to(ARTICLE_DIR)
        if any(part in SKIP_DIRS for part in rel.parts):
            continue
        if rel.name.startswith("_") or rel.name.startswith("."):
            continue
        if rel.name == "articles.json":
            continue
        if path.suffix.lower() not in EXTENSIONS:
            continue

        text = path.read_text(encoding="utf-8", errors="ignore")
        fm = parse_front_matter(text)

        # build entry
        rel_str = str(rel).replace("\\", "/")  # windows safe
        entry = {
            "id": fm.get("id") or slug_from_path(rel),
            "title": fm.get("title")
            or rel.stem.replace("-", " ").replace("_", " ").title(),
            "date": fm.get("date") or "",
            "tags": fm.get("tags") or [],
            "file": f"article/{rel_str}",
        }
        articles.append(entry)

    # sort: date desc, then title asc
    def sort_key(a):
        d = a["date"] or "0000-00-00"
        return (-int(d.replace("-", "")), a["title"])

    articles.sort(key=sort_key)
    return articles


if __name__ == "__main__":
    arts = scan()
    OUTPUT_FILE.write_text(
        json.dumps(arts, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"✓ generated articles.json — {len(arts)} articles")
    for a in arts:
        print(f"  [{a['date'] or '----'}] {a['id']} — {a['title']}")
