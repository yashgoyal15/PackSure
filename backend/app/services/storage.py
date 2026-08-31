"""
Minimal local-disk storage for uploaded package images.

Swap this module for an S3/GCS-backed implementation in production; the
rest of the app only calls `save_upload()` and reads `InspectionImage.file_path`,
so no other code needs to change.
"""
import os
import uuid

from fastapi import UploadFile

from app.core.config import settings

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)


def save_upload(file: UploadFile, inspection_id: int) -> str:
    ext = os.path.splitext(file.filename or "")[1].lower() or ".jpg"
    if ext not in (".jpg", ".jpeg", ".png"):
        ext = ".jpg"

    subdir = os.path.join(settings.UPLOAD_DIR, str(inspection_id))
    os.makedirs(subdir, exist_ok=True)

    filename = f"{uuid.uuid4().hex}{ext}"
    path = os.path.join(subdir, filename)

    with open(path, "wb") as out:
        out.write(file.file.read())

    return path
