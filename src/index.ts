/** @notice Local imports */
import { ERC20 } from "@/core/ERC20";
import { JsonRpcProvider } from "ethers";
import { Random } from "./core/Random";
import { OrderWorker } from "@/services/OrderWorker";
import { ERC20TransfersQueue } from "./queues/ERC20TransfersQueue";
import { redisConnection } from "./configs/redis";
import { OrderDatabase } from "./database/handlers/OrderDatabase";

const ERC20_ADDRESS = "0x9244212403a2E827cAdCa1f6fb68B43bc0C7A41F";
const provider = new JsonRpcProvider(
  "https://data-seed-prebsc-1-s1.binance.org:8545"
);

const erc20 = new ERC20(ERC20_ADDRESS, provider);
const orderService = new OrderDatabase();
const erc20Queue = new ERC20TransfersQueue(redisConnection, erc20);
const erc20Worker = new OrderWorker(redisConnection, orderService);

erc20Worker.on("order.status.changed", (payload) => {
  console.log(`Order ${payload.orderId} status changed to ${payload.status}`);
});

await erc20Queue.start();
await erc20.start();

await erc20Worker.start();
