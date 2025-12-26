/** @notice Local imports */
import app from "@/core/express";
import { erc20 } from "@/core/clients";
import { logger } from "@/configs/logger";
import { configs } from "@/configs";

/// Start core clients ///
await erc20.start();

app.listen(configs.application.server.port, () => {
  logger.info(`Server is running on port ${configs.application.server.port}`);
});
