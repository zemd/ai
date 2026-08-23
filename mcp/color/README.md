# @zemd/color-mcp

An MCP server for converting opaque colors between hexadecimal sRGB, 8-bit sRGB, OKLab, and OKLCH. It also calculates the maximum OKLCH chroma that fits in sRGB.

The calculations come from [`@zemd/color`](https://github.com/zemd/js/tree/main/packages/color). The server adds MCP schemas and useful output. It does not add mystery math for atmosphere.

## Connect

Run the published package as a local stdio server:

```json
{
  "mcpServers": {
    "color": {
      "command": "npx",
      "args": ["-y", "@zemd/color-mcp"]
    }
  }
}
```

## Tools

### `convert_color`

Pass one structured color:

```json
{ "color": { "notation": "hex", "hex": "#663399" } }
{ "color": { "notation": "rgb", "r": 102, "g": 51, "b": 153 } }
{ "color": { "notation": "oklab", "L": 0.44, "a": 0.09, "b": -0.13 } }
{ "color": { "notation": "oklch", "L": 0.44, "c": 0.16, "h": 303 } }
```

The result contains numeric and CSS forms for hex, RGB, OKLab, and OKLCH. For an out-of-gamut OKLab or OKLCH input, the original perceptual coordinates stay intact while the returned sRGB and hex values are clipped. Check `gamut.inGamut` instead of hoping the display negotiates with physics.

Alpha channels are not supported because `@zemd/color` works with opaque RGB colors.

### `find_max_chroma`

Pass OKLCH lightness and hue:

```json
{ "L": 0.7, "h": 220 }
```

The result contains `maxChroma` plus the boundary color in OKLCH, RGB, hex, and CSS notation.

## OKLCH and OKLab

OKLab describes a color with perceptual lightness `L` and Cartesian opponent axes `a` and `b`. OKLCH is the cylindrical form of the same color space:

- `L` stays the same.
- `C = sqrt(a² + b²)` becomes chroma.
- `h = atan2(b, a)` becomes hue in degrees.

They are two coordinate systems for the same model. OKLab is useful for vector math. OKLCH is usually easier when adjusting lightness, chroma, and hue deliberately.

## Chroma changes with hue

The sRGB gamut is not a neat cylinder in OKLCH. At the same lightness, one hue may allow more chroma than another before clipping.

Call `find_max_chroma` once for every `L` and `h` pair you intend to use. For a palette at `L = 0.7`, do not calculate one chroma limit and reuse it across every hue. That shortcut produces a palette whose most consistent feature is accidental clipping.

To keep a relative saturation level across hues, choose a ratio from 0 through 1 and calculate each color as `C = ratio * maxChroma`.

## Development

Use the [MCP Inspector](https://github.com/modelcontextprotocol/inspector) for an interactive protocol check:

```sh
cd mcp/color
npx @modelcontextprotocol/inspector node ./dist/cli.mjs
```

## License

`@zemd/color-mcp` is released under the Apache 2.0 license.

## 💙 💛 Donate

[![](https://img.shields.io/static/v1?label=UNITED24&message=support%20Ukraine&color=blue)](https://u24.gov.ua/)
