import React from "react";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

import { useLanguage } from "../context/LanguageContext";

import {
  Device,
  DetectionLog,
  fetchDevices,
  fetchDetectionLogs,
  isRecentlyAlive,
  subscribeToDevices,
  subscribeToDetectionLogs,
} from "../../lib/devices";

/* -------------------------------------------------------------------------- */
/*                                   COLORS                                   */
/* -------------------------------------------------------------------------- */

const COLORS = {
  white: "#FFFFFF",
  darkGreen: "#123B25",
  primary: "#4F8F3A",
  lightGreen: "#E8F0B8",
  veryLightGreen: "#F7F9E9",
  gold: "#D9B83F",
  lightGold: "#FBF7E7",
  gray: "#808080",
  muted: "#849084",
  lightGray: "#F5F5F5",
  border: "#E5E9D2",
  red: "#D32F2F",
  lightRed: "#FDECEA",
};

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

type StatsPreset = "all" | "today" | "yesterday" | "custom";

type StatCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number | string;
  note: string;
  tone?: "green" | "gold" | "red";
};

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

function isBirdDetection(log: DetectionLog) {
  return log.event_type?.toLowerCase() === "bird_detected";
}

function isOfflineEvent(log: DetectionLog) {
  const event = `${log.event_type} ${log.label}`.toLowerCase();

  return event.includes("offline") || event.includes("disconnect");
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function isSameDay(value: string | Date, target: Date) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return false;

  return (
    date.getFullYear() === target.getFullYear() &&
    date.getMonth() === target.getMonth() &&
    date.getDate() === target.getDate()
  );
}

function getTargetDate(
  preset: StatsPreset,
  customDate: Date | null
): Date | null {
  if (preset === "today") return new Date();

  if (preset === "yesterday") {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date;
  }

  if (preset === "custom") return customDate;

  return null; // "all" -> no date filtering
}

function formatLastSeen(
  value: string | null,
  t: (key: "never" | "unknown" | "justNow" | "minAgo" | "hrAgo" | "yesterday" | "daysAgo") => string
) {
  if (!value) return t("never");

  const date = new Date(value);
  const timestamp = date.getTime();

  if (Number.isNaN(timestamp)) return t("unknown");

  const seconds = Math.max(
    0,
    Math.floor((Date.now() - timestamp) / 1000)
  );

  if (seconds < 60) return t("justNow");

  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)} ${t("minAgo")}`;
  }

  if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)} ${t("hrAgo")}`;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === yesterday.toDateString()) {
    return `${t("yesterday")}, ${date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    })}`;
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatPeakTime(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

/* -------------------------------------------------------------------------- */
/*                                 STAT CARD                                  */
/* -------------------------------------------------------------------------- */

function StatCard({
  icon,
  label,
  value,
  note,
  tone = "green",
}: StatCardProps) {
  const iconStyle =
    tone === "gold"
      ? styles.statIconGold
      : tone === "red"
        ? styles.statIconRed
        : styles.statIconGreen;

  const iconColor =
    tone === "gold"
      ? "#B08A22"
      : tone === "red"
        ? COLORS.red
        : COLORS.primary;

  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, iconStyle]}>
        <Ionicons name={icon} size={19} color={iconColor} />
      </View>

      <Text style={styles.statLabel}>{label}</Text>

      <Text style={styles.statValue}>{value}</Text>

      <Text style={styles.statNote}>{note}</Text>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                              DEVICE STATUS ROW                            */
/* -------------------------------------------------------------------------- */

function DeviceStatusRow({
  device,
  selected,
  onPress,
}: {
  device: Device;
  selected: boolean;
  onPress: () => void;
}) {
  const { t } = useLanguage();
  const online = isRecentlyAlive(device);

  return (
    <TouchableOpacity
      style={[
        styles.deviceSelect,
        selected && styles.deviceSelectSelected,
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.deviceRow}>
        <View
          style={[
            styles.deviceIcon,
            !online && styles.deviceIconOffline,
          ]}
        >
          <Ionicons
            name="hardware-chip-outline"
            size={20}
            color={online ? COLORS.primary : COLORS.gray}
          />
        </View>

        <View style={styles.deviceMain}>
          <Text style={styles.deviceName} numberOfLines={1}>
            {device.name}
          </Text>

          <Text style={styles.deviceDetails} numberOfLines={2}>
            {device.location || t("locationMissing")} ·{" "}
            {formatLastSeen(device.last_seen, t)}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            online ? styles.statusOnline : styles.statusOffline,
          ]}
        >
          <View
            style={[
              styles.statusDot,
              online ? styles.dotOnline : styles.dotOffline,
            ]}
          />

          <Text
            style={[
              styles.statusText,
              online ? styles.textOnline : styles.textOffline,
            ]}
          >
            {online ? t("online") : t("offline")}
          </Text>
        </View>
      </View>

      <View style={styles.deviceSelectionFooter}>
        <Text
          style={[
            styles.selectionText,
            selected && styles.selectionTextSelected,
          ]}
        >
          {selected ? t("selected") : t("viewStatistics")}
        </Text>

        <Ionicons
          name={selected ? "chevron-up" : "chevron-down"}
          size={15}
          color={selected ? COLORS.primary : COLORS.gray}
        />
      </View>
    </TouchableOpacity>
  );
}

/* -------------------------------------------------------------------------- */
/*                            DEVICE STAT TILE                               */
/* -------------------------------------------------------------------------- */

function DeviceStatTile({
  icon,
  label,
  value,
  tone = "green",
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
  tone?: "green" | "gold" | "red";
}) {
  const iconColor =
    tone === "gold"
      ? "#B08A22"
      : tone === "red"
        ? COLORS.red
        : COLORS.primary;

  const iconBackground =
    tone === "gold"
      ? COLORS.lightGold
      : tone === "red"
        ? COLORS.lightRed
        : COLORS.veryLightGreen;

  return (
    <View style={styles.deviceStatTile}>
      <View
        style={[
          styles.deviceStatIcon,
          { backgroundColor: iconBackground },
        ]}
      >
        <Ionicons name={icon} size={17} color={iconColor} />
      </View>

      <Text style={styles.deviceStatLabel}>{label}</Text>

      <Text style={styles.deviceStatValue}>{value}</Text>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                                HOME SCREEN                                 */
/* -------------------------------------------------------------------------- */

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useLanguage();

  const [devices, setDevices] = React.useState<Device[]>([]);
  const [logs, setLogs] = React.useState<DetectionLog[]>([]);

  const [selectedDeviceId, setSelectedDeviceId] =
    React.useState<string | null>(null);

  const [preset, setPreset] = React.useState<StatsPreset>("all");
  const [customDate, setCustomDate] = React.useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = React.useState(false);

  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  // Re-render every 15 seconds so device status follows last_seen.
  const [tick, setTick] = React.useState(0);

  /* ----------------------------- LOAD DEVICES ---------------------------- */

  const loadDevices = React.useCallback(async () => {
    const data = await fetchDevices();
    setDevices(data);
  }, []);

  /* ------------------------------ LOAD LOGS ------------------------------ */

  const loadLogs = React.useCallback(async () => {
    const data = await fetchDetectionLogs(500);
    setLogs(data);
  }, []);

  /* --------------------------- INITIAL LOADING -------------------------- */

  React.useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        const [deviceData, logData] = await Promise.all([
          fetchDevices(),
          fetchDetectionLogs(500),
        ]);

        if (!mounted) return;

        setDevices(deviceData);
        setLogs(logData);
      } catch (error) {
        console.warn("Failed to load Home dashboard:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void initialize();

    return () => {
      mounted = false;
    };
  }, []);

  /* --------------------------- REALTIME DEVICES -------------------------- */

  React.useEffect(() => {
    const unsubscribe = subscribeToDevices(() => {
      void loadDevices().catch((error) => {
        console.warn("Failed to refresh devices:", error);
      });
    });

    return unsubscribe;
  }, [loadDevices]);

  /* ---------------------------- REALTIME LOGS ---------------------------- */

  React.useEffect(() => {
    const unsubscribe = subscribeToDetectionLogs((newLog) => {
      setLogs((previous) => {
        if (previous.some((item) => item.id === newLog.id)) {
          return previous;
        }

        return [newLog, ...previous].slice(0, 500);
      });
    });

    return unsubscribe;
  }, []);

  /* ---------------------------- STATUS REFRESH --------------------------- */

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTick((value) => value + 1);
    }, 15_000);

    return () => clearInterval(timer);
  }, []);

  /* ----------------------------- MANUAL REFRESH -------------------------- */

  const refreshAll = async () => {
    if (refreshing) return;

    setRefreshing(true);

    try {
      const [deviceData, logData] = await Promise.all([
        fetchDevices(),
        fetchDetectionLogs(500),
      ]);

      setDevices(deviceData);
      setLogs(logData);
    } catch (error) {
      console.warn("Failed to refresh dashboard:", error);
    } finally {
      setRefreshing(false);
    }
  };

  /* ---------------------------- DATE PICKER ------------------------------ */

  const handleDateChange = (event: DateTimePickerEvent, date?: Date) => {
    setShowDatePicker(false);

    if (event.type === "set" && date) {
      setCustomDate(date);
      setPreset("custom");
    }
  };

  /* ----------------------------- DEVICE ORDER ---------------------------- */

  const sortedDevices = React.useMemo(() => {
    return [...devices].sort((a, b) => {
      const aOnline = isRecentlyAlive(a);
      const bOnline = isRecentlyAlive(b);

      return Number(bOnline) - Number(aOnline);
    });
  }, [devices, tick]);

  const selectedDevice =
    devices.find((device) => device.id === selectedDeviceId) ?? null;

  /* ---------------------------- FLEET SUMMARY ---------------------------- */

  const onlineDevices = devices.filter((device) =>
    isRecentlyAlive(device)
  ).length;

  const offlineDevices = devices.length - onlineDevices;

  /* --------------------------- BIRD DETECTIONS ---------------------------- */

  const today = new Date();

  const allBirdLogs = logs.filter(isBirdDetection);

  const allBirdDetectionsToday = allBirdLogs.filter((log) => {
    return (
      new Date(log.created_at).toDateString() === today.toDateString()
    );
  }).length;

  const weekStart = startOfToday();
  weekStart.setDate(weekStart.getDate() - 6);

  const allBirdDetectionsThisWeek = allBirdLogs.filter((log) => {
    const date = new Date(log.created_at);
    return date >= weekStart && date <= new Date();
  }).length;

  /* ----------------------- SELECTED DEVICE STATISTICS -------------------- */

  const selectedDeviceStats = React.useMemo(() => {
    if (!selectedDeviceId) return null;

    const selectedLogs = logs.filter(
      (log) => log.device_id === selectedDeviceId
    );

    let filteredLogs: DetectionLog[] = selectedLogs;

    const targetDate = getTargetDate(preset, customDate);

    if (targetDate) {
      filteredLogs = selectedLogs.filter((log) =>
        isSameDay(log.created_at, targetDate)
      );
    }

    const birdLogs = filteredLogs.filter(isBirdDetection);
    const offlineLogs = filteredLogs.filter(isOfflineEvent);

    const detectedToday = selectedLogs.filter((log) => {
      return (
        isBirdDetection(log) &&
        new Date(log.created_at).toDateString() === new Date().toDateString()
      );
    }).length;

    let averagePerDay = 0;

    if (filteredLogs.length > 0) {
      if (preset === "all") {
        const uniqueDays = new Set(
          filteredLogs.map((log) =>
            new Date(log.created_at).toDateString()
          )
        ).size;

        averagePerDay =
          uniqueDays > 0
            ? Number((birdLogs.length / uniqueDays).toFixed(1))
            : 0;
      } else {
        // A single day was selected, so the average is that day's count.
        averagePerDay = birdLogs.length;
      }
    }

    let peakTime = "—";

    if (birdLogs.length > 0) {
      const hours = new Array(24).fill(0);

      birdLogs.forEach((log) => {
        const hour = new Date(log.created_at).getHours();
        hours[hour] += 1;
      });

      const peakHour = hours.indexOf(Math.max(...hours));
      peakTime = formatPeakTime(peakHour);
    }

    return {
      totalEvents: filteredLogs.length,
      birdAlerts: birdLogs.length,
      offlineEvents: offlineLogs.length,
      detectedToday,
      averagePerDay,
      peakTime,
      hasRecords: filteredLogs.length > 0,
    };
  }, [logs, selectedDeviceId, preset, customDate, tick]);

  /* ---------------------------------------------------------------------- */
  /*                                  RENDER                                */
  /* ---------------------------------------------------------------------- */

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}

        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.pageTitle}>{t("overview")}</Text>

            <Text style={styles.pageSubtitle}>
              {t("overviewDesc")}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={refreshAll}
            disabled={refreshing}
            activeOpacity={0.75}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Ionicons
                name="refresh-outline"
                size={20}
                color={COLORS.white}
              />
            )}
          </TouchableOpacity>
        </View>

        {/* SUMMARY CARDS */}

        <View style={styles.summaryGrid}>
          <StatCard
            icon="hardware-chip-outline"
            label={t("registered")}
            value={loading ? "—" : devices.length}
            note={t("registeredNote")}
            tone="green"
          />

          <StatCard
            icon="wifi-outline"
            label={t("onlineDevices")}
            value={loading ? "—" : onlineDevices}
            note={`${offlineDevices} ${t("offline")}`}
            tone="gold"
          />

          <StatCard
            icon="radio-outline"
            label={t("birdsToday")}
            value={loading ? "—" : allBirdDetectionsToday}
            note={`${allBirdDetectionsThisWeek} ${t("thisWeek")}`}
            tone="green"
          />

          <StatCard
            icon="heart-dislike-outline"
            label={t("offlineDevices")}
            value={loading ? "—" : offlineDevices}
            note={t("deviceActivity")}
            tone="red"
          />
        </View>

        {/* DEVICE STATUS PANEL */}

        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <View style={styles.panelHeading}>
              <Text style={styles.panelTitle}>
                {t("deviceStatus")}
              </Text>

              <Text style={styles.panelSubtitle}>
                {t("liveHeartbeat")}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.viewAllButton}
              activeOpacity={0.7}
              onPress={() =>
                router.push({
                  pathname: "/settings",
                  params: {
                    section: "devices",
                    t: String(Date.now()),
                  },
                } as any)
              }
            >
              <Text style={styles.viewAllText}>
                {t("devices")}
              </Text>

              <Ionicons
                name="chevron-forward"
                size={14}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator
                size="small"
                color={COLORS.primary}
              />

              <Text style={styles.loadingText}>
                {t("loading")}
              </Text>
            </View>
          ) : sortedDevices.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="hardware-chip-outline"
                size={30}
                color="#A9B69F"
              />

              <Text style={styles.emptyTitle}>
                {t("noDevices")}
              </Text>
            </View>
          ) : (
            <View style={styles.deviceList}>
              {sortedDevices.map((device) => (
                <DeviceStatusRow
                  key={device.id}
                  device={device}
                  selected={selectedDeviceId === device.id}
                  onPress={() =>
                    setSelectedDeviceId((current) =>
                      current === device.id ? null : device.id
                    )
                  }
                />
              ))}
            </View>
          )}
        </View>

        {/* SELECTED DEVICE STATISTICS */}

        {selectedDevice && selectedDeviceStats && (
          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <View style={styles.panelHeading}>
                <Text style={styles.panelTitle}>
                  {t("deviceStatistics")}
                </Text>

                <Text style={styles.panelSubtitle}>
                  {t("statisticsFor")} {selectedDevice.name}
                </Text>
              </View>
            </View>

            {/* DATE FILTERS */}

            <View style={styles.filterRow}>
              {(
                [
                  ["all", t("all")],
                  ["today", t("today")],
                  ["yesterday", t("yesterday")],
                ] as [StatsPreset, string][]
              ).map(([key, label]) => {
                const active = preset === key;

                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.filterButton,
                      active && styles.filterButtonActive,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => setPreset(key)}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        active && styles.filterTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={[
                  styles.filterButton,
                  preset === "custom" && styles.filterButtonActive,
                ]}
                activeOpacity={0.8}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons
                  name="calendar-outline"
                  size={12}
                  color={preset === "custom" ? COLORS.white : "#526456"}
                />

                <Text
                  style={[
                    styles.filterText,
                    preset === "custom" && styles.filterTextActive,
                  ]}
                >
                  {preset === "custom" && customDate
                    ? customDate.toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : ("custom")}
                </Text>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={customDate ?? new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "inline" : "default"}
                maximumDate={new Date()}
                onChange={handleDateChange}
              />
            )}

            {/* STATISTICS GRID */}

            <View style={styles.deviceStatsGrid}>
              <DeviceStatTile
                icon="pulse-outline"
                label={t("totalEvents")}
                value={selectedDeviceStats.totalEvents}
                tone="green"
              />

              <DeviceStatTile
                icon="alert-circle-outline"
                label={t("birdAlerts")}
                value={selectedDeviceStats.birdAlerts}
                tone="green"
              />

              <DeviceStatTile
                icon="wifi-outline"
                label={t("offlineEvents")}
                value={selectedDeviceStats.offlineEvents}
                tone="red"
              />

              <DeviceStatTile
                icon="eye-outline"
                label={t("detectedToday")}
                value={selectedDeviceStats.detectedToday}
                tone="gold"
              />

              <DeviceStatTile
                icon="trending-up-outline"
                label={t("averagePerDay")}
                value={selectedDeviceStats.averagePerDay}
                tone="green"
              />

              <DeviceStatTile
                icon="time-outline"
                label={t("peakTime")}
                value={selectedDeviceStats.peakTime}
                tone="green"
              />
            </View>

            {!selectedDeviceStats.hasRecords && (
              <View style={styles.noStats}>
                <Ionicons
                  name="stats-chart-outline"
                  size={22}
                  color={COLORS.gray}
                />

                <Text style={styles.noStatsText}>
                  {t("noStatistics")}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* STATUS INFORMATION NOTE */}

        <View style={styles.noteStrip}>
          <Ionicons
            name="information-circle-outline"
            size={19}
            color={COLORS.primary}
          />

          <Text style={styles.noteText}>
            {t("statusNote")} {t("statusNoteEnd")}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {t("footer")}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F8FAF5",
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 125,
  },

  /* HEADER */

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
    gap: 12,
  },

  headerText: {
    flex: 1,
  },

  pageTitle: {
    fontSize: 25,
    fontFamily: "PlusJakartaSans_700Bold",
    color: COLORS.darkGreen,
    letterSpacing: -0.6,
  },

  pageSubtitle: {
    fontSize: 11,
    lineHeight: 17,
    fontFamily: "PlusJakartaSans_400Regular",
    color: COLORS.muted,
    marginTop: 5,
  },

  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  /* SUMMARY CARDS */

  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 17,
  },

  statCard: {
    width: "48%",
    flexGrow: 1,
    minWidth: 0,
    minHeight: 139,
    padding: 13,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#E8EDE3",
    borderRadius: 13,
  },

  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  statIconGreen: {
    backgroundColor: "#EAF5E9",
  },

  statIconGold: {
    backgroundColor: COLORS.lightGold,
  },

  statIconRed: {
    backgroundColor: COLORS.lightRed,
  },

  statLabel: {
    fontSize: 10,
    lineHeight: 14,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: "#718072",
  },

  statValue: {
    fontSize: 25,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#173D27",
    marginTop: 4,
  },

  statNote: {
    fontSize: 9,
    lineHeight: 13,
    fontFamily: "PlusJakartaSans_400Regular",
    color: "#9AA49A",
    marginTop: 2,
  },

  /* PANELS */

  panel: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#E8EDE3",
    borderRadius: 13,
    padding: 15,
    marginBottom: 16,
  },

  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    marginBottom: 13,
  },

  panelHeading: {
    flex: 1,
  },

  panelTitle: {
    fontSize: 16,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#1B3E29",
  },

  panelSubtitle: {
    fontSize: 10,
    fontFamily: "PlusJakartaSans_400Regular",
    color: "#929D91",
    marginTop: 4,
  },

  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingVertical: 7,
    paddingLeft: 7,
  },

  viewAllText: {
    fontSize: 11,
    fontFamily: "PlusJakartaSans_700Bold",
    color: COLORS.primary,
  },

  /* DEVICE LIST */

  deviceList: {
    gap: 4,
  },

  deviceSelect: {
    paddingHorizontal: 9,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: "transparent",
  },

  deviceSelectSelected: {
    backgroundColor: "#EDF4E7",
  },

  deviceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  deviceIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#F1F5E9",
    alignItems: "center",
    justifyContent: "center",
  },

  deviceIconOffline: {
    backgroundColor: COLORS.lightGray,
  },

  deviceMain: {
    flex: 1,
    minWidth: 0,
  },

  deviceName: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#294331",
  },

  deviceDetails: {
    fontSize: 9,
    lineHeight: 14,
    fontFamily: "PlusJakartaSans_400Regular",
    color: "#909B90",
    marginTop: 4,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 20,
  },

  statusOnline: {
    backgroundColor: "#EDF7EB",
  },

  statusOffline: {
    backgroundColor: "#FFF0ED",
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  dotOnline: {
    backgroundColor: "#3F8745",
  },

  dotOffline: {
    backgroundColor: "#D45D50",
  },

  statusText: {
    fontSize: 9,
    fontFamily: "PlusJakartaSans_700Bold",
  },

  textOnline: {
    color: "#3F8745",
  },

  textOffline: {
    color: "#C75448",
  },

  deviceSelectionFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 48,
    paddingRight: 3,
    paddingTop: 7,
  },

  selectionText: {
    fontSize: 10,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: COLORS.gray,
  },

  selectionTextSelected: {
    color: COLORS.primary,
  },

  /* LOADING AND EMPTY STATES */

  loadingState: {
    minHeight: 100,
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },

  loadingText: {
    fontSize: 11,
    fontFamily: "PlusJakartaSans_400Regular",
    color: COLORS.muted,
  },

  emptyState: {
    paddingVertical: 27,
    paddingHorizontal: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_700Bold",
    color: COLORS.darkGreen,
    marginTop: 9,
  },

  emptySubtitle: {
    fontSize: 10,
    lineHeight: 16,
    fontFamily: "PlusJakartaSans_400Regular",
    color: COLORS.gray,
    textAlign: "center",
    marginTop: 5,
  },

  /* FILTERS */

  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 5,
    marginBottom: 16,
  },

  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 9,
    paddingHorizontal: 11,
    paddingVertical: 9,
    backgroundColor: COLORS.white,
  },

  filterButtonActive: {
    backgroundColor: COLORS.darkGreen,
    borderColor: COLORS.darkGreen,
  },

  filterText: {
    fontSize: 10,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: "#526456",
  },

  filterTextActive: {
    color: COLORS.white,
  },

  /* DEVICE STATISTICS */

  deviceStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },

  deviceStatTile: {
    width: "48%",
    flexGrow: 1,
    minWidth: 0,
    minHeight: 112,
    padding: 11,
    borderWidth: 1,
    borderColor: "#E8EDE3",
    borderRadius: 10,
    backgroundColor: COLORS.white,
  },

  deviceStatIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  deviceStatLabel: {
    fontSize: 10,
    fontFamily: "PlusJakartaSans_500Medium",
    color: "#718072",
  },

  deviceStatValue: {
    fontSize: 21,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#173D27",
    marginTop: 4,
  },

  noStats: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 12,
  },

  noStatsText: {
    fontSize: 10,
    lineHeight: 15,
    fontFamily: "PlusJakartaSans_400Regular",
    color: COLORS.gray,
    textAlign: "center",
    marginTop: 7,
  },

  /* INFORMATION NOTE */

  noteStrip: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    backgroundColor: "#F1F5E9",
    borderRadius: 9,
    padding: 13,
    marginTop: 1,
  },

  noteText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 16,
    fontFamily: "PlusJakartaSans_400Regular",
    color: "#61715E",
  },

  /* FOOTER */

  footer: {
    alignItems: "center",
    paddingTop: 19,
  },

  footerText: {
    fontSize: 9,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: "#A0AAA0",
    letterSpacing: 0.4,
  },
});