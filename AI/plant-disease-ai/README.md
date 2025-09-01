# Plant Disease AI (Top-Down Leaf Analysis)

This repo provides a complete starter pipeline for **top-down leaf** analysis:
- Preprocess & leaf segmentation
- Classification (MobileNetV3) of common rice leaf diseases (Healthy, BLB, Leaf_Blast, Brown_Spot)
- Optional extension to detection/segmentation
- Inference API (FastAPI) and simple UI (Streamlit)

## Quickstart

```bash
# 1) create env & install
pip install -r requirements.txt

# 2) (optional) inspect dataset structure
python scripts/inspect_dataset.py

# 3) train a classifier
python src/training/train_cls.py --data_dir data/processed/classification --epochs 3

# 4) run inference on one image
python src/inference/predict_image.py --image data/processed/classification/test/Healthy/healthy_0001.jpg

# 5) start API
uvicorn src.serving.fastapi_app:app --host 0.0.0.0 --port 8000
```

The repo includes a tiny **synthetic dataset** for demo under `data/processed/classification`. Replace with your real photos (same structure) for actual training.
