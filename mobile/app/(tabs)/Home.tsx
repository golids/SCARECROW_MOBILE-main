import React from "react";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  Device as DbDevice,
  DetectionLog,
  fetchDevices,
  fetchDetectionLogs,
  isRecentlyAlive,
  subscribeToDevices,
  subscribeToDetectionLogs,
} from "../../lib/devices";

/* -------------------------------------------------------------------------- */
/*                                  COLORS                                    */
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
  lightGray: "#F5F5F5",
  border: "#E5E9D2",
  red: "#D32F2F",
  lightRed: "#FDECEA",
};

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

type DeviceStatus = "Active" | "Inactive";

// UI shape of a device row (built from the Supabase `devices` table)
type Device = {
  id: string;
  name: string;
  status: DeviceStatus;
  lastSeen: string | null; // ISO timestamp from devices.last_seen
};

type RangePreset = "7d" | "30d" | "all" | "custom";

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isSameDay(a: Date, b: Date) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function formatDate(d: Date) {
  return d.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// "just now", "5 min ago", "3 h ago", "yesterday, 4:10 PM", "Oct 12, 4:10 PM"
function formatLastSeen(iso: string | null) {
  if (!iso) return "never";

  const then = new Date(iso);
  const diffSec = Math.max(0, Math.floor((Date.now() - then.getTime()) / 1000));

  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} h ago`;

  const time = then.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const yesterday = startOfDay(new Date());
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDay(then, yesterday)) return `yesterday, ${time}`;

  const date = then.toLocaleDateString([], { month: "short", day: "numeric" });
  return `${date}, ${time}`;
}

function formatHour(hour: number) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h} ${suffix}`;
}

/* -------------------------------------------------------------------------- */
/*                              SCARECROW ICON                                */
/* -------------------------------------------------------------------------- */

function ScarecrowIcon({
  size = 36,
  color = COLORS.primary,
}: {
  size?: number;
  color?: string;
}) {
  const s = size / 60;

  return (
    <View
      style={{
        width: size,
        height: size * 1.1,
        alignItems: "center",
      }}
    >
      {/* Hat brim */}
      <View
        style={{
          width: 44 * s,
          height: 5 * s,
          backgroundColor: color,
          borderRadius: 3,
          marginTop: 2 * s,
        }}
      />

      {/* Hat top */}
      <View
        style={{
          width: 6 * s,
          height: 8 * s,
          backgroundColor: COLORS.darkGreen,
          borderRadius: 2,
        }}
      />

      {/* Head */}
      <View
        style={{
          width: 18 * s,
          height: 22 * s,
          backgroundColor: color,
          borderRadius: 4,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Eyes */}
        <View style={{ flexDirection: "row", gap: 5 * s }}>
          <View
            style={{
              width: 4 * s,
              height: 4 * s,
              backgroundColor: COLORS.gold,
              borderRadius: 2,
            }}
          />
          <View
            style={{
              width: 4 * s,
              height: 4 * s,
              backgroundColor: COLORS.gold,
              borderRadius: 2,
            }}
          />
        </View>
      </View>

      {/* Arms */}
      <View
        style={{
          width: 52 * s,
          height: 5 * s,
          backgroundColor: color,
          borderRadius: 3,
          marginTop: -14 * s,
        }}
      />

      {/* Legs */}
      <View style={{ flexDirection: "row", gap: 6 * s, marginTop: 1 * s }}>
        <View
          style={{
            width: 6 * s,
            height: 14 * s,
            backgroundColor: color,
            borderRadius: 2,
          }}
        />
        <View
          style={{
            width: 6 * s,
            height: 14 * s,
            backgroundColor: color,
            borderRadius: 2,
          }}
        />
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                              STAT TILE                                     */
/* -------------------------------------------------------------------------- */

function StatTile({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.statTile}>
      <View style={styles.statIconWrap}>
        <Ionicons name={icon} size={16} color={COLORS.primary} />
      </View>

      <Text style={styles.statLabel}>{label}</Text>

      <Text style={[styles.statValue, !value && styles.emptyValue]}>
        {value || "—"}
      </Text>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                         DATE RANGE CALENDAR MODAL                          */
/* -------------------------------------------------------------------------- */

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function RangeCalendarModal({
  visible,
  initialStart,
  initialEnd,
  onApply,
  onClose,
}: {
  visible: boolean;
  initialStart: Date;
  initialEnd: Date;
  onApply: (start: Date, end: Date) => void;
  onClose: () => void;
}) {
  const [month, setMonth] = React.useState(startOfDay(initialEnd));
  const [start, setStart] = React.useState<Date | null>(null);
  const [end, setEnd] = React.useState<Date | null>(null);

  React.useEffect(() => {
    if (visible) {
      setStart(startOfDay(initialStart));
      setEnd(startOfDay(initialEnd));
      setMonth(startOfDay(initialEnd));
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const today = startOfDay(new Date());
  const year = month.getFullYear();
  const m = month.getMonth();
  const firstWeekday = new Date(year, m, 1).getDay();
  const daysInMonth = new Date(year, m + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, m, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const rows: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  const isCurrentMonth =
    year === today.getFullYear() && m === today.getMonth();

  const pickDay = (day: Date) => {
    if (!start || (start && end)) {
      // first tap (or starting over)
      setStart(day);
      setEnd(null);
    } else if (day < start) {
      setEnd(start);
      setStart(day);
    } else {
      setEnd(day);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Select date range</Text>
          <Text style={styles.modalHint}>
            {start
              ? `${formatDate(start)}${
                  end ? ` – ${formatDate(end)}` : " – tap an end date"
                }`
              : "Tap a start date"}
          </Text>

          {/* Month navigation */}
          <View style={styles.calHeader}>
            <TouchableOpacity
              style={styles.calNavBtn}
              onPress={() => setMonth(new Date(year, m - 1, 1))}
            >
              <Ionicons name="chevron-back" size={18} color={COLORS.primary} />
            </TouchableOpacity>

            <Text style={styles.calTitle}>
              {month.toLocaleDateString([], { month: "long", year: "numeric" })}
            </Text>

            <TouchableOpacity
              style={[styles.calNavBtn, isCurrentMonth && { opacity: 0.3 }]}
              disabled={isCurrentMonth}
              onPress={() => setMonth(new Date(year, m + 1, 1))}
            >
              <Ionicons
                name="chevron-forward"
                size={18}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          </View>

          {/* Weekday labels */}
          <View style={styles.calRow}>
            {WEEKDAYS.map((w, i) => (
              <Text key={i} style={styles.calWeekday}>
                {w}
              </Text>
            ))}
          </View>

          {/* Days */}
          {rows.map((row, ri) => (
            <View key={ri} style={styles.calRow}>
              {row.map((day, ci) => {
                if (!day) return <View key={ci} style={styles.calCell} />;

                const future = day > today;
                const isEdge =
                  (start && isSameDay(day, start)) ||
                  (end && isSameDay(day, end));
                const inRange =
                  start && end && day >= start && day <= end && !isEdge;

                return (
                  <TouchableOpacity
                    key={ci}
                    style={[
                      styles.calCell,
                      inRange && styles.calCellInRange,
                      isEdge && styles.calCellEdge,
                      future && { opacity: 0.25 },
                    ]}
                    disabled={future}
                    activeOpacity={0.7}
                    onPress={() => pickDay(day)}
                  >
                    <Text
                      style={[
                        styles.calDayText,
                        isEdge && styles.calDayTextEdge,
                      ]}
                    >
                      {day.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}

          {/* Buttons */}
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancel} onPress={onClose}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalApply, !start && { opacity: 0.4 }]}
              disabled={!start}
              onPress={() => start && onApply(start, end ?? start)}
            >
              <Text style={styles.modalApplyText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/*                              HOME SCREEN                                   */
/* -------------------------------------------------------------------------- */

export default function HomeScreen() {
  const router = useRouter();

  /*
   * Devices come from Supabase (`devices`), and statistics are computed from
   * the detection logs (same source as the Logs tab).
   */

  /* ----------------------------- Devices data ---------------------------- */

  const [dbDevices, setDbDevices] = React.useState<DbDevice[]>([]);

  // Re-render every 15s so Active/Inactive follows `last_seen` even when
  // nothing else changes (isRecentlyAlive compares against Date.now()).
  const [, setTick] = React.useState(0);

  const loadDevices = React.useCallback(async () => {
    try {
      const data = await fetchDevices();
      setDbDevices(data);
    } catch (e) {
      console.warn("Failed to load devices:", e);
    }
  }, []);

  React.useEffect(() => {
    loadDevices();

    // Live update when a Pi sends a heartbeat or its IP changes
    const unsubscribe = subscribeToDevices(loadDevices);
    const timer = setInterval(() => setTick((t) => t + 1), 15_000);

    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, [loadDevices]);

  // UI list: every registered device with Active / Inactive status.
  // Inactive devices come first (those are the ones maintenance cares about),
  // then alphabetical within each group.
  const devices: Device[] = dbDevices
    .map((d) => ({
      id: d.id,
      name: d.name,
      status: (isRecentlyAlive(d) ? "Active" : "Inactive") as DeviceStatus,
      lastSeen: d.last_seen,
    }))
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "Inactive" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

  const refreshAll = async () => {
    try {
      const [logData] = await Promise.all([fetchDetectionLogs(500), loadDevices()]);
      setLogs(logData);
    } catch (e) {
      console.warn("Failed to refresh:", e);
    }
  };

  /* ------------------------------ Logs data ------------------------------ */

  const [logs, setLogs] = React.useState<DetectionLog[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = React.useState<
    string | null
  >(null);

  // Statistics date filter
  const [preset, setPreset] = React.useState<RangePreset>("7d");
  const [customRange, setCustomRange] = React.useState<{
    start: Date;
    end: Date;
  } | null>(null);
  const [pickerOpen, setPickerOpen] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const data = await fetchDetectionLogs(500);
        if (mounted) setLogs(data);
      } catch (e) {
        console.warn("Failed to load detection logs:", e);
      }
    })();

    // Live-append new detections / events
    const unsubscribe = subscribeToDetectionLogs((newLog) => {
      setLogs((prev) => [newLog, ...prev]);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  /* --------------------------- Bird summary banner ----------------------- */

  const now = new Date();
  const allBirdLogs = logs.filter((l) => l.event_type === "bird_detected");

  const birdsToday = allBirdLogs.filter((l) =>
    isSameDay(new Date(l.created_at), now)
  ).length;

  const weekStart = startOfDay(now);
  weekStart.setDate(weekStart.getDate() - 6);
  const birdsThisWeek = allBirdLogs.filter(
    (l) => new Date(l.created_at) >= weekStart
  ).length;

  /* ------------------------- Selected device stats ----------------------- */

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId) ?? null;

  const stats = React.useMemo(() => {
    if (!selectedDevice) return null;

    const todayStart = startOfDay(new Date());
    const allDeviceLogs = logs.filter((l) => l.device_id === selectedDevice.id);

    // ---- Date range ----
    let rangeStart: Date;
    let rangeEnd: Date = todayStart;

    if (preset === "custom" && customRange) {
      rangeStart = startOfDay(customRange.start);
      rangeEnd = startOfDay(customRange.end);
    } else if (preset === "30d") {
      rangeStart = addDays(todayStart, -29);
    } else if (preset === "all") {
      const times = allDeviceLogs.map((l) => new Date(l.created_at).getTime());
      rangeStart = times.length
        ? startOfDay(new Date(Math.min(...times)))
        : todayStart;
    } else {
      rangeStart = addDays(todayStart, -6);
    }

    const rangeEndExclusive = addDays(rangeEnd, 1);
    const inRange = (l: DetectionLog) => {
      const t = new Date(l.created_at);
      return t >= rangeStart && t < rangeEndExclusive;
    };

    // ---- Filtered logs ----
    const deviceLogs = allDeviceLogs.filter(inRange);
    const birdLogs = deviceLogs.filter((l) => l.event_type === "bird_detected");
    const offlineLogs = deviceLogs.filter((l) => l.event_type === "offline");

    // "Detected Today" always means today, regardless of the filter
    const detectedToday = allDeviceLogs.filter(
      (l) =>
        l.event_type === "bird_detected" &&
        isSameDay(new Date(l.created_at), todayStart)
    ).length;

    // Average detections per day (over the days that have any events)
    const activeDays = new Set(
      deviceLogs.map((l) => startOfDay(new Date(l.created_at)).getTime())
    ).size;
    const avgPerDay =
      birdLogs.length > 0
        ? (birdLogs.length / Math.max(activeDays, 1)).toFixed(1)
        : "";

    // Peak hour of bird detections
    const hourCounts: Record<number, number> = {};
    birdLogs.forEach((l) => {
      const h = new Date(l.created_at).getHours();
      hourCounts[h] = (hourCounts[h] ?? 0) + 1;
    });
    let peakHour = -1;
    let peakCount = 0;
    Object.entries(hourCounts).forEach(([h, c]) => {
      if (c > peakCount) {
        peakCount = c;
        peakHour = Number(h);
      }
    });

    // ---- Chart bars: daily up to 14 days, otherwise grouped (max 8 bars) ----
    const totalDays =
      Math.round((rangeEnd.getTime() - rangeStart.getTime()) / 86400000) + 1;
    const bucketSize = totalDays <= 14 ? 1 : Math.ceil(totalDays / 8);

    const weekly: { day: string; count: number }[] = [];
    for (let i = 0; i < totalDays; i += bucketSize) {
      const bStart = addDays(rangeStart, i);
      const bEnd = addDays(rangeStart, Math.min(i + bucketSize, totalDays));

      const count = birdLogs.filter((l) => {
        const t = new Date(l.created_at);
        return t >= bStart && t < bEnd;
      }).length;

      let label: string;
      if (bucketSize > 1) {
        label = bStart.toLocaleDateString([], { month: "short", day: "numeric" });
      } else if (totalDays <= 7) {
        label = bStart.toLocaleDateString([], { weekday: "short" });
      } else {
        label = String(bStart.getDate());
      }

      weekly.push({ day: label, count });
    }

    return {
      totalEvents: String(deviceLogs.length),
      birdAlerts: String(birdLogs.length),
      offlineEvents: String(offlineLogs.length),
      detectedToday: String(detectedToday),
      avgPerDay,
      peakTime: peakHour >= 0 ? formatHour(peakHour) : "",
      weekly,
      bucketSize,
      rangeStart,
      rangeEnd,
    };
  }, [logs, selectedDevice, preset, customRange]);

  const activeCount = devices.filter((d) => d.status === "Active").length;
  const inactiveCount = devices.length - activeCount;

  const maxWeekly = Math.max(...(stats?.weekly.map((d) => d.count) ?? [0]), 1);
  const BAR_MAX_HEIGHT = 90;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces
      >
        {/* ---------------------------------------------------------------- */}
        {/* Header (Welcome + Add Button)                                     */}
        {/* ---------------------------------------------------------------- */}

        <View style={styles.header}>
          <View>
            <Text style={styles.welcome}>Device Monitoring</Text>
            <Text style={styles.headerSubtitle}>
              Admin overview of all devices
            </Text>
          </View>

          <TouchableOpacity
            style={styles.addBtn}
            activeOpacity={0.8}
            onPress={refreshAll}
          >
            <Ionicons name="refresh" size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* ---------------------------------------------------------------- */}
        {/* Fleet Overview */}
        {/* ---------------------------------------------------------------- */}

        <View style={styles.fleetCard}>
          <View style={styles.fleetItem}>
            <View style={styles.iconCircle}>
              <Ionicons
                name="hardware-chip-outline"
                size={18}
                color={COLORS.primary}
              />
            </View>
            <Text style={styles.fleetValue}>{devices.length}</Text>
            <Text style={styles.fleetLabel}>Total Devices</Text>
          </View>

          <View style={styles.dividerVert} />

          <View style={styles.fleetItem}>
            <View style={styles.iconCircle}>
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color={COLORS.primary}
              />
            </View>
            <Text style={styles.fleetValue}>{activeCount}</Text>
            <Text style={styles.fleetLabel}>Active</Text>
          </View>

          <View style={styles.dividerVert} />

          <View style={styles.fleetItem}>
            <View
              style={[
                styles.iconCircle,
                inactiveCount > 0 && styles.iconCircleAlert,
              ]}
            >
              <Ionicons
                name="alert-circle-outline"
                size={18}
                color={inactiveCount > 0 ? COLORS.red : COLORS.gray}
              />
            </View>
            <Text
              style={[
                styles.fleetValue,
                inactiveCount > 0 ? styles.fleetValueAlert : styles.fleetValueMuted,
              ]}
            >
              {inactiveCount}
            </Text>
            <Text style={styles.fleetLabel}>Inactive</Text>
          </View>
        </View>

        {/* ---------------------------------------------------------------- */}
        {/* Device List                                                       */}
        {/* ---------------------------------------------------------------- */}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Device List</Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                router.push({
                  pathname: "/settings",
                  params: { section: "devices", t: String(Date.now()) },
                } as any)
              }
            >
              <Text style={styles.sectionLink}>Manage &gt;</Text>
            </TouchableOpacity>
          </View>

          {/* Summary counts */}
          {devices.length > 0 && (
            <Text style={styles.deviceSummary}>
              Inactive devices are listed first · tap a device to see its
              statistics
            </Text>
          )}

          {devices.length > 0 ? (
            devices.map((device) => {
              const isActive = device.status === "Active";
              const isSelected = device.id === selectedDeviceId;

              return (
                <TouchableOpacity
                  key={device.id}
                  style={[
                    styles.deviceRow,
                    isSelected && styles.deviceRowSelected,
                  ]}
                  activeOpacity={0.75}
                  onPress={() =>
                    // Tap again to hide the statistics
                    setSelectedDeviceId(isSelected ? null : device.id)
                  }
                >
                  <View
                    style={[
                      styles.deviceIconWrap,
                      !isActive && styles.deviceIconWrapInactive,
                    ]}
                  >
                    <ScarecrowIcon
                      size={36}
                      color={isActive ? COLORS.primary : COLORS.gray}
                    />
                  </View>

                  <View style={styles.deviceInfo}>
                    <Text style={styles.deviceName} numberOfLines={1}>
                      {device.name}
                    </Text>

                    <View style={styles.statusRow}>
                      <View
                        style={[
                          styles.statusDot,
                          !isActive && styles.statusDotInactive,
                        ]}
                      />

                      <Text
                        style={[
                          styles.deviceStatus,
                          !isActive && styles.deviceStatusInactive,
                        ]}
                      >
                        {`Last seen ${formatLastSeen(device.lastSeen)}`}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      isActive
                        ? styles.statusBadgeActive
                        : styles.statusBadgeInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        isActive
                          ? styles.statusBadgeTextActive
                          : styles.statusBadgeTextInactive,
                      ]}
                    >
                      {device.status}
                    </Text>
                  </View>

                  <Ionicons
                    name={isSelected ? "chevron-down" : "chevron-forward"}
                    size={18}
                    color={COLORS.primary}
                  />
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={[styles.emptyBox, styles.deviceEmptySpacing]}>
              <Ionicons
                name="hardware-chip-outline"
                size={22}
                color={COLORS.gray}
              />

              <Text style={styles.emptyBoxText}>
                No devices registered yet.
              </Text>
            </View>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* Bird Summary                                                     */}
          {/* ---------------------------------------------------------------- */}

          <View style={styles.birdBanner}>
            <View style={styles.birdBannerLeft}>
              <View style={styles.birdEmojiWrap}>
                <Text style={styles.birdEmoji}>🐦‍⬛</Text>
              </View>

              <View>
                <Text style={styles.birdBannerLabel}>All detections today</Text>
                <Text style={styles.birdCountLarge}>{birdsToday}</Text>
              </View>
            </View>

            <View style={styles.birdBannerRight}>
              <Text style={styles.birdBannerLabel}>All detections this week</Text>
              <Text style={styles.birdCountLarge}>{birdsThisWeek}</Text>
            </View>
          </View>
        </View>

        {/* ---------------------------------------------------------------- */}
        {/* Statistics (only when a device is selected)                       */}
        {/* ---------------------------------------------------------------- */}

        {selectedDevice && stats && (
          <View style={styles.sectionLast}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Statistics</Text>

              <Text style={styles.statDeviceName} numberOfLines={1}>
                {selectedDevice.name}
              </Text>
            </View>

            {/* Date range filter */}
            <View style={styles.filterRow}>
              {(
                [
                  ["7d", "Last 7 days"],
                  ["30d", "Last 30 days"],
                  ["all", "All time"],
                ] as [RangePreset, string][]
              ).map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.chip, preset === key && styles.chipActive]}
                  activeOpacity={0.8}
                  onPress={() => setPreset(key)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      preset === key && styles.chipTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={[styles.chip, preset === "custom" && styles.chipActive]}
                activeOpacity={0.8}
                onPress={() => setPickerOpen(true)}
              >
                <Ionicons
                  name="calendar-outline"
                  size={13}
                  color={preset === "custom" ? COLORS.white : COLORS.primary}
                />
                <Text
                  style={[
                    styles.chipText,
                    preset === "custom" && styles.chipTextActive,
                  ]}
                >
                  Custom
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.rangeSummary}>
              Showing {formatDate(stats.rangeStart)}
              {isSameDay(stats.rangeStart, stats.rangeEnd)
                ? ""
                : ` – ${formatDate(stats.rangeEnd)}`}
            </Text>

            {/* Stat tiles */}
            <View style={styles.statGrid}>
              <StatTile
                icon="list-outline"
                label="Total Events"
                value={stats.totalEvents}
              />
              <StatTile
                icon="alert-circle-outline"
                label="Bird Alerts"
                value={stats.birdAlerts}
              />
              <StatTile
                icon="cloud-offline-outline"
                label="Offline Events"
                value={stats.offlineEvents}
              />
              <StatTile
                icon="eye-outline"
                label="Detected Today"
                value={stats.detectedToday}
              />
              <StatTile
                icon="trending-up-outline"
                label="Avg. per Day"
                value={stats.avgPerDay}
              />
              <StatTile
                icon="time-outline"
                label="Peak Time"
                value={stats.peakTime}
              />
            </View>

            {/* Chart */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>
                {stats.bucketSize > 1
                  ? `Bird Detections (every ${stats.bucketSize} days)`
                  : "Bird Detections per Day"}
              </Text>

              <View style={styles.chartRow}>
                {stats.weekly.map((item, index) => {
                  const height = Math.max(
                    (item.count / maxWeekly) * BAR_MAX_HEIGHT,
                    4
                  );

                  return (
                    <View key={`${item.day}-${index}`} style={styles.barCol}>
                      <Text style={styles.barValue}>{item.count}</Text>

                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.bar,
                            { height },
                            item.count === 0 && styles.barEmpty,
                          ]}
                        />
                      </View>

                      <Text style={styles.barLabel}>{item.day}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Date range picker */}
      {selectedDevice && stats && (
        <RangeCalendarModal
          visible={pickerOpen}
          initialStart={stats.rangeStart}
          initialEnd={stats.rangeEnd}
          onClose={() => setPickerOpen(false)}
          onApply={(s, e) => {
            setCustomRange({ start: s, end: e });
            setPreset("custom");
            setPickerOpen(false);
          }}
        />
      )}
    </SafeAreaView>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  STYLES                                    */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  /* Main */
  safe: {
    flex: 1,
    backgroundColor: COLORS.white,
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

  welcome: {
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

  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: COLORS.darkGreen,
  },

  /* Fleet Overview */
  fleetCard: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: "center",
  },

  fleetItem: {
    flex: 1,
    alignItems: "center",
  },

  fleetValue: {
    fontSize: 22,
    fontFamily: "PlusJakartaSans_700Bold",
    color: COLORS.primary,
    marginTop: 6,
  },

  fleetValueAlert: {
    color: COLORS.red,
  },

  fleetValueMuted: {
    color: COLORS.gray,
  },

  fleetLabel: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
    color: COLORS.gray,
    marginTop: 1,
  },

  iconCircleAlert: {
    backgroundColor: COLORS.lightRed,
  },

  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.veryLightGreen,
    alignItems: "center",
    justifyContent: "center",
  },

  dividerVert: {
    width: 1,
    height: 36,
    backgroundColor: COLORS.border,
  },

  emptyValue: {
    color: COLORS.gray,
  },

  /* Section */
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },

  sectionLast: {
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
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 20,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: COLORS.darkGreen,
  },

  sectionLink: {
    fontSize: 15,
    fontFamily: "PlusJakartaSans_500Medium",
    color: COLORS.primary,
  },

  statDeviceName: {
    flex: 1,
    textAlign: "right",
    marginLeft: 12,
    fontSize: 14,
    fontFamily: "PlusJakartaSans_500Medium",
    color: COLORS.primary,
  },

  /* Device */
  deviceSummary: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
    color: COLORS.gray,
    marginBottom: 10,
  },

  deviceRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  deviceRowSelected: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
    backgroundColor: COLORS.veryLightGreen,
  },

  deviceIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.veryLightGreen,
    alignItems: "center",
    justifyContent: "center",
  },

  deviceIconWrapInactive: {
    backgroundColor: COLORS.lightGray,
  },

  deviceInfo: {
    flex: 1,
    marginLeft: 12,
  },

  deviceName: {
    fontSize: 15,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: COLORS.darkGreen,
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },

  statusDotInactive: {
    backgroundColor: COLORS.gray,
  },

  deviceStatus: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
    color: COLORS.primary,
    marginLeft: 5,
  },

  deviceStatusInactive: {
    color: COLORS.gray,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
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

  deviceEmptySpacing: {
    marginBottom: 10,
  },

  /* Bird Banner */
  birdBanner: {
    flexDirection: "row",
    backgroundColor: COLORS.lightGold,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#EFE5B9",
  },

  birdBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  birdEmojiWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },

  birdEmoji: {
    fontSize: 18,
  },

  birdBannerRight: {
    alignItems: "flex-end",
  },

  birdBannerLabel: {
    fontSize: 11,
    fontFamily: "PlusJakartaSans_400Regular",
    color: COLORS.darkGreen,
  },

  birdCountLarge: {
    fontSize: 18,
    fontFamily: "PlusJakartaSans_700Bold",
    color: COLORS.primary,
  },

  /* Shared empty state */
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

  /* Date filter */
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },

  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },

  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  chipText: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_500Medium",
    color: COLORS.primary,
  },

  chipTextActive: {
    color: COLORS.white,
  },

  rangeSummary: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
    color: COLORS.gray,
    marginBottom: 12,
  },

  /* Calendar modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  modalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
  },

  modalTitle: {
    fontSize: 18,
    fontFamily: "PlusJakartaSans_700Bold",
    color: COLORS.darkGreen,
  },

  modalHint: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
    color: COLORS.gray,
    marginTop: 2,
    marginBottom: 12,
  },

  calHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  calNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.veryLightGreen,
    alignItems: "center",
    justifyContent: "center",
  },

  calTitle: {
    fontSize: 15,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: COLORS.darkGreen,
  },

  calRow: {
    flexDirection: "row",
  },

  calWeekday: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: COLORS.gray,
    paddingVertical: 4,
  },

  calCell: {
    flex: 1,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },

  calCellInRange: {
    backgroundColor: COLORS.lightGreen,
  },

  calCellEdge: {
    backgroundColor: COLORS.primary,
    borderRadius: 19,
  },

  calDayText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_500Medium",
    color: COLORS.darkGreen,
  },

  calDayTextEdge: {
    color: COLORS.white,
  },

  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 14,
  },

  modalCancel: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  modalCancelText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: COLORS.gray,
  },

  modalApply: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },

  modalApplyText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: COLORS.white,
  },

  /* Statistics */
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },

  statTile: {
    width: "48%",
    flexGrow: 1,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  statIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.veryLightGreen,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  statLabel: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
    color: COLORS.gray,
  },

  statValue: {
    fontSize: 20,
    fontFamily: "PlusJakartaSans_700Bold",
    color: COLORS.primary,
    marginTop: 2,
  },

  chartCard: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  chartTitle: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: COLORS.darkGreen,
    marginBottom: 12,
  },

  chartRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },

  barCol: {
    flex: 1,
    alignItems: "center",
  },

  barValue: {
    fontSize: 10,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: COLORS.darkGreen,
    marginBottom: 4,
  },

  barTrack: {
    height: 90,
    justifyContent: "flex-end",
  },

  bar: {
    width: 18,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },

  barEmpty: {
    backgroundColor: COLORS.border,
  },

  barLabel: {
    fontSize: 10,
    fontFamily: "PlusJakartaSans_400Regular",
    color: COLORS.gray,
    marginTop: 6,
  },
});