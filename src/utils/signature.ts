/** @notice Library imports */
import crypto from "crypto";
/// Local imports
import type {
  GetOrderByPayloadParams,
  OrderSignaturePayload,
} from "@/types/order";
import { configs } from "@/configs";

/**
 * @notice Generates signature for the order.
 * @dev Creates signature string based on the order details.
 * @param {OrderSignaturePayload} payload The details of the order.
 * @return {string} Returns the HMAC SHA256 signature as a hex string.
 */
export const signOrder = (payload: OrderSignaturePayload): string => {
  const sig = crypto
    .createHmac("sha512", configs.secrets.hmacSignatureSecret)
    .update(
      JSON.stringify({
        chainId: payload.chainId,
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
  payload: Omit<OrderSignaturePayload, "timestamp">
): string => {
  const sig = crypto
    .createHmac("sha256", configs.secrets.hmacSelfSignatureSecret)
    .update(
      JSON.stringify({
        chainId: payload.chainId,
        to: payload.to.toLowerCase(),
        from: payload.from.toLowerCase(),
        erc20: payload.erc20.toLowerCase(),
        amount: payload.amount.toString(),
      })
    )
    .digest("hex");
  return sig;
};
