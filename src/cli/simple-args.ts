import { exit } from "node:process";

export type ConfigurationValue = string | number | boolean | undefined;
export type ConfigurationNode = Record<string, ConfigurationValue>;

export function parseArgs(args: string[]): ConfigurationNode {
  const config = Object.create(null) as ConfigurationNode;

  const reg = /^--([-a-zA-Z0-9]+)(?:=(.+))?$/;
  for (const arg of args) {
    const m = reg.exec(arg);
    if (m?.[1]) {
      const argVal = parseValue(m[2]);
      config[m[1]] = argVal;
    }
  }

  return config;
}

export function parseValue(serialized: string | undefined): ConfigurationValue {
  if (serialized === undefined || serialized === "true") {
    return true;
  } else if (serialized === "false") {
    return false;
  } else if (/^(?:0x[A-Fa-f\d]+)$/.test(serialized)) {
    return Number.parseInt(serialized, 16);
  } else if (/^(-?\d+)$/.test(serialized)) {
    return Number.parseInt(serialized, 10);
  } else if (/^-?(?:0|[1-9]\d*)(?:\.\d+)(?:[Ee][+-]?\d+)?$/.test(serialized)) {
    return Number.parseFloat(serialized);
  }
  return serialized;
}

export type ConfigSpec = Record<
  string,
  { type: "string" | "number" | "boolean"; required?: boolean }
>;

// FIXME: relate `T` to `spec` or refactor to type guard
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export function validateConfig<T>(
  config: ConfigurationNode,
  spec: ConfigSpec,
): T {
  const maybeInvalidArg = Object.keys(config).find((arg) => !(arg in spec));
  if (maybeInvalidArg !== undefined) {
    throw new Error(`"${maybeInvalidArg}" unknown argument.`);
  }

  for (const key of Object.keys(spec)) {
    if (!(key in config)) {
      if (spec[key].required) {
        throw new Error(`"${key}" has not been configured but is required.`);
      }
      continue;
    }
    const givenType = typeof config[key];
    const expectedType = spec[key].type;
    if (givenType !== expectedType) {
      throw new Error(
        `"${key}"'s value is of type ${givenType} but ${expectedType} is expected.`,
      );
    }
  }
  return config as T;
}
// FIXME: relate `T` to `spec`
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export function validateConfigOrExit<T>(
  config: ConfigurationNode,
  spec: ConfigSpec,
): T {
  try {
    return validateConfig(config, spec);
  } catch (error) {
    console.error(
      `node-api-prebuilts: Failed to validate the commandline parameters: ${
        (error as Error).message
      }`,
    );
    exit(2);
  }
}
