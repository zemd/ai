import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

import packageJson from "../package.json" with { type: "json" };
import { calculateMaxChroma, convertColor } from "./color.ts";

const HexInputSchema = z.object({
  notation: z.literal("hex"),
  hex: z
    .string()
    .regex(/^#?(?:[\da-f]{3}|[\da-f]{6})$/i)
    .describe(
      "Three- or six-digit hexadecimal sRGB color. A leading # is optional; alpha is unsupported.",
    ),
});

const RgbInputSchema = z.object({
  notation: z.literal("rgb"),
  r: z.number().int().min(0).max(255).describe("Red sRGB channel from 0 through 255."),
  g: z.number().int().min(0).max(255).describe("Green sRGB channel from 0 through 255."),
  b: z.number().int().min(0).max(255).describe("Blue sRGB channel from 0 through 255."),
});

const OklabInputSchema = z.object({
  notation: z.literal("oklab"),
  L: z.number().min(0).max(1).describe("Perceptual lightness from 0 through 1."),
  a: z.number().finite().describe("Green-red opponent axis."),
  b: z.number().finite().describe("Blue-yellow opponent axis."),
});

const OklchInputSchema = z.object({
  notation: z.literal("oklch"),
  L: z.number().min(0).max(1).describe("Perceptual lightness from 0 through 1."),
  c: z.number().min(0).describe("Chroma. Use find_max_chroma to find the sRGB limit."),
  h: z.number().finite().describe("Hue angle in degrees. Values are normalized to 0 through 360."),
});

const RgbOutputSchema = z.object({
  r: z.number().int(),
  g: z.number().int(),
  b: z.number().int(),
});

const OklabOutputSchema = z.object({
  L: z.number(),
  a: z.number(),
  b: z.number(),
});

const OklchOutputSchema = z.object({
  L: z.number(),
  c: z.number(),
  h: z.number(),
});

const CssOutputSchema = z.object({
  hex: z.string(),
  rgb: z.string(),
  oklab: z.string(),
  oklch: z.string(),
});

const ConversionOutputSchema = z.object({
  sourceNotation: z.enum(["hex", "rgb", "oklab", "oklch"]),
  hex: z.string(),
  rgb: RgbOutputSchema,
  oklab: OklabOutputSchema,
  oklch: OklchOutputSchema,
  css: CssOutputSchema,
  gamut: z.object({
    space: z.literal("srgb"),
    inGamut: z.boolean(),
    clipped: z.boolean(),
    maxChroma: z.number(),
  }),
});

const MaxChromaOutputSchema = z.object({
  L: z.number(),
  h: z.number(),
  maxChroma: z.number(),
  oklch: OklchOutputSchema,
  rgb: RgbOutputSchema,
  hex: z.string(),
  css: z.object({
    oklch: z.string(),
    rgb: z.string(),
    hex: z.string(),
  }),
});

const readOnlyAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

const toolResult = <Output extends object>(output: Output) => {
  const structuredContent = Object.fromEntries(Object.entries(output));
  return {
    content: [{ type: "text" as const, text: JSON.stringify(output, null, 2) }],
    structuredContent,
  };
};

export const createColorServer = (): McpServer => {
  const server = new McpServer(
    { name: "@zemd/color-mcp", version: packageJson.version },
    {
      instructions:
        "Use convert_color for notation changes. Use find_max_chroma for every OKLCH lightness and hue pair; the sRGB chroma limit changes with hue.",
    },
  );

  server.registerTool(
    "convert_color",
    {
      title: "Convert Color",
      description:
        "Convert one opaque color between hexadecimal sRGB, 8-bit sRGB, OKLab, and OKLCH. Out-of-gamut OKLab and OKLCH inputs are clipped only for the returned sRGB and hex values; inspect gamut.inGamut.",
      inputSchema: z.object({
        color: z.discriminatedUnion("notation", [
          HexInputSchema,
          RgbInputSchema,
          OklabInputSchema,
          OklchInputSchema,
        ]),
      }),
      outputSchema: ConversionOutputSchema,
      annotations: readOnlyAnnotations,
    },
    ({ color }) => toolResult(convertColor(color)),
  );

  server.registerTool(
    "find_max_chroma",
    {
      title: "Find Maximum OKLCH Chroma",
      description:
        "Find the approximate maximum sRGB chroma for one OKLCH lightness and hue. Call this tool once per hue; maximum chroma changes with hue even when lightness is fixed.",
      inputSchema: z.object({
        L: z.number().min(0).max(1).describe("OKLCH lightness from 0 through 1."),
        h: z
          .number()
          .finite()
          .describe("OKLCH hue in degrees. Values are normalized to 0 through 360."),
      }),
      outputSchema: MaxChromaOutputSchema,
      annotations: readOnlyAnnotations,
    },
    ({ L, h }) => toolResult(calculateMaxChroma(L, h)),
  );

  return server;
};
