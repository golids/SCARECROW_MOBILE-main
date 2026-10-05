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

// One row per RPi camera — lets whoever is on-site doing maintenance type in
// the Pi's current local WiFi IP (shown on the Pi itself / your router's
// client list) so the app's Live Feed and Activity Logs pick it back up.
function DeviceIpRow({ device, onSaved }: { device: Device; onSaved: () => void }) {
  const [ip, setIp] = React.useState(device.ip_address ?? "");
  const [saving, setSaving] = React.useState(false);
  const online = isRecentlyAlive(device);

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
        <View style={[styles.statusDot, online ? styles.statusOnline : styles.statusOffline]} />
        <Text style={styles.deviceName}>{device.name}</Text>
        <Text style={styles.deviceLocation}>{device.location}</Text>
      </View>
      <View style={styles.ipRow}>
        <TextInput
          value={ip}
          onChangeText={setIp}
          placeholder="192.168.1.xx"
          placeholderTextColor="#808080"
          keyboardType="numbers-and-punctuation"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.ipInput}
        />
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

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
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
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
      ]
    );
  };

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
              <Text style={styles.headerSubtitle}>Manage cameras and your account</Text>
            </View>
          </View>
          {/* ── Camera Devices (maintenance) ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Camera Devices</Text>
            <Text style={styles.sectionHint}>
              On-site for maintenance? Connect your phone to the same WiFi as the
              cameras, then set each Pi's local IP here so Live Feed and Activity
              Logs reconnect to it.
            </Text>
            {devices.map((d) => (
              <DeviceIpRow key={d.id} device={d} onSaved={loadDevices} />
            ))}
            {devices.length === 0 && (
              <Text style={styles.sectionHint}>No devices found yet — add them in Supabase.</Text>
            )}
          </View>

          {/* ── Settings Options ── */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.settingRow}>
              <Ionicons name="person-outline" size={20} color="#4F8F3A" />
              <Text style={styles.settingText}>Account</Text>
              <Ionicons name="chevron-forward" size={18} color="#808080" style={styles.chevron} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.settingRow}>
              <Ionicons name="notifications-outline" size={20} color="#4F8F3A" />
              <Text style={styles.settingText}>Notifications</Text>
              <Ionicons name="chevron-forward" size={18} color="#808080" style={styles.chevron} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.settingRow}>
              <Ionicons name="lock-closed-outline" size={20} color="#4F8F3A" />
              <Text style={styles.settingText}>Privacy</Text>
              <Ionicons name="chevron-forward" size={18} color="#808080" style={styles.chevron} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.settingRow}>
              <Ionicons name="help-circle-outline" size={20} color="#4F8F3A" />
              <Text style={styles.settingText}>Help & Support</Text>
              <Ionicons name="chevron-forward" size={18} color="#808080" style={styles.chevron} />
            </TouchableOpacity>
          </View>

          {/* ── Logout Button ── */}
          <View style={styles.logoutContainerStatic}>
            <TouchableOpacity
              style={[styles.logoutButton, loading && styles.logoutButtonDisabled]}
              onPress={handleLogout}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#123B25" size="small" />
              ) : (
                <>
                  <Ionicons name="log-out-outline" size={30} color="#123B25" style={{ marginRight: 8 }} />
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

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#FFFFFF",
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#123B25",
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
    color: "#808080",
    marginTop: 2,
  },
  section: {
    marginBottom: 14,
    backgroundColor: "rgba(232,240,184,0.8)",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E8F0B8",
    overflow: "hidden",
    padding: 14,
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: "#123B25",
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 11,
    fontFamily: "PlusJakartaSans_400Regular",
    color: "#808080",
    marginBottom: 10,
  },
  deviceRow: {
    backgroundColor: "rgba(255,255,255,0.5)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E8F0B8",
    padding: 10,
    marginBottom: 8,
  },
  deviceRowTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusOnline: {
    backgroundColor: "#4F8F3A",
  },
  statusOffline: {
    backgroundColor: "#D32F2F",
  },
  deviceName: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: "#123B25",
  },
  deviceLocation: {
    fontSize: 11,
    fontFamily: "PlusJakartaSans_400Regular",
    color: "#808080",
    marginLeft: "auto",
  },
  ipRow: {
    flexDirection: "row",
    gap: 8,
  },
  ipInput: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E8F0B8",
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    fontFamily: "PlusJakartaSans_400Regular",
    color: "#123B25",
  },
  saveBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: "#4F8F3A",
    alignItems: "center",
    justifyContent: "center",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 2,
    paddingVertical: 14,
  },
  settingText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontFamily: "PlusJakartaSans_500Medium",
    color: "#123B25",
  },
  chevron: {
    marginLeft: "auto",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(232,240,184,1)",
  },
  logoutContainerStatic: {
    marginTop: 10,
  },
  logoutButton: {
    flexDirection: "row",
    backgroundColor: "rgba(232,240,184,0.8)",
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
    height: 55,
    width: "85%",
    alignSelf: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#4F8F3A",
  },
  logoutButtonDisabled: {
    opacity: 0.7,
  },
  logoutText: {
    color: "#123B25",
    fontSize: 16,
    fontFamily: "PlusJakartaSans_600SemiBold",
    letterSpacing: 0.5,
  },
});