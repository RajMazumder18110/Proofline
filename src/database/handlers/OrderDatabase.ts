/** @notice Library imports */
/// Local imports
import {
  OrderStatus,
  OrderFailReasons,
  type Order,
  type CreateOrderPayload,
  type GetOrderByPayloadParams,
} from "@/types/order";

export class OrderDatabase {
  /// Read Methods ///
  /**
   * @notice Retrieves an order by its ID.
   * @dev Fetches the order from the database using the provided ID.
   * @param orderId The ID of the order to retrieve.
   * @returns {Promise<Order>} A promise that resolves to the found order.
   */
  public async getOrderById(orderId: string): Promise<any> {}

  /**
   * @notice Retrieves an order based on the provided payload parameters.
   * @dev Fetches the order from the database matching the given criteria.
   * @param payload The parameters to identify the order.
   * @returns {Promise<Order>} A promise that resolves to the found order.
   */
  public async getOrderByPayload(
    payload: GetOrderByPayloadParams
  ): Promise<Order | null> {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return {
      id: "jobId-1",
      erc20: "usdt-address",
      from: payload.from,
      to: payload.to,
      amount: payload.amount,
      txHash: null,
      signature: "signature",
      sigTimestamp: Date.now(),
      status: OrderStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /// Write Methods ///
  /**
   * @notice Creates a new order in the database.
   * @param order The order payload to create.
   * @returns {Promise<Order>} A promise that resolves to the created order.
   */
  public async createOrder(order: CreateOrderPayload): Promise<Order> {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return {
      id: "jobId-1",
      erc20: order.erc20,
      from: order.from,
      to: order.to,
      amount: order.amount,
      txHash: null,
      signature: order.signature,
      sigTimestamp: order.sigTimestamp,
      status: OrderStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * @notice Marks an order as completed in the database.
   * @param orderId The ID of the order to complete.
   * @param txHash The transaction hash associated with the order completion.
   * @returns {Promise<void>} A promise that resolves when the order is marked as completed.
   */
  public async completeOrder(orderId: string, txHash: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    OrderStatus.COMPLETED;
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
    await new Promise((resolve) => setTimeout(resolve, 2000));
    OrderStatus.CANCELLED;
  }
}
