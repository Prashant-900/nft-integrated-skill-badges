// Application color palette
export const allColors = [
  "#ABE0F0", // Light blue
  "#FFEE91", // Light yellow
  "#F5C857", // Gold
  "#E2852E", // Orange
  "#F875AA", // Pink
  "#FDEDED", // Light pink
  "#EDFFF0", // Light mint
  "#1581BF", // Blue
  "#850E35", // Dark red
  "#EE6983", // Rose
  "#FFC4C4", // Peach
  "#FCF5EE"  // Cream
];

// Named colors for specific use cases
export const colors = {
  lightBlue: "#ABE0F0",
  lightYellow: "#FFEE91",
  gold: "#F5C857",
  orange: "#E2852E",
  pink: "#F875AA",
  lightPink: "#FDEDED",
  lightMint: "#EDFFF0",
  blue: "#1581BF",
  darkRed: "#850E35",
  rose: "#EE6983",
  peach: "#FFC4C4",
  cream: "#FCF5EE"
};

// Background gradients using the color palette
export const backgrounds = {
  primary: `linear-gradient(135deg, ${colors.blue} 0%, ${colors.lightBlue} 100%)`,
  secondary: `linear-gradient(135deg, ${colors.orange} 0%, ${colors.gold} 100%)`,
  accent: `linear-gradient(135deg, ${colors.darkRed} 0%, ${colors.rose} 100%)`,
  light: `linear-gradient(135deg, ${colors.lightPink} 0%, ${colors.cream} 100%)`,
  success: `linear-gradient(135deg, ${colors.lightMint} 0%, ${colors.lightBlue} 100%)`,
};
