import { constants, copyFileSync, mkdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { prebuiltsDirectoryPath, versionedAddonFilename } from "./paths";
import { Triplet } from "./triplet";
import { CommandError, isErrnoException } from "./utility";

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
