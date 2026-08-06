from pydantic import BaseModel, Field
from typing import Optional

class SubmissionCreate(BaseModel):
    problemId: str = Field(..., alias="problem_id")
    language: str
    code: str
    isSubmit: bool = Field(default=False, alias="is_submit")
    contestId: Optional[str] = Field(default=None, alias="contest_id")

    class Config:
        populate_by_name = True

class SubmissionResponse(BaseModel):
    id: str
    totalTestCases: int

    class Config:
        populate_by_name = True
