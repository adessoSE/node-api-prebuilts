import { fs, vol } from "memfs";
import { sep } from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { copyArtifacts } from "./addon";

vi.mock("node:fs");
vi.mock("node:fs/promises");

describe("addon", () => {
  beforeEach(() => {
    vol.reset();
    vol.mkdirSync(process.cwd(), { recursive: true });
  });
  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("copyArtifacts", () => {
    it("should create the output directory and call copyFile for the addon", () => {
      vol.fromJSON({
        "build/Release/addon.node": "content",
      });
      const mkdirSync = vi.spyOn(fs, "mkdirSync");
      const copyFileSync = vi.spyOn(fs, "copyFileSync");

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
        fs.constants.COPYFILE_FICLONE,
      );
    });

    it("should create the output directory and call copyFile for the addon with libc", () => {
      vol.fromJSON({
        "build/Release/addon.node": "content",
      });
      const mkdirSync = vi.spyOn(fs, "mkdirSync");
      const copyFileSync = vi.spyOn(fs, "copyFileSync");

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
        fs.constants.COPYFILE_FICLONE,
      );
    });

    it("should create the output directory and call copyFile for every file", () => {
      vol.fromJSON({
        "build/Release/libfoo.so": "contentA",
        "build/Release/libbar.so": "contentB",
      });
      const mkdirSync = vi.spyOn(fs, "mkdirSync");
      const copyFileSync = vi.spyOn(fs, "copyFileSync");

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
        fs.constants.COPYFILE_FICLONE,
      );
      expect(copyFileSync).toHaveBeenCalledWith(
        `build${sep}Release${sep}libbar.so`,
        `prebuilts${sep}linux-x64-glibc${sep}libbar.so`,
        fs.constants.COPYFILE_FICLONE,
      );
    });
  });
});
