/** @notice Library imports */
import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
/// Local imports
import {
  orderInsertSchema,
  findOrderByIdSchema,
} from "@/database/validators/orders";
import { logger } from "@/configs/logger";
import { OrderManager } from "@/services/OrderManager";
import type { OrderEventQueue } from "@/queues/OrderEventQueue";
import { OrderStatus, type OrderPublishEventPayload } from "@/types/order";

export class OrdersController {
  /**
   * @notice Constructor
   * @param orderManager The order manager instance.
   * @param orderEventsQueue The order events queue instance.
   */
  constructor(
    private orderManager: OrderManager,
    private orderEventsQueue: OrderEventQueue
  ) {
    /// Binding methods
    this.constructor.bind(this);
    this.createOrder = this.createOrder.bind(this);
    this.getOrderById = this.getOrderById.bind(this);
  }

  /// Public methods ///
  /**
   * @notice Handles fetching an order by its ID.
   * @dev Retrieves the order from the database and returns it in the response.
   */
  public async getOrderById(req: Request, res: Response): Promise<Response> {
    /// Validate order id from query params
    const data = findOrderByIdSchema.parse(req.params);
    /// Fetch order from database
    // const order = await this.orderManager.getOrderById(data.id);
    // if (!order) {
    //   return res
    //     .status(StatusCodes.BAD_REQUEST)
    //     .json({ error: "Order not found" });
    // }
    /// Return the fetched order
    return res.status(StatusCodes.OK).json({
      success: true,
      error: null,
      data: null, // order,
    });
  }

  /**
   * @notice Handles the creation of a new order.
   * @dev Validates the request body and creates a new order in the database.
   */
  public async createOrder(req: Request, res: Response): Promise<Response> {
    /// Validate order data from request body
    const data = orderInsertSchema.parse(req.body);
    /// Creating new order
    const newOrderId = await this.orderManager.createOrder(data);
    if (!newOrderId) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: "Failed to create order" });
    }

    /// Enqueue order verification event
    const orderProgressPayload: OrderPublishEventPayload = {
      eventName: "order:progress",
      orderId: newOrderId,
      status: OrderStatus.PENDING,
    };
    await this.orderEventsQueue.publish(orderProgressPayload);
    logger.info(`Order created with ID: ${newOrderId}`, {
      orderId: newOrderId,
    });

    /// Return the created order
    return res.status(StatusCodes.CREATED).json({
      success: true,
      error: null,
      data: { orderId: newOrderId },
    });
  }
}
