import cv2
import numpy as np

def white_balance_grayworld(img_bgr):
    img = img_bgr.astype(np.float32) + 1e-6
    avg_b, avg_g, avg_r = img[:,:,0].mean(), img[:,:,1].mean(), img[:,:,2].mean()
    avg_gray = (avg_b + avg_g + avg_r) / 3.0
    img[:,:,0] *= (avg_gray / avg_b)
    img[:,:,1] *= (avg_gray / avg_g)
    img[:,:,2] *= (avg_gray / avg_r)
    img = np.clip(img, 0, 255).astype(np.uint8)
    return img

def gamma_correction(img_bgr, gamma=1.0):
    inv = 1.0 / max(gamma, 1e-6)
    table = (np.arange(256) / 255.0) ** inv * 255.0
    table = table.astype(np.uint8)
    return cv2.LUT(img_bgr, table)

def resize_letterbox(img_bgr, size=256):
    h, w = img_bgr.shape[:2]
    scale = size / max(h, w)
    nh, nw = int(h * scale), int(w * scale)
    resized = cv2.resize(img_bgr, (nw, nh), interpolation=cv2.INTER_AREA)
    out = np.full((size, size, 3), 0, dtype=np.uint8)
    top = (size - nh) // 2
    left = (size - nw) // 2
    out[top:top+nh, left:left+nw] = resized
    return out
