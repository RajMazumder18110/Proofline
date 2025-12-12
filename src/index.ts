/** @notice Local imports */
import { ERC20 } from "@/core/ERC20";
import { JsonRpcProvider } from "ethers";
import { Random } from "./core/Random";
import { OrderWorker } from "@/services/OrderWorker";
import { ERC20TransfersQueue } from "./queues/ERC20TransfersQueue";
import { redisConnection } from "./configs/redis";
import { OrderDatabase } from "./database/handlers/OrderDatabase";

const ERC20_ADDRESS = "0xDBC67674c68A361A5e6cB5a198861c8CF24eCdB7"; // "0x9244212403a2E827cAdCa1f6fb68B43bc0C7A41F";
const provider = new JsonRpcProvider(
  "http://127.0.0.1:8545" /// "https://data-seed-prebsc-1-s1.binance.org:8545"
);

const erc20 = new ERC20(ERC20_ADDRESS, provider);
const orderService = new OrderDatabase();
const erc20Queue = new ERC20TransfersQueue(redisConnection, erc20);
const orderWorker = new OrderWorker(redisConnection, orderService);

orderWorker.on("order.status.changed", (payload) => {
  console.log(`Order ${payload.orderId} status changed to ${payload.status}`);
});

orderWorker.on("event.status.dropped", (payload) => {
  console.log(`event ${payload} dropped`);
});

await erc20Queue.start();
await erc20.start();

await orderWorker.start();
