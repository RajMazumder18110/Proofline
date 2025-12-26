/** @notice Library imports */
import { drizzle } from "drizzle-orm/mysql2";
/// Local imports
import { configs } from "@/configs";
import * as schema from "@/database/schemas";

/// Database client
export const database = drizzle(configs.database.mysqlUrl, {
  schema,
  mode: "default",
});
