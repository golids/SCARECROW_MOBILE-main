// app/(tabs)/settings.tsx
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabase";

/* -------------------------------------------------------------------------- */
/*                                  COLORS                                    */
/* -------------------------------------------------------------------------- */
// Same palette as Home and Logs. Tip: move this into constants/colors.ts and
// import it in all three screens.

const COLORS = {
  white: "#FFFFFF",
  darkGreen: "#123B25",
  primary: "#4F8F3A",
  lightGreen: "#E8F0B8",
  veryLightGreen: "#F7F9E9",
  gold: "#D9B83F",
  lightGold: "#FBF7E7",
  gray: "#808080",
  lightGray: "#F5F5F5",
  border: "#E5E9D2",
};

/* -------------------------------------------------------------------------- */
/*                              SETTINGS SCREEN                               */
/* -------------------------------------------------------------------------- */

export default function SettingsScreen() {
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          try {
            const { error } = await supabase.auth.signOut();
            if (error) {
              Alert.alert("Error", error.message);
            } else {
              router.replace("/screens/LoginScreen");
            }
          } catch (error) {
            Alert.alert("Error", "Something went wrong. Please try again.");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const options: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
    { icon: "person-outline", label: "Account" },
    { icon: "notifications-outline", label: "Notifications" },
    { icon: "lock-closed-outline", label: "Privacy" },
    { icon: "help-circle-outline", label: "Help & Support" },
  ];

  return (
    <View style={styles.background}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Settings</Text>
              <Text style={styles.headerSubtitle}>Manage your account</Text>
            </View>
          </View>

          {/* ── Settings Options ── */}
          <View style={styles.section}>
            {options.map((opt, index) => (
              <React.Fragment key={opt.label}>
                <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
                  <View style={styles.settingIconWrap}>
                    <Ionicons name={opt.icon} size={18} color={COLORS.primary} />
                  </View>
                  <Text style={styles.settingText}>{opt.label}</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={COLORS.primary}
                    style={styles.chevron}
                  />
                </TouchableOpacity>

                {index < options.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </View>

          {/* ── Logout Button ── */}
          <View style={styles.logoutContainerStatic}>
            <TouchableOpacity
              style={[styles.logoutButton, loading && styles.logoutButtonDisabled]}
              onPress={handleLogout}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.darkGreen} size="small" />
              ) : (
                <>
                  <Ionicons
                    name="log-out-outline"
                    size={26}
                    color={COLORS.darkGreen}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.logoutText}>Log Out</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  STYLES                                    */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.white,
  },

  container: {
    flex: 1,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 120,
  },

  /* Header */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  headerTitle: {
    fontSize: 24,
    fontFamily: "PlusJakartaSans_700Bold",
    color: COLORS.darkGreen,
  },

  headerSubtitle: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
    color: COLORS.gray,
    marginTop: 2,
  },

  /* Cards */
  section: {
    marginBottom: 14,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    overflow: "hidden",
    padding: 14,
  },

  /* Option rows */
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 2,
    paddingVertical: 12,
  },

  settingIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.veryLightGreen,
    alignItems: "center",
    justifyContent: "center",
  },

  settingText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontFamily: "PlusJakartaSans_500Medium",
    color: COLORS.darkGreen,
  },

  chevron: {
    marginLeft: "auto",
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },

  /* Logout */
  logoutContainerStatic: {
    marginTop: 10,
  },

  logoutButton: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
    height: 55,
    width: "85%",
    alignSelf: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },

  logoutButtonDisabled: {
    opacity: 0.7,
  },

  logoutText: {
    color: COLORS.darkGreen,
    fontSize: 16,
    fontFamily: "PlusJakartaSans_600SemiBold",
    letterSpacing: 0.5,
  },
});