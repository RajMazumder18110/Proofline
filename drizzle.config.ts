/** @notice Library imports */
import { defineConfig } from "drizzle-kit";
/// Local imports
import { configs } from "@/configs";

export default defineConfig({
  schema: "./src/database/schemas/index.ts",
  out: "./migrations",
  dialect: "mysql",
  dbCredentials: {
    url: configs.database.mysqlUrl,
  },
});
