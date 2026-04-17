import os
import uuid
from pathlib import Path
from typing import Tuple

from fastapi import UploadFile

from .config import settings


class LocalStorage:
    def __init__(self, base_dir: str):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def save(self, file: UploadFile) -> Tuple[str, str, int]:
        ext = Path(file.filename or "").suffix
        safe_name = f"{uuid.uuid4().hex}{ext}"
        dest = self.base_dir / safe_name
        with dest.open("wb") as buffer:
            buffer.write(file.file.read())
        url = f"/uploads/{safe_name}"
        size = dest.stat().st_size
        return safe_name, url, size


# Placeholder for future S3-compatible backend
class S3Storage:
    def __init__(self):
        raise NotImplementedError("S3 storage not configured")

    def save(self, file: UploadFile):
        raise NotImplementedError


def get_storage():
    if settings.file_storage_backend == "local":
        return LocalStorage(settings.upload_dir)
    return LocalStorage(settings.upload_dir)
