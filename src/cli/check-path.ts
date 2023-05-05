import { env, exit } from "node:process";

import { loadLoaderOptions, probeAddonPathForFile } from "../addon.js";
import { CommandError } from "../utility.js";
import { ConfigurationNode, validateConfigOrExit } from "./simple-args.js";

interface CheckPathParams {
  "loader-options": string;
}
const checkPathParamsSpec = {
  "loader-options": { type: "string", required: true },
} as const;

export function checkPathCommand(config: ConfigurationNode) {
  const params = validateConfigOrExit<CheckPathParams>(
    config,
    checkPathParamsSpec,
  );

  if (env.npm_config_build_from_source) {
    exit(1);
  }

  try {
    const loaderOptions = loadLoaderOptions(params["loader-options"]);
    const foundAddonFile = probeAddonPathForFile(loaderOptions);
    exit(foundAddonFile ? 0 : 1);
  } catch (exc) {
    if (exc instanceof CommandError) {
      console.error(exc.message);
    } else {
      console.error("node-api-prebuilts: Failed to check for prebuilt addons.");
      console.error(exc);
    }
    exit(2);
  }
}
