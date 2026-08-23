import {
  find_max_chroma,
  oklab_to_srgb,
  oklch_to_srgb,
  srgb_to_hex,
  srgb_to_oklab,
  srgb_to_oklch,
  type Lch,
  type Oklab,
  type RGB,
} from "@zemd/color";

export type ColorNotation = "hex" | "rgb" | "oklab" | "oklch";

export type ColorInput =
  | { notation: "hex"; hex: string }
  | { notation: "rgb"; r: number; g: number; b: number }
  | { notation: "oklab"; L: number; a: number; b: number }
  | { notation: "oklch"; L: number; c: number; h: number };

export interface ColorConversion {
  sourceNotation: ColorNotation;
  hex: string;
  rgb: RGB;
  oklab: Oklab;
  oklch: Lch;
  css: {
    hex: string;
    rgb: string;
    oklab: string;
    oklch: string;
  };
  gamut: {
    space: "srgb";
    inGamut: boolean;
    clipped: boolean;
    maxChroma: number;
  };
}

export interface MaximumChromaResult {
  L: number;
  h: number;
  maxChroma: number;
  oklch: Lch;
  rgb: RGB;
  hex: string;
  css: {
    oklch: string;
    rgb: string;
    hex: string;
  };
}

const achromaticEpsilon = 1e-12;
const gamutEpsilon = 1e-7;
const hexPattern = /^#?(?:[\da-f]{3}|[\da-f]{6})$/i;

const cleanZero = (value: number): number => (Object.is(value, -0) ? 0 : value);

const formatNumber = (value: number, fractionDigits = 6): string =>
  cleanZero(Number(value.toFixed(fractionDigits))).toString();

export const normalizeHue = (hue: number): number => {
  const normalized = ((hue % 360) + 360) % 360;
  return cleanZero(normalized);
};

const parseHex = (hex: string): RGB => {
  if (!hexPattern.test(hex)) {
    throw new TypeError("Hex colors must use three or six hexadecimal digits, with an optional #.");
  }

  const compact = hex.replace(/^#/, "");
  const expanded =
    compact.length === 3
      ? Array.from(compact, (character) => `${character}${character}`).join("")
      : compact;

  return {
    r: Number.parseInt(expanded.slice(0, 2), 16),
    g: Number.parseInt(expanded.slice(2, 4), 16),
    b: Number.parseInt(expanded.slice(4, 6), 16),
  };
};

const oklabToOklch = ({ L, a, b }: Oklab): Lch => {
  const c = Math.hypot(a, b);
  return {
    L,
    c,
    h: c < achromaticEpsilon ? 0 : normalizeHue(Math.atan2(b, a) * (180 / Math.PI)),
  };
};

const oklchToOklab = ({ L, c, h }: Lch): Oklab => {
  const radians = normalizeHue(h) * (Math.PI / 180);
  return {
    L,
    a: cleanZero(c * Math.cos(radians)),
    b: cleanZero(c * Math.sin(radians)),
  };
};

const formatCss = (hex: string, rgb: RGB, oklab: Oklab, oklch: Lch): ColorConversion["css"] => ({
  hex,
  rgb: `rgb(${rgb.r} ${rgb.g} ${rgb.b})`,
  oklab: `oklab(${formatNumber(oklab.L * 100, 4)}% ${formatNumber(oklab.a)} ${formatNumber(oklab.b)})`,
  oklch: `oklch(${formatNumber(oklch.L * 100, 4)}% ${formatNumber(oklch.c)} ${formatNumber(oklch.h, 4)})`,
});

export const convertColor = (input: ColorInput): ColorConversion => {
  let rgb: RGB;
  let oklab: Oklab;
  let oklch: Lch;

  switch (input.notation) {
    case "hex": {
      rgb = parseHex(input.hex);
      oklab = srgb_to_oklab(rgb);
      oklch = srgb_to_oklch(rgb);
      break;
    }
    case "rgb": {
      rgb = { r: input.r, g: input.g, b: input.b };
      oklab = srgb_to_oklab(rgb);
      oklch = srgb_to_oklch(rgb);
      break;
    }
    case "oklab": {
      oklab = { L: input.L, a: input.a, b: input.b };
      oklch = oklabToOklch(oklab);
      rgb = oklab_to_srgb(oklab);
      break;
    }
    case "oklch": {
      oklch = { L: input.L, c: input.c, h: normalizeHue(input.h) };
      oklab = oklchToOklab(oklch);
      rgb = oklch_to_srgb(oklch);
      break;
    }
  }

  const maxChroma = find_max_chroma({ L: oklch.L, h: oklch.h });
  const inGamut =
    input.notation === "hex" || input.notation === "rgb" || oklch.c <= maxChroma + gamutEpsilon;
  const hex = `#${srgb_to_hex(rgb)}`;

  return {
    sourceNotation: input.notation,
    hex,
    rgb,
    oklab,
    oklch,
    css: formatCss(hex, rgb, oklab, oklch),
    gamut: {
      space: "srgb",
      inGamut,
      clipped: !inGamut,
      maxChroma,
    },
  };
};

export const calculateMaxChroma = (L: number, h: number): MaximumChromaResult => {
  const normalizedHue = normalizeHue(h);
  const maxChroma = find_max_chroma({ L, h: normalizedHue });
  const oklch = { L, c: maxChroma, h: normalizedHue };
  const rgb = oklch_to_srgb(oklch);
  const hex = `#${srgb_to_hex(rgb)}`;

  return {
    L,
    h: normalizedHue,
    maxChroma,
    oklch,
    rgb,
    hex,
    css: {
      oklch: `oklch(${formatNumber(L * 100, 4)}% ${formatNumber(maxChroma)} ${formatNumber(normalizedHue, 4)})`,
      rgb: `rgb(${rgb.r} ${rgb.g} ${rgb.b})`,
      hex,
    },
  };
};
