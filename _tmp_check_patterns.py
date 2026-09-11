import re
from pathlib import Path

st = Path("data/subtopicsData.ts").read_text(encoding="utf-8")
ex = Path("data/standardSubtopicPatterns.ts").read_text(encoding="utf-8")
ids = re.findall(r"st\('[^']+',\s*'([^']+)'", st)
sub_ids = [f"st-{s}" for s in ids]
ex_ids = re.findall(r"'(st-[^']+)':", ex)
missing = [i for i in sub_ids if i not in set(ex_ids)]
extra = [i for i in ex_ids if i not in set(sub_ids)]
print("subtopics", len(sub_ids))
print("examples", len(ex_ids))
print("missing", missing)
print("extra", extra)
print("expected_patterns", len(sub_ids) * 4)
