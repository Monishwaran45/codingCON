import uuid
import jwt
import bcrypt
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Response, Request, Depends, status

from app.config import settings
from app.models.user import User
from app.models.rating_history import RatingHistory
from app.schemas.auth import RegisterRequest, LoginRequest, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))

def create_jwt_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "userId": user_id,
        "email": email,
        "role": role,
        "exp": datetime.utcnow() + timedelta(days=settings.JWT_EXPIRES_IN_DAYS)
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")

async def get_current_user(request: Request) -> User:
    token = request.cookies.get("token")
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        user = await User.get(payload["userId"])
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        return user
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(req: RegisterRequest, response: Response):
    existing = await User.find_one(User.email == req.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = str(uuid.uuid4())
    pw_hash = hash_password(req.password)
    
    user = User(
        id=user_id,
        username=req.username,
        email=req.email,
        password_hash=pw_hash,
        role=req.role or "student"
    )
    await user.save()

    token = create_jwt_token(user.id, user.email, user.role)
    response.set_cookie(
        key="token",
        value=token,
        httponly=True,
        max_age=settings.JWT_EXPIRES_IN_DAYS * 86400,
        samesite="lax"
    )
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "rating": user.rating,
        "maxRating": user.max_rating,
        "streakDays": user.streak_days,
        "solvedCount": user.solved_count
    }

@router.post("/login")
async def login(req: LoginRequest, response: Response):
    user = await User.find_one(User.email == req.email)
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_jwt_token(user.id, user.email, user.role)
    response.set_cookie(
        key="token",
        value=token,
        httponly=True,
        max_age=settings.JWT_EXPIRES_IN_DAYS * 86400,
        samesite="lax"
    )

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
        "ratingHistory": [{"rating": r.rating, "recordedAt": r.recorded_at.isoformat()} for r in ratings]
    }

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key="token")
    return {"ok": True}

@router.get("/me")
async def get_me(user: User = Depends(get_current_user)):
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
        "ratingHistory": [{"rating": r.rating, "recordedAt": r.recorded_at.isoformat()} for r in ratings]
    }
