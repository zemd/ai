# @zemd/ai

A monorepo of AI tools.

## Projects

| Project                                         | Version                                                                                                                                 | License    | Description                                                       |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------- |
| [`@zemd/color-mcp`](./mcp/color)                | [![npm](https://img.shields.io/npm/v/@zemd/color-mcp?color=0000ff&label=npm&labelColor=000)](https://npmjs.com/package/@zemd/color-mcp) | Apache-2.0 | Convert sRGB, OKLab, and OKLCH colors and inspect sRGB gamut.     |
| [`calculate-colors`](./skills/calculate-colors) | 0.1.0                                                                                                                                   | MIT        | Teach an agent to use the color MCP server without guessing math. |

## Install the skill

Install the reusable color skill with any Agent Skills-compatible installer:

```sh
npx skills@latest add zemd/ai --skill calculate-colors
```

Connect `@zemd/color-mcp` as `color` before using the skill. See the [server README](./mcp/color/README.md) for local and package-based configuration.

## License

Unless stated otherwise, packages are released under **Apache-2.0** 😇.

## 💙 💛 Donate

[![](https://img.shields.io/static/v1?label=UNITED24&message=support%20Ukraine&color=blue)](https://u24.gov.ua/)
