/** @notice Library imports */

/// Local imports
import {
  OrderStatus,
  type CreateOrderPayload,
  type FindOneOrderFromRedisPayload,
  type GetOrderByPayloadParams,
} from "@/types/order";
import { logger } from "@/configs/logger";
import type { RedisOrderService } from "./RedisOrderService";
import type { OrderDatabase } from "@/database/handlers/OrderDatabase";

export class OrderManager {
  /**
   * @notice Constructor
   * @dev Initializes the Order Manager service.
   * @param database The order database handler instance.
   * @param redisService The Redis service instance.
   */
  constructor(
    private database: OrderDatabase,
    private redisService: RedisOrderService
  ) {}

  /// GETTERS ///
  /**
   * @notice Gets the Redis order service instance.
   * @returns The RedisOrderService instance.
   */
  public get cache(): RedisOrderService {
    return this.redisService;
  }

  /// Public methods ///
  /**
   * @notice Creates a new order.
   * @dev Inserts the order into the database and saves it to Redis for processing.
   * @param order The order payload.
   * @returns The ID of the created order or null if creation failed.
   */
  public async createOrder(order: CreateOrderPayload): Promise<string | null> {
    /// Creating order in the database
    const createdOrderId = await this.database.createOrder(order);
    if (!createdOrderId) return null;

    /// Adding order payload to Redis for further processing
    await this.redisService.saveOrUpdateOrder({
      ...order,
      orderId: createdOrderId,
    });
    /// Returning the created order ID
    return createdOrderId;
  }

  /**
   * @notice Fetches settled orders from Redis and inserts them into the database.
   * @dev Retrieves settled orders from Redis and marks them as settled in the database.
   */
  public async fetchSettledOrdersAndInsertToDB(): Promise<void> {
    /// Fetch settled orders from Redis
    const settledOrders = await this.redisService.fetchSettledOrders();
    /// Separate successful and failed orders
    const failedOrders = settledOrders.filter(
      (order) => order.status === OrderStatus.CANCELLED
    );
    const successfulOrders = settledOrders.filter(
      (order) => order.status === OrderStatus.COMPLETED
    );

    /// Update successful orders in the database
    if (Boolean(successfulOrders.length)) {
      const payload = successfulOrders.map((order) => ({
        id: order.orderId,
        txHash: order.txHash!,
      }));

      await this.database.markOrdersAsCompleted(payload);
      logger.info(
        `Marked ${successfulOrders.length} orders as COMPLETED in the database.`
      );
      /// Clear successful orders from Redis
      await this.redisService.clearSettledOrders(
        successfulOrders.map((order) => order.uniqueSignature)
      );
      logger.info(
        `Cleared ${successfulOrders.length} settled orders from Redis.`
      );
    }

    /// Update failed orders in the database
    if (Boolean(failedOrders.length)) {
      const payload = failedOrders.map((order) => ({
        id: order.orderId,
        txHash: order.txHash,
        error: order.failReason,
      }));

      await this.database.markOrdersAsCancelled(payload);
      logger.info(
        `Marked ${failedOrders.length} orders as CANCELLED in the database.`
      );

      /// Clear failed orders from Redis
      await this.redisService.clearSettledOrders(
        failedOrders.map((order) => order.uniqueSignature)
      );
      logger.info(`Cleared ${failedOrders.length} settled orders from Redis.`);
    }
  }
}
