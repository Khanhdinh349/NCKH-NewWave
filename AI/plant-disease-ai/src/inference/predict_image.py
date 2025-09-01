import argparse, json
import torch, timm
import numpy as np
import cv2
from PIL import Image
from torchvision import transforms

from src.data.leaf_segment import segment_leaf_bylab
from src.inference.postprocess import estimate_severity_percent, severity_level

def load_model(ckpt_path, device):
    ck = torch.load(ckpt_path, map_location=device)
    classes = ck.get("classes", None)
    model = timm.create_model('mobilenetv3_large_100', pretrained=False, num_classes=len(classes))
    model.load_state_dict(ck["model"])
    model.to(device)
    model.eval()
    return model, classes

def main(args):
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model_path = "models/checkpoints/cls/best_cls.pth"
    model, classes = load_model(model_path, device)

    tf = transforms.Compose([
        transforms.Resize((224,224)),
        transforms.ToTensor(),
        transforms.Normalize((0.485,0.456,0.406),(0.229,0.224,0.225))
    ])

    bgr = cv2.imread(args.image)
    if bgr is None:
        raise FileNotFoundError(args.image)

    mask, crop = segment_leaf_bylab(bgr)
    pil = Image.fromarray(cv2.cvtColor(crop, cv2.COLOR_BGR2RGB))
    x = tf(pil).unsqueeze(0).to(device)

    with torch.no_grad():
        logits = model(x)
        prob = torch.softmax(logits, dim=1).cpu().numpy()[0]
    idx = int(prob.argmax())
    conf = float(prob[idx])
    cls = classes[idx]

    sev = estimate_severity_percent(crop)
    lvl = severity_level(sev)

    advice = "Theo dõi và tối ưu ánh sáng/thoáng khí." if cls == "Healthy" else \
             "Theo dõi và tối ưu ánh sáng/thoáng khí."

    out = {
        "plant": "succulent",
        "disease": cls,
        "confidence": round(conf, 4),
        "severity_percent": round(sev, 1),
        "severity_level": lvl,
        "advice": advice
    }
    print(json.dumps(out, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--image", type=str, required=True)
    args = ap.parse_args()
    main(args)
