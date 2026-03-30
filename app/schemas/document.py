from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class DocumentResponse(BaseModel):
    id: int
    project_id: int
    file_name: str
    s3_key: str
    file_size: int
    mime_type: str
    document_type: str
    upload_at: datetime

    model_config = ConfigDict(from_attributes=True)
