/** @notice Local imports */
import { orders } from "@/database/schemas";
import type { QueueEventsListener } from "bullmq";

/** @notice Types for Order module */
export enum OrderStatus {
  PENDING = "PENDING",
  VERIFYING = "VERIFYING",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export const enum OrderFailReasons {
  INVALID_SIGNATURE = "INVALID_SIGNATURE",
}

export type Order = typeof orders.$inferSelect;

export type GetOrderByPayloadParams = Pick<
  Order,
  "erc20" | "from" | "to" | "amount"
>;

export type OrderSignaturePayload = Pick<
  Order,
  "erc20" | "from" | "to" | "amount" | "timestamp"
>;

export type CreateOrderPayload = Pick<
  Order,
  "erc20" | "from" | "to" | "amount" | "timestamp" | "signature"
>;

export type SaveOrderToRedisPayload = CreateOrderPayload & {
  orderId: string;
};

export type FindOneOrderFromRedisPayload = CreateOrderPayload & {
  orderId: string;
  signedSig: string;
};

export type OrderEventPayload = {
  orderId: string;
  status: OrderStatus;
  reason?: OrderFailReasons;
};

export interface OrderPublishEventPayload extends OrderEventPayload {
  eventName: "order:progress" | "order:completed" | "order:cancelled";
}

export interface OrderEventsListener extends QueueEventsListener {
  "order:progress": (args: OrderEventPayload, id: string) => void;
  "order:completed": (args: OrderEventPayload, id: string) => void;
  "order:cancelled": (args: OrderEventPayload, id: string) => void;
}
