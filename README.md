## 🚧 **UNDER CONSTRUCTION** 🚧
# `node-api-prebuilts`

A CLI and library to manage, locate and load prebuilt node addons targetting [Node-API].
The tool should be used as a post-build step to copy the native addon into a
directory structure which disambiguates the binaries by their triplets.
So it serves a similar purpose to [`prebuildify`] and [`pkg-prebuilds`].

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

### CLI documentation
```
USAGE
  $ node-api-prebuilts [-h | --help]
  $ node-api-prebuilts --cmd=<command>
  $ node-api-prebuilts --cmd=copy --build-dir=<string> --package-dir=<string>
                       [--name=<string> [--napi-version=<int>]]
                       [--files=<comma seperated filenames>]

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


EXAMPLES
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
