from fastapi import FastAPI, UploadFile, File
import torch, timm, cv2, numpy as np
from PIL import Image
from torchvision import transforms
from src.data.leaf_segment import segment_leaf_bylab
from src.inference.postprocess import estimate_severity_percent, severity_level

app = FastAPI(title="Plant Disease API")

device = "cuda" if torch.cuda.is_available() else "cpu"
_ck = torch.load("models/checkpoints/cls/best_cls.pth", map_location=device)
_classes = _ck["classes"]
_model = timm.create_model("mobilenetv3_large_100", pretrained=False, num_classes=len(_classes))
_model.load_state_dict(_ck["model"])
_model.to(device).eval()

_tf = transforms.Compose([
    transforms.Resize((224,224)),
    transforms.ToTensor(),
    transforms.Normalize((0.485,0.456,0.406),(0.229,0.224,0.225))
])

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    data = await file.read()
    nparr = np.frombuffer(data, np.uint8)
    bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if bgr is None:
        return {"error":"invalid image"}

    mask, crop = segment_leaf_bylab(bgr)
    pil = Image.fromarray(cv2.cvtColor(crop, cv2.COLOR_BGR2RGB))
    x = _tf(pil).unsqueeze(0).to(device)
    with torch.no_grad():
        logits = _model(x)
        prob = torch.softmax(logits, dim=1).cpu().numpy()[0]
    idx = int(prob.argmax()); conf = float(prob[idx]); cls = _classes[idx]

    sev = estimate_severity_percent(crop); lvl = severity_level(sev)
    advice = "Theo dõi và tối ưu ánh sáng/thoáng khí." if cls == "Healthy" else \
             "Cắt bỏ lá nặng, tránh tưới lên lá, vệ sinh dụng cụ, xử lý theo khuyến cáo từng bệnh."

    return {
        "plant": "rice",
        "disease": cls,
        "confidence": round(conf,4),
        "severity_percent": round(sev,1),
        "severity_level": lvl,
        "advice": advice
    }
