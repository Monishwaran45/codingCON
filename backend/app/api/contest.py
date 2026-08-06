import uuid
from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, status

from app.models.user import User
from app.models.contest import Contest
from app.models.problem import Problem
from app.models.announcement import Announcement
from app.schemas.contest import ContestCreate, AnnouncementCreate
from app.api.auth import get_current_user
from app.sockets.gateway import emit_announcement

router = APIRouter(prefix="/contest", tags=["contest"])

def format_contest_response(c: Contest, problems: List[dict] = None, announcements: List[dict] = None):
    now = datetime.utcnow()
    is_frozen = c.is_leaderboard_frozen
    if not is_frozen and c.freeze_time_remaining_minutes is not None:
        remaining_minutes = (c.end_time - now).total_seconds() / 60.0
        if remaining_minutes <= c.freeze_time_remaining_minutes:
            is_frozen = True

    return {
        "id": c.id,
        "title": c.title,
        "startTime": c.start_time.isoformat(),
        "endTime": c.end_time.isoformat(),
        "durationMinutes": c.duration_minutes,
        "participantCount": c.participant_count,
        "maxScore": c.max_score,
        "isLeaderboardFrozen": is_frozen,
        "problemIds": c.problem_ids,
        "problems": problems or [],
        "announcements": announcements or []
    }

@router.get("")
async def get_contests():
    contests = await Contest.find_all().sort("-start_time").to_list()
    return [format_contest_response(c) for c in contests]

@router.get("/active")
async def get_active_contest():
    now = datetime.utcnow()
    contest = await Contest.find_one(Contest.end_time >= now).sort("+end_time")
    if not contest:
        contest = await Contest.find_all().sort("-created_at").first_or_none()
    if not contest:
        raise HTTPException(status_code=404, detail="No active contest found")

    problems = await Problem.find({"_id": {"$in": contest.problem_ids}}).to_list()
    formatted_problems = [
        {
            "id": p.id,
            "title": p.title,
            "slug": p.slug,
            "difficulty": p.difficulty,
            "points": p.points,
            "tags": p.tags,
            "acceptanceRate": p.acceptance_rate
        }
        for p in problems
    ]

    announcements = await Announcement.find(Announcement.contest_id == contest.id).sort("-timestamp").to_list()
    formatted_announcements = [
        {
            "id": a.id,
            "contestId": a.contest_id,
            "message": a.message,
            "timestamp": a.timestamp.isoformat()
        }
        for a in announcements
    ]

    return format_contest_response(contest, problems=formatted_problems, announcements=formatted_announcements)

@router.get("/{contest_id}")
async def get_contest_by_id(contest_id: str):
    contest = await Contest.get(contest_id)
    if not contest:
        raise HTTPException(status_code=404, detail="Contest not found")

    problems = await Problem.find({"_id": {"$in": contest.problem_ids}}).to_list()
    formatted_problems = [
        {
            "id": p.id,
            "title": p.title,
            "slug": p.slug,
            "difficulty": p.difficulty,
            "points": p.points,
            "tags": p.tags,
            "acceptanceRate": p.acceptance_rate
        }
        for p in problems
    ]

    announcements = await Announcement.find(Announcement.contest_id == contest.id).sort("-timestamp").to_list()
    formatted_announcements = [
        {
            "id": a.id,
            "contestId": a.contest_id,
            "message": a.message,
            "timestamp": a.timestamp.isoformat()
        }
        for a in announcements
    ]

    return format_contest_response(contest, problems=formatted_problems, announcements=formatted_announcements)

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_contest(req: ContestCreate, user: User = Depends(get_current_user)):
    if user.role not in ["admin", "problem_setter"]:
        raise HTTPException(status_code=403, detail="Forbidden")

    contest_id = str(uuid.uuid4())
    contest = Contest(
        id=contest_id,
        title=req.title,
        start_time=req.startTime,
        end_time=req.endTime,
        duration_minutes=req.durationMinutes,
        max_score=req.maxScore,
        problem_ids=req.problemIds,
        created_by=user.id
    )
    await contest.save()
    return format_contest_response(contest)

@router.post("/{contest_id}/announcements")
async def add_announcement(contest_id: str, req: AnnouncementCreate, user: User = Depends(get_current_user)):
    if user.role not in ["admin", "problem_setter"]:
        raise HTTPException(status_code=403, detail="Forbidden")

    ann_id = str(uuid.uuid4())
    ann = Announcement(
        id=ann_id,
        contest_id=contest_id,
        message=req.message,
        created_by=user.id
    )
    await ann.save()

    ann_data = {
        "id": ann.id,
        "contestId": ann.contest_id,
        "message": ann.message,
        "timestamp": ann.timestamp.isoformat()
    }
    await emit_announcement(contest_id, ann_data)
    return ann_data
