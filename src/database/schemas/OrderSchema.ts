/** @notice Library imports */
import {
  bigint,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";
/// Local imports
import { OrderStatus } from "@/types/order";
import { generateOrderId } from "@/utils/orderId";

/// Enum Definitions ///
const orderStatusEnum = mysqlEnum([
  OrderStatus.PENDING,
  OrderStatus.VERIFYING,
  OrderStatus.COMPLETED,
  OrderStatus.CANCELLED,
]);

/// Table Definition ///
export const orders = mysqlTable(
  "orders",
  {
    /// Core fields
    id: varchar({ length: 255 }).primaryKey().$defaultFn(generateOrderId),

    /// Order fields ///
    erc20: varchar({ length: 42 }).notNull(),
    from: varchar({ length: 42 }).notNull(),
    to: varchar({ length: 42 }).notNull(),
    amount: bigint({ mode: "bigint" }).notNull(),
    txHash: varchar({ length: 66 }),
    chainId: int().notNull(),
    signature: varchar({ length: 512 }).notNull().unique(),
    timestamp: bigint({ mode: "number", unsigned: true }).notNull(),
    error: varchar({ length: 255 }),
    status: orderStatusEnum.notNull().default(OrderStatus.PENDING),

    /// Timestamps ///
    createdAt: timestamp({ mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp({ mode: "date" }).notNull().defaultNow().onUpdateNow(),
  },

  /// Indexes ///
  (table) => [
    /// Unique Indexes ///
    index("orders_tx_hash_idx").on(table.txHash),

    /// Indexes ///
    index("orders_status_idx").on(table.status, table.id),
    index("orders_payload_composite_idx").on(
      table.to,
      table.from,
      table.erc20,
      table.amount
    ),
  ]
);
