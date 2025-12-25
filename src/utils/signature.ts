/** @notice Library imports */
import crypto from "crypto";
/// Local imports
import { HMAC_SECRET } from "@/configs/env";
import type {
  GetOrderByPayloadParams,
  OrderSignaturePayload,
} from "@/types/order";

/**
 * @notice Generates signature for the order.
 * @dev Creates signature string based on the order details.
 * @param {OrderSignaturePayload} payload The details of the order.
 * @return {string} Returns the HMAC SHA256 signature as a hex string.
 */
export const signOrder = (payload: OrderSignaturePayload): string => {
  const sig = crypto
    .createHmac("sha512", HMAC_SECRET)
    .update(
      JSON.stringify({
        to: payload.to.toLowerCase(),
        from: payload.from.toLowerCase(),
        erc20: payload.erc20.toLowerCase(),
        amount: payload.amount.toString(),
        timestamp: Number(payload.timestamp),
      })
    )
    .digest("hex");
  return sig;
};

/**
 * @notice Generates signature for order details used in Redis.
 * @dev Creates signature string based on the order details without timestamp.
 * @param payload The details of the order.
 * @returns The HMAC SHA256 signature as a hex string.
 */
export const signOrderDetailsForRedis = (
  payload: GetOrderByPayloadParams
): string => {
  const sig = crypto
    .createHmac("sha256", HMAC_SECRET)
    .update(
      JSON.stringify({
        to: payload.to.toLowerCase(),
        from: payload.from.toLowerCase(),
        erc20: payload.erc20.toLowerCase(),
        amount: payload.amount.toString(),
      })
    )
    .digest("hex");
  return sig;
};
