/** @notice Library imports */
import IORedis from "ioredis";
import { Job, Worker } from "bullmq";
/// Local imports
import { Queues } from "@/queues";
import { configs } from "@/configs";
import { logger } from "@/configs/logger";
import { signOrder } from "@/utils/signature";
import type { OrderManager } from "@/services/OrderManager";
import { OrderStatus, OrderFailReasons } from "@/types/order";
import type { OrderEventQueue } from "@/queues/OrderEventQueue";
import type { TransferEventPublishPayload } from "@/types/erc20";

export class TransfersWorker {
  /// Holds the instances.
  private _worker: Worker<TransferEventPublishPayload>;

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
    this._worker = new Worker<TransferEventPublishPayload>(
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
   * @param {Job<TransferEventPublishPayload>} job The job to process.
   * @param {string} token An optional token for job processing.
   * @param {AbortSignal} signal An optional abort signal for job cancellation.
   * @return {Promise<void>} A promise that resolves when the job is processed.
   */
  private async _execute(
    job: Job<TransferEventPublishPayload>,
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
    logger.info(`Processing order.`, { orderId: order.orderId });
    /// Emit events for verifying status
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
      /// TODO: Handle invalid signature case
      /// Mark order as failed due to invalid signature
      // await this.orderDatabase.failOrder(
      //   order.id,
      //   OrderFailReasons.INVALID_SIGNATURE
      // );
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
        reason: OrderFailReasons.INVALID_SIGNATURE,
      });

      /// Logging invalid signature attempt
      logger.warn(`Order cancelled due to invalid signature.`, {
        orderId: order.orderId,
        computedSignature: sig,
        expectedSignature: order.signature,
      });
      return;
    }

    /// Mark order as completed
    // await this.orderDatabase.completeOrder(order.id, payload.txHash);
    /// TODO: Update order status in order manager
    /// Mark order as completed in order manager

    /// Emit events for status change
    await this.orderEvents.publish({
      eventName: "order:progress",
      orderId: order.orderId,
      status: OrderStatus.COMPLETED,
    });
    /// Emit events for completion
    await this.orderEvents.publish({
      eventName: "order:completed",
      status: OrderStatus.COMPLETED,
      /// Order details
      orderId: order.orderId,
      erc20: order.erc20,
      from: order.from,
      to: order.to,
      amount: order.amount.toString(),
      timestamp: order.timestamp,
      chainId: payload.chainId,
      txHash: payload.txHash,
      signature: order.signature,
    });

    /// Logging successful order completion
    logger.info(`Order completed successfully.`, {
      orderId: order.orderId,
      txHash: payload.txHash,
    });
  }
}
