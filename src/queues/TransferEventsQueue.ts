/** @notice Library imports */
import IORedis from "ioredis";
import { Queue } from "bullmq";
/// Local imports
import { Queues } from "@/queues";
import { configs } from "@/configs";
import type { TransferEventPayload } from "@/types/erc20";

export class TransferEventsQueue {
  /// Holds the instances.
  private _queue: Queue;

  /**
   * @notice Constructor
   * @dev Initializes the ERC20 transfers queue.
   * @param {IORedis} connection The Redis connection instance.
   */
  constructor(connection: IORedis) {
    this._queue = new Queue(Queues.ERC20_TRANSFERS, {
      connection,
      defaultJobOptions: configs.queues.defaultJobOptions,
    });
  }

  /// Public methods ///
  /**
   * @notice Enqueues a transfer event payload for processing.
   * @dev Adds the transfer event payload to the queue with a unique job ID.
   * @param {TransferEventPayload} payload The transfer event payload to enqueue.
   * @return {Promise<void>} A promise that resolves when the payload is enqueued.
   */
  public async enqueue(payload: TransferEventPayload): Promise<void> {
    await this._queue.add("Transfer", payload, {
      // Use transaction hash as job ID to avoid duplicates
      jobId: payload.txHash,
    });
  }
}
