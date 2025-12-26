/** @notice Library imports */
import { z } from "zod";
import { isAddress } from "ethers";
import { createInsertSchema } from "drizzle-zod";
/// Local imports
import { orders } from "@/database/schemas";

export const findOrderByIdSchema = z.object({
  id: z.coerce.number().positive({ message: "Invalid ID" }),
});

export const orderInsertSchema = createInsertSchema(orders, {
  erc20: (schema) =>
    schema.refine(isAddress, { error: "Invalid ERC20 address" }),
  from: (schema) => schema.refine(isAddress, { error: "Invalid from address" }),
  to: (schema) => schema.refine(isAddress, { error: "Invalid to address" }),
  amount: (schema) =>
    schema.min(BigInt(1), { error: "Amount must be greater than zero" }),
  signature: (schema) =>
    schema
      .min(1, { error: "Signature cannot be empty" })
      .max(512, { error: "Signature is too long" }),
}).pick({
  erc20: true,
  from: true,
  to: true,
  amount: true,
  signature: true,
  timestamp: true,
});
