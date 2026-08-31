FROM python:3.11-slim

# Tesseract itself, plus the handful of shared libs opencv-python-headless
# still dynamically links against even in "headless" builds. Without these,
# `import cv2` / pytesseract calls fail at runtime on a bare python:slim
# image — pip installing opencv-python-headless is NOT enough on its own.
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Render/Railway inject $PORT at runtime — don't hardcode 8000. Shell form
# (not exec-array form) is required for ${PORT} to actually expand.
ENV PORT=8000
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT}
