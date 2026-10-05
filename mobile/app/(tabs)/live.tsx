// app/(tabs)/live.tsx
import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import {
  Device,
  fetchDevices,
  subscribeToDevices,
  streamUrlFor,
  isRecentlyAlive,
} from "../lib/devices";

function timeAgo(iso: string | null): string {
  if (!iso) return "Never";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// One camera tile: shows the live MJPEG stream from the Pi when online,
// otherwise an offline placeholder with a working Reconnect button.
function CameraCard({
  device,
  reloadKey,
  onReconnect,
}: {
  device: Device;
  reloadKey: number;
  onReconnect: (id: string) => void;
}) {
  const online = isRecentlyAlive(device);
  const streamUrl = streamUrlFor(device);
  const [streamFailed, setStreamFailed] = React.useState(false);

  React.useEffect(() => {
    setStreamFailed(false);
  }, [reloadKey, device.ip_address]);

  const showStream = online && streamUrl && !streamFailed;

  return (
    <View style={styles.cameraCard}>
      <View style={styles.cameraHeader}>
        <View style={styles.cameraTitleContainer}>
          <MaterialIcons name="camera-alt" size={20} color="#4F8F3A" />
          <Text style={styles.cameraTitle}>{device.name}</Text>
        </View>
        <View style={[styles.offlineBadge, online && styles.onlineBadge]}>
          <View style={[styles.offlineDot, online && styles.onlineDot]} />
          <Text style={[styles.offlineText, online && styles.onlineText]}>
            {online ? "LIVE" : "DEVICE OFFLINE"}
          </Text>
        </View>
      </View>

      <View style={styles.cameraPreview}>
        {showStream ? (
          <WebView
            key={`${device.id}-${reloadKey}`}
            source={{
              html: `<html><body style="margin:0;background:#000">
                <img src="${streamUrl}" style="width:100%;height:100%;object-fit:cover" />
              </body></html>`,
            }}
            onError={() => setStreamFailed(true)}
            onHttpError={() => setStreamFailed(true)}
            style={styles.webview}
          />
        ) : online ? (
          <>
            <ActivityIndicator color="#4F8F3A" />
            <Text style={styles.previewText}>Connecting to stream…</Text>
          </>
        ) : (
          <>
            <Ionicons name="videocam-off-outline" size={40} color="#808080" />
            <Text style={styles.previewText}>
              {device.ip_address ? "Camera Offline" : "No IP configured — set it in Settings"}
            </Text>
          </>
        )}
      </View>

      <View style={styles.cameraFooter}>
        <Ionicons name="location-outline" size={14} color="#808080" />
        <Text style={styles.cameraLocation}>{device.location}</Text>
        <Text style={styles.cameraLocation}> · {timeAgo(device.last_seen)}</Text>
      </View>

      <TouchableOpacity style={styles.retryButton} onPress={() => onReconnect(device.id)}>
        <Ionicons name="refresh-outline" size={16} color="#4F8F3A" />
        <Text style={styles.retryText}>Reconnect</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function LiveScreen() {
  const [devices, setDevices] = React.useState<Device[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [reloadKeys, setReloadKeys] = React.useState<Record<string, number>>({});

  const load = React.useCallback(async () => {
    try {
      const data = await fetchDevices();
      setDevices(data);
    } catch (e) {
      // Table not created yet, or no network — fail quiet, UI shows offline state.
      console.warn("Failed to load devices:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
    const unsubscribe = subscribeToDevices(load);
    return unsubscribe;
  }, [load]);

  const handleReconnect = (id: string) => {
    setReloadKeys((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
    load();
  };

  const onlineCount = devices.filter(isRecentlyAlive).length;
  const offlineCount = devices.length - onlineCount;
  const mostRecent = devices
    .map((d) => d.last_seen)
    .filter(Boolean)
    .sort()
    .pop() as string | undefined;

  return (
    <View style={styles.bg}>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Live Feed</Text>
              <Text style={styles.headerSubtitle}>Monitor your scarecrows in real-time</Text>
            </View>
            <TouchableOpacity style={styles.refreshBtn} onPress={load}>
              <Ionicons name="refresh" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Connection Status Card */}
          <View style={styles.card}>
            <View style={styles.connectionLeft}>
              <MaterialIcons
                name={offlineCount === 0 ? "wifi" : "wifi-off"}
                size={18}
                color={offlineCount === 0 ? "#4F8F3A" : "#D32F2F"}
              />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.connLabel}>Connection Status</Text>
                <Text style={[styles.connValue, { color: offlineCount === 0 ? "#4F8F3A" : "#D32F2F" }]}>
                  {loading
                    ? "Checking…"
                    : offlineCount === 0
                    ? `${onlineCount} Devices Online`
                    : `${offlineCount} Device${offlineCount > 1 ? "s" : ""} Offline`}
                </Text>
              </View>
            </View>
            <View style={styles.dividerVert} />
            <View style={styles.connectionRight}>
              <Ionicons name="time-outline" size={16} color="#4F8F3A" />
              <View style={{ marginLeft: 4 }}>
                <Text style={styles.connLabel}>Last Active</Text>
                <Text style={styles.connValueLarge}>{timeAgo(mostRecent ?? null)}</Text>
              </View>
            </View>
          </View>

          {/* Camera Grid */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Cameras</Text>
            </View>

            {devices.length === 0 && !loading && (
              <Text style={styles.previewText}>
                No cameras found. Add your 2 devices in Supabase (see supabase/schema.sql).
              </Text>
            )}

            {devices.map((device) => (
              <CameraCard
                key={device.id}
                device={device}
                reloadKey={reloadKeys[device.id] ?? 0}
                onReconnect={handleReconnect}
              />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#FFFFFF",
  },
  safe: {
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
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#4F8F3A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#123B25",
  },
  card: {
    flexDirection: "row",
    backgroundColor: "rgba(232,240,184,0.8)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: "rgba(232,240,184,1)",
    alignItems: "center",
  },
  connectionLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  connectionRight: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 12,
  },
  dividerVert: {
    width: 1.5,
    height: 36,
    backgroundColor: "rgba(232,240,184,0.8)",
  },
  connLabel: {
    fontSize: 10,
    fontFamily: "PlusJakartaSans_400Regular",
    color: "#808080",
  },
  connValue: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: "#123B25",
  },
  connValueLarge: {
    fontSize: 18,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#4F8F3A",
  },
  section: {
    backgroundColor: "rgba(232,240,184,0.8)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: "#E8F0B8",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: "#123B25",
  },
  cameraCard: {
    backgroundColor: "rgba(232,240,184,0.35)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E8F0B8",
  },
  cameraHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cameraTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cameraTitle: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: "#123B25",
  },
  offlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(211, 47, 47, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  onlineBadge: {
    backgroundColor: "rgba(79,143,58,0.12)",
  },
  offlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#D32F2F",
  },
  onlineDot: {
    backgroundColor: "#4F8F3A",
  },
  offlineText: {
    fontSize: 9,
    fontFamily: "PlusJakartaSans_500Medium",
    color: "#D32F2F",
  },
  onlineText: {
    color: "#4F8F3A",
  },
  cameraPreview: {
    height: 180,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E8F0B8",
    borderStyle: "dashed",
    overflow: "hidden",
  },
  webview: {
    flex: 1,
    width: "100%",
    backgroundColor: "#000",
  },
  previewText: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
    color: "#808080",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 12,
  },
  cameraFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 10,
  },
  cameraLocation: {
    fontSize: 11,
    fontFamily: "PlusJakartaSans_400Regular",
    color: "#808080",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(79,143,58,0.1)",
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4F8F3A",
  },
  retryText: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_500Medium",
    color: "#4F8F3A",
  },
});