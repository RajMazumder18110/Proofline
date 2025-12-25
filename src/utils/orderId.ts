/** @notice Library imports */
import { customAlphabet } from "nanoid";

const alphabets =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const orderIdPrefix = "ORD";
const nanoIdLength = 30;

export const generateOrderId = (): string => {
  const nanoid = customAlphabet(alphabets, nanoIdLength);
  return `${orderIdPrefix}_${nanoid()}`;
};
