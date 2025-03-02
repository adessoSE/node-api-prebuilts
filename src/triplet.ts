import { arch, config, env, platform } from "node:process";

import { familySync } from "detect-libc";

import { isNonEmptyString } from "./utility.js";

/**
 * Describes a runtime environment (ISA, OS, C runtime).
 *
 * The name is borrowed from cross compiling nomenclature.
 */
export interface Triplet {
  /**
   * String identifier for a platform aka Operating System.
   *
   * In the context of NodeJS this can be one of the following values:
   * * `'aix'`
   * * `'darwin'`
   * * `'freebsd'`
   * * `'linux'`
   * * `'openbsd'`
   * * `'sunos'`
   * * `'win32'`
   */
  platform: string;
  /**
   * String identifier for a processor's instruction set architecture (ISA).
   *
   * In the context of NodeJS this can be one of the following values:
   * * `'arm'`
   * * `'arm64'`
   * * `'ia32'`
   * * `'mips'`
   * * `'mipsel'`
   * * `'ppc'`
   * * `'ppc64'`
   * * `'s390'`
   * * `'s390x'`
   * * `'x32'`
   * * `'x64'`
   */
  arch: string;
  /**
   * The name of the C runtime implementation.
   *
   * Needs only be provided in the case where for a given platform multiple
   * standard libraries are commonly used. This is currently the case on linux
   * where `'glibc'` and `'musl'` are both widely used linux implementations.
   */
  libc: string | null;
}

function hasArmVersion(
  vars: NodeJS.ProcessConfig["variables"],
): vars is NodeJS.ProcessConfig["variables"] & {
  arm_version: string;
} {
  return "arm_version" in vars;
}
// see https://github.com/nodejs/node/issues/9491
const sanitizedArch =
  arch !== "arm" || !hasArmVersion(config.variables)
    ? arch
    : `armv${config.variables.arm_version}`;

/**
 * Returns the triplet of the currently executing process.
 */
export function hostTriplet(): Triplet {
  return {
    platform,
    arch: sanitizedArch,
    libc: familySync(),
  };
}
/**
 * Returns triplet values provided by the environment for cross compiling.
 */
function configuredTriplet(): Partial<Triplet> {
  return {
    platform: env.npm_config_platform,
    arch: env.npm_config_arch,
  };
}

/**
 * Returns the triplet composed from the cross compiling environment and the
 * current host.
 */
export function activeTriplet(): Triplet {
  return makeTripletWithFallback(configuredTriplet(), hostTriplet());
}

/**
 * Bijectively maps a triplet to a filesystem-safe string.
 */
export function tripletId(triplet: Triplet): string {
  return [triplet.platform, triplet.arch, triplet.libc]
    .filter(isNonEmptyString)
    .join("-");
}

export function makeTripletWithFallback(
  partialTriplet: Partial<Triplet>,
  fallback: Triplet,
): Triplet {
  return {
    platform: isNonEmptyString(partialTriplet.platform)
      ? partialTriplet.platform
      : fallback.platform,
    arch: isNonEmptyString(partialTriplet.arch)
      ? partialTriplet.arch
      : fallback.arch,
    libc:
      partialTriplet.libc === null || isNonEmptyString(partialTriplet.libc)
        ? partialTriplet.libc
        : fallback.libc,
  };
}
