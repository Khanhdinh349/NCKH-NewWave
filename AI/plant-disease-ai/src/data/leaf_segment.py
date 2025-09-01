import cv2
import numpy as np

def segment_leaf_bylab(img_bgr):
    img = cv2.GaussianBlur(img_bgr, (5,5), 0)
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    L, A, B = cv2.split(lab)
    thr = np.percentile(A, 60)
    leaf_mask = (A < thr).astype(np.uint8) * 255
    leaf_mask = cv2.morphologyEx(leaf_mask, cv2.MORPH_OPEN, np.ones((5,5),np.uint8))
    leaf_mask = cv2.morphologyEx(leaf_mask, cv2.MORPH_CLOSE, np.ones((9,9),np.uint8))

    cnts, _ = cv2.findContours(leaf_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not cnts:  # fallback whole image
        return np.ones_like(leaf_mask)*255, img_bgr
    c = max(cnts, key=cv2.contourArea)
    mask = np.zeros_like(leaf_mask)
    cv2.drawContours(mask, [c], -1, 255, -1)
    x,y,w,h = cv2.boundingRect(c)
    crop = img_bgr[y:y+h, x:x+w]
    return mask, crop
