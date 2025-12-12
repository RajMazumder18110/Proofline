/** @notice Local imports */
import { OrderDatabase } from "@/database/handlers/OrderDatabase";
import type { CreateOrderPayload } from "@/types/order";
import { signOrder } from "@/utils/signature";

const payload: CreateOrderPayload = {
  erc20: "0xDBC67674c68A361A5e6cB5a198861c8CF24eCdB7",
  from: "0xD85E2cD257BD154B9959Bc1a25d8825645d6Bab6",
  to: "0x5c2E23698eB98cBd12dbaf100227BaF68D1e20fD",
  amount: BigInt(1000),
  timestamp: Date.now(),
  signature: "0xSignature",
};

const orderDb = new OrderDatabase();

const insertId = await orderDb.createOrder({
  erc20: payload.erc20,
  from: payload.from,
  to: payload.to,
  amount: payload.amount,
  timestamp: payload.timestamp,
  signature: signOrder(payload),
});
console.log("Inserted Order ID:", insertId);
process.exit(0);
