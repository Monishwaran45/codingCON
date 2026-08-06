from beanie import Document
from pydantic import Field
from datetime import datetime
from typing import List, Optional

class Contest(Document):
    id: str = Field(default_factory=lambda: "", alias="_id")
    title: str
    start_time: datetime
    end_time: datetime
    duration_minutes: int = 120
    participant_count: int = 0
    max_score: int = 0
    is_leaderboard_frozen: bool = False
    freeze_time_remaining_minutes: Optional[int] = None
    created_by: Optional[str] = None
    problem_ids: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "contests"
