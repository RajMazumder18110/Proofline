/** @notice Library imports */
import { eq, and, SQL, sql, inArray } from "drizzle-orm";
/// Local imports
import {
  OrderStatus,
  OrderFailReasons,
  type Order,
  type CreateOrderPayload,
  type GetOrderByPayloadParams,
} from "@/types/order";
import { database } from "@/database";
import { orders } from "@/database/schemas";

export class OrderDatabase {
  /// Read Methods ///
  /**
   * @notice Retrieves an order by its ID.
   * @dev Fetches the order from the database using the provided ID.
   * @param orderId The ID of the order to retrieve.
   * @returns {Promise<Order | null>} A promise that resolves to the found order.
   */
  public async getOrderById(orderId: string): Promise<Order | null> {
    const order = await database.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });
    return order ?? null;
  }

  /**
   * @notice Retrieves a pending order by its ID.
   * @param orderId The ID of the order to retrieve.
   * @returns {Promise<Order | null>} A promise that resolves to the found pending order.
   */
  public async getPendingOrderById(orderId: string): Promise<Order | null> {
    const order = await database.query.orders.findFirst({
      where: and(
        eq(orders.id, orderId),
        eq(orders.status, OrderStatus.PENDING)
      ),
    });
    return order ?? null;
  }

  /**
   * @notice Retrieves an order based on the provided payload parameters.
   * @dev Fetches the order from the database matching the given criteria.
   * @param payload The parameters to identify the order.
   * @returns {Promise<Order | null>} A promise that resolves to the found order.
   */
  public async getOrderByPayload(
    payload: GetOrderByPayloadParams
  ): Promise<Order | null> {
    const order = await database.query.orders.findFirst({
      where: and(
        eq(orders.to, payload.to),
        eq(orders.from, payload.from),
        eq(orders.erc20, payload.erc20),
        eq(orders.amount, payload.amount),
        eq(orders.status, OrderStatus.PENDING)
      ),
    });
    return order ?? null;
  }

  /// Write Methods ///
  /**
   * @notice Creates a new order in the database.
   * @param order The order payload to create.
   * @returns {Promise<string | null>} A promise that resolves to the created order.
   */
  public async createOrder(order: CreateOrderPayload): Promise<string | null> {
    const [newOrder] = await database
      .insert(orders)
      .values(order)
      .$returningId();

    return newOrder?.id ?? null;
  }

  /**
   * @notice Marks multiple orders as completed in the database.
   * @dev Updates the status and transaction hash of the specified orders.
   * @param payload The list of orders to mark as completed.
   * @returns {Promise<void>} A promise that resolves when the orders are marked as completed.
   */
  public async markOrdersAsCompleted(
    payload: Pick<Order, "id" | "txHash">[]
  ): Promise<void> {
    const sqlChunks: SQL[] = [];
    const ids = payload.map((order) => order.id);

    /// Building SQL CASE statements for txHash updates
    sqlChunks.push(sql`(CASE`);
    for (const order of payload) {
      sqlChunks.push(sql`WHEN ${orders.id} = ${order.id} THEN ${order.txHash}`);
    }
    sqlChunks.push(sql`END)`);
    /// Combining SQL chunks
    const finalSql = sql.join(sqlChunks, sql.raw(" "));
    /// Executing the update query
    await database
      .update(orders)
      .set({
        status: OrderStatus.COMPLETED,
        txHash: finalSql,
      })
      .where(
        and(inArray(orders.id, ids), eq(orders.status, OrderStatus.VERIFYING))
      );
  }

  public async markOrdersAsCancelled(
    payload: Pick<Order, "id" | "txHash" | "error">[]
  ): Promise<void> {
    const sqlChunksTxHash: SQL[] = [];
    const sqlChunksForReason: SQL[] = [];
    const ids = payload.map((order) => order.id);

    /// Building SQL CASE statements for txHash updates
    sqlChunksTxHash.push(sql`(CASE`);
    sqlChunksForReason.push(sql`(CASE`);

    for (const order of payload) {
      sqlChunksTxHash.push(
        sql`WHEN ${orders.id} = ${order.id} THEN ${order.txHash}`
      );
      sqlChunksForReason.push(
        sql`WHEN ${orders.id} = ${order.id} THEN ${order.error}`
      );
    }
    sqlChunksTxHash.push(sql`END)`);
    sqlChunksForReason.push(sql`END)`);
    /// Combining SQL chunks
    const finalTxHashSql = sql.join(sqlChunksTxHash, sql.raw(" "));
    const finalReasonSql = sql.join(sqlChunksForReason, sql.raw(" "));

    /// Executing the update query
    await database
      .update(orders)
      .set({
        status: OrderStatus.CANCELLED,
        txHash: finalTxHashSql,
        error: finalReasonSql,
      })
      .where(
        and(inArray(orders.id, ids), eq(orders.status, OrderStatus.VERIFYING))
      );
  }

  /**
   * @notice Marks an order as completed in the database.
   * @param orderId The ID of the order to complete.
   * @param txHash The transaction hash associated with the order completion.
   * @returns {Promise<void>} A promise that resolves when the order is marked as completed.
   */
  public async completeOrder(orderId: string, txHash: string): Promise<void> {
    await database
      .update(orders)
      .set({
        txHash: txHash,
        status: OrderStatus.COMPLETED,
      })
      .where(eq(orders.id, orderId));
  }

  /**
   * @notice Marks an order as failed in the database.
   * @param orderId The ID of the order to fail.
   * @param reason The reason for the order failure.
   * @returns {Promise<void>} A promise that resolves when the order is marked as failed.
   */
  public async failOrder(
    orderId: string,
    reason: OrderFailReasons
  ): Promise<void> {
    await database
      .update(orders)
      .set({
        error: reason,
        status: OrderStatus.CANCELLED,
      })
      .where(eq(orders.id, orderId));
  }
}
