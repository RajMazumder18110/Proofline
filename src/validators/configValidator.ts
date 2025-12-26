/** @notice Library imports */
import { z } from "zod";
import { isAddress } from "ethers";

/// Schema
export const configSchema = z.object({
  /// Application settings
  application: z.object({
    name: z.string().min(1, "Application name is required"),
    version: z.string().min(1, "Application version is required"),
    logging: z.object({
      level: z.enum(["debug", "info", "warn", "error"], {
        error: "Logging level is required",
      }),
    }),
    server: z.object({
      port: z
        .number()
        .int()
        .min(1, "Server port must be at least 1")
        .max(65535, "Server port must be at most 65535"),
    }),
    shutdownSignals: z
      .array(z.enum(["SIGINT", "SIGTERM"]))
      .nonempty("At least one shutdown signal is required"),
  }),

  /// Database settings
  database: z.object({
    redisUrl: z.url("Invalid Redis URL"),
    mysqlUrl: z.url("Invalid MySQL URL"),
  }),

  /// Queues
  queues: z.object({
    defaultJobOptions: z.object({
      removeOnComplete: z.boolean().default(true),
      removeOnFail: z.object({
        age: z
          .int()
          .nonnegative()
          .min(0, "Age must be non-negative")
          .default(86400), // 1 day
      }),
      attempts: z.number().min(1, "Attempts must be at least 1"),
      backoff: z.object({
        type: z.enum(["fixed", "exponential"], {
          error: "Backoff type is required",
        }),
        delay: z.number().min(0, "Backoff delay must be non-negative"),
      }),
    }),
  }),

  /// Workers
  workers: z.object({
    concurrency: z
      .int()
      .nonnegative()
      .min(1, "Worker concurrency must be at least 1"),
  }),

  /// Contracts
  contracts: z
    .array(
      z.object({
        chainId: z.number().int().nonnegative().min(1, "Invalid chain ID"),
        network: z.string().min(1, "Network name is required"),
        rpcUrl: z.url("Invalid RPC URL"),
        address: z.string().refine((addr) => isAddress(addr), {
          message: "Invalid contract address",
        }),
      })
    )
    .min(1, "At least one contract configuration is required"),

  /// Secrets
  secrets: z.object({
    hmacSignatureSecret: z
      .string()
      .min(10, "HMAC signature secret must be at least 10 characters long"),

    hmacSelfSignatureSecret: z
      .string()
      .min(
        10,
        "HMAC self-signature secret must be at least 10 characters long"
      ),
  }),
});

/// Types
export type Configs = z.infer<typeof configSchema>;
