import logging
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio
import uvicorn

from app.config import settings
from app.db import init_db
from app.services.redis_service import redis_service
from app.services.queue_service import queue_service
from app.sockets.gateway import sio
from app.worker.judge_worker import process_submission

from app.api.auth import router as auth_router
from app.api.problems import router as problems_router
from app.api.contest import router as contest_router
from app.api.leaderboard import router as leaderboard_router
from app.api.submissions import router as submissions_router
from app.api.profile import router as profile_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("app.main")

worker_task = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global worker_task
    logger.info("Initializing CodingCON FastAPI backend infrastructure...")
    
    # 1. Initialize DB (MongoDB + Beanie)
    await init_db()
    
    # 2. Connect Redis
    await redis_service.connect()
    
    # 3. Connect RabbitMQ Queue
    await queue_service.connect()
    
    # 4. Start background Judge Worker listener
    worker_task = asyncio.create_task(queue_service.consume_submissions(process_submission))
    
    logger.info("🚀 CodingCON FastAPI Server successfully started!")
    yield
    
    # Shutdown
    if worker_task:
        worker_task.cancel()

fastapi_app = FastAPI(
    title="CodingCON Enterprise API",
    description="FastAPI + Beanie ODM + Pydantic V2 + Redis + RabbitMQ + Docker Sandbox",
    version="2.0.0",
    lifespan=lifespan
)

# CORS Middleware
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.CORS_ORIGIN, "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health Check
@fastapi_app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "service": "FastAPI",
        "database": "MongoDB (Beanie ODM)",
        "cache": "Redis",
        "queue": "RabbitMQ",
        "engine": "Pydantic V2"
    }

# Register Routers
fastapi_app.include_router(auth_router, prefix="/api")
fastapi_app.include_router(problems_router, prefix="/api")
fastapi_app.include_router(contest_router, prefix="/api")
fastapi_app.include_router(leaderboard_router, prefix="/api")
fastapi_app.include_router(submissions_router, prefix="/api")
fastapi_app.include_router(profile_router, prefix="/api")

# Wrap FastAPI with Socket.IO ASGI application
app = socketio.ASGIApp(
    socketio_server=sio,
    other_asgi_app=fastapi_app
)

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
