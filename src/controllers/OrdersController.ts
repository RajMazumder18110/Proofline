/** @notice Library imports */
import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
/// Local imports
import {
  orderInsertSchema,
  findOrderByIdSchema,
} from "@/database/validators/orders";
import { OrderDatabase } from "@/database/handlers/OrderDatabase";

export class OrdersController {
  /**
   * @notice Constructor
   * @param orderDatabase The order database handler instance.
   */
  constructor(private orderDatabase: OrderDatabase) {
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
    const order = await this.orderDatabase.getOrderById(data.id);
    if (!order) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "Order not found" });
    }
    /// Return the fetched order
    return res.status(StatusCodes.OK).json({
      success: true,
      error: null,
      data: order,
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
    const newOrderId = await this.orderDatabase.createOrder(data);
    if (!newOrderId) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: "Failed to create order" });
    }

    /// Return the created order
    return res.status(StatusCodes.CREATED).json({
      success: true,
      error: null,
      data: { orderId: newOrderId },
    });
  }
}
