from fastapi import APIRouter, HTTPException, Depends
from app.models.leaderboard import Leaderboard
from app.services.redis_service import redis_service

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])

@router.get("/{contest_id}")
async def get_leaderboard(contest_id: str):
    cache_key = f"leaderboard:{contest_id}"
    cached = await redis_service.get_json(cache_key)
    if cached:
        return cached

    entries = await Leaderboard.find(Leaderboard.contest_id == contest_id).sort("-total_score", "+penalty_time_minutes").to_list()
    res = [
        {
            "userId": entry.user_id,
            "username": entry.username,
            "rank": idx + 1,
            "score": entry.total_score,
            "solvedCount": entry.solved_count,
            "penaltyMinutes": entry.penalty_time_minutes,
            "problemBreakdown": {k: v.model_dump() for k, v in entry.problem_breakdown.items()}
        }
        for idx, entry in enumerate(entries)
    ]
    await redis_service.set_json(cache_key, res, ttl_seconds=60)
    return res
