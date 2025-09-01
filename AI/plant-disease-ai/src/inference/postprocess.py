import cv2
import numpy as np

def estimate_severity_percent(leaf_bgr):
    hsv = cv2.cvtColor(leaf_bgr, cv2.COLOR_BGR2HSV)
    # naive brown/gray lesion mask
    lesion1 = cv2.inRange(hsv, (5, 50, 0), (25, 255, 200))   # brown-ish
    lesion2 = cv2.inRange(hsv, (0, 0, 120), (180, 30, 200))  # gray-ish
    lesion = cv2.bitwise_or(lesion1, lesion2)

    # leaf mask (green-ish)
    leaf_mask = cv2.inRange(hsv, (25, 20, 20), (100, 255, 255))
    leaf_area = max(1, int(np.count_nonzero(leaf_mask)))
    sev = 100.0 * int(np.count_nonzero(lesion)) / leaf_area
    sev = float(max(0.0, min(100.0, sev)))
    return sev

def severity_level(sev):
    if sev < 5: return "nhẹ"
    if sev < 20: return "trung bình"
    return "nặng"
