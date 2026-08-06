from beanie import Document, Indexed
from pydantic import Field
from datetime import datetime
from typing import Literal

class User(Document):
    id: str = Field(default_factory=lambda: "", alias="_id")
    username: Indexed(str, unique=True)
    email: Indexed(str, unique=True)
    password_hash: str
    role: Literal["student", "admin", "problem_setter"] = "student"
    rating: int = 1500
    max_rating: int = 1500
    streak_days: int = 0
    solved_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"
