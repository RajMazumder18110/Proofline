/** @notice Library imports */
import IORedis from "ioredis";

/// Local imports
import type {
  FindOneOrderFromRedisPayload,
  GetOrderByPayloadParams,
  SaveOrderToRedisPayload,
} from "@/types/order";
import { signOrderDetailsForRedis } from "@/utils/signature";

export class RedisOrderService {
  /**
   * @notice Constructor
   * @dev Initializes the Redis Order Service.
   * @param redis The Redis connection instance.
   */
  constructor(private redis: IORedis) {}

  /// PUBLIC METHODS ///
  /**
   * @notice Saves an order payload to Redis for processing.
   * @dev This is a placeholder method and should be implemented with actual Redis logic.
   * @param order The order payload to save.
   */
  public async saveOrder(order: SaveOrderToRedisPayload): Promise<void> {
    /// Generate signature for the order details
    const signedSig = signOrderDetailsForRedis({
      to: order.to,
      from: order.from,
      erc20: order.erc20,
      amount: order.amount,
    });
    /// Save the order signature to Redis set
    await this.redis.sadd(this.ordersSetKey, signedSig);
    /// Save the order ID associated with the signature
    await this.redis.hset(`order:${signedSig}`, {
      orderId: order.orderId,
      to: order.to,
      from: order.from,
      erc20: order.erc20,
      timestamp: order.timestamp,
      signature: order.signature,
      amount: order.amount.toString(),
      /// Add signature for easy lookup
      signedSig,
    });
  }

  /**
   * @notice Finds an order ID by its payload details.
   * @dev This is a placeholder method and should be implemented with actual Redis logic.
   * @param order The order payload to search for.
   * @returns The order details if found, otherwise null.
   */
  public async findOneByPayload(
    order: GetOrderByPayloadParams
  ): Promise<FindOneOrderFromRedisPayload | null> {
    /// Generate signature for the order details
    const signedSig = signOrderDetailsForRedis({
      to: order.to,
      from: order.from,
      erc20: order.erc20,
      amount: order.amount,
    });
    /// Check if the signature exists in Redis set
    const exists = await this.redis.sismember(this.ordersSetKey, signedSig);
    if (!Boolean(exists)) return null;

    /// Retrieve the order ID associated with the signature
    const orderData = await this.redis.hgetall(`order:${signedSig}`);
    return orderData as unknown as FindOneOrderFromRedisPayload;
  }

  /**
   * @notice Checks if an order exists in Redis.
   * @dev This is a placeholder method and should be implemented with actual Redis logic.
   * @param order The order payload to check.
   * @returns True if the order exists in Redis, false otherwise.
   */
  public async isValidOrder(order: GetOrderByPayloadParams): Promise<boolean> {
    /// Generate signature for the order details
    const signedSig = signOrderDetailsForRedis({
      to: order.to,
      from: order.from,
      erc20: order.erc20,
      amount: order.amount,
    });
    /// Check if the signature exists in Redis set
    const exists = await this.redis.sismember(this.ordersSetKey, signedSig);
    return exists === 1;
  }

  /// PRIVATE METHODS ///
  /**
   * @notice Generates the Redis key for an order.
   * @param id The order ID.
   * @returns The Redis key for the order.
   */
  private get ordersSetKey(): string {
    return `orders`;
  }
}
