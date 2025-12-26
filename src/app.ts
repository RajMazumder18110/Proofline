/** @notice Local imports */
import app from "@/core/express";
import { configs } from "@/configs";
import { erc20 } from "@/core/clients";
import { logger } from "@/configs/logger";

/// Start core clients ///
await erc20.start();

const appServer = app.listen(configs.application.server.port, () => {
  logger.info(`Server is running on port ${configs.application.server.port}`);
});

/// Graceful shutdown ///
configs.application.shutdownSignals.forEach((signal) => {
  process.on(signal, async () => {
    logger.warn(`${signal} received: closing...`);
    /// Stopping events
    await erc20.stop();
    logger.info("ERC20 listener clients stopped.");

    /// Closing the server ///
    appServer.close(() => {
      logger.info("Server closed. Exiting process.");
      process.exit(0);
    });
  });
});
