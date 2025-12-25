/** @notice Library imports */
import winston from "winston";
/// Local imports

export const logger = winston.createLogger({
  level: "info",
  defaultMeta: { app: "Proofline", version: "1.0.0" },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format.colorize()
      ),
      silent: process.env.NODE_ENV === "test",
    }),
  ],
});
