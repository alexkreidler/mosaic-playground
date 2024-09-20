// 1. Import the extendTheme function
import { extendTheme } from "@chakra-ui/react";

// 2. Import the Saas UI theme
import { theme as baseTheme } from "@saas-ui/react";

// 2. Extend the theme to include custom colors, fonts, etc
const colors = {
  primary: baseTheme.colors.blue,
};

export const theme = extendTheme(
  {
    colors,
    fonts: {
      body: "Inter, sans-serif",
      heading: "Inter, sans-serif",
    },
  },
  baseTheme
);
