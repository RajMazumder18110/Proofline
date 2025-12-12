/** @notice Library imports */
import IORedis from "ioredis";
import { Job, Worker } from "bullmq";
import { EventEmitter } from "events";
/// Local imports
import {
  OrderFailReasons,
  OrderStatus,
  type OrderEventMap,
} from "@/types/order";
import { Queues } from "@/queues";
import { signOrder } from "@/utils/signature";
import type { TransferEventPayload } from "@/types/erc20";
import type { OrderDatabase } from "@/database/handlers/OrderDatabase";

export class OrderWorker extends EventEmitter<OrderEventMap> {
  /// Holds the instances.
  private _worker: Worker;

  /**
   * @notice Constructor
   * @dev Initializes the ERC20 transfers worker.
   * @param {IORedis} connection The Redis connection instance.
   * @param {OrderDatabase} _orderDatabase The order database service instance.
   */
  constructor(connection: IORedis, private _orderDatabase: OrderDatabase) {
    super();
    this._worker = new Worker(
      Queues.ERC20_TRANSFERS,
      this._execute.bind(this),
      { connection, autorun: false }
    );
  }

  /// Public methods ///
  /**
   * @notice Starts the ERC20 transfers worker.
   * @dev Begins processing jobs from the queue.
   * @return {Promise<void>} A promise that resolves when the worker starts.
   */
  public async start(): Promise<void> {
    await this._worker.run();
  }

  /**
   * @notice Stops the ERC20 transfers worker.
   * @dev Cleans up the worker and stops processing jobs.
   * @return {Promise<void>} A promise that resolves when the worker stops.
   */
  public async stop(): Promise<void> {
    await this._worker.close();
  }

  /// Private methods ///
  /**
   * @notice Processes a transfer event payload job.
   * @dev Handles the logic for processing the transfer event payload.
   * @param {Job<TransferEventPayload>} job The job to process.
   * @param {string} token An optional token for job processing.
   * @param {AbortSignal} signal An optional abort signal for job cancellation.
   * @return {Promise<void>} A promise that resolves when the job is processed.
   */
  private async _execute(
    job: Job<TransferEventPayload>,
    token?: string,
    signal?: AbortSignal
  ): Promise<void> {
    /// Extract the job data
    const jobId = job.id!;
    const payload = job.data;
    /// Grabbing order based on payload
    const order = await this._orderDatabase.getOrderByPayload({
      to: payload.to,
      from: payload.from,
      erc20: payload.erc20,
      amount: BigInt(payload.value),
    });
    /// If no order found, drop the job
    if (!order) {
      this.emit("event.status.dropped", jobId);
      return;
    }

    /// Process the order further
    this.emit("event.status.processed", jobId);
    this.emit("order.status.changed", {
      orderId: order.id,
      status: OrderStatus.VERIFYING,
    });
    /// Prepare signature
    const sig = signOrder({
      to: payload.to,
      from: payload.from,
      erc20: payload.erc20,
      amount: BigInt(payload.value),
      timestamp: order.timestamp,
    });

    /// Validate the signature
    if (sig !== order.signature) {
      await this._orderDatabase.failOrder(
        order.id,
        OrderFailReasons.INVALID_SIGNATURE
      );
      /// Emit events for status change
      this.emit("order.status.changed", {
        orderId: order.id,
        status: OrderStatus.CANCELLED,
      });
      /// Emit events for cancellation
      this.emit("order.status.cancelled", {
        orderId: order.id,
        reason: OrderFailReasons.INVALID_SIGNATURE,
      });
      return;
    }

    /// Mark order as completed
    await this._orderDatabase.completeOrder(order.id, payload.txHash);
    this.emit("order.status.changed", {
      orderId: order.id,
      status: OrderStatus.COMPLETED,
    });
    this.emit("event.status.processed", jobId);
  }
}
