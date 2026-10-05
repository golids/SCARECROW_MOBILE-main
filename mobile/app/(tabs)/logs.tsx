// app/(tabs)/logs.tsx
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
import { Ionicons } from "@expo/vector-icons";
import {
  DetectionLog,
  fetchDetectionLogs,
  subscribeToDetectionLogs,
} from "../lib/devices";

// Filter chips data
const FILTERS = ["All", "Today", "Yesterday", "Alerts"];

function iconFor(eventType: string): string {
  switch (eventType) {
    case "offline":
      return "wifi-off";
    case "online":
      return "wifi";
    case "bird_detected":
      return "bug";
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
      return "#D32F2F";
    case "online":
      return "#4F8F3A";
    case "bird_detected":
      return "#D9B83F";
    case "battery":
      return "#D9B83F";
    case "motion":
      return "#4F8F3A";
    default:
      return "#4F8F3A";
  }
}

function dateBucket(iso: string): "Today" | "Yesterday" | "Earlier" {
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
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function LogsScreen() {
  const [selectedFilter, setSelectedFilter] = React.useState("All");
  const [logs, setLogs] = React.useState<DetectionLog[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    try {
      const data = await fetchDetectionLogs(100);
      setLogs(data);
    } catch (e) {
      console.warn("Failed to load detection logs:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
    // Live-append the moment either RPi camera writes a new detection/event —
    // this is what makes a new bird detection or a reconnect show up instantly.
    const unsubscribe = subscribeToDetectionLogs((newLog) => {
      setLogs((prev) => [newLog, ...prev]);
    });
    return unsubscribe;
  }, [load]);

  const filtered = logs.filter((log) => {
    if (selectedFilter === "All") return true;
    if (selectedFilter === "Today") return dateBucket(log.created_at) === "Today";
    if (selectedFilter === "Yesterday") return dateBucket(log.created_at) === "Yesterday";
    if (selectedFilter === "Alerts") return log.event_type === "bird_detected" || log.event_type === "offline";
    return true;
  });

  const todayLogs = filtered.filter((l) => dateBucket(l.created_at) === "Today");
  const yesterdayLogs = filtered.filter((l) => dateBucket(l.created_at) === "Yesterday");

  const totalEvents = logs.length;
  const alertCount = logs.filter((l) => l.event_type === "bird_detected").length;
  const offlineCount = logs.filter((l) => l.event_type === "offline").length;

  const renderLog = (log: DetectionLog) => (
    <View key={log.id} style={styles.logRow}>
      <View style={[styles.logIconWrap, { backgroundColor: getEventColor(log.event_type) + "20" }]}>
        <Ionicons name={iconFor(log.event_type) as any} size={20} color={getEventColor(log.event_type)} />
      </View>
      <View style={styles.logContent}>
        <View style={styles.logHeader}>
          <Text style={styles.logDevice}>{log.device_name}</Text>
          <Text style={styles.logTime}>{formatTime(log.created_at)}</Text>
        </View>
        <Text style={styles.logEvent}>{log.label}</Text>
      </View>
    </View>
  );

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
            <TouchableOpacity style={styles.filterBtn} onPress={load}>
              <Ionicons name="refresh" size={22} color="#FFFFFF" />
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

          {/* Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
          >
            <View style={styles.filterContainer}>
              {FILTERS.map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterChip,
                    selectedFilter === filter && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedFilter(filter)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedFilter === filter && styles.filterChipTextActive,
                    ]}
                  >
                    {filter}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {loading && (
            <View style={{ paddingVertical: 24, alignItems: "center" }}>
              <ActivityIndicator color="#4F8F3A" />
            </View>
          )}

          {!loading && logs.length === 0 && (
            <View style={styles.section}>
              <Text style={styles.logEvent}>
                No events yet. Once your RPi cameras are online and running detection,
                they'll show up here automatically.
              </Text>
            </View>
          )}

          {/* Today's Logs Section */}
          {todayLogs.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Today</Text>
              </View>
              {todayLogs.map(renderLog)}
            </View>
          )}

          {/* Yesterday's Logs Section */}
          {yesterdayLogs.length > 0 && (
            <View style={[styles.section, { marginBottom: 100 }]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Yesterday</Text>
              </View>
              {yesterdayLogs.map(renderLog)}
            </View>
          )}
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
    paddingBottom: 20,
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
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#4F8F3A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#123B25",
  },
  statsCard: {
    flexDirection: "row",
    backgroundColor: "rgba(232,240,184,0.8)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: "rgba(232,240,184,1)",
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
    color: "#4F8F3A",
  },
  statLabel: {
    fontSize: 10,
    fontFamily: "PlusJakartaSans_400Regular",
    color: "#808080",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(18,59,37,0.15)",
  },
  filterScroll: {
    marginBottom: 14,
  },
  filterContainer: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(232,240,184,0.5)",
    borderWidth: 1,
    borderColor: "#E8F0B8",
  },
  filterChipActive: {
    backgroundColor: "#4F8F3A",
    borderColor: "#4F8F3A",
  },
  filterChipText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_500Medium",
    color: "#123B25",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
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
  logRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(232,240,184,0.35)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E8F0B8",
  },
  logIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  logContent: {
    flex: 1,
    marginLeft: 12,
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  logDevice: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: "#123B25",
  },
  logTime: {
    fontSize: 10,
    fontFamily: "PlusJakartaSans_400Regular",
    color: "#808080",
  },
  logEvent: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
    color: "#4a4a4a",
  },
});