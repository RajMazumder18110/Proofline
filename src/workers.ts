/** @notice Local imports */
import { redisConnection } from "@/configs/redis";
import { TransfersWorker } from "@/workers/TransfersWorker";
import { orderEventQueue, orderManager } from "@/core/clients";
import { logger } from "./configs/logger";

/// Workers ///
const transfersWorker = new TransfersWorker(
  redisConnection,
  orderManager,
  orderEventQueue
);

/// Graceful shutdown ///
["SIGINT", "SIGTERM"].forEach((signal) => {
  process.on(signal, async () => {
    console.warn(`\n${signal} received: closing workers...`);
    /// Stopping all the workers ///
    await Promise.allSettled([transfersWorker.stop()]);
    logger.info("All workers stopped. Exiting process.");
    process.exit(0);
  });
});

/// Starting all the workers ///
await Promise.allSettled([transfersWorker.start()]);
