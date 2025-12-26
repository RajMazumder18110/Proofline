/** @notice Library imports */
import winston from "winston";
/// Local imports
import { configs } from "@/configs";

export const logger = winston.createLogger({
  level: configs.application.logging.level,
  defaultMeta: {
    app: configs.application.name,
    version: configs.application.version,
  },
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
