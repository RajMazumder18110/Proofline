/** @notice Library imports */
import type { JsonRpcProvider, WebSocketProvider } from "ethers";

/// Type definitions for the ERC20 core module
export type ProviderConnection = JsonRpcProvider | WebSocketProvider;
export type TransferFilter = {
  address: string;
  topics: string[];
};
export type TransferEventPayload = {
  to: string;
  from: string;
  value: string;
  txHash: string;
  erc20: string;
  blockNumber: number;
  blockHash: string;
};
export type ERC20EventMap = {
  /// ERC20 specific events
  transfer: [payload: TransferEventPayload];
  // /// Mandatory events
  error: [error: Error];
};
