/** @notice Library imports */
import IORedis from "ioredis";

/// Local imports
import {
  OrderFailReasons,
  OrderStatus,
  type FindOneOrderFromRedisPayload,
  type GetOrderByPayloadParams,
  type SaveOrderToRedisPayload,
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
      chainId: order.chainId,
    });

    /// Sets the Redis pipeline
    const pipeline = this.redis.multi();
    /// Save the order signature to Redis set
    pipeline.sadd(this.ordersQueueSetKey, signedSig);
    /// Save the order ID associated with the signature
    pipeline.hset(this.ordersHashKey(signedSig), {
      orderId: order.orderId,
      to: order.to,
      from: order.from,
      erc20: order.erc20,
      chainId: order.chainId,
      timestamp: order.timestamp,
      signature: order.signature,
      amount: order.amount.toString(),
      status: OrderStatus.PENDING,
      /// Add signature for easy lookup
      signedSig,
    });

    /// Execute the pipeline
    await pipeline.exec();
  }

  /**
   * @notice Updates the status of an order in Redis.
   * @dev Updates the order status field in the Redis hash.
   * @param orderSig The order signature.
   * @param status The current status of the order.
   */
  public async updateOrderStatus(
    orderSig: string,
    status: OrderStatus
  ): Promise<void> {
    /// Sets the Redis pipeline
    const pipeline = this.redis.multi();
    /// Update the order status in Redis hash
    pipeline.hset(this.ordersHashKey(orderSig), {
      status,
    });
    /// Execute the pipeline
    await pipeline.exec();
  }

  /**
   * @notice Marks an order as failed in Redis.
   * @dev Updates the order status to CANCELLED and sets the fail reason.
   * @param orderSig The order signature.
   * @param reason The reason for order failure.
   */
  public async cancelOrder(
    orderSig: string,
    reason: OrderFailReasons
  ): Promise<void> {
    /// Update the order status and fail reason in Redis hash
    const pipeline = this.redis.multi();
    /// Updating status and fail reason
    pipeline.hset(this.ordersHashKey(orderSig), {
      status: OrderStatus.CANCELLED,
      failReason: reason,
    });
    /// Add zset score for settled orders
    pipeline.zadd(this.ordersSettledSetKey, Date.now(), orderSig);
    /// Remove from active orders set
    pipeline.srem(this.ordersQueueSetKey, orderSig);
    /// Execute the pipeline
    await pipeline.exec();
  }

  /**
   * @notice Marks an order as completed in Redis.
   * @param orderSig The order signature.
   * @param hash The transaction hash associated with the completed order.
   */
  public async completeOrder(orderSig: string, hash: string): Promise<void> {
    /// Update the order status and fail reason in Redis hash
    const pipeline = this.redis.multi();
    /// Updating status to COMPLETED
    pipeline.hset(this.ordersHashKey(orderSig), {
      status: OrderStatus.COMPLETED,
      txHash: hash,
    });
    /// Add zset score for settled orders
    pipeline.zadd(this.ordersSettledSetKey, Date.now(), orderSig);
    /// Remove from active orders set
    pipeline.srem(this.ordersQueueSetKey, orderSig);
    /// Execute the pipeline
    await pipeline.exec();
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
      chainId: order.chainId,
    });
    /// Check if the signature exists in Redis set
    const exists = await this.redis.sismember(
      this.ordersQueueSetKey,
      signedSig
    );
    if (!Boolean(exists)) return null;

    /// Retrieve the order ID associated with the signature
    const orderData = await this.redis.hgetall(this.ordersHashKey(signedSig));
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
      chainId: order.chainId,
    });
    /// Check if the signature exists in Redis set
    const exists = await this.redis.sismember(
      this.ordersQueueSetKey,
      signedSig
    );
    return exists === 1;
  }

  /**
   * @notice Fetches settled orders from Redis.
   * @dev Retrieves settled orders from Redis sorted set.
   * @returns The list of settled orders.
   */
  public async fetchSettledOrders(): Promise<FindOneOrderFromRedisPayload[]> {
    const settledOrders: FindOneOrderFromRedisPayload[] = [];
    /// Fetch all settled order signatures
    const settledSigs = await this.redis.zrevrangebyscore(
      this.ordersSettledSetKey,
      String(Date.now()), /// Max score
      String(0), /// Min score
      "LIMIT",
      0, /// Offset
      100 /// Count
    );

    /// Retrieve each settled order details
    const pipeline = this.redis.multi();
    for (const sig of settledSigs) {
      pipeline.hgetall(this.ordersHashKey(sig));
    }
    const results = await pipeline.exec();
    /// In case of no results, return empty array
    if (!results) return settledOrders;

    // Process results
    for (const [_, orderData] of results) {
      settledOrders.push(orderData as unknown as FindOneOrderFromRedisPayload);
    }
    return settledOrders;
  }

  /// PRIVATE METHODS ///
  /**
   * @notice Generates the Redis key for an order.
   * @returns The Redis key for the orders.
   */
  private get ordersQueueSetKey(): string {
    return `orders:ongoing`;
  }

  /**
   * @notice Generates the Redis key for settled orders.
   * @returns The Redis key for settled orders.
   */
  private get ordersSettledSetKey(): string {
    return `orders:settled`;
  }

  /**
   * @notice Generates the Redis hash key for a specific order.
   * @param orderSig The order signature.
   * @returns The Redis hash key for the order.
   */
  private ordersHashKey(orderSig: string): string {
    return `order:${orderSig}`;
  }
}
