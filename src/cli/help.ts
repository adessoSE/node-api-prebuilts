// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require("../../package.json") as { version: string };

const helpText = `node-api-prebuilts - a management tool for prebuilt addons [version ${version}]

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
`;

export function helpCommand() {
  console.log(helpText);
}
