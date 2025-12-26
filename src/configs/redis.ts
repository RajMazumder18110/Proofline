/** @notice Library imports */
import IORedis from "ioredis";
/// Local imports
import { logger } from "./logger";
import { configs } from "@/configs";

/// Redis connection instance
export const redisConnection = new IORedis(configs.database.redisUrl, {
  maxRetriesPerRequest: null,
});

/// Handle Redis connection events
redisConnection.on("connect", () => {
  logger.info("Redis connected successfully.");
});
redisConnection.on("error", (error) => {
  logger.error("Redis connection error:", error);
});
