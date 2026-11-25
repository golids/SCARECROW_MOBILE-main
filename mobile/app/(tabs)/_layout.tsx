import React from "react";
import { Tabs } from "expo-router";

import {
  View,
  StyleSheet,
  StatusBar,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  LayoutDashboard,
  Cpu,
  Bird,
  Bell,
  Settings,
} from "lucide-react-native";

import { useLanguage } from "../context/LanguageContext";

import {
  useTheme,
  type ThemeColors,
} from "../../context/ThemeContext";

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  const { t } = useLanguage();

  const { colors: COLORS, isDark } = useTheme();

  const styles = React.useMemo(
    () => createStyles(COLORS),
    [COLORS]
  );

  const bottomOffset = Math.max(
    insets.bottom,
    12
  );

  return (
    <View style={styles.container}>
      {/* STATUS BAR */}

      <StatusBar barStyle="light-content" />

      {/* TOP SAFE AREA */}

      <View
        style={[
          styles.topSafeArea,
          {
            height: insets.top,
          },
        ]}
      />

      {/* TAB NAVIGATION */}

      <Tabs
        screenOptions={{
          headerShown: false,

          tabBarShowLabel: true,

          tabBarActiveTintColor:
            COLORS.navigationActive,

          tabBarInactiveTintColor:
            COLORS.navigationInactive,

          tabBarHideOnKeyboard: true,

          sceneStyle: {
            backgroundColor: COLORS.background,
          },

          tabBarStyle: {
            position: "absolute",

            left: 50,
            right: 50,

            bottom: bottomOffset,

            marginHorizontal: 20,
            marginBottom: -10,

            height: 68,

            borderRadius: 20,

            backgroundColor: COLORS.navigation,

            borderTopWidth: 1,
            borderWidth: 1,
            borderColor: COLORS.border,

            paddingTop: 7,
            paddingBottom: 7,

            elevation: 8,

            shadowColor: "#000000",

            shadowOffset: {
              width: 0,
              height: 4,
            },

            shadowOpacity: isDark ? 0.35 : 0.1,

            shadowRadius: 8,
          },

          tabBarLabelStyle: {
            fontFamily:
              "PlusJakartaSans_600SemiBold",

            fontSize: 9,

            marginTop: 2,
          },

          tabBarItemStyle: {
            paddingVertical: 3,
          },
        }}
      >
        {/* OVERVIEW */}

        <Tabs.Screen
          name="Home"
          options={{
            title: t("overview"),

            tabBarIcon: ({ color, focused }) => (
              <LayoutDashboard
                size={21}
                color={color}
                strokeWidth={focused ? 2.5 : 1.8}
              />
            ),
          }}
        />

        {/* DEVICES */}

        <Tabs.Screen
          name="devices"
          options={{
            title: t("devices"),

            tabBarIcon: ({ color, focused }) => (
              <Cpu
                size={21}
                color={color}
                strokeWidth={focused ? 2.5 : 1.8}
              />
            ),
          }}
        />

        {/* DETECTIONS */}

        <Tabs.Screen
          name="detections"
          options={{
            title: t("detections"),

            tabBarIcon: ({ color, focused }) => (
              <Bird
                size={21}
                color={color}
                strokeWidth={focused ? 2.5 : 1.8}
              />
            ),
          }}
        />

        {/* ALERTS */}

        <Tabs.Screen
          name="alerts"
          options={{
            title: t("alerts"),

            tabBarIcon: ({ color, focused }) => (
              <Bell
                size={21}
                color={color}
                strokeWidth={focused ? 2.5 : 1.8}
              />
            ),
          }}
        />

        {/* SETTINGS */}

        <Tabs.Screen
          name="settings"
          options={{
            title: t("settings"),

            tabBarIcon: ({ color, focused }) => (
              <Settings
                size={21}
                color={color}
                strokeWidth={focused ? 2.5 : 1.8}
              />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

/* DYNAMIC THEME STYLES */

const createStyles = (COLORS: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
    },

    topSafeArea: {
      backgroundColor: COLORS.statusBar,
    },
  });