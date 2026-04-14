import { Platform } from 'react-native';

// System font stack — no external fonts needed in Phase 01
const fontFamily = Platform.select({
  ios:     'System',
  android: 'Roboto',
  default: 'System',
});

const monoFamily = Platform.select({
  ios:     'Courier New',
  android: 'monospace',
  default: 'monospace',
});

export const Typography = {
  // Font families
  fontFamily,
  monoFamily,

  // Weights
  regular: '400' as const,
  medium:  '500' as const,
  bold:    '600' as const,

  // Scale — military-tight, no fluff
  size: {
    xs:   11,
    sm:   13,
    base: 15,
    md:   17,
    lg:   20,
    xl:   24,
    xxl:  30,
  },

  // Line heights
  leading: {
    tight:  1.2,
    normal: 1.5,
    loose:  1.75,
  },
};

// Pre-built text style objects — import these directly in components
export const TextStyles = {
  // Screen titles
  heading: {
    fontFamily,
    fontSize:   Typography.size.xl,
    fontWeight: Typography.bold,
    lineHeight: Typography.size.xl * Typography.leading.tight,
    color:      undefined, // set per-screen from Colors
  },

  // Section labels, card titles
  subheading: {
    fontFamily,
    fontSize:   Typography.size.md,
    fontWeight: Typography.medium,
    lineHeight: Typography.size.md * Typography.leading.normal,
  },

  // Body copy
  body: {
    fontFamily,
    fontSize:   Typography.size.base,
    fontWeight: Typography.regular,
    lineHeight: Typography.size.base * Typography.leading.loose,
  },

  // Supporting text, captions
  caption: {
    fontFamily,
    fontSize:   Typography.size.sm,
    fontWeight: Typography.regular,
    lineHeight: Typography.size.sm * Typography.leading.normal,
  },

  // Tiny labels, badges
  label: {
    fontFamily,
    fontSize:   Typography.size.xs,
    fontWeight: Typography.medium,
    lineHeight: Typography.size.xs * Typography.leading.normal,
    letterSpacing: 0.4,
  },

  // Military-framed status text (used in Mission Brief, trigger log)
  status: {
    fontFamily,
    fontSize:   Typography.size.base,
    fontWeight: Typography.medium,
    lineHeight: Typography.size.base * Typography.leading.normal,
    letterSpacing: 0.2,
  },
};
