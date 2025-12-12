/** @notice Exports all the default configurations */
import { type QueueOptions } from "bullmq";

/// Default options for the ERC20 transfer queue
export const defaultTransferQueueOptions: QueueOptions["defaultJobOptions"] = {
  removeOnComplete: { count: 0 },
  removeOnFail: { age: 86400 }, // 1 day
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 1000,
  },
};
