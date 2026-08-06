from beanie import Document
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Dict, Optional, Any

class ProblemScoreBreakdown(BaseModel):
    score: int = 0
    attempted: bool = False
    solved_time: Optional[str] = None

class Leaderboard(Document):
    contest_id: str
    user_id: str
    username: str
    solved_count: int = 0
    total_score: int = 0
    penalty_time_minutes: int = 0
    problem_breakdown: Dict[str, ProblemScoreBreakdown] = Field(default_factory=dict)
    last_updated: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "leaderboards"
        indexes = [
            [("contest_id", 1), ("user_id", 1)],
            [("contest_id", 1), ("total_score", -1), ("penalty_time_minutes", 1)],
        ]
