// app/theme/colors.ts
// Central brand palette — keep every new screen referencing these instead of
// hardcoding hex values, so future rebrands only touch this file.

export const colors = {
  primary: "#123B25",   // Deep Forest Green — nav, headings, primary text
  secondary: "#4F8F3A", // Leaf Green — buttons, icons, active states
  background: "#F5F6D8",// Warm Cream — page background
  surface: "#E8F0B8",   // Soft Pale Green — cards, panels, borders
  accent: "#D9B83F",    // Golden Yellow — highlights, alerts, badges
  white: "#FFFFFF",

  // Functional (not in the brand sheet, kept for clear UX semantics)
  muted: "#808080",     // secondary/help text
  danger: "#D32F2F",    // offline / error states
  online: "#4F8F3A",
  offline: "#D32F2F",
};

export const fonts = {
  regular: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  semiBold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
};
