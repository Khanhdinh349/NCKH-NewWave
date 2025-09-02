import streamlit as st
import requests
import json
import os
import re

# === CÀI ĐẶT GEMINI API ===
API_KEY = "AIzaSyBPdziDTCRz89kCLZ9STQZ7WhIaESOQ1jc"  # 👉 nên lưu trong st.secrets hoặc biến môi trường để bảo mật
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
DATA_FILE = "plants.json"

# === HÀM LÀM SẠCH JSON TRẢ VỀ ===
def clean_json_response(text: str) -> str:
    """
    Loại bỏ ```json ... ``` hoặc ``` ... ``` nếu Gemini trả về dưới dạng code block.
    """
    text = text.strip()
    text = re.sub(r"^```json\s*", "", text)  # bỏ ```json ở đầu
    text = re.sub(r"^```\s*", "", text)      # bỏ ``` ở đầu nếu có
    text = re.sub(r"\s*```$", "", text)      # bỏ ``` ở cuối
    return text.strip()

# === HÀM GỌI GEMINI ĐỂ LẤY THÔNG TIN ===
def get_plant_info(plant_name):
    prompt = f"""
    Hãy cung cấp thông tin về cây '{plant_name}' gồm:
    - Đặc điểm chính
    - Nhiệt độ lý tưởng để phát triển (chỉ ghi số, kèm °C)
    - Độ ẩm thích hợp để canh tác (chỉ ghi %, ví dụ 60%)

    Trả về kết quả theo định dạng JSON THUẦN (KHÔNG kèm ```json, ``` hay văn bản khác), ví dụ:
    {{
        "plant": "{plant_name}",
        "temperature": "25-30°C",
        "humidity": "60-70%"
    }}
    """

    headers = {
        "Content-Type": "application/json",
        "X-goog-api-key": API_KEY
    }

    data = {
        "contents": [
            {"parts": [{"text": prompt}]}
        ]
    }

    res = requests.post(GEMINI_URL, headers=headers, json=data)
    if res.status_code == 200:
        try:
            text = res.json()['candidates'][0]['content']['parts'][0]['text']
            cleaned = clean_json_response(text)   # loại bỏ code block
            plant_data = json.loads(cleaned)      # parse JSON thuần
            return plant_data
        except Exception as e:
            return {"error": f"Lỗi phân tích JSON: {e}\nKết quả nhận được: {text}"}
    else:
        return {"error": f"Lỗi API: {res.status_code}\n{res.text}"}

# === HÀM LƯU DỮ LIỆU VÀO JSON FILE ===
def save_to_json(new_data):
    data = []
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            try:
                data = json.load(f)
            except:
                data = []

    # Nếu cây đã tồn tại thì cập nhật, nếu chưa có thì thêm mới
    found = False
    for item in data:
        if item["plant"].lower() == new_data["plant"].lower():
            item.update(new_data)
            found = True
            break
    if not found:
        data.append(new_data)

    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

# === GIAO DIỆN STREAMLIT ===
st.set_page_config(page_title="🌿 Tra cứu cây trồng & lưu JSON", layout="centered")

st.title("🌱 Công cụ AI tra cứu thông tin cây trồng")
plant_name = st.text_input("🔍 Nhập tên cây:")

if st.button("Lấy thông tin & lưu JSON"):
    if plant_name.strip() == "":
        st.warning("⚠️ Vui lòng nhập tên cây.")
    else:
        with st.spinner("🔎 Đang lấy thông tin từ Gemini..."):
            result = get_plant_info(plant_name)
            if "error" in result:
                st.error(result["error"])
            else:
                st.success("✅ Thông tin cây trồng:")
                st.json(result)

                save_to_json(result)
                st.info(f"💾 Đã lưu thông tin của '{plant_name}' vào {DATA_FILE}")
