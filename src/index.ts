/** @notice Local imports */
import app from "@/core/express";
import { erc20, erc20Queue } from "@/core/clients";

/// Start core clients ///
await erc20Queue.start();
await erc20.start();

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
