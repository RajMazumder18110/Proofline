/** @notice Library imports */
import config from "config";
/// Local imports
import { configSchema, type Configs } from "@/validators/configValidator";

/// Grabbing all configs
const data = config.util.toObject();
/// Validating and exporting
export const configs: Configs = Object.freeze(configSchema.parse(data));
