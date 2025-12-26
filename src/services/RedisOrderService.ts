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
  public async saveOrUpdateOrder(
    order: SaveOrderToRedisPayload
  ): Promise<void> {
    /// Generate base signature (without timestamp) for indexing
    const baseSig = signOrderDetailsForRedis({
      to: order.to,
      from: order.from,
      erc20: order.erc20,
      amount: order.amount,
      chainId: order.chainId,
    });

    /// Generate unique signature (with timestamp) for unique storage
    const uniqueSig = signOrderDetailsForRedis(
      {
        to: order.to,
        from: order.from,
        erc20: order.erc20,
        amount: order.amount,
        chainId: order.chainId,
      },
      order.timestamp
    );

    /// Sets the Redis pipeline
    const pipeline = this.redis.multi();
    /// Save the unique order signature to Redis set
    pipeline.sadd(this.ordersQueueSetKey, uniqueSig);
    /// Index: base signature -> unique signatures
    pipeline.sadd(this.ordersIndexKey(baseSig), uniqueSig);
    /// Save the order ID associated with the unique signature
    pipeline.hset(this.ordersHashKey(uniqueSig), {
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
      baseSignature: baseSig,
      uniqueSignature: uniqueSig,
    });

    /// Execute the pipeline
    await pipeline.exec();
  }

  /**
   * @notice Updates the status of an order in Redis.
   * @dev Updates the order status field in the Redis hash.
   * @param uniqueOrderSig The order unique signature.
   * @param status The current status of the order.
   */
  public async updateOrderStatus(
    uniqueOrderSig: string,
    status: OrderStatus
  ): Promise<void> {
    /// Sets the Redis pipeline
    const pipeline = this.redis.multi();
    /// Update the order status in Redis hash
    pipeline.hset(this.ordersHashKey(uniqueOrderSig), {
      status,
    });
    /// Execute the pipeline
    await pipeline.exec();
  }

  /**
   * @notice Marks an order as failed in Redis.
   * @dev Updates the order status to CANCELLED and sets the fail reason.
   * @param baseOrderSig The base order signature.
   * @param uniqueOrderSig The order signature (unique signature).
   * @param txHash The transaction hash associated with the failed order.
   * @param reason The reason for order failure.
   */
  public async cancelOrder(
    baseOrderSig: string,
    uniqueOrderSig: string,
    txHash: string,
    reason: OrderFailReasons
  ): Promise<void> {
    /// Update the order status and fail reason in Redis hash
    const pipeline = this.redis.multi();
    /// Updating status and fail reason
    pipeline.hset(this.ordersHashKey(uniqueOrderSig), {
      status: OrderStatus.CANCELLED,
      txHash: txHash,
      failReason: reason,
    });
    /// Add zset score for settled orders
    pipeline.zadd(this.ordersSettledSetKey, Date.now(), uniqueOrderSig);
    /// Remove from active unique order signature
    pipeline.srem(this.ordersQueueSetKey, uniqueOrderSig);
    /// Remove from base signature index
    pipeline.srem(this.ordersIndexKey(baseOrderSig), uniqueOrderSig);
    /// Execute the pipeline
    await pipeline.exec();
  }

  /**
   * @notice Marks an order as completed in Redis.
   * @dev Updates the order status to COMPLETED.
   * @param baseOrderSig The base order signature.
   * @param uniqueOrderSig The order signature (unique signature).
   * @param hash The transaction hash associated with the completed order.
   */
  public async completeOrder(
    baseOrderSig: string,
    uniqueOrderSig: string,
    hash: string
  ): Promise<void> {
    /// Update the order status and fail reason in Redis hash
    const pipeline = this.redis.multi();
    /// Updating status to COMPLETED
    pipeline.hset(this.ordersHashKey(uniqueOrderSig), {
      status: OrderStatus.COMPLETED,
      txHash: hash,
    });
    /// Add zset score for settled orders
    pipeline.zadd(this.ordersSettledSetKey, Date.now(), uniqueOrderSig);
    /// Remove from active unique order signature
    pipeline.srem(this.ordersQueueSetKey, uniqueOrderSig);
    /// Remove from base signature index
    pipeline.srem(this.ordersIndexKey(baseOrderSig), uniqueOrderSig);
    /// Execute the pipeline
    await pipeline.exec();
  }

  /**
   * @notice Finds order IDs by its payload details.
   * @dev This is a placeholder method and should be implemented with actual Redis logic.
   * @param order The order payload to search for.
   * @returns The order details if found, otherwise null.
   */
  public async findByPayload(
    order: GetOrderByPayloadParams
  ): Promise<FindOneOrderFromRedisPayload[]> {
    /// Generate base signature (without timestamp) for lookup
    const baseSig = signOrderDetailsForRedis({
      to: order.to,
      from: order.from,
      erc20: order.erc20,
      amount: order.amount,
      chainId: order.chainId,
    });

    /// Get all unique signatures for this base signature
    const uniqueSigs = await this.redis.smembers(this.ordersIndexKey(baseSig));
    if (!Boolean(uniqueSigs.length)) return [];

    /// Start pipeline to fetch all orders
    const pipeline = this.redis.multi();
    for (const sig of uniqueSigs) {
      pipeline.hgetall(this.ordersHashKey(sig));
    }
    const results = await pipeline.exec();
    /// In case of no results, return empty array
    if (!results) return [];

    /// Process results
    const orders: FindOneOrderFromRedisPayload[] = [];
    for (const [err, orderData] of results) {
      if (!err) {
        const data = orderData as unknown as FindOneOrderFromRedisPayload;
        orders.push({
          ...data,
          amount: BigInt(data.amount),
          chainId: Number(data.chainId),
          timestamp: Number(data.timestamp),
        });
      }
    }
    return orders;
  }

  /**
   * @notice Checks if an order exists in Redis.
   * @dev This is a placeholder method and should be implemented with actual Redis logic.
   * @param order The order payload to check.
   * @returns True if the order exists in Redis, false otherwise.
   */
  public async isValidOrder(order: GetOrderByPayloadParams): Promise<boolean> {
    /// Generate base signature for lookup
    const baseSig = signOrderDetailsForRedis({
      to: order.to,
      from: order.from,
      erc20: order.erc20,
      amount: order.amount,
      chainId: order.chainId,
    });

    /// Get all unique signatures for this base signature
    const uniqueSigs = await this.redis.smembers(this.ordersIndexKey(baseSig));
    if (uniqueSigs.length === 0) return false;

    /// Check if any of them exist in the active orders set
    for (const sig of uniqueSigs) {
      const exists = await this.redis.sismember(this.ordersQueueSetKey, sig);
      if (exists === 1) return true;
    }
    return false;
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
    for (const [err, orderData] of results) {
      if (!err) {
        const data = orderData as unknown as FindOneOrderFromRedisPayload;
        settledOrders.push({
          ...data,
          amount: BigInt(data.amount),
          chainId: Number(data.chainId),
          timestamp: Number(data.timestamp),
        });
      }
    }
    return settledOrders;
  }

  /**
   * @notice Clears settled orders from Redis.
   * @dev Removes settled orders from Redis sorted set and their associated hashes.
   * @param signatures The list of order signatures (unique signatures) to clear.
   */
  public async clearSettledOrders(signatures: string[]): Promise<void> {
    /// Sets the Redis pipeline
    const pipeline = this.redis.multi();

    for (const uniqueSignature of signatures) {
      /// Remove from settled orders zset
      pipeline.zrem(this.ordersSettledSetKey, uniqueSignature);
      /// Remove the order hash
      pipeline.del(this.ordersHashKey(uniqueSignature));
    }
    /// Execute the pipeline
    await pipeline.exec();
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

  /**
   * @notice Generates the Redis set key for order index.
   * @param baseSig The base signature (without timestamp).
   * @returns The Redis set key for the order index.
   */
  private ordersIndexKey(baseSig: string): string {
    return `orderIndex:${baseSig}`;
  }
}
