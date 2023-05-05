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
import {
  CommandError,
  isErrnoException,
  isNonEmptyString,
  isNonNullObject,
} from "./utility.js";

type UnknownRecord = Record<string | number | symbol, unknown>;

/**
 * Describes which file paths to consider when attempting to load an addon.
 */
export interface LoaderOptions {
  /**
   * The addon's basename
   *
   * The loader will append '.node' stem and the Node API version suffix.
   */
  readonly name: string;
  /**
   * Specifies which Node API version suffixes will be tried by the loader.
   */
  readonly napi_versions: readonly number[];
}

export interface AddonModule<Addon extends object = UnknownRecord> {
  readonly exports: Addon;
  readonly path: string;
  readonly resolvedPath: string;
}
/**
 * Creates a `requireAddon` function with the given require instance.
 * @see requireAddon
 */
export function createRequireAddon(_require: NodeJS.Require) {
  return function requireAddon<Addon extends object = UnknownRecord>(
    packageDir: string,
    loaderOptions: LoaderOptions,
  ): AddonModule<Addon> {
    validateRequireAddonArgs(packageDir, loaderOptions);
    const addonPaths = compatiblePrebuiltAddonPaths(loaderOptions, packageDir);

    addonPaths.unshift(
      join(packageDir, `build/Debug/${loaderOptions.name}.node`),
      join(packageDir, `build/Release/${loaderOptions.name}.node`),
    );

    for (let i = 0; i < addonPaths.length; ++i) {
      const addonPath = addonPaths[i];
      try {
        const resolvedPath = _require.resolve(addonPath);
        return {
          exports: _require(resolvedPath) as Addon,
          path: addonPath,
          resolvedPath,
        };
      } catch (exc) {
        if (
          i + 1 < addonPaths.length &&
          typeof exc === "object" &&
          (exc as UnknownRecord | null)?.code === "MODULE_NOT_FOUND"
        ) {
          continue;
        }
        throw exc;
      }
    }

    // the loop above will either return early or rethrow the exception thrown by
    // the last failed addon load attempt.
    throw new Error(`unreachable`);
  };
}

const nativeRequire =
  (globalThis as UnknownRecord).__webpack_require__ === require
    ? ((globalThis as UnknownRecord).__non_webpack_require__ as NodeJS.Require)
    : require;

/**
 * Loads the node addon and returns its exports, load path and resolved path.
 * The latter two might be useful if you need to `dlopen()` the addon binary
 * later on.
 *
 * The function first tries to load the addon from the `build/` directory, i.e.
 * if the user built a debug version or requested a from-source-build via
 * `npm_config_build_from_source` it takes preference over any prebuilt binary.
 * Afterwards it tries to load all paths returned by @linkcode prebuiltsDirectoryPath()
 * until a binary is found. If this isn't the case it will rethrow the last
 * `"MODULE_NOT_FOUND"` exception.
 *
 * @param packageDir specifies the path to the directory containing `prebuilts`
 * @param loaderOptions specifies what and how to look for
 * @returns the addon's exports, load path and resolved path.
 */
export const requireAddon = createRequireAddon(nativeRequire);

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
): void {
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

function validateRequireAddonArgs(
  basePath: unknown,
  loaderOptions: unknown,
): void {
  if (!isNonEmptyString(basePath)) {
    throw new Error("addonPath() first argument must be a non-empty string");
  }
  validateAddonInfo(loaderOptions);
}

function validateAddonInfo(loaderOptions: unknown): void {
  if (!isNonNullObject(loaderOptions)) {
    throw new Error("addonPath second argument must be an object");
  }
  if (!isNonEmptyString(loaderOptions.name)) {
    throw new Error("the addonInfo object must contain an addon's name");
  }
  if (
    !Array.isArray(loaderOptions.napi_versions) ||
    loaderOptions.napi_versions.length <= 0 ||
    !loaderOptions.napi_versions.every(
      (val): val is number => typeof val === "number",
    )
  ) {
    throw new Error(
      "the addonInfo object must contain an array with napi version numbers",
    );
  }
}
