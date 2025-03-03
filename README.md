# `node-api-prebuilts`

A CLI and library to manage, locate and load prebuilt node addons targetting [Node-API].
The tool should be used as a post-build step to copy the native addon into a
directory structure which disambiguates the binaries by their triplets.
It serves a similar purpose to [`prebuildify`] and [`pkg-prebuilds`].

Design goals:

* don't drag in any "unnecessary" dependencies (see [below](#no-unnecessary-dependencies))
* be build-system agnostic
* no magic / explicit configuration over guesswork
* be lightweight
* provide typed APIs for CLI commands

Non-goals:

* Support node addons implemented with nan / V8 / libuv APIs

## Usage

```sh
yarn add @adesso-se/node-api-prebuilts
# -- OR -- #
npm install --save @adesso-se/node-api-prebuilts
```

Add the `prebuilts/` directory to your `.gitignore` and include it in your
distribution package via the `package.json#files` property.

Add a post-build step to your native addon that copies the built addon into the
`prebuilts` directory. The invocation should roughly look like this:

```sh
node-api-prebuilts --cmd=copy --build-dir=buid/Release --package-dir=. --name=nvefs --napi-version=8
```

See [CLI Documentation](#cli-documentation) for more information.

Add a `loader-options.json` to your package. It defines the supported Node API
versions and the addon name in a central place, e.g.:

```json
{
  "name": "nvefs",
  "napi_versions": [8]
}
```

With the scaffolding in place the addon can be loaded like this (assuming the
compiled js output is placed in the package root):

```ts
import { requireAddon } from '@adesso-se/node-api-prebuilts';
const {
  exports: {
    foo,
    bar,
  },
} = requireAddon<{
  foo: (arg: string) => bool;
  bar: object;
}>(__dirname, "loader-options.json");
```

Lastly you want to prevent rebuilding the native addon on package-install if a
suitable prebuilt binary already exists:

```json
{
  "scripts": {
    "install": "node-api-prebuilts --cmd=check-path --loader-options=loader-options.json || <the addon needs to be built>"
  }
}
```

The `check-path` command sets the exit code to zero if a prebuilt binary has
been found and to a non-zero exit code otherwise.

### API Synopsis

```ts
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

/**
 * Reads the json LoaderOptions representation from disk.
 *
 * (It currently doesn't validate the loaded json)
 */
export declare function loadLoaderOptions(optionsPath: string): LoaderOptions;

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
 * @param loaderOptions specifies which native addon to look for
 * @param loaderOptionsPath specifies a filepath relative to `packageDir`
 *                          containing a json representation of loaderOptions
 * @returns the addon's exports, load path and resolved path.
 */
export declare function requireAddon<Addon extends object = UnknownRecord>(
  packageDir: string,
  loaderOptions: LoaderOptions,
): AddonModule<Addon>;
export declare function requireAddon<Addon extends object = UnknownRecord>(
  packageDir: string,
  loaderOptionsPath: string,
): AddonModule<Addon>;

export interface AddonModule<Addon extends object = UnknownRecord> {
  readonly exports: Addon;
  readonly path: string;
  readonly resolvedPath: string;
}
// exposition only => not exported or part of the package API
type UnknownRecord = Record<string | number | symbol, unknown>;

/**
 * Returns the triplet composed from the cross compiling environment and the
 * current host.
 */
export function activeTriplet(): Triplet;

/**
 * Maps a triplet to a filesystem-safe string.
 */
export function tripletId(triplet: Triplet): string;
```

Note that this doesn't describe all public APIs but the most commonly used ones.
Consult `src/index.ts` for a complete list. All public APIs have JSDoc comments.

### CLI Documentation

```text
USAGE
  $ node-api-prebuilts [-h | --help]
  $ node-api-prebuilts --cmd=<command>
  $ node-api-prebuilts --cmd=copy --build-dir=<string> --package-dir=<string>
                       [--name=<string> [--napi-version=<int>]]
                       [--files=<comma seperated filenames>]
  $ node-api-prebuilts --cmd=check-path --loader-options=<string>

COMMANDS
  --cmd=copy
    Copies a compiled addon and/or files from the build directory into a sub-
    directory structure in the package directory. Both directory options must
    be supplied. You must either specify the addon name, the files list or both.
    The triplet related options default to the host platform.

    --build-dir=<string>    The path to the directory containing the node addon
    --package-dir=<string>  The path to the packaging directory
                              (will contain the "prebuilts" directory)
    --name=<string>         filename of the node addon (without ".node" stem)
    --napi-version=<int>    Node API version the addon has been compiled against
    --files=<csv>           Additional files to copy from build to package dir
    --platform=<string>     String identifier for the target platform;
                              defaults to the host platform
    --arch=<string>         String identifier for the target ISA;
                              defaults to the host ISA
    --libc=<string>         The name of the target C runtime implementation;
                              defaults to the host C runtime implementation

  --cmd=check-path
    Checks whether the prebuilt addon loader will find an addon. It does so by
    constructing the possible addon locations and checking whether a file exists
    in that place. It sets an exit code != 0 if no file is found or the environ-
    ment variable "npm_config_build_from_source" is set.

    --loader-options=<path> The path to the LoaderOptions json file (required).

EXAMPLES
  Copy an addon named "nvefs" from build/Release to the prebuilts directory:
  $ node-api-prebuilts --cmd=copy --build-dir=buid/Release --package-dir=. \\
      --name=nvefs --napi-version=8

  Copy foo.so and bar.so from build/Release to the prebuilts directory
  $ node-api-prebuilts --cmd=copy --build-dir=buid/Release --package-dir=. \\
      --files=foo.so,bar.so

  Check whether a file would be found by "requireAddon" with the given
  loader-options.json
  $ node-api-prebuilts --cmd=check-path --loader-options=loader-options.json
```

## No unnecessary Dependencies

At its core this libray has one job: Locate (and load) a native node addon for
the execution triplet. Therefore we only want to depend on packages that
directly help with this task and are stable. It is also quite annoying to
retrieve deprecation/security notices about libraries which are only ever used
by install scripts. This implies that we can't use `yargs` and the like to parse
CLI arguments.

## License

[MIT License](https://choosealicense.com/licenses/mit/)

[Node-API]: https://nodejs.org/dist/latest-v16.x/docs/api/n-api.html#node-api
[`prebuildify`]: https://www.npmjs.com/package/prebuildify
[`pkg-prebuilds`]: https://www.npmjs.com/package/pkg-prebuilds
