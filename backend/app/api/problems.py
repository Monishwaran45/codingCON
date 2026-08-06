import uuid
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends, status, Query

from app.models.user import User
from app.models.problem import Problem, TestCase
from app.schemas.problem import ProblemCreate, ProblemResponse
from app.api.auth import get_current_user
from app.services.redis_service import redis_service

router = APIRouter(prefix="/problems", tags=["problems"])

def slugify(title: str) -> str:
    return title.lower().replace(" ", "-").replace("'", "")

def format_problem_response(p: Problem, include_all_cases: bool = False):
    cases = p.test_cases if include_all_cases else [tc for tc in p.test_cases if tc.is_sample]
    return {
        "id": p.id,
        "title": p.title,
        "slug": p.slug,
        "difficulty": p.difficulty,
        "points": p.points,
        "timeLimitMs": p.time_limit_ms,
        "memoryLimitMb": p.memory_limit_mb,
        "acceptanceRate": p.acceptance_rate,
        "totalSubmissions": p.total_submissions,
        "description": p.description,
        "inputFormat": p.input_format,
        "outputFormat": p.output_format,
        "tags": p.tags,
        "isActive": p.is_active,
        "testCases": [
            {
                "id": tc.id,
                "input": tc.input,
                "expectedOutput": tc.expected_output,
                "isSample": tc.is_sample,
                "sortOrder": tc.sort_order
            }
            for tc in cases
        ]
    }

@router.get("")
async def get_problems(
    difficulty: Optional[str] = None,
    tag: Optional[str] = None,
    q: Optional[str] = None
):
    cache_key = f"problems:query:{difficulty}:{tag}:{q}"
    cached = await redis_service.get_json(cache_key)
    if cached:
        return cached

    query = Problem.find(Problem.is_active == True)
    if difficulty:
        query = query.find(Problem.difficulty == difficulty.lower())
    if tag:
        query = query.find(Problem.tags == tag)

    problems = await query.to_list()
    if q:
        q_lower = q.lower()
        problems = [p for p in problems if q_lower in p.title.lower() or q_lower in p.description.lower()]

    res = [format_problem_response(p, include_all_cases=False) for p in problems]
    await redis_service.set_json(cache_key, res, ttl_seconds=60)
    return res

@router.get("/{problem_id}")
async def get_problem_by_id(problem_id: str):
    problem = await Problem.get(problem_id)
    if not problem or not problem.is_active:
        # Try finding by slug
        problem = await Problem.find_one(Problem.slug == problem_id, Problem.is_active == True)
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    return format_problem_response(problem, include_all_cases=False)

@router.get("/{problem_id}/admin")
async def get_problem_admin(problem_id: str, user: User = Depends(get_current_user)):
    if user.role not in ["admin", "problem_setter"]:
        raise HTTPException(status_code=403, detail="Forbidden")

    problem = await Problem.get(problem_id)
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    return format_problem_response(problem, include_all_cases=True)

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_problem(req: ProblemCreate, user: User = Depends(get_current_user)):
    if user.role not in ["admin", "problem_setter"]:
        raise HTTPException(status_code=403, detail="Forbidden")

    prob_id = str(uuid.uuid4())
    slug = slugify(req.title)
    
    test_cases = [
        TestCase(
            id=tc.id or str(uuid.uuid4()),
            input=tc.input,
            expected_output=tc.expectedOutput,
            is_sample=tc.isSample,
            sort_order=tc.sortOrder
        )
        for tc in req.testCases
    ]

    problem = Problem(
        id=prob_id,
        title=req.title,
        slug=slug,
        difficulty=req.difficulty,
        points=req.points,
        time_limit_ms=req.timeLimitMs,
        memory_limit_mb=req.memoryLimitMb,
        description=req.description,
        input_format=req.inputFormat,
        output_format=req.outputFormat,
        tags=req.tags,
        test_cases=test_cases,
        created_by=user.id
    )
    await problem.save()
    return format_problem_response(problem, include_all_cases=True)
