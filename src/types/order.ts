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

export type OrderEventPublishPayload =
  | /// Event for order progress
  {
      eventName: "order:progress";
      orderId: string;
      status: OrderStatus;
    }
  /// Event for order completed
  | {
      eventName: "order:completed";
      status: OrderStatus.COMPLETED;
      orderId: string;
      erc20: string;
      from: string;
      to: string;
      amount: string;
      timestamp: number;
      chainId: number;
      txHash: string;
      signature: string;
    }
  /// Event for order cancelled
  | {
      eventName: "order:cancelled";
      status: OrderStatus.CANCELLED;
      orderId: string;
      reason: OrderFailReasons;
    };

export interface OrderEventsListener extends QueueEventsListener {
  "order:progress": (args: OrderEventPublishPayload, id: string) => void;
  "order:completed": (args: OrderEventPublishPayload, id: string) => void;
  "order:cancelled": (args: OrderEventPublishPayload, id: string) => void;
}
