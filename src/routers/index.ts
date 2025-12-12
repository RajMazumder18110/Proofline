/** @notice Exports all routers */
export * from "./orderRouter";

/// Router paths ///
const PREFIX = "/api";
export enum RouterPaths {
  ORDERS = `${PREFIX}/orders`,
}
