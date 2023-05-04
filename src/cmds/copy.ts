import { constants, copyFileSync, mkdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { exit, versions } from "node:process";

import { prebuiltsDirectoryPath, versionedAddonFilename } from "../paths.js";
import { ConfigurationNode, validateConfigOrExit } from "../simple-args.js";
import { activeTriplet, makeTripletWithFallback, Triplet } from "../triplet.js";
import { CommandError, isErrnoException } from "../utility.js";

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

export default function copyArtifactsCommand(config: ConfigurationNode) {
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

/**
 * Copies a node addon from its build directory to the prebuilts directory.
 *
 * Equivalent to the CLI command `--copy`.
 *
 * @param name The filename of the node addon without the `.node` extension
 * @param buildDir The path to the directory containing the node addon
 * @param packageDir The path to the packaging directory (will contain the `prebuilts` directory)
 * @param triplet The triplet of the node addon
 * @param napiVersion The Node API version the addon has been compiled against
 * @param files Additional files to copy from `buildDir` to `packageDir`; these paths must be relative
 */
export function copyArtifacts(
  buildDir: string,
  packageDir: string,
  triplet: Triplet,
  napiVersion: number,
  { name, files = [] }: { name?: string; files?: string[] },
) {
  const outputDirectoryPath = join(packageDir, prebuiltsDirectoryPath(triplet));

  try {
    mkdirSync(outputDirectoryPath, { recursive: true });
  } catch (exc) {
    // if the output directory already exists we can continue
    if (
      !isErrnoException(exc) ||
      exc.code !== "EEXIST" ||
      !statSync(outputDirectoryPath, { throwIfNoEntry: false })?.isDirectory()
    ) {
      throw new CommandError(
        `Failed to create the output directory "${outputDirectoryPath}"`,
        exc,
      );
    }
  }

  if (name != null) {
    const artifactBuildPath = join(buildDir, `${name}.node`);
    const artifactName = versionedAddonFilename(name, napiVersion);
    try {
      copyFileSync(
        artifactBuildPath,
        join(outputDirectoryPath, artifactName),
        constants.COPYFILE_FICLONE,
      );
    } catch (exc) {
      throw new CommandError(
        "Failed to copy the node addon to the output directory",
        exc,
      );
    }
  }

  for (const file of files) {
    try {
      copyFileSync(
        join(buildDir, file),
        join(outputDirectoryPath, file),
        constants.COPYFILE_FICLONE,
      );
    } catch (exc) {
      throw new CommandError(
        `Failed to copy the additional file "${file}" to the output directory`,
        exc,
      );
    }
  }
}
