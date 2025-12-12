/** @notice Local imports */
import { ERC20 } from "./ERC20";
import { redisConnection } from "@/configs/redis";
import { OrderWorker } from "@/services/OrderWorker";
import { ERC20TransfersQueue } from "@/queues/ERC20TransfersQueue";
import { OrderDatabase } from "@/database/handlers/OrderDatabase";
import { OrdersController } from "@/controllers/OrdersController";

import { JsonRpcProvider } from "ethers";
import { OrderEventQueue } from "@/queues/OrderEventQueue";

const ERC20_ADDRESS = "0x9244212403a2E827cAdCa1f6fb68B43bc0C7A41F";
const provider = new JsonRpcProvider(
  "https://data-seed-prebsc-1-s1.binance.org:8545"
);

/// core clients ///
export const erc20 = new ERC20(ERC20_ADDRESS, provider);
export const orderService = new OrderDatabase();
export const orderEventQueue = new OrderEventQueue(redisConnection);
export const erc20Queue = new ERC20TransfersQueue(redisConnection, erc20);
export const orderWorker = new OrderWorker(
  redisConnection,
  orderService,
  orderEventQueue
);

/// controllers ///
export const ordersController = new OrdersController(orderService);
