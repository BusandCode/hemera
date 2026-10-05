
// import { Dimensions, PixelRatio, Text, TextInput } from 'react-native';

// const BASE_WIDTH = 390;

// const { width, height } = Dimensions.get('window');
// const shortSide = Math.min(width, height);

// export const clamp = (value: number, min: number, max: number) =>
//   Math.min(Math.max(value, min), max);

// export const UI_SCALE = 0.9;

// const ratio = clamp(shortSide / BASE_WIDTH, 0.85, 1);

// const round = (n: number) => PixelRatio.roundToNearestPixel(n);

// /** Full scale — use for image/box sizes that should track the screen. */
// export const s = (size: number) => round(size * ratio * UI_SCALE);

// /** Kept for compatibility; same as s(). */
// export const vs = (size: number) => round(size * ratio * UI_SCALE);

// export const ms = (size: number, factor = 0.4) =>
//   round((size + (size * ratio - size) * factor) * UI_SCALE);

// export const isSmallDevice = shortSide < 360;
// export const isTablet = shortSide >= 600;

// /** Caps how far the phone's own "font size" setting can enlarge text. */
// export const MAX_FONT_SCALE = 1.1;

// type WithDefaults = { defaultProps?: Record<string, unknown> };
// for (const C of [Text, TextInput] as unknown as WithDefaults[]) {
//   C.defaultProps = { ...(C.defaultProps ?? {}), maxFontSizeMultiplier: MAX_FONT_SCALE };
// }

// src/utils/responsive.ts
// Neutral version: every screen gets back the exact hardcoded sizes you wrote.
// ms(14) is just 14, s(56) is just 56 — nothing is scaled up or down on any device.
// (Screens still import from here, so keeping this file avoids touching them all.)

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/** Returns the size unchanged. */
export const ms = (size: number, _factor?: number) => size;

/** Returns the size unchanged. */
export const s = (size: number) => size;

/** Returns the size unchanged. */
export const vs = (size: number) => size;

export const isSmallDevice = false;
export const isTablet = false;

/** Still used by a few Text components to stop huge system font settings breaking layouts. */
export const MAX_FONT_SCALE = 1.2;