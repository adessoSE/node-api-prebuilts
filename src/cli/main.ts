import { argv, exit } from "node:process";

import { copyArtifactsCommand } from "./copy.js";
import { helpCommand } from "./help.js";
import { parseArgs } from "./simple-args.js";

const params = parseArgs(argv.slice(2));

if (argv.length < 3 || params.help === true || argv.slice(2).includes("-h")) {
  delete params.help;
  helpCommand();
  exit(0);
}

const { cmd } = params;
delete params.cmd;

switch (cmd) {
  case "copy":
    copyArtifactsCommand(params);
    break;

  case undefined:
    console.error(
      'node-api-prebuilts: No "--cmd=<command>" option supplied. Use --help to print usage information.',
    );
    exit(-1);
  // eslint-disable-next-line no-fallthrough
  default:
    console.error(
      `node-api-prebuilts: "--cmd=${cmd.toString()}" doesn't specify a known command. Use --help to print usage information`,
    );
    exit(-1);
}

exit(0);
