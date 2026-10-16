// app/(tabs)/settings.tsx
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabase";
import { Device, fetchDevices, updateDeviceIp, isRecentlyAlive } from "../lib/devices";

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
/*                              DEVICE IP ROW                                 */
/* -------------------------------------------------------------------------- */

// One row per RPi camera — lets whoever is on-site doing maintenance type in
// the Pi's current local WiFi IP (shown on the Pi itself / your router's
// client list) so the app's Activity Logs pick it back up.
function DeviceIpRow({ device, onSaved }: { device: Device; onSaved: () => void }) {
  const [ip, setIp] = React.useState(device.ip_address ?? "");
  const [saving, setSaving] = React.useState(false);
  const active = isRecentlyAlive(device);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDeviceIp(device.id, ip.trim(), device.port);
      onSaved();
      Alert.alert("Saved", `${device.name} will now try ${ip.trim()}:${device.port}`);
    } catch (e: any) {
      Alert.alert("Couldn't save", e?.message ?? "Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.deviceRow}>
      <View style={styles.deviceRowTop}>
        <View style={[styles.statusDot, active ? styles.statusActive : styles.statusInactive]} />

        <View style={styles.deviceTextWrap}>
          <Text style={styles.deviceName} numberOfLines={1}>
            {device.name}
          </Text>
          {!!device.location && (
            <Text style={styles.deviceLocation} numberOfLines={1}>
              {device.location}
            </Text>
          )}
        </View>

        <View
          style={[
            styles.statusBadge,
            active ? styles.statusBadgeActive : styles.statusBadgeInactive,
          ]}
        >
          <Text
            style={[
              styles.statusBadgeText,
              active ? styles.statusBadgeTextActive : styles.statusBadgeTextInactive,
            ]}
          >
            {active ? "Active" : "Inactive"}
          </Text>
        </View>
      </View>

      <View style={styles.ipRow}>
        <TextInput
          value={ip}
          onChangeText={setIp}
          placeholder="192.168.1.xx"
          placeholderTextColor={COLORS.gray}
          keyboardType="numbers-and-punctuation"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.ipInput}
        />
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Ionicons name="checkmark" size={18} color={COLORS.white} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                              SETTINGS SCREEN                               */
/* -------------------------------------------------------------------------- */

export default function SettingsScreen() {
  const [loading, setLoading] = React.useState(false);
  const [devices, setDevices] = React.useState<Device[]>([]);
  const router = useRouter();

  const loadDevices = React.useCallback(async () => {
    try {
      const data = await fetchDevices();
      setDevices(data);
    } catch (e) {
      console.warn("Failed to load devices:", e);
    }
  }, []);

  React.useEffect(() => {
    loadDevices();
  }, [loadDevices]);

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
              <Text style={styles.headerSubtitle}>Manage devices and your account</Text>
            </View>
          </View>

          {/* ── Camera Devices (maintenance) ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Camera Devices</Text>
            <Text style={styles.sectionHint}>
              On-site for maintenance? Connect your phone to the same WiFi as the
              cameras, then set each Pi's local IP here so the app can reconnect
              to it.
            </Text>

            {devices.map((d) => (
              <DeviceIpRow key={d.id} device={d} onSaved={loadDevices} />
            ))}

            {devices.length === 0 && (
              <View style={styles.emptyBox}>
                <Ionicons name="hardware-chip-outline" size={22} color={COLORS.gray} />
                <Text style={styles.emptyBoxText}>
                  No devices found yet — add them in Supabase.
                </Text>
              </View>
            )}
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

  sectionLabel: {
    fontSize: 20,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: COLORS.darkGreen,
    marginBottom: 4,
  },

  sectionHint: {
    fontSize: 11,
    fontFamily: "PlusJakartaSans_400Regular",
    color: COLORS.gray,
    marginBottom: 12,
    lineHeight: 16,
  },

  /* Device rows */
  deviceRow: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
    marginBottom: 10,
  },

  deviceRowTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },

  statusActive: {
    backgroundColor: COLORS.primary,
  },

  statusInactive: {
    backgroundColor: COLORS.gray,
  },

  deviceTextWrap: {
    flex: 1,
    marginRight: 8,
  },

  deviceName: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: COLORS.darkGreen,
  },

  deviceLocation: {
    fontSize: 11,
    fontFamily: "PlusJakartaSans_400Regular",
    color: COLORS.gray,
    marginTop: 1,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },

  statusBadgeActive: {
    backgroundColor: COLORS.veryLightGreen,
    borderColor: COLORS.primary,
  },

  statusBadgeInactive: {
    backgroundColor: COLORS.lightGray,
    borderColor: COLORS.border,
  },

  statusBadgeText: {
    fontSize: 11,
    fontFamily: "PlusJakartaSans_600SemiBold",
  },

  statusBadgeTextActive: {
    color: COLORS.primary,
  },

  statusBadgeTextInactive: {
    color: COLORS.gray,
  },

  ipRow: {
    flexDirection: "row",
    gap: 8,
  },

  ipInput: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    fontFamily: "PlusJakartaSans_400Regular",
    color: COLORS.darkGreen,
  },

  saveBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Empty state */
  emptyBox: {
    minHeight: 70,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.lightGray,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },

  emptyBoxText: {
    fontSize: 11,
    fontFamily: "PlusJakartaSans_400Regular",
    color: COLORS.gray,
    marginTop: 6,
    textAlign: "center",
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
