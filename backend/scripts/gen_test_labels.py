"""
Generates synthetic package-label test images so the OCR + rule engine
pipeline can be validated deterministically, without needing real product
photos or network access to a stock-image service.
"""
from PIL import Image, ImageDraw, ImageFont
import os

FONT_PATH = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "test_images")
os.makedirs(OUT_DIR, exist_ok=True)


def draw_label(filename, lines, size=(700, 900), noise=False, blur=False):
    img = Image.new("RGB", size, "white")
    d = ImageDraw.Draw(img)
    y = 40
    for text, bold, fs in lines:
        font = ImageFont.truetype(FONT_BOLD if bold else FONT_PATH, fs)
        d.text((40, y), text, fill="black", font=font)
        bbox = d.textbbox((40, y), text, font=font)
        y = bbox[3] + 22

    if blur:
        from PIL import ImageFilter
        img = img.filter(ImageFilter.GaussianBlur(2.2))

    if noise:
        import random
        px = img.load()
        for _ in range(size[0] * size[1] // 12):
            x, y_ = random.randint(0, size[0] - 1), random.randint(0, size[1] - 1)
            v = random.randint(150, 255)
            px[x, y_] = (v, v, v)

    path = os.path.join(OUT_DIR, filename)
    img.save(path, quality=90)
    print("wrote", path)
    return path


# 1. A clean, fully-compliant label — every declaration present and clear.
draw_label(
    "good_label.jpg",
    [
        ("Basmati Rice, Premium Aged", True, 30),
        ("Extra Long Grain", False, 20),
        ("", False, 10),
        ("Net Quantity: 5 kg", True, 24),
        ("MRP: Rs. 450.00 (incl. of all taxes)", True, 24),
        ("", False, 10),
        ("Marketed by: Golden Harvest Foods Pvt Ltd", False, 20),
        ("Address: Plot 42, Industrial Area,", False, 18),
        ("Sonipat, Haryana 131001, India", False, 18),
        ("", False, 10),
        ("Mfg Date: 03/2026   Best Before: 12 months", False, 18),
        ("Batch No: GH2603A", False, 18),
        ("", False, 10),
        ("Customer Care: 1800-123-4567", False, 18),
        ("Email: care@goldenharvest.in", False, 18),
        ("", False, 10),
        ("Country of Origin: India", True, 20),
    ],
)

# 2. Missing MRP and manufacturer entirely -> should trigger NON-COMPLIANCE.
draw_label(
    "noncompliant_label.jpg",
    [
        ("Detergent Powder, Active Foam", True, 30),
        ("", False, 10),
        ("Net Weight: 1 kg", True, 24),
        ("", False, 20),
        ("Customer Care: support@example.com", False, 18),
        ("", False, 10),
        ("Country of Origin: India", False, 18),
    ],
)

# 3. A clean label but captured blurry/noisy -> should trigger REVIEW
#    (low OCR confidence) rather than an automatic PASS or FAIL.
draw_label(
    "blurry_label.jpg",
    [
        ("Herbal Toothpaste", True, 28),
        ("Net Qty: 100 g", True, 22),
        ("MRP: Rs. 89.00", True, 22),
        ("Mfg by: CleanCare Industries", False, 18),
        ("Address: 7 MG Road, Pune 411001", False, 16),
        ("Customer Care: 1800-999-8888", False, 16),
        ("Country of Origin: India", False, 16),
    ],
    blur=True,
    noise=True,
)


# 4. Two-column layout — declarations on the left, ingredients on the right
#    at the same row height. This is extremely common on real Indian snack
#    packaging (see the "Aloo Bhujiya"-style label reported in production)
#    but was entirely absent from this test set, which is why Tesseract's
#    single-column line grouping (--psm 6 merges same-row columns into one
#    "line") went uncaught: it silently produced oversized bounding boxes
#    that stretched across both columns. Keep this case around as a
#    regression check for ocr.py's column-gap line-splitting.
def draw_two_column_label(filename, left_lines, right_lines, size=(1000, 700)):
    img = Image.new("RGB", size, "white")
    d = ImageDraw.Draw(img)
    title_font = ImageFont.truetype(FONT_BOLD, 30)
    d.rectangle([30, 20, 600, 80], outline="black", width=4)
    d.text((60, 30), "Aloo Bhujiya", fill="black", font=title_font)

    body_font = ImageFont.truetype(FONT_PATH, 22)
    left_x, right_x, y = 30, 480, 110
    for text in left_lines:
        d.text((left_x, y), text, fill="black", font=body_font)
        y += 38
    y = 110
    for text in right_lines:
        d.text((right_x, y), text, fill="black", font=body_font)
        y += 38

    path = os.path.join(OUT_DIR, filename)
    img.save(path, quality=90)
    print("wrote", path)
    return path


draw_two_column_label(
    "two_column_label.jpg",
    left_lines=[
        "Net Weight : 250 g",
        "Batch : 1000120230424",
        "MFG Date : 24/04/2023",
        "MRP: 120/- (Including all Taxes)",
        "Best Before 90 Days from MFG Date",
    ],
    right_lines=[
        "Ingredients : Besan,",
        "Edible Oil, Sugar, Salt,",
        "Masala, Termeric Powder,",
        "Poteto Powder, Dryfruits,",
    ],
)
