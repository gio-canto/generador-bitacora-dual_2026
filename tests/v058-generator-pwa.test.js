import { describe, expect, it } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  GENERATOR_PWA_SIZES,
  generateGeneratorPwaIcons,
} from "../scripts/create-pwa-icons.mjs";

describe("v0.58 PWA del generador independiente de Registro Dual", () => {
  it("instala el generador con nombre e iconos propios", async () => {
    const generator = JSON.parse(await readFile("public/manifest.webmanifest", "utf8"));
    const registry = JSON.parse(await readFile("public/registro-entrega/manifest.webmanifest", "utf8"));
    expect(generator).toMatchObject({
      short_name: "Generador Dual",
      start_url: "./",
      scope: "./",
      display: "standalone",
    });
    expect(generator.short_name).not.toBe(registry.short_name);
    expect(generator.icons.map((icon) => icon.sizes)).toEqual(
      expect.arrayContaining(["192x192", "512x512"]),
    );
    expect(generator.icons.some((icon) => icon.purpose === "maskable")).toBe(true);
    expect(generator.icons.every((icon) => icon.src.startsWith("./Assets/generador-dual-"))).toBe(true);
    expect((await readFile("index.html", "utf8"))).toContain("./manifest.webmanifest");
  });

  it("deriva los iconos del logotipo oficial del generador", async () => {
    const temp = await mkdtemp(join(tmpdir(), "generator-mobile-icons-"));
    try {
      const names = await generateGeneratorPwaIcons(temp);
      expect(names).toHaveLength(GENERATOR_PWA_SIZES.length);
      for (const [name, size] of GENERATOR_PWA_SIZES) {
        const file = await readFile(join(temp, name));
        expect(file.subarray(1, 4).toString()).toBe("PNG");
        expect(file.readUInt32BE(16)).toBe(size);
        expect(file.readUInt32BE(20)).toBe(size);
      }
    } finally {
      await rm(temp, { recursive: true, force: true });
    }
  });
});
