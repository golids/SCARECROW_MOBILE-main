
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  View,
  StyleSheet,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useLanguage } from "../context/LanguageContext";

const COLORS = {
  primary: "#4F8F3A",
  darkGreen: "#123B25",
  inactive: "#899187",
  white: "#FFFFFF",
  border: "#E5E9D2",
};

function StatusBarHeader() {
  const insets = useSafeAreaInsets();

  if (insets.top <= 0) return null;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.statusBarBg,
        { height: insets.top },
      ]}
    />
  );
}

export default function TabsLayout() {
  const { t, isLanguageReady } = useLanguage();
  const insets = useSafeAreaInsets();

  // Bottom safe area
  const bottomPosition =
    Platform.OS === "android"
      ? Math.max(insets.bottom, 12) + 12
      : insets.bottom + 12;

  if (!isLanguageReady) {
    return <View style={styles.root} />;
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <Tabs
        screenOptions={{
          headerShown: false,

          // CENTERED FLOATING TAB BAR
          tabBarStyle: [
            styles.tabBar,
            {
              left: 50,
              right: 50,
              bottom: bottomPosition,
            },
          ],

          tabBarBackground: () => (
            <View style={styles.tabBarBackground} />
          ),

          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.inactive,

          tabBarShowLabel: true,
          tabBarLabelStyle: styles.tabBarLabel,

          tabBarActiveBackgroundColor: "transparent",
          tabBarInactiveBackgroundColor: "transparent",

          tabBarItemStyle: styles.tabBarItem,
        }}
      >
        {/* OVERVIEW */}
        <Tabs.Screen
          name="Home"
          options={{
            title: t("overview"),
            tabBarIcon: ({ focused }) => (
              <Ionicons
                name={focused ? "grid" : "grid-outline"}
                size={21}
                color={
                  focused ? COLORS.primary : COLORS.inactive
                }
              />
            ),
          }}
        />

        {/* DEVICES */}
        <Tabs.Screen
          name="devices"
          options={{
            title: t("devices"),
            tabBarIcon: ({ focused }) => (
              <Ionicons
                name={
                  focused
                    ? "hardware-chip"
                    : "hardware-chip-outline"
                }
                size={21}
                color={
                  focused ? COLORS.primary : COLORS.inactive
                }
              />
            ),
          }}
        />

        {/* DETECTIONS */}
        <Tabs.Screen
          name="detections"
          options={{
            title: t("detections"),
            tabBarIcon: ({ focused }) => (
              <Ionicons
                name={focused ? "radio" : "radio-outline"}
                size={21}
                color={
                  focused ? COLORS.primary : COLORS.inactive
                }
              />
            ),
          }}
        />

        {/* ALERTS */}
        <Tabs.Screen
          name="alerts"
          options={{
            title: t("alerts"),
            tabBarIcon: ({ focused }) => (
              <Ionicons
                name={
                  focused
                    ? "notifications"
                    : "notifications-outline"
                }
                size={21}
                color={
                  focused ? COLORS.primary : COLORS.inactive
                }
              />
            ),
          }}
        />

        {/* SETTINGS */}
        <Tabs.Screen
          name="settings"
          options={{
            title: t("settings"),
            tabBarIcon: ({ focused }) => (
              <Ionicons
                name={
                  focused
                    ? "settings"
                    : "settings-outline"
                }
                size={21}
                color={
                  focused ? COLORS.primary : COLORS.inactive
                }
              />
            ),
          }}
        />
      </Tabs>

      <StatusBarHeader />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  statusBarBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    zIndex: 999,
  },

  tabBar: {
    position: "absolute",

    height: 68,
    paddingTop: 7,
    paddingBottom: 7,
    paddingHorizontal: 4,
    marginLeft: 20,
    marginRight: 20,
    marginBottom: -10,

    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderTopWidth: 0,

    elevation: 5,

    shadowColor: "#000000",
    shadowOpacity: 0.10,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },

  tabBarBackground: {
    ...StyleSheet.absoluteFill,

    backgroundColor: COLORS.white,
    borderRadius: 20,

    borderWidth: 1,
    borderColor: COLORS.border,
  },

  tabBarItem: {
    flex: 1,
    height: "100%",

    paddingVertical: 2,
    paddingHorizontal: 0,
    marginHorizontal: 0,

    borderRadius: 12,

    alignItems: "center",
    justifyContent: "center",
  },

  tabBarLabel: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 10,
    marginTop: 3,
    marginBottom: 0,
  },
});
