import { ConfigurationNode } from "../simple-args";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require("../../package.json") as { version: string };

const helpText = `node-api-prebuilts - a management tool for prebuilt addons [version ${version}]

USAGE
  $ node-api-prebuilts [-h | --help]
  $ node-api-prebuilts --cmd=<command>

COMMANDS

EXAMPLES
`;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function helpCommand(_config: ConfigurationNode) {
  console.log(helpText);
}
