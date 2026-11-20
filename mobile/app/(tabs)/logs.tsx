
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  Device,
  DetectionLog,
  fetchDevices,
  fetchDetectionLogs,
  subscribeToDetectionLogs,
} from "../../lib/devices";

type Category = "bird" | "alerts";
type DateFilter = "all" | "today" | "yesterday";

const LOG_LIMIT = 500;
const PREVIEW_LIMIT = 5;

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

const FONT = {
  regular: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  semiBold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
};

function getDateBucket(dateString: string): "Today" | "Yesterday" | "Earlier" {
  const date = new Date(dateString);
  const now = new Date();

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const logDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  if (logDate.getTime() === today.getTime()) return "Today";
  if (logDate.getTime() === yesterday.getTime()) return "Yesterday";

  return "Earlier";
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getEventLabel(eventType: string) {
  const labels: Record<string, string> = {
    bird_detected: "Bird Detected",
    motion: "Motion Detected",
    offline: "Device Offline",
    online: "Device Online",
    system: "System Event",
    battery: "Battery Alert",
    device_error: "Device Error",
    error: "Device Error",
    low_battery: "Low Battery",
    device_recovery: "Device Recovered",
    recovery: "Device Recovered",
  };

  return (
    labels[eventType.toLowerCase()] ??
    eventType.replace(/_/g, " ").replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    )
  );
}

function getEventIcon(eventType: string): keyof typeof Ionicons.glyphMap {
  const type = eventType.toLowerCase();

  if (type === "offline") return "cloud-offline-outline";
  if (type === "online") return "cloud-done-outline";

  if (type === "battery" || type === "low_battery") {
    return "battery-dead-outline";
  }

  if (type === "device_error" || type === "error") {
    return "alert-circle-outline";
  }

  if (type === "device_recovery" || type === "recovery") {
    return "checkmark-circle-outline";
  }

  if (type === "motion") return "scan-outline";

  return "information-circle-outline";
}

function getEventColor(eventType: string) {
  const type = eventType.toLowerCase();

  if (
    type === "offline" ||
    type === "device_error" ||
    type === "error" ||
    type === "low_battery" ||
    type === "battery"
  ) {
    return {
      background: COLORS.lightRed,
      foreground: COLORS.red,
    };
  }

  if (
    type === "online" ||
    type === "device_recovery" ||
    type === "recovery"
  ) {
    return {
      background: COLORS.veryLightGreen,
      foreground: COLORS.primary,
    };
  }

  return {
    background: COLORS.lightGold,
    foreground: "#9A7B13",
  };
}

export default function LogsScreen() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [logs, setLogs] = useState<DetectionLog[]>([]);

  const [category, setCategory] = useState<Category>("bird");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [selectedDevice, setSelectedDevice] = useState<string>("all");

  const [deviceDropdownOpen, setDeviceDropdownOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});

  const loadData = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);

      const [deviceData, logData] = await Promise.all([
        fetchDevices(),
        fetchDetectionLogs(LOG_LIMIT),
      ]);

      setDevices(deviceData);
      setLogs(logData);
    } catch (error) {
      console.error("Failed to load logs:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const refresh = useCallback(() => {
    setRefreshing(true);
    loadData(false);
  }, [loadData]);

  useEffect(() => {
    loadData();

    const unsubscribe = subscribeToDetectionLogs((newLog) => {
      setLogs((previousLogs) => {
        const exists = previousLogs.some(
          (log) => String(log.id) === String(newLog.id)
        );

        if (exists) return previousLogs;

        return [newLog, ...previousLogs].slice(0, LOG_LIMIT);
      });
    });

    return () => {
      unsubscribe?.();
    };
  }, [loadData]);

  const isBirdDetection = (log: DetectionLog) =>
    log.event_type?.toLowerCase() === "bird_detected";

  const filteredLogs = useMemo(() => {
    let result = logs.filter((log) =>
      category === "bird"
        ? isBirdDetection(log)
        : !isBirdDetection(log)
    );

    if (selectedDevice !== "all") {
      result = result.filter(
        (log) => log.device_id === selectedDevice
      );
    }

    if (dateFilter !== "all") {
      result = result.filter((log) => {
        const bucket = getDateBucket(log.created_at);
        return dateFilter === "today"
          ? bucket === "Today"
          : bucket === "Yesterday";
      });
    }

    return result.sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
    );
  }, [logs, category, selectedDevice, dateFilter]);

  const todayBirdCount = useMemo(
    () =>
      logs.filter(
        (log) =>
          isBirdDetection(log) &&
          getDateBucket(log.created_at) === "Today"
      ).length,
    [logs]
  );

  const todayAlertCount = useMemo(
    () =>
      logs.filter(
        (log) =>
          !isBirdDetection(log) &&
          getDateBucket(log.created_at) === "Today"
      ).length,
    [logs]
  );

  const groupedLogs = useMemo(() => {
    const groups: Record<string, DetectionLog[]> = {
      Today: [],
      Yesterday: [],
      Earlier: [],
    };

    filteredLogs.forEach((log) => {
      groups[getDateBucket(log.created_at)].push(log);
    });

    return groups;
  }, [filteredLogs]);

  const toggleSection = (section: string) => {
    setExpandedSections((previous) => ({
      ...previous,
      [section]: !previous[section],
    }));
  };

  const renderLog = (log: DetectionLog) => {
    const bird = isBirdDetection(log);
    const eventColor = getEventColor(log.event_type);

    return (
      <View key={String(log.id)} style={styles.logCard}>
        <View style={styles.logTopRow}>
          <View
            style={[
              styles.logIcon,
              {
                backgroundColor: bird
                  ? COLORS.veryLightGreen
                  : eventColor.background,
              },
            ]}
          >
            <Ionicons
              name={
                bird
                  ? "eye-outline"
                  : getEventIcon(log.event_type)
              }
              size={21}
              color={
                bird
                  ? COLORS.primary
                  : eventColor.foreground
              }
            />
          </View>

          <View style={styles.logMain}>
            <Text style={styles.logTitle}>
              {bird
                ? log.species || log.label || "Bird Detected"
                : getEventLabel(log.event_type)}
            </Text>

            <Text style={styles.logDevice}>
              {log.device_name || "Unknown Device"}
            </Text>
          </View>

          <Text style={styles.logTime}>
            {formatTime(log.created_at)}
          </Text>
        </View>

        {bird ? (
          <View style={styles.logDetails}>
            <View style={styles.detailChip}>
              <Ionicons
                name="eye-outline"
                size={13}
                color={COLORS.gray}
              />
              <Text style={styles.detailText}>
                {log.label || "Bird detection"}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.alertDetails}>
            <View
              style={[
                styles.eventBadge,
                { backgroundColor: eventColor.background },
              ]}
            >
              <Text
                style={[
                  styles.eventBadgeText,
                  { color: eventColor.foreground },
                ]}
              >
                {getEventLabel(log.event_type)}
              </Text>
            </View>

            {log.label ? (
              <Text style={styles.alertDescription}>
                {log.label}
              </Text>
            ) : null}
          </View>
        )}

        <Text style={styles.logDate}>
          {formatDate(log.created_at)}
        </Text>
      </View>
    );
  };

  const renderSection = (
    title: "Today" | "Yesterday" | "Earlier",
    items: DetectionLog[]
  ) => {
    if (items.length === 0) return null;

    const sectionKey = `${category}-${title}`;
    const expanded = !!expandedSections[sectionKey];

    const visibleItems = expanded
      ? items
      : items.slice(0, PREVIEW_LIMIT);

    const hasMore = items.length > PREVIEW_LIMIT;

    return (
      <View key={sectionKey} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionCount}>
            {items.length} {items.length === 1 ? "record" : "records"}
          </Text>
        </View>

        {visibleItems.map(renderLog)}

        {hasMore && (
          <TouchableOpacity
            style={styles.expandButton}
            onPress={() => toggleSection(sectionKey)}
            activeOpacity={0.75}
          >
            <Text style={styles.expandButtonText}>
              {expanded
                ? "Show less"
                : `Show all ${items.length} records`}
            </Text>

            <Ionicons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={16}
              color={COLORS.primary}
            />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const currentCount =
    category === "bird"
      ? todayBirdCount
      : todayAlertCount;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Activity Logs</Text>
          <Text style={styles.headerSubtitle}>
            Monitor detections and device activities
          </Text>
        </View>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => refresh()}
          activeOpacity={0.7}
        >
          <Ionicons
            name="refresh-outline"
            size={21}
            color={COLORS.darkGreen}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.categoryContainer}>
        <TouchableOpacity
          style={[
            styles.categoryButton,
            category === "bird" && styles.activeCategoryButton,
          ]}
          onPress={() => setCategory("bird")}
          activeOpacity={0.8}
        >
          <Ionicons
            name="eye-outline"
            size={18}
            color={
              category === "bird"
                ? COLORS.white
                : COLORS.darkGreen
            }
          />
          <Text
            style={[
              styles.categoryText,
              category === "bird" && styles.activeCategoryText,
            ]}
          >
            Bird Detection
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.categoryButton,
            category === "alerts" && styles.activeCategoryButton,
          ]}
          onPress={() => setCategory("alerts")}
          activeOpacity={0.8}
        >
          <Ionicons
            name="notifications-outline"
            size={18}
            color={
              category === "alerts"
                ? COLORS.white
                : COLORS.darkGreen
            }
          />
          <Text
            style={[
              styles.categoryText,
              category === "alerts" && styles.activeCategoryText,
            ]}
          >
            Device Alerts
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryIcon}>
          <Ionicons
            name={
              category === "bird"
                ? "eye-outline"
                : "notifications-outline"
            }
            size={23}
            color={COLORS.primary}
          />
        </View>

        <View style={styles.summaryContent}>
          <Text style={styles.summaryLabel}>
            {category === "bird"
              ? "Bird Detections Today"
              : "Device Alerts Today"}
          </Text>
          <Text style={styles.summaryValue}>
            {currentCount}
          </Text>
        </View>

        <View style={styles.summaryTag}>
          <Text style={styles.summaryTagText}>Today</Text>
        </View>
      </View>

      <View style={styles.filterArea}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateFilters}
        >
          {(
            [
              ["all", "All"],
              ["today", "Today"],
              ["yesterday", "Yesterday"],
            ] as [DateFilter, string][]
          ).map(([value, label]) => (
            <TouchableOpacity
              key={value}
              onPress={() => setDateFilter(value)}
              style={[
                styles.filterButton,
                dateFilter === value && styles.activeFilterButton,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  dateFilter === value && styles.activeFilterText,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={styles.deviceFilter}
          onPress={() => setDeviceDropdownOpen((previous) => !previous)}
          activeOpacity={0.8}
        >
          <Ionicons
            name="hardware-chip-outline"
            size={17}
            color={COLORS.darkGreen}
          />

          <Text style={styles.deviceFilterText} numberOfLines={1}>
            {selectedDevice === "all"
              ? "All Devices"
              : devices.find((device) => device.id === selectedDevice)
                  ?.name || "Selected Device"}
          </Text>

          <Ionicons
            name={
              deviceDropdownOpen
                ? "chevron-up"
                : "chevron-down"
            }
            size={16}
            color={COLORS.darkGreen}
          />
        </TouchableOpacity>

        {deviceDropdownOpen && (
          <View style={styles.dropdown}>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setSelectedDevice("all");
                setDeviceDropdownOpen(false);
              }}
            >
              <Text
                style={[
                  styles.dropdownText,
                  selectedDevice === "all" && styles.selectedDropdownText,
                ]}
              >
                All Devices
              </Text>

              {selectedDevice === "all" && (
                <Ionicons
                  name="checkmark"
                  size={18}
                  color={COLORS.primary}
                />
              )}
            </TouchableOpacity>

            {devices.map((device) => (
              <TouchableOpacity
                key={device.id}
                style={styles.dropdownItem}
                onPress={() => {
                  setSelectedDevice(device.id);
                  setDeviceDropdownOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownText,
                    selectedDevice === device.id &&
                      styles.selectedDropdownText,
                  ]}
                >
                  {device.name}
                </Text>

                {selectedDevice === device.id && (
                  <Ionicons
                    name="checkmark"
                    size={18}
                    color={COLORS.primary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
          />
          <Text style={styles.loadingText}>
            Loading activity logs...
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.logsScroll}
          contentContainerStyle={styles.logsContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={COLORS.primary}
            />
          }
        >
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>
              {category === "bird"
                ? "Bird Detection History"
                : "Device Alert History"}
            </Text>

            <Text style={styles.resultsCount}>
              {filteredLogs.length}{" "}
              {filteredLogs.length === 1 ? "result" : "results"}
            </Text>
          </View>

          {filteredLogs.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name={
                    category === "bird"
                      ? "eye-outline"
                      : "notifications-off-outline"
                  }
                  size={34}
                  color={COLORS.primary}
                />
              </View>

              <Text style={styles.emptyTitle}>
                No Records Found
              </Text>

              <Text style={styles.emptyDescription}>
                {category === "bird"
                  ? "Bird detection records will appear here when your ScareCROW device detects birds."
                  : "Device alerts and system activities will appear here when your devices report an event."}
              </Text>
            </View>
          ) : (
            <>
              {renderSection("Today", groupedLogs.Today)}
              {renderSection("Yesterday", groupedLogs.Yesterday)}
              {renderSection("Earlier", groupedLogs.Earlier)}
            </>
          )}

          <Text style={styles.footerText}>
            ScareCROW Monitoring System
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerTitle: {
    fontFamily: FONT.bold,
    fontSize: 23,
    color: COLORS.darkGreen,
  },

  headerSubtitle: {
    fontFamily: FONT.regular,
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },

  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: COLORS.veryLightGreen,
    alignItems: "center",
    justifyContent: "center",
  },

  categoryContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    padding: 5,
    borderRadius: 15,
    backgroundColor: COLORS.lightGray,
    marginBottom: 16,
  },

  categoryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 5,
  },

  activeCategoryButton: {
    backgroundColor: COLORS.darkGreen,
  },

  categoryText: {
    fontFamily: FONT.semiBold,
    fontSize: 12,
    color: COLORS.darkGreen,
  },

  activeCategoryText: {
    color: COLORS.white,
  },

  summaryCard: {
    marginHorizontal: 20,
    marginBottom: 17,
    padding: 16,
    borderRadius: 17,
    backgroundColor: COLORS.veryLightGreen,
    flexDirection: "row",
    alignItems: "center",
  },

  summaryIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },

  summaryContent: {
    flex: 1,
    marginLeft: 12,
  },

  summaryLabel: {
    fontFamily: FONT.medium,
    fontSize: 11,
    color: COLORS.gray,
  },

  summaryValue: {
    fontFamily: FONT.bold,
    fontSize: 24,
    color: COLORS.darkGreen,
    marginTop: 2,
  },

  summaryTag: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },

  summaryTagText: {
    fontFamily: FONT.semiBold,
    fontSize: 10,
    color: COLORS.primary,
  },

  filterArea: {
    paddingHorizontal: 20,
    marginBottom: 12,
    zIndex: 10,
  },

  dateFilters: {
    gap: 8,
    paddingBottom: 12,
  },

  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
  },

  activeFilterButton: {
    backgroundColor: COLORS.lightGreen,
  },

  filterText: {
    fontFamily: FONT.medium,
    fontSize: 11,
    color: COLORS.gray,
  },

  activeFilterText: {
    color: COLORS.darkGreen,
    fontFamily: FONT.bold,
  },

  deviceFilter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },

  deviceFilterText: {
    flex: 1,
    fontFamily: FONT.medium,
    fontSize: 12,
    color: COLORS.darkGreen,
  },

  dropdown: {
    marginTop: 5,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },

  dropdownItem: {
    minHeight: 43,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },

  dropdownText: {
    fontFamily: FONT.medium,
    fontSize: 12,
    color: COLORS.gray,
  },

  selectedDropdownText: {
    color: COLORS.primary,
    fontFamily: FONT.bold,
  },

  logsScroll: {
    flex: 1,
  },

  logsContent: {
    paddingHorizontal: 20,
    paddingBottom: 35,
  },

  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  resultsTitle: {
    fontFamily: FONT.bold,
    fontSize: 14,
    color: COLORS.darkGreen,
  },

  resultsCount: {
    fontFamily: FONT.medium,
    fontSize: 11,
    color: COLORS.gray,
  },

  section: {
    marginBottom: 20,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  sectionTitle: {
    fontFamily: FONT.bold,
    fontSize: 13,
    color: COLORS.darkGreen,
  },

  sectionCount: {
    fontFamily: FONT.medium,
    fontSize: 10,
    color: COLORS.gray,
  },

  logCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 13,
    marginBottom: 9,
  },

  logTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  logIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  logMain: {
    flex: 1,
    marginLeft: 11,
  },

  logTitle: {
    fontFamily: FONT.bold,
    fontSize: 12,
    color: COLORS.darkGreen,
  },

  logDevice: {
    fontFamily: FONT.regular,
    fontSize: 10,
    color: COLORS.gray,
    marginTop: 4,
  },

  logTime: {
    fontFamily: FONT.medium,
    fontSize: 10,
    color: COLORS.gray,
    marginLeft: 5,
  },

  logDetails: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 11,
    marginLeft: 53,
  },

  detailChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.lightGray,
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  detailText: {
    fontFamily: FONT.medium,
    fontSize: 10,
    color: COLORS.gray,
  },

  alertDetails: {
    marginTop: 10,
    marginLeft: 53,
    gap: 6,
    alignItems: "flex-start",
  },

  eventBadge: {
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  eventBadgeText: {
    fontFamily: FONT.semiBold,
    fontSize: 10,
  },

  alertDescription: {
    fontFamily: FONT.regular,
    fontSize: 10,
    color: COLORS.gray,
  },

  logDate: {
    fontFamily: FONT.regular,
    fontSize: 9,
    color: COLORS.gray,
    marginTop: 10,
    marginLeft: 53,
  },

  expandButton: {
    minHeight: 40,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 11,
    backgroundColor: COLORS.veryLightGreen,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 2,
  },

  expandButtonText: {
    fontFamily: FONT.semiBold,
    fontSize: 11,
    color: COLORS.primary,
  },

  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    fontFamily: FONT.medium,
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 12,
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
    paddingVertical: 55,
    backgroundColor: COLORS.veryLightGreen,
    borderRadius: 16,
  },

  emptyIcon: {
    width: 65,
    height: 65,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },

  emptyTitle: {
    fontFamily: FONT.bold,
    fontSize: 15,
    color: COLORS.darkGreen,
  },

  emptyDescription: {
    fontFamily: FONT.regular,
    fontSize: 11,
    color: COLORS.gray,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 7,
  },

  footerText: {
    fontFamily: FONT.medium,
    fontSize: 9,
    color: COLORS.gray,
    textAlign: "center",
    marginTop: 10,
  },
});