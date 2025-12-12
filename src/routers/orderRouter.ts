/** @notice Library imports */
import { Router } from "express";
/// Local imports ///
import { ordersController as controller } from "@/core/clients";

/// Routes ///
// PREFIX: /orders
enum OrderRoutes {
  CreateOrder = "/",
  GetOrderById = "/:id",
}

/// Router instance ///
const orderRouter = Router();
/// Route bindings ///
orderRouter.post(OrderRoutes.CreateOrder, controller.createOrder);
orderRouter.get(OrderRoutes.GetOrderById, controller.getOrderById);

export { orderRouter };
