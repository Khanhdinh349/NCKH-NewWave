from pathlib import Path
import json

base = Path("data/processed/classification")
stats = {}
for split in ["train","val","test"]:
    stats[split] = {}
    for cls_dir in (base/split).glob("*"):
        if cls_dir.is_dir():
            stats[split][cls_dir.name] = len(list(cls_dir.glob("*.jpg")))
print(json.dumps(stats, indent=2))
