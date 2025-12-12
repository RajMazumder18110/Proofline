/** @notice Library imports */
import IORedis from "ioredis";
/// Local imports
import { REDIS_CONNECTION_URL } from "./env";

/// Redis connection instance
export const redisConnection = new IORedis(REDIS_CONNECTION_URL, {
  maxRetriesPerRequest: null,
});

/// Handle Redis connection events
redisConnection.on("connect", () => {
  console.log("Connected to Redis successfully.");
});
redisConnection.on("error", (error) => {
  console.error("Redis connection error:", error);
});
