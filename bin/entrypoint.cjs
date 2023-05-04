#!/usr/bin/env node

const commands = ["help"];

const { argv, exit } = require("node:process");
const { parseArgs } = require("../dist/simple-args.js");
const params = parseArgs(argv.slice(2));

if (
  argv.length < 3 ||
  params.help === true ||
  argv.slice(2).indexOf("-h") >= 0
) {
  params.cmd = "help";
  delete params.help;
} else if (typeof params.cmd !== "string") {
  console.error(
    'node-api-prebuilts: No "--cmd=<command>" option supplied. Use --help to print usage information.',
  );
  exit(-1);
} else if (commands.findIndex((cmdName) => cmdName === params.cmd) < 0) {
  console.error(
    `node-api-prebuilts: "--cmd=${params.cmd}" doesn't specify a known command. Use --help to print usage information`,
  );
  exit(-1);
}
const { cmd } = params;
delete params.cmd; // option has been fully evaluated

require(`../dist/cmds/${cmd}.js`).default(params);
