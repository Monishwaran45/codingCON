import logging
import json
from typing import Optional, Any
import redis.asyncio as aioredis
from app.config import settings

logger = logging.getLogger("app.redis")

class RedisService:
    def __init__(self):
        self.redis: Optional[aioredis.Redis] = None

    async def connect(self):
        try:
            client = aioredis.from_url(settings.REDIS_URL, socket_connect_timeout=2)
            await client.ping()
            self.redis = client
            logger.info(f"✓ Connected to Redis at {settings.REDIS_URL}")
        except Exception as e:
            logger.warning(f"⚠️ Could not connect to external Redis ({e}). Using FakeRedis fallback...")
            try:
                import fakeredis.aioredis
                self.redis = fakeredis.aioredis.FakeRedis()
                logger.info("✓ Connected to FakeRedis in-memory instance")
            except Exception as fake_err:
                logger.error(f"❌ Failed to start FakeRedis: {fake_err}")

    async def get_json(self, key: str) -> Optional[Any]:
        if not self.redis:
            return None
        try:
            val = await self.redis.get(key)
            if val:
                return json.loads(val)
        except Exception:
            pass
        return None

    async def set_json(self, key: str, value: Any, ttl_seconds: int = 300):
        if not self.redis:
            return
        try:
            await self.redis.set(key, json.dumps(value), ex=ttl_seconds)
        except Exception:
            pass

    async def delete(self, key: str):
        if not self.redis:
            return
        try:
            await self.redis.delete(key)
        except Exception:
            pass

redis_service = RedisService()
