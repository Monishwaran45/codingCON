from beanie import Document, Indexed
from pydantic import Field
from datetime import datetime
from typing import Optional

class Announcement(Document):
    id: str = Field(default_factory=lambda: "", alias="_id")
    contest_id: Indexed(str)
    message: str
    created_by: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "announcements"
