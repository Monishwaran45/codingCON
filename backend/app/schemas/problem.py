from pydantic import BaseModel, Field
from typing import List, Literal, Optional

class TestCaseSchema(BaseModel):
    id: Optional[str] = None
    input: str = ""
    expectedOutput: str = Field(..., alias="expected_output")
    isSample: bool = Field(default=False, alias="is_sample")
    sortOrder: int = Field(default=0, alias="sort_order")

    class Config:
        populate_by_name = True

class ProblemCreate(BaseModel):
    title: str = Field(..., min_length=2)
    difficulty: Literal["easy", "medium", "hard"]
    points: int = 100
    timeLimitMs: int = Field(default=1000, alias="time_limit_ms")
    memoryLimitMb: int = Field(default=256, alias="memory_limit_mb")
    description: str = ""
    inputFormat: str = Field(default="", alias="input_format")
    outputFormat: str = Field(default="", alias="output_format")
    tags: List[str] = Field(default_factory=list)
    testCases: List[TestCaseSchema] = Field(default_factory=list, alias="test_cases")

    class Config:
        populate_by_name = True

class ProblemResponse(BaseModel):
    id: str = Field(..., alias="id")
    title: str
    slug: str
    difficulty: str
    points: int
    timeLimitMs: int = Field(..., alias="time_limit_ms")
    memoryLimitMb: int = Field(..., alias="memory_limit_mb")
    acceptanceRate: float = Field(..., alias="acceptance_rate")
    totalSubmissions: int = Field(..., alias="total_submissions")
    description: str
    inputFormat: str = Field(..., alias="input_format")
    outputFormat: str = Field(..., alias="output_format")
    tags: List[str]
    isActive: bool = Field(..., alias="is_active")
    testCases: List[TestCaseSchema] = Field(..., alias="test_cases")

    class Config:
        populate_by_name = True
