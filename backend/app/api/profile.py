from fastapi import APIRouter, Depends
from app.models.user import User
from app.models.rating_history import RatingHistory
from app.api.auth import get_current_user

router = APIRouter(prefix="/profile", tags=["profile"])

@router.get("")
async def get_profile(user: User = Depends(get_current_user)):
    ratings = await RatingHistory.find(RatingHistory.user_id == user.id).sort("recorded_at").to_list()
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "rating": user.rating,
        "maxRating": user.max_rating,
        "streakDays": user.streak_days,
        "solvedCount": user.solved_count,
        "ratingHistory": [
            {
                "id": r.id,
                "rating": r.rating,
                "contestId": r.contest_id,
                "recordedAt": r.recorded_at.isoformat()
            }
            for r in ratings
        ]
    }
