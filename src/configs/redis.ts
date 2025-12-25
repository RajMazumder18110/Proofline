/** @notice Library imports */
import IORedis from "ioredis";
/// Local imports
import { logger } from "./logger";
import { REDIS_CONNECTION_URL } from "./env";

/// Redis connection instance
export const redisConnection = new IORedis(REDIS_CONNECTION_URL, {
  maxRetriesPerRequest: null,
});

/// Handle Redis connection events
redisConnection.on("connect", () => {
  logger.info("Redis connected successfully.");
});
redisConnection.on("error", (error) => {
  logger.error("Redis connection error:", error);
});
