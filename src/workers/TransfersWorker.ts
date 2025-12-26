/** @notice Library imports */
import IORedis from "ioredis";
import { Job, Worker } from "bullmq";
/// Local imports
import { Queues } from "@/queues";
import { configs } from "@/configs";
import { logger } from "@/configs/logger";
import { signOrder } from "@/utils/signature";
import type { TransferEventPayload } from "@/types/erc20";
import type { OrderManager } from "@/services/OrderManager";
import { OrderStatus, OrderFailReasons } from "@/types/order";
import type { OrderEventQueue } from "@/queues/OrderEventQueue";

export class TransfersWorker {
  /// Holds the instances.
  private _worker: Worker;

  /**
   * @notice Constructor
   * @dev Initializes the ERC20 transfers worker.
   * @param {IORedis} connection The Redis connection instance.
   * @param {OrderManager} orderManager The order manager service instance.
   * @param {OrderEventQueue} orderEvents The order events queue instance.
   */
  constructor(
    connection: IORedis,
    private orderManager: OrderManager,
    private orderEvents: OrderEventQueue
  ) {
    /// Worker instance
    this._worker = new Worker(
      Queues.ERC20_TRANSFERS,
      this._execute.bind(this),
      { connection, autorun: false, concurrency: configs.workers.concurrency }
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
    logger.info("TransfersWorker started and processing jobs.");
    await this._worker.run();
  }

  /**
   * @notice Stops the ERC20 transfers worker.
   * @dev Cleans up the worker and stops processing jobs.
   * @return {Promise<void>} A promise that resolves when the worker stops.
   */
  public async stop(): Promise<void> {
    await this._worker.close();
    logger.info("TransfersWorker stopped.");
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
    /// Checking if order exists for the given payload
    const order = await this.orderManager.getOrderIdByPayload({
      to: payload.to,
      from: payload.from,
      erc20: payload.erc20,
      amount: BigInt(payload.value),
    });
    /// If no valid order found, drop the job
    if (!order) return;

    /// Process the order further
    await this.orderEvents.publish({
      eventName: "order:progress",
      orderId: order.orderId,
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
        orderId: order.orderId,
        status: OrderStatus.CANCELLED,
      });
      /// Emit events for cancellation
      await this.orderEvents.publish({
        eventName: "order:cancelled",
        orderId: order.orderId,
        status: OrderStatus.CANCELLED,
      });

      /// Logging invalid signature attempt
      logger.warn(
        `Order ${order.orderId} cancelled due to invalid signature.`,
        {
          orderId: order.orderId,
          computedSignature: sig,
          expectedSignature: order.signature,
        }
      );
      return;
    }

    /// Mark order as completed
    await this.orderDatabase.completeOrder(order.id, payload.txHash);
    /// Emit events for status change
    await this.orderEvents.publish({
      eventName: "order:progress",
      orderId: order.orderId,
      status: OrderStatus.COMPLETED,
    });
    /// Emit events for completion
    await this.orderEvents.publish({
      eventName: "order:completed",
      orderId: order.orderId,
      status: OrderStatus.COMPLETED,
    });
    /// Logging successful order completion
    logger.info(`Order ${order.orderId} completed successfully.`, {
      orderId: order.orderId,
      txHash: payload.txHash,
    });
  }
}
