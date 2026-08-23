import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { calculateMaxChroma, convertColor, normalizeHue } from "./color.ts";

void describe("convertColor", () => {
  void it("converts hexadecimal sRGB to the supported notations", () => {
    const result = convertColor({ notation: "hex", hex: "#ff0000" });

    assert.strictEqual(result.hex, "#ff0000");
    assert.deepStrictEqual(result.rgb, { r: 255, g: 0, b: 0 });
    assert.ok(Math.abs(result.oklch.L - 0.6279553606145516) < 0.5 * 10 ** -10);
    assert.ok(Math.abs(result.oklch.c - 0.2576833077361567) < 0.5 * 10 ** -10);
    assert.ok(Math.abs(result.oklch.h - 29.233885192342633) < 0.5 * 10 ** -10);
    assert.strictEqual(result.css.oklch, "oklch(62.7955% 0.257683 29.2339)");
    assert.deepStrictEqual(result.gamut, {
      space: "srgb",
      inGamut: true,
      clipped: false,
      maxChroma: result.gamut.maxChroma,
    });
  });

  void it("expands shorthand hexadecimal colors", () => {
    const result = convertColor({ notation: "hex", hex: "0f8" });

    assert.strictEqual(result.hex, "#00ff88");
    assert.deepStrictEqual(result.rgb, { r: 0, g: 255, b: 136 });
  });

  void it("rejects malformed hexadecimal colors at the public API", () => {
    assert.throws(
      () => convertColor({ notation: "hex", hex: "#not-a-color" }),
      /three or six hexadecimal digits/,
    );
  });

  void it("converts both neutral and chromatic OKLab coordinates", () => {
    const neutral = convertColor({ notation: "oklab", L: 0.5, a: 0, b: 0 });
    const chromatic = convertColor({ notation: "oklab", L: 0.5, a: 0, b: -0.1 });

    assert.deepStrictEqual(neutral.oklch, { L: 0.5, c: 0, h: 0 });
    assert.ok(Math.abs(chromatic.oklch.c - 0.1) < Number.EPSILON);
    assert.strictEqual(chromatic.oklch.h, 270);
  });

  void it("keeps OKLCH coordinates while clipping only the sRGB result", () => {
    const result = convertColor({ notation: "oklch", L: 0.5, c: 0.4, h: 40 });

    assert.deepStrictEqual(result.oklch, { L: 0.5, c: 0.4, h: 40 });
    assert.strictEqual(result.gamut.inGamut, false);
    assert.strictEqual(result.gamut.clipped, true);
    assert.ok(result.gamut.maxChroma < result.oklch.c);
    assert.ok(Object.values(result.rgb).every((channel) => channel >= 0 && channel <= 255));
  });
});

void describe("calculateMaxChroma", () => {
  void it("returns a stable sRGB boundary", () => {
    const result = calculateMaxChroma(0.5, 40);

    assert.ok(Math.abs(result.maxChroma - 0.15690744224771497) < 0.5 * 10 ** -10);
    assert.deepStrictEqual(result.oklch, { L: 0.5, c: result.maxChroma, h: 40 });
    assert.match(result.css.oklch, /^oklch\(50% 0\.156907 40\)$/);
  });

  void it("shows that the sRGB chroma limit changes with hue", () => {
    const warm = calculateMaxChroma(0.7, 40);
    const cool = calculateMaxChroma(0.7, 220);

    assert.notStrictEqual(warm.maxChroma, cool.maxChroma);
    assert.ok(Math.abs(warm.maxChroma - cool.maxChroma) > 0.01);
  });
});

void describe("normalizeHue", () => {
  void it("wraps hue angles into one turn", () => {
    assert.strictEqual(normalizeHue(-30), 330);
    assert.strictEqual(normalizeHue(360), 0);
    assert.strictEqual(normalizeHue(725), 5);
  });
});
