"""
Merge Script: Add hindi_translation from gita_dataset.json into final_gita.json.
Matches records by chapter + verse number.
Run this once from the /final/ directory.
"""

import json

# ── Load both files ──────────────────────────────────────────────────────────
with open("final_gita.json", "r", encoding="utf-8") as f:
    final_data = json.load(f)

with open("gita_dataset.json", "r", encoding="utf-8") as f:
    dataset = json.load(f)

# ── Build a lookup: (chapter, verse) → hindi_translation ────────────────────
hindi_lookup = {}
for item in dataset:
    key = (item["chapter_number"], item["verse_number"])
    hindi_lookup[key] = item.get("hindi_translation", "")

# ── Merge hindi into final_gita ───────────────────────────────────────────────
matched = 0
missing = 0

for verse in final_data:
    key = (verse["chapter"], verse["verse"])
    if key in hindi_lookup:
        verse["hindi_translation"] = hindi_lookup[key]
        matched += 1
    else:
        verse["hindi_translation"] = ""  # Placeholder if not found
        missing += 1

# ── Save back ─────────────────────────────────────────────────────────────────
with open("final_gita.json", "w", encoding="utf-8") as f:
    json.dump(final_data, f, ensure_ascii=False, indent=2)

print(f"Done! Matched: {matched} | Missing: {missing}")
print("final_gita.json updated with hindi_translation field.")
