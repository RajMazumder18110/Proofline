/** @notice Library imports */
import {
  id,
  type Log,
  type EventPayload,
  Interface,
  JsonRpcProvider,
  WebSocketProvider,
} from "ethers";
/// Local imports
import type {
  TransferFilter,
  ProviderConnection,
  TransferEventPayload,
  TransferEventPublishPayload,
} from "@/types/erc20";
import { configs } from "@/configs";
import { logger } from "@/configs/logger";
import type { TransferEventsQueue } from "@/queues/TransferEventsQueue";

export class ERC20Events {
  /// Holds the provider instance
  private _queue: TransferEventsQueue;
  private _providers: ProviderConnection[] = [];

  /**
   * @notice Constructor
   * @dev Initializes the provider connection.
   * @param {TransferEventsQueue} queue The ERC20 transfers queue instance.
   */
  constructor(queue: TransferEventsQueue) {
    this._queue = queue;
  }

  /// Public methods ///
  /**
   * @notice Starts the ERC20 operations.
   * @dev Sets up event listeners for Transfer events and error handling.
   */
  public async start(): Promise<void> {
    /// Looping through all the contracts from config.
    const contracts = configs.contracts;
    for (const contract of contracts) {
      /// Provider
      const provider = this._getProvider(contract.rpcUrl);

      /// adding filter for Transfer events
      const filter: TransferFilter = {
        address: contract.address,
        topics: [id("Transfer(address,address,uint256)")],
      };

      /// Listen erc20 `Transfer` events with context
      await provider.on(
        filter,
        async (log: Log, event: EventPayload<TransferFilter>) => {
          await this._onTransfer(
            log,
            event,
            contract.chainId,
            contract.network
          );
        }
      );
      await provider.on("error", async (error: Error) => {
        await this._onError(error, contract.chainId, contract.network);
      });

      /// Storing provider instance
      this._providers.push(provider);

      /// Log start message
      logger.info(
        `ERC20Events started for contract: ${contract.address} on chain ${contract.chainId}`
      );
    }
  }

  /**
   * @notice Stops the ERC20 operations and cleans up resources.
   * @dev Cleans up provider listeners and destroys the provider instance.
   */
  public async stop(): Promise<void> {
    for (const provider of this._providers) {
      /// Clean up provider listeners
      await provider.removeAllListeners();
      await provider.destroy();
      /// Log stop message
      logger.info(
        `ERC20Events stopped for provider: ${provider._network.chainId}`
      );
    }
  }

  /// Private methods ///

  /**
   * @notice Gets the appropriate provider based on the RPC URL.
   * @dev Supports both WebSocket and HTTP providers.
   * @param rpcUrl The RPC URL to connect to.
   * @returns The provider connection instance.
   */
  private _getProvider(rpcUrl: string): ProviderConnection {
    const isWsUrl = rpcUrl.startsWith("ws://") || rpcUrl.startsWith("wss://");
    if (isWsUrl) {
      return new WebSocketProvider(rpcUrl);
    } else {
      return new JsonRpcProvider(rpcUrl);
    }
  }

  /**
   * @notice Handles errors by emitting an "error" event.
   * @param error The error object to handle.
   * @param chainId The chain ID where the error occurred.
   * @param network The network name where the error occurred.
   */
  private async _onError(
    error: Error,
    chainId: number,
    network: string
  ): Promise<void> {
    // this.emit("error", error);
    /// TODO: Implement error handling logic
  }

  /**
   * @notice Handles Transfer events by emitting a "transfer" event.
   * @param log The log object associated with the event.
   * @param event The event payload containing Transfer event data.
   * @param chainId The chain ID where the event occurred.
   * @param network The network name where the event occurred.
   */
  private async _onTransfer(
    log: Log,
    event: EventPayload<TransferFilter>,
    chainId: number,
    network: string
  ): Promise<void> {
    /// Preparing payload
    const payload: TransferEventPayload = this._parseLog(log);
    /// Enqueue transfer event payload
    const payloadWithMeta: TransferEventPublishPayload = {
      ...payload,
      chainId,
      network,
    };
    await this._queue.enqueue(payloadWithMeta);
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
