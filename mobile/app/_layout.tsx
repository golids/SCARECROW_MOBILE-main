import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";

import { LanguageProvider } from "./context/LanguageContext";

import {
  ThemeProvider,
  useTheme,
} from "../context/ThemeContext";

SplashScreen.preventAutoHideAsync().catch(() => {});

/* ROOT NAVIGATION */

function RootNavigator() {
  const { colors, isThemeReady } = useTheme();

  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  const isReady =
    (fontsLoaded || !!fontError) &&
    isThemeReady;

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen name="index" />

      <Stack.Screen name="(tabs)" />

      <Stack.Screen name="screens" />
    </Stack>
  );
}

/* ROOT LAYOUT */

export default function RootLayout() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <RootNavigator />
      </LanguageProvider>
    </ThemeProvider>
  );
}