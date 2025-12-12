/** @notice Library imports */
import crypto from "crypto";
/// Local imports
import { HMAC_SECRET } from "@/configs/env";
import type { OrderSignaturePayload } from "@/types/order";

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
        timestamp: payload.timestamp,
      })
    )
    .digest("hex");
  return sig;
};
