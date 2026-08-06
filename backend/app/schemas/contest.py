from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional

class ContestCreate(BaseModel):
    title: str = Field(..., min_length=2)
    startTime: datetime = Field(..., alias="start_time")
    endTime: datetime = Field(..., alias="end_time")
    durationMinutes: int = Field(default=120, alias="duration_minutes")
    maxScore: int = Field(default=0, alias="max_score")
    problemIds: List[str] = Field(default_factory=list, alias="problem_ids")

    class Config:
        populate_by_name = True

class AnnouncementCreate(BaseModel):
    message: str = Field(..., min_length=1)

class ContestResponse(BaseModel):
    id: str = Field(..., alias="id")
    title: str
    startTime: datetime = Field(..., alias="start_time")
    endTime: datetime = Field(..., alias="end_time")
    durationMinutes: int = Field(..., alias="duration_minutes")
    participantCount: int = Field(..., alias="participant_count")
    maxScore: int = Field(..., alias="max_score")
    isLeaderboardFrozen: bool = Field(..., alias="is_leaderboard_frozen")
    problemIds: List[str] = Field(..., alias="problem_ids")
    problems: Optional[List[dict]] = None
    announcements: Optional[List[dict]] = None

    class Config:
        populate_by_name = True
