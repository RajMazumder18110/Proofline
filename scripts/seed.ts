/** @notice Local imports */
import { orderManager } from "@/core/clients";
import { SignatureService } from "@/services/SignatureService";
import type { CreateOrderPayload } from "@/types/order";
import { parseEther } from "ethers";

const payload: CreateOrderPayload = {
  erc20: "0xD98aFa5e340816A637Bd886D16E82F9C2106bB21",
  from: "0xD85E2cD257BD154B9959Bc1a25d8825645d6Bab6",
  to: "0x5c2E23698eB98cBd12dbaf100227BaF68D1e20fD",
  chainId: 97,
  amount: parseEther("1"),
  timestamp: Date.now(),
  signature: "0xSignature",
};

const insertId = await orderManager.createOrder({
  erc20: payload.erc20,
  from: payload.from,
  to: payload.to,
  amount: payload.amount,
  chainId: payload.chainId,
  timestamp: payload.timestamp,
  signature: SignatureService.signOrderWithSignature(payload),
});

console.log("Inserted Order ID:", insertId);
process.exit(0);
