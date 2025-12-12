/** @notice Library imports */
import { defineConfig } from "drizzle-kit";
/// Local imports
import { MYSQL_CONNECTION_URL } from "@/configs/env";

export default defineConfig({
  schema: "./src/database/schemas/index.ts",
  out: "./migrations",
  dialect: "mysql",
  dbCredentials: {
    url: MYSQL_CONNECTION_URL,
  },
});
