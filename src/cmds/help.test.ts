import { describe, expect, it, jest } from "@jest/globals";

import helpCommand from "./help";

describe("help-command", () => {
  // since entrypoint.cjs isn't compiled, we use this test case to assert that
  // help.ts is abiding its API contract
  it("should export a default function which prints something to the console", () => {
    console.log = jest.fn();
    helpCommand({});
    expect(console.log).toHaveBeenCalled();
  });
});
