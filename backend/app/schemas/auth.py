from pydantic import BaseModel, EmailStr, Field
from typing import Literal, Optional, List
from datetime import datetime

class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: Optional[Literal["student", "admin", "problem_setter"]] = "student"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str = Field(..., alias="id")
    username: str
    email: str
    role: str
    rating: int
    maxRating: int = Field(..., alias="max_rating")
    streakDays: int = Field(default=0, alias="streak_days")
    solvedCount: int = Field(default=0, alias="solved_count")

    class Config:
        populate_by_name = True
