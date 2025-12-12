/** @notice Library imports */
import IORedis from "ioredis";
import { Job, Queue } from "bullmq";
/// Local imports
import { Queues } from "@/queues";
import type { ERC20 } from "@/core/ERC20";
import type { TransferEventPayload } from "@/types/erc20";

export class ERC20TransfersQueue {
  /// Holds the instances.
  private _queue: Queue;
  private _erc20: ERC20;

  /**
   * @notice Constructor
   * @dev Initializes the ERC20 transfers queue.
   * @param {IORedis} connection The Redis connection instance.
   * @param {ERC20} erc20 The ERC20 contract instance.
   */
  constructor(connection: IORedis, erc20: ERC20) {
    this._erc20 = erc20;
    this._queue = new Queue(Queues.ERC20_TRANSFERS, {
      connection,
      defaultJobOptions: {
        /// TODO: Adjust attempts and backoff strategy as needed
      },
    });
  }

  /// Public methods ///
  /**
   * @notice Starts listening for ERC20 transfer events and adds them to the queue.
   * @dev Sets up event listeners for Transfer events and enqueues them for processing.
   * @return {Promise<void>} A promise that resolves when the listener is set up.
   */
  public async start(): Promise<void> {
    /// Listen for Transfer events from the ERC20 contract
    this._erc20.on("transfer", this._enqueue.bind(this));
  }

  /**
   * @notice Stops listening for ERC20 transfer events and cleans up the queue.
   * @dev Removes event listeners and closes the queue.
   * @return {Promise<void>} A promise that resolves when the queue is cleaned up.
   */
  public async stop(): Promise<void> {
    /// Stop any ongoing operations
    this._erc20.off("transfer", this._enqueue.bind(this));
    /// Clean up the queue
    await this._queue.close();
  }

  /// Private methods ///
  /**
   * @notice Enqueues a transfer event payload for processing.
   * @dev Adds the transfer event payload to the queue with a unique job ID.
   * @param {TransferEventPayload} payload The transfer event payload to enqueue.
   * @return {Promise<void>} A promise that resolves when the payload is enqueued.
   */
  private async _enqueue(payload: TransferEventPayload): Promise<void> {
    await this._queue.add("Transfer", payload, {
      // Use transaction hash as job ID to avoid duplicates
      jobId: payload.txHash,
    });
  }
}
