// src/constants/typography.ts
// Poppins is used throughout the app for all text roles.
export const fonts = {
  poppins: {
    regular: 'Poppins_400Regular',
    medium: 'Poppins_500Medium',
    semiBold: 'Poppins_600SemiBold',
    bold: 'Poppins_700Bold',
    extraBold: 'Poppins_800ExtraBold',
  },
};

// Convenience aliases for common text roles — all Poppins now.
export const type = {
  h1: { fontFamily: fonts.poppins.extraBold },
  h2: { fontFamily: fonts.poppins.bold },
  h3: { fontFamily: fonts.poppins.semiBold },
  h4: { fontFamily: fonts.poppins.medium },

  body: { fontFamily: fonts.poppins.regular },
  bodyMedium: { fontFamily: fonts.poppins.medium },
  bodySemiBold: { fontFamily: fonts.poppins.semiBold },
  bodyBold: { fontFamily: fonts.poppins.bold },

  label: { fontFamily: fonts.poppins.semiBold },
  caption: { fontFamily: fonts.poppins.regular },
};