from beanie import Document, Indexed
from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Literal, Optional

class TestCaseResult(BaseModel):
    id: str
    test_case_id: str
    passed: bool = False
    actual_output: Optional[str] = None
    execution_time_ms: Optional[int] = None
    memory_kb: Optional[int] = None
    error: Optional[str] = None
    sort_order: int = 0

class Submission(Document):
    id: str = Field(default_factory=lambda: "", alias="_id")
    problem_id: Indexed(str)
    user_id: Indexed(str)
    contest_id: Optional[str] = None
    language: str
    code: str
    verdict: Literal["pending", "running", "AC", "WA", "TLE", "MLE", "RE"] = "pending"
    passed_test_cases: int = 0
    total_test_cases: int = 0
    execution_time_ms: int = 0
    memory_kb: int = 0
    is_submit: bool = False
    test_case_results: List[TestCaseResult] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "submissions"
