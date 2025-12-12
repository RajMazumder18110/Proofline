/** @notice Library imports */
import { drizzle } from "drizzle-orm/mysql2";
/// Local imports
import * as schema from "@/database/schemas";
import { MYSQL_CONNECTION_URL } from "@/configs/env";

/// Database client
export const database = drizzle(MYSQL_CONNECTION_URL, {
  schema,
  mode: "default",
});
