FROM python:3.11-slim

# Tesseract itself, plus the handful of shared libs opencv-python-headless
# still dynamically links against even in "headless" builds.
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

ENV PORT=8000

CMD python -m scripts.seed && uvicorn app.main:app --host 0.0.0.0 --port ${PORT}