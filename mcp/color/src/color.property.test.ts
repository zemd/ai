import assert from "node:assert/strict";
import { describe, it } from "node:test";

import * as fc from "fast-check";

import { calculateMaxChroma, convertColor, normalizeHue } from "./color.ts";

const channel = fc.integer({ min: 0, max: 255 });

void describe("color properties", () => {
  void it("round-trips every sampled RGB color through hexadecimal notation", () => {
    fc.assert(
      fc.property(channel, channel, channel, (r, g, b) => {
        const converted = convertColor({ notation: "rgb", r, g, b });
        const fromHex = convertColor({ notation: "hex", hex: converted.hex });

        assert.deepStrictEqual(fromHex.rgb, { r, g, b });
      }),
    );
  });

  void it("normalizes every finite hue into one turn", () => {
    fc.assert(
      fc.property(fc.double({ noNaN: true, noDefaultInfinity: true }), (hue) => {
        const normalized = normalizeHue(hue);

        assert.ok(normalized >= 0);
        assert.ok(normalized < 360);
      }),
    );
  });

  void it("returns finite, displayable sRGB boundaries", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1, noNaN: true }),
        fc.double({ min: -10_000, max: 10_000, noNaN: true }),
        (L, h) => {
          const result = calculateMaxChroma(L, h);

          assert.ok(Number.isFinite(result.maxChroma));
          assert.ok(result.maxChroma >= 0);
          assert.ok(Object.values(result.rgb).every((value) => Number.isInteger(value)));
          assert.ok(Object.values(result.rgb).every((value) => value >= 0 && value <= 255));
        },
      ),
    );
  });
});
