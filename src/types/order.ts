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
  "erc20" | "from" | "to" | "amount" | "chainId"
>;

export type OrderSignaturePayload = Pick<
  Order,
  "erc20" | "from" | "to" | "amount" | "timestamp" | "chainId"
>;

export type CreateOrderPayload = Pick<
  Order,
  "erc20" | "from" | "to" | "amount" | "timestamp" | "signature" | "chainId"
>;

export type SaveOrderToRedisPayload = CreateOrderPayload & {
  orderId: string;
};

export type SuccessFindOneOrderFromRedisPayload = CreateOrderPayload & {
  orderId: string;
  signedSig: string;
  txHash: string;
  status: OrderStatus.COMPLETED;
};

export type ErrorFindOneOrderFromRedisPayload = CreateOrderPayload & {
  orderId: string;
  signedSig: string;
  txHash: string;
  failReason: OrderFailReasons;
  status: OrderStatus.CANCELLED;
};

export type FindOneOrderFromRedisPayload =
  | SuccessFindOneOrderFromRedisPayload
  | ErrorFindOneOrderFromRedisPayload;

export enum OrderEvents {
  ORDER_PROGRESS = "order:progress",
  ORDER_COMPLETED = "order:completed",
  ORDER_CANCELLED = "order:cancelled",
}

export type OrderEventPublishPayload =
  | /// Event for order progress
  {
      eventName: OrderEvents.ORDER_PROGRESS;
      orderId: string;
      status: OrderStatus;
    }
  /// Event for order completed
  | {
      eventName: OrderEvents.ORDER_COMPLETED;
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
      eventName: OrderEvents.ORDER_CANCELLED;
      status: OrderStatus.CANCELLED;
      orderId: string;
      reason: OrderFailReasons;
    };

export interface OrderEventsListener extends QueueEventsListener {
  [OrderEvents.ORDER_PROGRESS]: (
    args: OrderEventPublishPayload,
    id: string
  ) => void;
  [OrderEvents.ORDER_COMPLETED]: (
    args: OrderEventPublishPayload,
    id: string
  ) => void;
  [OrderEvents.ORDER_CANCELLED]: (
    args: OrderEventPublishPayload,
    id: string
  ) => void;
}
