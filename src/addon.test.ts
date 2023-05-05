import { afterEach, describe, expect, it, jest } from "@jest/globals";
import type { copyFileSync, mkdirSync, statSync } from "fs";
import { sep } from "path";

import { copyArtifacts } from "./addon";

type FsMock = {
  mkdirSync: jest.MockedFunction<typeof mkdirSync>;
  statSync: jest.MockedFunction<typeof statSync>;
  copyFileSync: jest.MockedFunction<typeof copyFileSync>;
  constants: {
    COPYFILE_FICLONE: number;
  };
};
jest.mock(
  "node:fs",
  (): FsMock => ({
    mkdirSync: jest.fn(),
    statSync: jest.fn() as unknown as jest.MockedFunction<typeof statSync>,
    copyFileSync: jest.fn(),
    constants: {
      COPYFILE_FICLONE: 0xc0de,
    },
  }),
);

describe("addon", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("copyArtifacts", () => {
    it("should create the output directory and call copyFile for the addon", () => {
      const {
        copyFileSync,
        mkdirSync,
        constants: { COPYFILE_FICLONE },
      } = jest.requireMock<FsMock>("node:fs");

      copyArtifacts(
        "build/Release",
        ".",
        { platform: "win32", arch: "x64", libc: null },
        6,
        { name: "addon" },
      );

      expect(mkdirSync).toHaveBeenCalledTimes(1);
      expect(mkdirSync).toHaveBeenCalledWith(`prebuilts${sep}win32-x64`, {
        recursive: true,
      });

      expect(copyFileSync).toHaveBeenCalledTimes(1);
      expect(copyFileSync).toHaveBeenCalledWith(
        `build${sep}Release${sep}addon.node`,
        `prebuilts${sep}win32-x64${sep}addon-napi06.node`,
        COPYFILE_FICLONE,
      );
    });
    it("should create the output directory and call copyFile for the addon with libc", () => {
      const {
        copyFileSync,
        mkdirSync,
        constants: { COPYFILE_FICLONE },
      } = jest.requireMock<FsMock>("node:fs");

      copyArtifacts(
        "build/Release",
        ".",
        { platform: "linux", arch: "x64", libc: "glibc" },
        6,
        { name: "addon" },
      );

      expect(mkdirSync).toHaveBeenCalledTimes(1);
      expect(mkdirSync).toHaveBeenCalledWith(`prebuilts${sep}linux-x64-glibc`, {
        recursive: true,
      });

      expect(copyFileSync).toHaveBeenCalledTimes(1);
      expect(copyFileSync).toHaveBeenCalledWith(
        `build${sep}Release${sep}addon.node`,
        `prebuilts${sep}linux-x64-glibc${sep}addon-napi06.node`,
        COPYFILE_FICLONE,
      );
    });

    it("should create the output directory and call copyFile for every file", () => {
      const {
        copyFileSync,
        mkdirSync,
        constants: { COPYFILE_FICLONE },
      } = jest.requireMock<FsMock>("node:fs");

      copyArtifacts(
        "build/Release",
        ".",
        { platform: "linux", arch: "x64", libc: "glibc" },
        6,
        { files: ["libfoo.so", "libbar.so"] },
      );

      expect(mkdirSync).toHaveBeenCalledTimes(1);
      expect(mkdirSync).toHaveBeenCalledWith(`prebuilts${sep}linux-x64-glibc`, {
        recursive: true,
      });

      expect(copyFileSync).toHaveBeenCalledTimes(2);
      expect(copyFileSync).toHaveBeenCalledWith(
        `build${sep}Release${sep}libfoo.so`,
        `prebuilts${sep}linux-x64-glibc${sep}libfoo.so`,
        COPYFILE_FICLONE,
      );
      expect(copyFileSync).toHaveBeenCalledWith(
        `build${sep}Release${sep}libbar.so`,
        `prebuilts${sep}linux-x64-glibc${sep}libbar.so`,
        COPYFILE_FICLONE,
      );
    });
  });
});
