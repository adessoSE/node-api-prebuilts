import { join } from "node:path";
import { versions } from "node:process";

import type { LoaderOptions } from "./addon.js";
import { activeTriplet, Triplet, tripletId } from "./triplet.js";
import { isNonEmptyString } from "./utility.js";

/**
 * Derives from a LoaderOptions object which paths should be considered when
 * loading the addon. It prunes the specified Node API versions exceeding
 * `process.versions.napi`.
 *
 * @param {LoaderOptions} param0 specifies which file paths to consider
 * @param packageDir optionally specifies the path to the directory containing `prebuilts`
 *                   otherwise it is assumed that `packageDir == cwd` holds
 * @returns an array of paths which will be considered by requireAddon
 *
 * @see activeTriplet
 */
export function compatiblePrebuiltAddonPaths(
  { name, napi_versions }: LoaderOptions,
  packageDir?: string,
): string[] {
  const maxSupportedNapiVersion = parseInt(versions.napi);

  const napiVersions = napi_versions.filter(
    (version) => version <= maxSupportedNapiVersion,
  );
  // array order determines availability check order
  // => descending version numbers guarantee highest available will be chosen
  napiVersions.sort((lhs, rhs) => rhs - lhs);

  const triplet = activeTriplet();
  return napiVersions.map((version) =>
    addonPrebuiltPath(name, version, triplet, packageDir),
  );
}
export function addonPrebuiltPath(
  name: string,
  napiVersion: number,
  triplet: Triplet,
  packageDir?: string,
): string {
  const directory = prebuiltsDirectoryPath(triplet, packageDir);
  const versionedName = versionedAddonFilename(name, napiVersion);
  return join(directory, versionedName);
}
export function prebuiltsDirectoryPath(
  triplet: Triplet,
  packageDir?: string,
): string {
  const prebuiltsDir = "prebuilts";
  const tripletDir = tripletDirectoryName(triplet);
  return isNonEmptyString(packageDir)
    ? join(packageDir, prebuiltsDir, tripletDir)
    : join(prebuiltsDir, tripletDir);
}

/**
 * Bijectively maps a triplet to a directory name.
 */
export function tripletDirectoryName(triplet: Triplet): string {
  return tripletId(triplet);
}
export function versionedAddonFilename(
  name: string,
  napiVersion: number,
): string {
  return `${name}-napi${napiVersion.toString().padStart(2, "0")}.node`;
}
