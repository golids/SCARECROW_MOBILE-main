// app/(tabs)/logs.tsx
import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import {
  Device,
  DetectionLog,
  fetchDevices,
  fetchDetectionLogs,
  subscribeToDetectionLogs,
} from "../lib/devices";

/* -------------------------------------------------------------------------- */
/*                                  COLORS                                    */
/* -------------------------------------------------------------------------- */
// Same palette as Home. Tip: move this into constants/colors.ts and import it
// in all screens so they never drift apart.

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
  red: "#D32F2F",
  lightRed: "#FDECEA",
};

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

const FILTERS = ["All", "Today", "Yesterday", "Alerts"];
const ALL_DEVICES = "all";

// Same number Home loads, so counts match between the two screens
const LOG_LIMIT = 500;

type Bucket = "Today" | "Yesterday" | "Earlier";

function dateBucket(iso: string): Bucket {
  const d = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  if (d >= startOfToday) return "Today";
  if (d >= startOfYesterday) return "Yesterday";
  return "Earlier";
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Merge freshly fetched logs with any that arrived live, without duplicates
function mergeLogs(fresh: DetectionLog[], existing: DetectionLog[]) {
  const byId = new Map<number, DetectionLog>();
  existing.forEach((l) => byId.set(l.id, l));
  fresh.forEach((l) => byId.set(l.id, l));

  return Array.from(byId.values())
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, LOG_LIMIT);
}

function iconFor(eventType: string): string {
  switch (eventType) {
    case "offline":
      return "cloud-offline";
    case "online":
      return "wifi";
    case "battery":
      return "battery-dead";
    case "motion":
      return "videocam";
    case "system":
      return "cloud-done";
    default:
      return "alert-circle";
  }
}

function getEventColor(type: string) {
  switch (type) {
    case "offline":
      return COLORS.red;
    case "bird_detected":
    case "battery":
      return COLORS.gold;
    default:
      return COLORS.primary;
  }
}

function getEventLabel(type: string) {
  switch (type) {
    case "offline":
      return "Offline";
    case "online":
      return "Online";
    case "battery":
      return "Battery";
    case "motion":
      return "Motion";
    case "system":
      return "System";
    default:
      return "Event";
  }
}

/* -------------------------------------------------------------------------- */
/*                               LOGS SCREEN                                  */
/* -------------------------------------------------------------------------- */

export default function LogsScreen() {
  // Optional: navigate here with ?device=<device id> to pre-select a device
  // e.g. router.push({ pathname: "/logs", params: { device: selectedDevice.id } })
  const params = useLocalSearchParams<{ device?: string }>();

  const [selectedFilter, setSelectedFilter] = React.useState("All");
  const [selectedDeviceId, setSelectedDeviceId] = React.useState<string>(
    params.device ?? ALL_DEVICES
  );
  const [devices, setDevices] = React.useState<Device[]>([]);
  const [logs, setLogs] = React.useState<DetectionLog[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Device dropdown
  const { width: screenWidth } = useWindowDimensions();
  const dropdownRef = React.useRef<View>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [menuPos, setMenuPos] = React.useState({ top: 0, right: 16 });

  const openMenu = () => {
    // Measure the button so the menu opens right under it, aligned to its right edge
    dropdownRef.current?.measureInWindow((x, y, w, h) => {
      setMenuPos({ top: y + h + 6, right: Math.max(screenWidth - (x + w), 8) });
      setMenuOpen(true);
    });
  };

  React.useEffect(() => {
    if (params.device) setSelectedDeviceId(params.device);
  }, [params.device]);

  const load = React.useCallback(async () => {
    try {
      const [logData, deviceData] = await Promise.all([
        fetchDetectionLogs(LOG_LIMIT),
        fetchDevices(),
      ]);
      setLogs((prev) => mergeLogs(logData, prev));
      setDevices(deviceData);
    } catch (e) {
      console.warn("Failed to load detection logs:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
    // Live-append the moment a camera writes a new detection/event.
    const unsubscribe = subscribeToDetectionLogs((newLog) => {
      setLogs((prev) => mergeLogs([newLog], prev));
    });
    return unsubscribe;
  }, [load]);

  /* ------------------------------ Filtering ------------------------------ */

  // Device filter first (drives the summary card)
  const deviceLogs = logs.filter(
    (l) => selectedDeviceId === ALL_DEVICES || l.device_id === selectedDeviceId
  );

  // Then the time / alert filter (drives the list)
  const filtered = deviceLogs.filter((log) => {
    if (selectedFilter === "All") return true;
    if (selectedFilter === "Today") return dateBucket(log.created_at) === "Today";
    if (selectedFilter === "Yesterday")
      return dateBucket(log.created_at) === "Yesterday";
    if (selectedFilter === "Alerts")
      return log.event_type === "bird_detected" || log.event_type === "offline";
    return true;
  });

  const todayLogs = filtered.filter((l) => dateBucket(l.created_at) === "Today");
  const yesterdayLogs = filtered.filter(
    (l) => dateBucket(l.created_at) === "Yesterday"
  );
  const earlierLogs = filtered.filter(
    (l) => dateBucket(l.created_at) === "Earlier"
  );

  const totalEvents = deviceLogs.length;
  const alertCount = deviceLogs.filter((l) => l.event_type === "bird_detected").length;
  const offlineCount = deviceLogs.filter((l) => l.event_type === "offline").length;

  /* ------------------------------- Rendering ----------------------------- */

  const renderLog = (log: DetectionLog) => {
    const color = getEventColor(log.event_type);
    const isBird = log.event_type === "bird_detected";

    return (
      <View key={log.id} style={styles.logRow}>
        <View style={[styles.logIconWrap, { backgroundColor: color + "20" }]}>
          {isBird ? (
            <Text style={styles.logEmoji}>🐦‍⬛</Text>
          ) : (
            <Ionicons name={iconFor(log.event_type) as any} size={20} color={color} />
          )}
        </View>

        <View style={styles.logContent}>
          <View style={styles.logHeader}>
            <Text style={styles.logDevice} numberOfLines={1}>
              {log.device_name}
            </Text>
          </View>

          {/* Date + time on every row */}
          <Text style={styles.logTime}>
            {formatDate(log.created_at)} · {formatTime(log.created_at)}
          </Text>

          <View style={styles.logBottom}>
            <Text style={styles.logEvent} numberOfLines={2}>
              {log.label}
            </Text>

            {/* No tag for bird detections (the 🐦‍⬛ icon already shows it) */}
            {!isBird && (
              <View
                style={[
                  styles.eventBadge,
                  { backgroundColor: color + "20", borderColor: color },
                ]}
              >
                <Text style={[styles.eventBadgeText, { color }]}>
                  {getEventLabel(log.event_type)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderSection = (title: string, items: DetectionLog[]) =>
    items.length > 0 ? (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionCount}>{items.length}</Text>
        </View>
        {items.map(renderLog)}
      </View>
    ) : null;

  const deviceOptions = [
    { id: ALL_DEVICES, name: "All devices" },
    ...devices.map((d) => ({ id: d.id, name: d.name })),
  ];

  const selectedDeviceName =
    deviceOptions.find((o) => o.id === selectedDeviceId)?.name ?? "All devices";

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
              <Text style={styles.headerTitle}>Activity Logs</Text>
              <Text style={styles.headerSubtitle}>Device history and events</Text>
            </View>

            <TouchableOpacity
              style={styles.refreshBtn}
              onPress={load}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={22} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          {/* Stats Summary Card */}
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{totalEvents}</Text>
              <Text style={styles.statLabel}>Total Events</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{alertCount}</Text>
              <Text style={styles.statLabel}>Bird Alerts</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{offlineCount}</Text>
              <Text style={styles.statLabel}>Offline Events</Text>
            </View>
          </View>

          {/* Filter row: time/alert chips on the left, device dropdown on the far right */}
          <View style={styles.filterRow}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
            >
              <View style={styles.chipContainer}>
                {FILTERS.map((filter) => {
                  const active = selectedFilter === filter;

                  return (
                    <TouchableOpacity
                      key={filter}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setSelectedFilter(filter)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[styles.chipText, active && styles.chipTextActive]}
                      >
                        {filter}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {devices.length > 1 && (
              <View ref={dropdownRef} collapsable={false}>
                <TouchableOpacity
                  style={styles.dropdownBtn}
                  onPress={openMenu}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="hardware-chip-outline"
                    size={14}
                    color={COLORS.primary}
                    style={{ marginRight: 5 }}
                  />
                  <Text style={styles.dropdownBtnText} numberOfLines={1}>
                    {selectedDeviceName}
                  </Text>
                  <Ionicons
                    name={menuOpen ? "chevron-up" : "chevron-down"}
                    size={14}
                    color={COLORS.primary}
                    style={{ marginLeft: 4 }}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Loading */}
          {loading && (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={COLORS.primary} />
            </View>
          )}

          {/* Empty: no logs at all */}
          {!loading && logs.length === 0 && (
            <View style={styles.emptyBox}>
              <Ionicons name="time-outline" size={22} color={COLORS.gray} />
              <Text style={styles.emptyBoxText}>
                No events yet. Once your RPi cameras are online and running
                detection, they'll show up here automatically.
              </Text>
            </View>
          )}

          {/* Empty: logs exist but filters match nothing */}
          {!loading && logs.length > 0 && filtered.length === 0 && (
            <View style={styles.emptyBox}>
              <Ionicons name="filter-outline" size={22} color={COLORS.gray} />
              <Text style={styles.emptyBoxText}>
                No events match the selected filters.
              </Text>
            </View>
          )}

          {/* Sections */}
          {renderSection("Today", todayLogs)}
          {renderSection("Yesterday", yesterdayLogs)}
          {renderSection("Earlier", earlierLogs)}
        </ScrollView>
      </SafeAreaView>

      {/* Device dropdown menu */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setMenuOpen(false)}>
          <View
            style={[
              styles.dropdownMenu,
              { top: menuPos.top, right: menuPos.right },
            ]}
          >
            {deviceOptions.map((option, index) => {
              const active = selectedDeviceId === option.id;

              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.dropdownItem,
                    index < deviceOptions.length - 1 && styles.dropdownItemDivider,
                    active && styles.dropdownItemActive,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => {
                    setSelectedDeviceId(option.id);
                    setMenuOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      active && styles.dropdownItemTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {option.name}
                  </Text>

                  {active && (
                    <Ionicons name="checkmark" size={16} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  STYLES                                    */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.white,
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
    paddingBottom: 120, // keeps the last card clear of the floating tab bar
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

  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: COLORS.darkGreen,
  },

  /* Summary card */
  statsCard: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "space-around",
  },

  statItem: {
    alignItems: "center",
    flex: 1,
  },

  statNumber: {
    fontSize: 20,
    fontFamily: "PlusJakartaSans_700Bold",
    color: COLORS.primary,
  },

  statLabel: {
    fontSize: 10,
    fontFamily: "PlusJakartaSans_400Regular",
    color: COLORS.gray,
    marginTop: 2,
  },

  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },

  /* Filter row (chips on the left, device dropdown on the far right) */
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  filterScroll: {
    flex: 1,
    marginRight: 8,
  },

  /* Device dropdown */
  dropdownBtn: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: 140,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },

  dropdownBtnText: {
    flexShrink: 1,
    fontSize: 13,
    fontFamily: "PlusJakartaSans_500Medium",
    color: COLORS.darkGreen,
  },

  modalOverlay: {
    flex: 1,
  },

  dropdownMenu: {
    position: "absolute",
    minWidth: 170,
    maxWidth: 240,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },

  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  dropdownItemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  dropdownItemActive: {
    backgroundColor: COLORS.veryLightGreen,
  },

  dropdownItemText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "PlusJakartaSans_500Medium",
    color: COLORS.darkGreen,
    marginRight: 8,
  },

  dropdownItemTextActive: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: COLORS.primary,
  },

  /* Chips */

  chipContainer: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },

  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  chipText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_500Medium",
    color: COLORS.darkGreen,
  },

  chipTextActive: {
    color: COLORS.white,
  },

  /* Loading / empty */
  loadingWrap: {
    paddingVertical: 24,
    alignItems: "center",
  },

  emptyBox: {
    minHeight: 90,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.lightGray,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginBottom: 14,
  },

  emptyBoxText: {
    fontSize: 11,
    fontFamily: "PlusJakartaSans_400Regular",
    color: COLORS.gray,
    marginTop: 6,
    textAlign: "center",
  },

  /* Sections */
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 16,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: COLORS.darkGreen,
  },

  sectionCount: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_500Medium",
    color: COLORS.primary,
  },

  /* Log rows */
  logRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  logIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  logEmoji: {
    fontSize: 20,
  },

  logContent: {
    flex: 1,
    marginLeft: 12,
  },

  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  logDevice: {
    flex: 1,
    fontSize: 13,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: COLORS.darkGreen,
  },

  logTime: {
    fontSize: 10,
    fontFamily: "PlusJakartaSans_400Regular",
    color: COLORS.gray,
    marginTop: 1,
    marginBottom: 4,
  },

  logBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  logEvent: {
    flex: 1,
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
    color: "#4a4a4a",
    marginRight: 8,
  },

  eventBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },

  eventBadgeText: {
    fontSize: 10,
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
});