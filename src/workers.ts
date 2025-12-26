/** @notice Local imports */
import { configs } from "@/configs";
import { logger } from "@/configs/logger";
import { redisConnection } from "@/configs/redis";
import { TransfersWorker } from "@/workers/TransfersWorker";
import { orderEventQueue, orderManager } from "@/core/clients";

/// Workers ///
const transfersWorker = new TransfersWorker(
  redisConnection,
  orderManager,
  orderEventQueue
);

/// Graceful shutdown ///
configs.application.shutdownSignals.forEach((signal) => {
  process.on(signal, async () => {
    logger.warn(`${signal} received: closing...`);
    /// Stopping all the workers ///
    await Promise.allSettled([transfersWorker.stop()]);
    logger.info("All workers stopped. Exiting process.");
    process.exit(0);
  });
});

/// Starting all the workers ///
await Promise.allSettled([transfersWorker.start()]);
