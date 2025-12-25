/** @notice Local imports */
import app from "@/core/express";
import { erc20 } from "@/core/clients";
import { logger } from "@/configs/logger";

/// Start core clients ///
await erc20.start();

app.listen(3000, () => {
  logger.info("Server is running on port 3000");
});
