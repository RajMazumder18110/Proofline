/** @notice Types for Order module */
export const enum OrderStatus {
  PENDING = "PENDING",
  VERIFYING = "VERIFYING",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export const enum OrderFailReasons {
  INVALID_SIGNATURE = "INVALID_SIGNATURE",
}

export type Order = {
  id: string;
  status: OrderStatus;
  erc20: string;
  from: string;
  to: string;
  amount: string;
  txHash: string | null;
  signature: string;
  sigTimestamp: number;
  createdAt: Date;
  updatedAt: Date;
};

export type GetOrderByPayloadParams = Pick<
  Order,
  "erc20" | "from" | "to" | "amount"
>;

export type OrderSignaturePayload = Pick<
  Order,
  "erc20" | "from" | "to" | "amount" | "sigTimestamp"
>;

export type CreateOrderPayload = Pick<
  Order,
  "erc20" | "from" | "to" | "amount" | "sigTimestamp" | "signature"
>;

export type OrderEventMap = {
  /// Worker specific events ///
  "event.status.dropped": [jobId: string];
  "event.status.processed": [jobId: string];
  /// Order specific events
  "order.status.changed": [payload: { orderId: string; status: OrderStatus }];
  "order.status.completed": [payload: { orderId: string }];
  "order.status.cancelled": [
    payload: { orderId: string; reason: OrderFailReasons }
  ];
  /// Mandatory events
  error: [error: Error];
};
