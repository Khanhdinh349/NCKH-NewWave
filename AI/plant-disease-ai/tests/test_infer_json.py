import json, subprocess, sys, os, glob

# pick one image from test set
cands = glob.glob("data/processed/classification/test/*/*.jpg")
img = cands[0] if cands else None
assert img, "No test images found."
print("Testing on:", img)

# call predict
proc = subprocess.run([sys.executable, "src/inference/predict_image.py", "--image", img], capture_output=True, text=True)
print(proc.stdout)
js = json.loads(proc.stdout)
required = {"plant","disease","confidence","severity_percent","severity_level","advice"}
assert required.issubset(js.keys())
print("Schema OK.")
