import { describe, it, expect } from "@jest/globals";

import { parseArgs } from "./simple-args";

describe("simple-args", () => {
  describe("parseArgs", () => {
    it("should parse simple boolean flags", () => {
      const cfg = parseArgs([
        "--dev",
        "--db-encryption=false",
        "--online=true",
      ]);

      expect(typeof cfg).toBe("object");
      expect(cfg.dev).toBe(true);
      expect(cfg["db-encryption"]).toBe(false);
      expect(cfg.online).toBe(true);
      expect(Object.getOwnPropertyNames(cfg).length).toBe(3);
    });

    it("should parse strings arguments", () => {
      const cfg = parseArgs([
        "--env=qa",
        "--o=0=1",
        "--count=42",
        "--number=42.42",
      ]);

      expect(typeof cfg).toBe("object");
      expect(cfg.env).toBe("qa");
      expect(cfg.o).toBe("0=1");
      expect(cfg.count).toBe(42);
      expect(cfg.number).toBe(42.42);
      expect(Object.getOwnPropertyNames(cfg).length).toBe(4);
    });

    it("should ignore non config values", () => {
      const cfg = parseArgs([
        "/usr/bin/stuff",
        "C:\\xpath\\electron.exe",
        "-not-valid",
        "this=uninteresting",
        "-me=very-uninteresting",
      ]);

      expect(typeof cfg).toBe("object");
      expect(Object.getOwnPropertyNames(cfg).length).toBe(0);
    });
  });
});
