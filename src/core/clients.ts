/** @notice Local imports */
import { ERC20Events } from "@/events/ERC20Events";
import { redisConnection } from "@/configs/redis";
import { OrderManager } from "@/services/OrderManager";
import { TransferEventsQueue } from "@/queues/TransferEventsQueue";
import { OrderDatabase } from "@/database/handlers/OrderDatabase";
import { OrdersController } from "@/controllers/OrdersController";
import { OrderEventQueue } from "@/queues/OrderEventQueue";
import { RedisOrderService } from "@/services/RedisOrderService";

/// services ///
export const orderService = new OrderDatabase();
export const redisOrderService = new RedisOrderService(redisConnection);

/// queues ///
export const orderEventQueue = new OrderEventQueue(redisConnection);
export const erc20Queue = new TransferEventsQueue(redisConnection);

/// events ///
export const erc20 = new ERC20Events(erc20Queue);

/// managers ///
export const orderManager = new OrderManager(orderService, redisOrderService);

/// controllers ///
export const ordersController = new OrdersController(
  orderManager,
  orderEventQueue
);
