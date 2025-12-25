/** @notice Local imports */
import { ERC20Events } from "@/events/ERC20Events";
import { redisConnection } from "@/configs/redis";
import { OrderManager } from "@/services/OrderManager";
import { TransferEventsQueue } from "@/queues/TransferEventsQueue";
import { OrderDatabase } from "@/database/handlers/OrderDatabase";
import { OrdersController } from "@/controllers/OrdersController";

import { JsonRpcProvider } from "ethers";
import { OrderEventQueue } from "@/queues/OrderEventQueue";
import { RedisOrderService } from "@/services/RedisOrderService";

const ERC20_ADDRESS = "0xD98aFa5e340816A637Bd886D16E82F9C2106bB21";
const provider = new JsonRpcProvider(
  "https://data-seed-prebsc-1-s1.binance.org:8545"
);

/// core clients ///
/// services ///
export const orderService = new OrderDatabase();
export const redisOrderService = new RedisOrderService(redisConnection);

/// queues ///
export const orderEventQueue = new OrderEventQueue(redisConnection);
export const erc20Queue = new TransferEventsQueue(redisConnection);

/// events ///
export const erc20 = new ERC20Events(ERC20_ADDRESS, provider, erc20Queue);

/// managers ///
export const orderManager = new OrderManager(orderService, redisOrderService);

/// controllers ///
export const ordersController = new OrdersController(
  orderManager,
  orderEventQueue
);
