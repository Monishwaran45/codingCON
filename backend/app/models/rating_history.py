from beanie import Document, Indexed
from pydantic import Field
from datetime import datetime
from typing import Optional

class RatingHistory(Document):
    id: str = Field(default_factory=lambda: "", alias="_id")
    user_id: Indexed(str)
    rating: int
    contest_id: Optional[str] = None
    recorded_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "rating_history"
