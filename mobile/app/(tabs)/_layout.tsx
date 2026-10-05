import { Tabs } from "expo-router";
import {
  View,
  StyleSheet,
  Platform,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabBarItem,
        tabBarBackground: () => <View style={styles.tabBarBackground} />,
        tabBarActiveTintColor: "#4F8F3A",
        tabBarInactiveTintColor: "#808080",
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarActiveBackgroundColor: "transparent",
        tabBarInactiveBackgroundColor: "transparent",
        // Remove ripple / press feedback (tap indicator)
        tabBarButton: (props) => (
          <TouchableWithoutFeedback
            onPress={props.onPress ?? undefined}
            onLongPress={props.onLongPress ?? undefined}
            delayLongPress={props.delayLongPress ?? undefined}
            accessibilityRole={props.accessibilityRole}
            accessibilityState={props.accessibilityState}
            accessibilityLabel={props.accessibilityLabel}
            testID={props.testID}
          >
            <View style={props.style}>{props.children}</View>
          </TouchableWithoutFeedback>
        ),
      }}
    >
      <Tabs.Screen
        name="Home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="live"
        options={{
          title: "Live",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "videocam" : "videocam-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="logs"
        options={{
          title: "Logs",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "document-text" : "document-text-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "settings" : "settings-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    height: 64,
    borderRadius: 20,
    backgroundColor: "transparent",
    borderTopWidth: 0,
    elevation: 0,
    // No shadow on the container — prevents bleed-through inside the pill
    shadowColor: "transparent",
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },
  tabBarBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // Bumped opacity so the drop shadow can't show through as an inner halo
    backgroundColor: "rgba(232,240,184,0.92)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    // Shadow only on iOS — Android elevation removed to kill the inner halo
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  tabBarItem: {
    flex: 1,
    height: "100%",
    paddingVertical: 6,
    paddingHorizontal: 0,
    marginHorizontal: 0,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBarLabel: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 11,
    marginTop: 2,
  },
});