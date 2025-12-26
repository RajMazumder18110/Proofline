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
      chainId: order.chainId,
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
    /**
     * 
     * [
  {
    signature: "023035dcda39141545aeeb1d494d2541d3e7ed8ee76facaac4b6d413a2de14861033e20a4989359396aabf6a914e5d8023fd86a3660f05e0a686dca64d493f83",
    chainId: 97,
    to: "0x5c2E23698eB98cBd12dbaf100227BaF68D1e20fD",
    txHash: "0x249507868d98f5973407f4b6958af7ce35a2024f23814647e8154584a7a0c466",
    orderId: "ORD_e3mzN912TMhBafWPK1Y52wSrFD6brR",
    signedSig: "0e93585f7a94dfde61601d7564c20c40e7b0afc0c58049a38a3e327951657d9e",
    amount: 1000000000000000000n,
    erc20: "0xD98aFa5e340816A637Bd886D16E82F9C2106bB21",
    timestamp: 1766737783819,
    status: "COMPLETED",
    from: "0xD85E2cD257BD154B9959Bc1a25d8825645d6Bab6",
  }
]
     */
    console.log(settledOrders);
    // /// Insert each settled order into the database
    // for (const order of settledOrders) {
    //   await this.database.markOrderAsSettled(order.orderSig, order.settledAt);
    // }
  }
}
