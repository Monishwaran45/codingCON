import amqp from 'amqplib';
import { EventEmitter } from 'events';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672/';
const QUEUE_NAME = 'judge_queue';

let connection: any = null;
let channel: any = null;

// Fallback mechanism
const fallbackEmitter = new EventEmitter();
let isFallback = false;

export async function connectRabbitMQ(retries = 3): Promise<void> {
  if (channel || isFallback) return;

  while (retries > 0) {
    try {
      connection = await amqp.connect(RABBITMQ_URL);
      channel = await connection.createChannel();
      await channel.assertQueue(QUEUE_NAME, {
        durable: true,
      });
      await channel.assertQueue('socket_events_queue', {
        durable: false, // Don't need to persist socket events if server restarts
      });
      console.log('✓ RabbitMQ connected to judge_queue and socket_events_queue');
      return;
    } catch (error: any) {
      retries--;
      if (retries === 0) {
        console.warn(`⚠️ RabbitMQ unavailable — starting fallback In-Memory Queue...`);
        console.log('✓ Connected to In-Memory Queue (EventEmitter)');
        isFallback = true;

        // Start the judge worker in-process so it can consume from the fallback emitter
        try {
          require('../worker');
        } catch (err) {
          console.error('Failed to start fallback worker:', err);
        }
      } else {
        console.warn(`⚠️ Could not connect to RabbitMQ (retries left: ${retries}):`, (error as Error).message ?? error);
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }
}

export async function publishJudgeJob(job: any): Promise<void> {
  if (!channel && !isFallback) await connectRabbitMQ();
  
  if (isFallback) {
    fallbackEmitter.emit('job', job);
  } else {
    channel!.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(job)), {
      persistent: true,
    });
  }
}

export async function consumeJudgeJobs(handler: (job: any) => Promise<void>): Promise<void> {
  if (!channel && !isFallback) await connectRabbitMQ();
  
  if (isFallback) {
    console.log(`[*] Waiting for messages in in-memory ${QUEUE_NAME} (fallback).`);
    fallbackEmitter.on('job', async (job) => {
      try {
        await handler(job);
      } catch (err) {
        console.error('Error processing judge job (fallback):', err);
      }
    });
  } else {
    channel!.prefetch(1);
    
    console.log(`[*] Waiting for messages in ${QUEUE_NAME}.`);
    
    channel!.consume(QUEUE_NAME, async (msg: any) => {
      if (msg !== null) {
        try {
          const job = JSON.parse(msg.content.toString());
          await handler(job);
          channel!.ack(msg); // acknowledge successful processing
        } catch (err) {
          console.error('Error processing judge job:', err);
          channel!.nack(msg, false, true); // requeue on error
        }
      }
    });
  }
}

export async function publishSocketEvent(room: string, eventName: string, data: any): Promise<void> {
  if (!channel && !isFallback) await connectRabbitMQ();
  
  const payload = { room, eventName, data };
  
  if (isFallback) {
    fallbackEmitter.emit('socket_event', payload);
  } else {
    channel!.sendToQueue('socket_events_queue', Buffer.from(JSON.stringify(payload)), {
      persistent: false,
    });
  }
}

export async function consumeSocketEvents(handler: (payload: { room: string, eventName: string, data: any }) => void): Promise<void> {
  if (!channel && !isFallback) await connectRabbitMQ();
  
  if (isFallback) {
    fallbackEmitter.on('socket_event', handler);
  } else {
    channel!.consume('socket_events_queue', (msg: any) => {
      if (msg !== null) {
        try {
          const payload = JSON.parse(msg.content.toString());
          handler(payload);
          channel!.ack(msg);
        } catch (err) {
          console.error('Error processing socket event:', err);
          channel!.ack(msg); // drop bad events
        }
      }
    });
  }
}

