import { exit, versions } from "node:process";

import { copyArtifacts } from "../addon.js";
import { activeTriplet, makeTripletWithFallback } from "../triplet.js";
import { CommandError } from "../utility.js";
import { ConfigurationNode, validateConfigOrExit } from "./simple-args.js";

interface CopyParams {
  "build-dir": string;
  "package-dir": string;

  platform?: string;
  arch?: string;
  libc?: string;

  name?: string;
  "napi-version"?: number;

  files?: string;
}
const copyParamsSpec = {
  "build-dir": {
    type: "string",
    required: true,
  },
  "package-dir": {
    type: "string",
    required: true,
  },
  platform: {
    type: "string",
  },
  arch: {
    type: "string",
  },
  libc: {
    type: "string",
  },
  name: {
    type: "string",
  },
  "napi-version": {
    type: "number",
  },
  files: {
    type: "string",
  },
} as const;

export function copyArtifactsCommand(config: ConfigurationNode) {
  const params = validateConfigOrExit<CopyParams>(config, copyParamsSpec);

  const triplet = makeTripletWithFallback(params, activeTriplet());
  const files = params.files?.split(",") ?? [];
  const napiVersion = params["napi-version"] ?? parseInt(versions.napi);

  if (params.name == null && files.length < 1) {
    console.error(
      "node-api-prebuilts: Missing --name or --files option. Use --help to print usage information.",
    );
    exit(-1);
  }

  try {
    copyArtifacts(
      params["build-dir"],
      params["package-dir"],
      triplet,
      napiVersion,
      {
        name: params.name,
        files,
      },
    );
  } catch (exc) {
    if (exc instanceof CommandError) {
      console.error(exc.message);
    } else {
      console.error("node-api-prebuilts: Failed to copy the artifacts.");
      console.error(exc);
    }
    exit(1);
  }
}
