/** @notice Library imports */

/// Local imports
import type {
  CreateOrderPayload,
  FindOneOrderFromRedisPayload,
  GetOrderByPayloadParams,
  OrderStatus,
} from "@/types/order";
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
   * @notice Validates if an order exists.
   * @dev Checks the Redis store to see if the order is valid.
   * @param order The order payload to validate.
   * @returns True if the order is valid, false otherwise.
   */
  public async isOrderValid(order: GetOrderByPayloadParams): Promise<boolean> {
    /// Check if the order exists in Redis
    return await this.redisService.isValidOrder({
      to: order.to,
      from: order.from,
      erc20: order.erc20,
      amount: order.amount,
    });
  }

  /**
   * @notice Retrieves an order ID by its payload details.
   * @dev Queries the Redis store for the order ID.
   * @param order The order payload to search for.
   * @returns The order details if found, otherwise null.
   */
  public async getOrderIdByPayload(
    order: GetOrderByPayloadParams
  ): Promise<FindOneOrderFromRedisPayload | null> {
    /// Retrieve the order from Redis
    return await this.redisService.findOneByPayload({
      to: order.to,
      from: order.from,
      erc20: order.erc20,
      amount: order.amount,
    });
  }

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
    await this.redisService.saveOrder({
      ...order,
      orderId: createdOrderId,
    });
    /// Returning the created order ID
    return createdOrderId;
  }

  /**
   * @notice Updates the status of an order in Redis.
   * @param orderSig The order signature.
   * @param status
   */
  public async updateOrderStatusRedis(
    orderSig: string,
    status: OrderStatus
  ): Promise<void> {
    await this.redisService.updateOrderStatus(orderSig, status);
  }
}
