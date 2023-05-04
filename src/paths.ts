import { Triplet } from "./triplet.js";
import { isNonEmptyString } from "./utility.js";

export function prebuiltsDirectoryPath(triplet: Triplet): string {
  return `prebuilts/${tripletDirectoryName(triplet)}`;
}

/**
 * Bijectively maps a triplet to a directory name.
 */
export function tripletDirectoryName(triplet: Triplet): string {
  return [triplet.platform, triplet.arch, triplet.libc]
    .filter(isNonEmptyString)
    .join("-");
}
export function versionedAddonFilename(
  name: string,
  napiVersion: number,
): string {
  return `${name}-napi${napiVersion.toString().padStart(2, "0")}.node`;
}
