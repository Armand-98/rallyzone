const palette = {
  // Primary — teal (trust, calm, action)
  teal50:  '#E1F5EE',
  teal100: '#9FE1CB',
  teal300: '#1D9E75',
  teal500: '#0F6E56',
  teal700: '#085041',

  // Crisis — red (always visible, never alarming)
  crisis50:  '#FCEBEB',
  crisis300: '#E24B4A',
  crisis500: '#A32D2D',

  // Neutral — warm grays (military, no-nonsense)
  gray50:  '#F5F4F0',
  gray100: '#E0DFD8',
  gray200: '#B4B2A9',
  gray400: '#888780',
  gray600: '#5F5E5A',
  gray800: '#2C2C2A',
  gray900: '#1A1A18',

  // Accent — amber (insights, highlights)
  amber100: '#FAC775',
  amber300: '#EF9F27',
  amber500: '#BA7517',

  // Semantic
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export const Colors = {
  // Backgrounds
  bgPrimary:     palette.white,
  bgSecondary:   palette.gray50,
  bgTertiary:    palette.gray100,

  // Text
  textPrimary:   palette.gray900,
  textSecondary: palette.gray600,
  textTertiary:  palette.gray400,
  textInverse:   palette.white,

  // Brand
  brandPrimary:  palette.teal300,
  brandDark:     palette.teal500,
  brandLight:    palette.teal50,

  // Crisis rail — used ONLY for the crisis button component
  crisisBtn:     palette.crisis300,
  crisisBtnDark: palette.crisis500,
  crisisBtnBg:   palette.crisis50,
  crisisText:    palette.white,

  // Borders
  borderLight:   palette.gray100,
  borderMid:     palette.gray200,

  // Accent
  accent:        palette.amber300,
  accentLight:   palette.amber100,

  // Utility
  white:         palette.white,
  transparent:   palette.transparent,
};

export type ColorKey = keyof typeof Colors;
