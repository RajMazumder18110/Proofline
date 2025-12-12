/** @notice Library imports */
/// Local imports
import type { ERC20 } from "./ERC20";
import type { TransferEventPayload } from "@/types/erc20";

export class Random {
  /**
   * @notice Constructor
   * @param _erc20 The ERC20 instance.
   */
  constructor(private _erc20: ERC20) {}

  /// Public methods ///
  /**
   * @notice Starts the Random operations.
   * @dev Sets up event listeners for ERC20 transfer events.
   */
  public async start(): Promise<void> {
    this._erc20.on("transfer", this._onTransferEvent.bind(this));
  }

  /**
   * @notice Stops the Random operations and cleans up resources.
   * @dev Cleans up ERC20 event listeners.
   */
  public async stop(): Promise<void> {
    this._erc20.removeListener("transfer", this._onTransferEvent.bind(this));
  }

  /// Private methods ///
  /**
   * @notice Handles ERC20 transfer events.
   * @param {TransferEventPayload} payload The transfer event payload.
   */
  private async _onTransferEvent(payload: TransferEventPayload): Promise<void> {
    console.log("Random received transfer event:", payload.txHash);
  }
}
