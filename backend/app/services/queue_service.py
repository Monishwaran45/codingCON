import logging
import json
import asyncio
from typing import Optional, Callable, Awaitable
import aio_pika
from app.config import settings

logger = logging.getLogger("app.queue")

QUEUE_NAME = "submission_queue"

class QueueService:
    def __init__(self):
        self.connection: Optional[aio_pika.RobustConnection] = None
        self.channel: Optional[aio_pika.RobustChannel] = None
        self.queue: Optional[aio_pika.RobustQueue] = None
        self.memory_queue: asyncio.Queue = asyncio.Queue()
        self.is_memory_fallback: bool = False

    async def connect(self):
        try:
            self.connection = await aio_pika.connect_robust(
                settings.RABBITMQ_URL, timeout=2.0
            )
            self.channel = await self.connection.channel()
            self.queue = await self.channel.declare_queue(QUEUE_NAME, durable=True)
            logger.info(f"✓ Connected to RabbitMQ queue '{QUEUE_NAME}' at {settings.RABBITMQ_URL}")
        except Exception as e:
            logger.warning(f"⚠️ Could not connect to RabbitMQ ({e}). Using In-Memory asyncio.Queue fallback...")
            self.is_memory_fallback = True

    async def publish_submission(self, payload: dict):
        if not self.is_memory_fallback and self.channel:
            try:
                message = aio_pika.Message(
                    body=json.dumps(payload).encode(),
                    delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
                )
                await self.channel.default_exchange.publish(message, routing_key=QUEUE_NAME)
                return
            except Exception as e:
                logger.error(f"Failed to publish to RabbitMQ: {e}")

        # Fallback to memory queue
        await self.memory_queue.put(payload)

    async def consume_submissions(self, callback: Callable[[dict], Awaitable[None]]):
        if not self.is_memory_fallback and self.queue:
            async with self.queue.iterator() as queue_iter:
                async for message in queue_iter:
                    async with message.process():
                        payload = json.loads(message.body.decode())
                        await callback(payload)
        else:
            while True:
                payload = await self.memory_queue.get()
                try:
                    await callback(payload)
                except Exception as e:
                    logger.error(f"Error processing memory queue submission: {e}")
                finally:
                    self.memory_queue.task_done()

queue_service = QueueService()
