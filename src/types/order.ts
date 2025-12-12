/** @notice Local imports */
import { orders } from "@/database/schemas";

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

export type OrderEventMap = {
  /// Worker specific events ///
  "event.status.dropped": [jobId: string];
  "event.status.processed": [jobId: string];
  /// Order specific events
  "order.status.changed": [payload: { orderId: number; status: OrderStatus }];
  "order.status.completed": [payload: { orderId: number }];
  "order.status.cancelled": [
    payload: { orderId: number; reason: OrderFailReasons }
  ];
  /// Mandatory events
  error: [error: Error];
};
