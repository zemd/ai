---
name: calculate-colors
description: Calculate and compare opaque colors with the @zemd/color-mcp server. Use when converting hex, RGB, OKLab, or OKLCH colors, checking sRGB gamut, finding maximum chroma, or building hue-consistent palettes.
---

# Calculate Colors

Use the `color` MCP server. Treat its structured result as the source of truth; color conversion is a poor place for confident mental arithmetic.

If `convert_color` and `find_max_chroma` are unavailable, ask the user to connect `@zemd/color-mcp`. Do not silently replace the server with guessed values.

## Convert a color

Call `convert_color` with one structured input:

```json
{ "color": { "notation": "hex", "hex": "#663399" } }
{ "color": { "notation": "rgb", "r": 102, "g": 51, "b": 153 } }
{ "color": { "notation": "oklab", "L": 0.44, "a": 0.09, "b": -0.13 } }
{ "color": { "notation": "oklch", "L": 0.44, "c": 0.16, "h": 303 } }
```

Return the notation the user asked for. Include the other forms when comparison is useful.

Check `gamut.inGamut` for OKLab and OKLCH inputs. If it is false, say that the returned RGB and hex values were clipped. Do not present the clipped value as an exact round-trip.

The server handles opaque colors only. Say so when the request includes alpha.

## Understand OKLab and OKLCH

Treat OKLab and OKLCH as two coordinate systems for the same perceptual color model.

- OKLab uses `L` for lightness and Cartesian `a` and `b` opponent axes.
- OKLCH keeps `L`, turns `sqrt(a² + b²)` into chroma `C`, and turns `atan2(b, a)` into hue `h` in degrees.

Use OKLab for axis or vector math. Use OKLCH when the user wants to adjust lightness, chroma, or hue directly.

## Find maximum chroma

Call `find_max_chroma` with one lightness and hue:

```json
{ "L": 0.7, "h": 220 }
```

Use `maxChroma` as the approximate largest `C` that fits in sRGB for that exact pair.

Maximum chroma changes from one hue to another because the sRGB gamut is not cylindrical in OKLCH. Call the tool again for every hue, even when lightness stays fixed. One limit reused across a palette is convenient, consistent, and wrong.

For comparable relative intensity across hues, choose a ratio from 0 through 1 and calculate each color as:

```text
C = ratio * maxChroma(L, h)
```

Report the ratio, each hue's `maxChroma`, and the resulting `C` so the decision remains inspectable.
