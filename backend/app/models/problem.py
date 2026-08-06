from beanie import Document, Indexed
from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Literal, Optional

class TestCase(BaseModel):
    id: str
    input: str = ""
    expected_output: str = ""
    is_sample: bool = False
    sort_order: int = 0

class Problem(Document):
    id: str = Field(default_factory=lambda: "", alias="_id")
    title: str
    slug: Indexed(str, unique=True)
    difficulty: Literal["easy", "medium", "hard"]
    points: int = 100
    time_limit_ms: int = 1000
    memory_limit_mb: int = 256
    acceptance_rate: float = 0.0
    total_submissions: int = 0
    description: str = ""
    input_format: str = ""
    output_format: str = ""
    tags: List[str] = Field(default_factory=list)
    is_active: bool = True
    created_by: Optional[str] = None
    test_cases: List[TestCase] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "problems"
