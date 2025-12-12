/** @notice Library imports */
import IORedis from "ioredis";
import { Job, Worker } from "bullmq";
/// Local imports
import { Queues } from "@/queues";
import { signOrder } from "@/utils/signature";
import type { TransferEventPayload } from "@/types/erc20";
import { OrderStatus, OrderFailReasons } from "@/types/order";
import type { OrderDatabase } from "@/database/handlers/OrderDatabase";
import type { OrderEventQueue } from "@/queues/OrderEventQueue";

export class OrderWorker {
  /// Holds the instances.
  private _worker: Worker;

  /**
   * @notice Constructor
   * @dev Initializes the ERC20 transfers worker.
   * @param {IORedis} connection The Redis connection instance.
   * @param {OrderDatabase} orderDatabase The order database service instance.
   */
  constructor(
    connection: IORedis,
    private orderDatabase: OrderDatabase,
    private orderEvents: OrderEventQueue
  ) {
    /// Worker instance
    this._worker = new Worker(
      Queues.ERC20_TRANSFERS,
      this._execute.bind(this),
      { connection, autorun: true }
    );
  }

  /// Public methods ///
  /**
   * @notice Starts the ERC20 transfers worker.
   * @dev Begins processing jobs from the queue.
   * @return {Promise<void>} A promise that resolves when the worker starts.
   */
  public async start(): Promise<void> {
    if (this._worker.isRunning()) return;
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
    const payload = job.data;
    /// Grabbing order based on payload
    await this.orderEvents.publish({
      eventName: "order:progress",
      orderId: 50,
      status: OrderStatus.VERIFYING,
    });

    await new Promise((resolve) => setTimeout(resolve, 10000));
    await this.orderEvents.publish({
      eventName: "order:progress",
      orderId: 50,
      status: OrderStatus.COMPLETED,
    });
    return;

    const order = await this.orderDatabase.getOrderByPayload({
      to: payload.to,
      from: payload.from,
      erc20: payload.erc20,
      amount: BigInt(payload.value),
    });
    /// If no order found, drop the job
    if (!order) return;

    /// Process the order further
    await this.orderEvents.publish({
      eventName: "order:progress",
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
      await this.orderDatabase.failOrder(
        order.id,
        OrderFailReasons.INVALID_SIGNATURE
      );
      /// Emit events for status change
      await this.orderEvents.publish({
        eventName: "order:progress",
        orderId: order.id,
        status: OrderStatus.CANCELLED,
      });
      /// Emit events for cancellation
      await this.orderEvents.publish({
        eventName: "order:cancelled",
        orderId: order.id,
        status: OrderStatus.CANCELLED,
      });
      return;
    }

    /// Mark order as completed
    await this.orderDatabase.completeOrder(order.id, payload.txHash);
    await this.orderEvents.publish({
      eventName: "order:progress",
      orderId: order.id,
      status: OrderStatus.CANCELLED,
    });
    await this.orderEvents.publish({
      eventName: "order:cancelled",
      orderId: order.id,
      status: OrderStatus.CANCELLED,
    });
  }
}
