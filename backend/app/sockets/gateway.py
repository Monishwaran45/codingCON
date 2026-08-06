import logging
import socketio
from app.config import settings

logger = logging.getLogger("app.sockets")

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=[settings.CORS_ORIGIN, "http://localhost:3000", "*"],
)

@sio.event
async def connect(sid, environ):
    logger.info(f"Socket connected: {sid}")

@sio.event
async def disconnect(sid):
    logger.info(f"Socket disconnected: {sid}")

@sio.event
async def subscribe_submission(sid, submission_id: str):
    room = f"submission:{submission_id}"
    await sio.enter_room(sid, room)
    logger.info(f"Sid {sid} subscribed to room {room}")

@sio.event
async def subscribe_leaderboard(sid, contest_id: str):
    room = f"contest:{contest_id}"
    await sio.enter_room(sid, room)
    logger.info(f"Sid {sid} subscribed to room {room}")

@sio.event
async def subscribe_contest(sid, contest_id: str):
    room = f"contest:{contest_id}"
    await sio.enter_room(sid, room)
    logger.info(f"Sid {sid} subscribed to room {room}")

async def emit_submission_progress(submission_id: str, data: dict):
    room = f"submission:{submission_id}"
    await sio.emit("submission:progress", data, room=room)

async def emit_submission_done(submission_id: str, data: dict):
    room = f"submission:{submission_id}"
    await sio.emit("submission:done", data, room=room)

async def emit_leaderboard_update(contest_id: str, leaderboard_data: list):
    room = f"contest:{contest_id}"
    await sio.emit("leaderboard:update", leaderboard_data, room=room)

async def emit_announcement(contest_id: str, announcement_data: dict):
    room = f"contest:{contest_id}"
    await sio.emit("announcement", announcement_data, room=room)
