import {
  constants,
  copyFileSync,
  mkdirSync,
  readFileSync,
  statSync,
} from "node:fs";
import { join } from "node:path";

import {
  compatiblePrebuiltAddonPaths,
  prebuiltsDirectoryPath,
  versionedAddonFilename,
} from "./paths.js";
import { Triplet } from "./triplet.js";
import { CommandError, isErrnoException } from "./utility.js";

/**
 * Describes which file paths to consider when attempting to load an addon.
 */
export interface LoaderOptions {
  /**
   * The addon's basename
   *
   * The loader will append '.node' stem and the Node API version suffix.
   */
  name: string;
  /**
   * Specifies which Node API version suffixes will be tried by the loader.
   */
  napi_versions: number[];
}

/**
 * Copies a node addon from its build directory to the prebuilts directory.
 *
 * Equivalent to the CLI `copy` command.
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
  const outputDirectoryPath = prebuiltsDirectoryPath(triplet, packageDir);

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

/**
 * Checks whether any of the paths considered by `requireAddon()` leads to a file.
 * It doesn't attempt to check a potentially found addon in any way.
 *
 * Mostly equivalent to the CLI `check-path` command. Notably it doesn't return
 * false if the environment variable `npm_config_build_from_source` has been set.
 *
 * @returns true if a file has been found, false otherwise.
 */
export function probeAddonPathForFile(
  loaderOptions: LoaderOptions,
  packageDir?: string,
): boolean {
  const prebuiltAddonPaths = compatiblePrebuiltAddonPaths(
    loaderOptions,
    packageDir,
  );
  for (const prebuiltAddonPath of prebuiltAddonPaths) {
    if (statSync(prebuiltAddonPath, { throwIfNoEntry: false })?.isFile()) {
      return true;
    }
  }
  return false;
}

/**
 * Reads the json LoaderOptions representation from disk.
 *
 * (It currently doesn't validate the loaded json)
 */
export function loadLoaderOptions(optionsPath: string): LoaderOptions {
  try {
    const optionsFileContent = readFileSync(optionsPath, { encoding: "utf-8" });
    return JSON.parse(optionsFileContent) as LoaderOptions;
  } catch (error) {
    throw new CommandError(
      `Failed to load the loader options file "${optionsPath}".`,
      error,
    );
  }
}
