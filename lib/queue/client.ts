/**
 * BullMQ Queue Client
 *
 * Provides the DM processing queue and Redis connection for BullMQ.
 */

import { Queue } from "bullmq";
import Redis from "ioredis";

let connection: Redis | null = null;

export function getRedisConnection(): Redis {
  if (!connection) {
    connection = new Redis(process.env.REDIS_URL!, {
      maxRetriesPerRequest: null,
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  return connection;
}

// ─── DM Queue ───────────────────────────────────────────────────────────────────

export type CommentSource = "WEBHOOK" | "POLLING";

export interface ProcessCommentJob {
  accountConnectionId?: string;
  instagramAccountId: string;
  commentId: string;
  commentText: string;
  commenterId: string;
  commenterName?: string;
  mediaId: string;
  originalMediaId?: string;
  requeueAttempt?: number;
  source?: CommentSource;
}

export interface ProcessPostbackJob {
  accountConnectionId?: string;
  instagramAccountId: string;
  userId: string;
  payload: string;
  mid?: string;
  fallback?: boolean;
}

export interface ProcessFollowUpJob {
  accountConnectionId?: string;
  instagramAccountId: string;
  userId: string;
  automationId: string;
  commenterName?: string | null;
}

export interface ProcessMessageJob {
  accountConnectionId?: string;
  instagramAccountId: string;
  messageId: string;
  messageText: string;
  senderId: string;
}

export type DmQueueJob =
  | ProcessCommentJob
  | ProcessPostbackJob
  | ProcessFollowUpJob
  | ProcessMessageJob;

export const POSTBACK_JOB_NAME = "process-postback";
export const FOLLOWUP_JOB_NAME = "process-followup";
export const MESSAGE_JOB_NAME = "process-message";

let dmQueue: Queue<DmQueueJob> | null = null;

export function getDMQueue(): Queue<DmQueueJob> {
  if (!dmQueue) {
    dmQueue = new Queue<DmQueueJob>("dm-processing", {
      connection: getRedisConnection(),
      defaultJobOptions: {
        removeOnComplete: { count: 1000 },
        removeOnFail: { age: 300, count: 2000 },
        attempts: 3,
        backoff: {
          type: "custom",
        },
      },
    });
  }

  return dmQueue;
}