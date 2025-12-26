/** @notice Library imports */
import { id, type Log, type EventPayload, Interface } from "ethers";
/// Local imports
import type {
  TransferFilter,
  ProviderConnection,
  TransferEventPayload,
} from "@/types/erc20";
import { logger } from "@/configs/logger";
import type { TransferEventsQueue } from "@/queues/TransferEventsQueue";

export class ERC20Events {
  /// Holds the provider instance
  private _address: string;
  private _provider: ProviderConnection;
  private _queue: TransferEventsQueue;

  /**
   * @notice Constructor
   * @dev Initializes the provider connection.
   * @param {string} address The ERC20 contract address.
   * @param {ProviderConnection} connection The provider connection instance.
   * @param {TransferEventsQueue} queue The ERC20 transfers queue instance.
   */
  constructor(
    address: string,
    connection: ProviderConnection,
    queue: TransferEventsQueue
  ) {
    this._queue = queue;
    this._address = address;
    this._provider = connection;
  }

  /// Public methods ///
  /**
   * @notice Starts the ERC20 operations.
   * @dev Sets up event listeners for Transfer events and error handling.
   */
  public async start(): Promise<void> {
    /// Create filter for Transfer events
    const filter: TransferFilter = {
      address: this._address,
      topics: [id("Transfer(address,address,uint256)")],
    };
    /// Listen erc20 `Transfer` events.
    await this._provider.on(filter, this._onTransfer.bind(this));
    /// Listen for provider errors
    await this._provider.on("error", this._onError.bind(this));
    /// Log start message
    logger.info(`ERC20Events started for contract: ${this._address}`);
  }

  /**
   * @notice Stops the ERC20 operations and cleans up resources.
   * @dev Cleans up provider listeners and destroys the provider instance.
   */
  public async stop(): Promise<void> {
    /// Stop any ongoing operations
    await this.stop();
    /// Clean up provider listeners
    await this._provider.removeAllListeners();
    await this._provider.destroy();
    /// Log stop message
    logger.info(`ERC20Events stopped for contract: ${this._address}`);
  }

  /// Private methods ///
  /**
   * @notice Handles errors by emitting an "error" event.
   * @param error The error object to handle.
   */
  private async _onError(error: Error): Promise<void> {
    // this.emit("error", error);
    /// TODO: Implement error handling logic
  }

  /**
   * @notice Handles Transfer events by emitting a "transfer" event.
   * @param log The log object associated with the event.
   * @param event The event payload containing Transfer event data.
   */
  private async _onTransfer(
    log: Log,
    event: EventPayload<TransferFilter>
  ): Promise<void> {
    /// Preparing payload
    const payload: TransferEventPayload = this._parseLog(log);
    /// Enqueue transfer event payload
    await this._queue.enqueue(payload);
  }

  /// Utility methods ///
  /**
   * @notice Parses a log into a TransferEventPayload.
   * @param {Log} log The log to parse.
   * @returns {TransferEventPayload} The parsed transfer event payload.
   */
  private _parseLog(log: Log): TransferEventPayload {
    const iface = new Interface([
      "event Transfer(address indexed from, address indexed to, uint256 value)",
    ]);
    const parsedLog = iface.parseLog(log)!;
    return {
      /// Transfer event data
      to: parsedLog.args.to.toLowerCase(),
      value: parsedLog.args.value.toString(),
      from: parsedLog.args.from.toLowerCase(),

      /// Additional metadata
      blockNumber: log.blockNumber,
      erc20: log.address.toLowerCase(),
      blockHash: log.blockHash.toLowerCase(),
      txHash: log.transactionHash.toLowerCase(),
    };
  }
}
