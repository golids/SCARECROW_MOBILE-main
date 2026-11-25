import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";

export type Theme = "light" | "dark";

const STORAGE_KEY = "scarecrow-theme";

/* LIGHT THEME */

export const LIGHT_COLORS = {
  background: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceSecondary: "#F7F9E9",
  surfaceHover: "#F0F6E9",

  white: "#FFFFFF",
  darkGreen: "#123B25",
  primary: "#4F8F3A",
  lightGreen: "#E8F0B8",
  veryLightGreen: "#F7F9E9",

  text: "#123B25",
  muted: "#808080",
  gray: "#808080",
  lightGray: "#F5F5F5",

  border: "#E5E9D2",
  input: "#FFFFFF",
  placeholder: "#A0A0A0",

  gold: "#D9B83F",
  lightGold: "#FBF7E7",

  red: "#D32F2F",
  lightRed: "#FDECEA",

  navigation: "#FFFFFF",
  navigationActive: "#4F8F3A",
  navigationInactive: "#899187",

  accent: "#E8F0B8",
  buttonText: "#FFFFFF",
  statusBar: "#123B25",
  switchOff: "#D9DED6",
  switchOn: "#4F8F3A",

  overlay: "rgba(0,0,0,0.45)",
};

/* DARK THEME */

export const DARK_COLORS: typeof LIGHT_COLORS = {
  background: "#17251D",
  surface: "#223329",
  surfaceSecondary: "#29382D",
  surfaceHover: "#2D4134",

  white: "#FFFFFF",
  darkGreen: "#EDF4E9",
  primary: "#91AD72",
  lightGreen: "#304735",
  veryLightGreen: "#29382D",

  text: "#EDF4E9",
  muted: "#B8C9BA",
  gray: "#B8C9BA",
  lightGray: "#29382D",

  border: "#3A5040",
  input: "#1B2B21",
  placeholder: "#9EAFA1",

  gold: "#E0C46A",
  lightGold: "#403A24",

  red: "#F28B82",
  lightRed: "#402A29",

  navigation: "#142119",
  navigationActive: "#E8F0B8",
  navigationInactive: "#B8C9BA",

  accent: "#E8F0B8",
  buttonText: "#17251D",
  statusBar: "#142119",
  switchOff: "#3A5040",
  switchOn: "#91AD72",

  overlay: "rgba(0,0,0,0.65)",
};

export type ThemeColors = typeof LIGHT_COLORS;

/* CONTEXT TYPES */

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  colors: ThemeColors;
  isThemeReady: boolean;
  changeTheme: (theme: Theme) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<
  ThemeContextType | undefined
>(undefined);

/* THEME PROVIDER */

export function ThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [theme, setTheme] = useState<Theme>("light");

  const [isThemeReady, setIsThemeReady] =
    useState(false);

  /* LOAD SAVED THEME */

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme =
          await AsyncStorage.getItem(STORAGE_KEY);

        if (
          savedTheme === "light" ||
          savedTheme === "dark"
        ) {
          setTheme(savedTheme);
        }
      } catch (error) {
        console.error(
          "Failed to load theme:",
          error
        );
      } finally {
        setIsThemeReady(true);
      }
    };

    void loadTheme();
  }, []);

  /* CHANGE AND SAVE THEME */

  const changeTheme = useCallback(
    async (nextTheme: Theme) => {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEY,
          nextTheme
        );

        setTheme(nextTheme);
      } catch (error) {
        console.error(
          "Failed to save theme:",
          error
        );

        throw error;
      }
    },
    []
  );

  /* TOGGLE LIGHT / DARK */

  const toggleTheme = useCallback(async () => {
    const nextTheme =
      theme === "light" ? "dark" : "light";

    await changeTheme(nextTheme);
  }, [theme, changeTheme]);

  const isDark = theme === "dark";

  const colors = isDark
    ? DARK_COLORS
    : LIGHT_COLORS;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        colors,
        isThemeReady,
        changeTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

/* CUSTOM HOOK */

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useTheme must be used within ThemeProvider"
    );
  }

  return context;
}