import streamlit as st
import requests

# === GEMINI API SETUP ===
API_KEY = "AIzaSyBPdziDTCRz89kCLZ9STQZ7WhIaESOQ1jc"
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

# === FUNCTION TO CALL GEMINI ===
def get_plant_info(plant_name):
    prompt = f"""
    Provide detailed information about the plant '{plant_name}' including:
    1. Key characteristics.
    2. Ideal temperature for growth.
    3. Ideal humidity level for cultivation.
    Keep the response short, clear, and easy to understand. Use bullet points if appropriate.
    """

    headers = {
        "Content-Type": "application/json",
        "X-goog-api-key": API_KEY
    }

    data = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ]
    }

    try:
        res = requests.post(GEMINI_URL, headers=headers, json=data)
        if res.status_code == 200:
            return res.json()['candidates'][0]['content']['parts'][0]['text']
        else:
            return f"❌ API Error: {res.status_code}\n{res.text}"
    except Exception as e:
        return f"❗ Error calling API: {e}"

# === STREAMLIT UI ===
st.set_page_config(page_title="🌿 Plant Info Finder with AI", layout="centered")

st.title("🌱 AI-Powered Plant Information Finder")
st.write("Enter the name of a plant to get its **characteristics**, **ideal temperature**, and **humidity range** for optimal growth.")

plant_name = st.text_input("🔍 Enter plant name:")

if st.button("Get Plant Info"):
    if plant_name.strip() == "":
        st.warning("⚠️ Please enter a plant name.")
    else:
        with st.spinner("🔎 Fetching information from Gemini AI..."):
            result = get_plant_info(plant_name)
            st.success("✅ Plant Information:")
            st.markdown(result)
