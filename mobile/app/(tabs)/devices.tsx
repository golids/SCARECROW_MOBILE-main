
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useLanguage } from "../context/LanguageContext";
import {
  Device,
  fetchDevices,
  isRecentlyAlive,
  subscribeToDevices,
} from "../../lib/devices";

const COLORS = {
  white: "#FFFFFF",
  darkGreen: "#123B25",
  primary: "#4F8F3A",
  lightGreen: "#E8F0B8",
  veryLightGreen: "#F7F9E9",
  gray: "#808080",
  lightGray: "#F5F5F5",
  border: "#E5E9D2",
  red: "#D32F2F",
  lightRed: "#FDECEA",
};

type FilterType = "All" | "Online" | "Offline";

function formatLastSeen(value: string | null, t: (key: any) => string) {
  if (!value) return t("never");

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return t("unknown");

  const seconds = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 1000)
  );

  if (seconds < 60) return t("justNow");

  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)} ${t("minAgo")}`;
  }

  if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)} ${t("hrAgo")}`;
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function DevicesScreen() {
  const { t } = useLanguage();

  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const loadDevices = useCallback(async () => {
    try {
      setErrorMessage("");
      const result = await fetchDevices();
      setDevices(result);
    } catch (error: any) {
      console.error("Client devices loading error:", error);
      setErrorMessage(
        error?.message || t("loadDevicesError")
      );
    }
  }, [t]);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const result = await fetchDevices();

        if (mounted) {
          setDevices(result);
          setErrorMessage("");
        }
      } catch (error: any) {
        console.error("Client devices loading error:", error);

        if (mounted) {
          setErrorMessage(
            error?.message || t("loadDevicesError")
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void initialize();

    const unsubscribe = subscribeToDevices(() => {
      if (mounted) void loadDevices();
    });

    const timer = setInterval(() => {
      if (mounted) setTick((value) => value + 1);
    }, 15_000);

    return () => {
      mounted = false;
      unsubscribe();
      clearInterval(timer);
    };
  }, [loadDevices, t]);

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      await loadDevices();
    } finally {
      setRefreshing(false);
    }
  };

  const onlineCount = devices.filter(isRecentlyAlive).length;
  const offlineCount = devices.length - onlineCount;

  const filteredDevices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return devices
      .map((device) => ({
        device,
        online: isRecentlyAlive(device),
      }))
      .filter(({ device, online }) => {
        const matchesSearch =
          !query ||
          device.name?.toLowerCase().includes(query) ||
          device.location?.toLowerCase().includes(query);

        const matchesFilter =
          filter === "All" ||
          (filter === "Online" && online) ||
          (filter === "Offline" && !online);

        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => Number(b.online) - Number(a.online));
  }, [devices, search, filter, tick]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>{t("loadingDevices")}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{t("devices")}</Text>
            <Text style={styles.subtitle}>
              Monitor the ScareCROW devices assigned to your account.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={refreshing}
          >
            <Ionicons name="refresh" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons
              name="hardware-chip-outline"
              size={21}
              color={COLORS.primary}
            />
            <Text style={styles.statValue}>{devices.length}</Text>
            <Text style={styles.statLabel}>Assigned devices</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons
              name="wifi-outline"
              size={21}
              color={COLORS.primary}
            />
            <Text style={styles.statValue}>{onlineCount}</Text>
            <Text style={styles.statLabel}>{t("online")}</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons
              name="wifi-outline"
              size={21}
              color={COLORS.red}
            />
            <Text style={styles.statValue}>{offlineCount}</Text>
            <Text style={styles.statLabel}>{t("offline")}</Text>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={19} color={COLORS.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search device or location..."
            placeholderTextColor={COLORS.gray}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={19} color={COLORS.gray} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterRow}>
          {(["All", "Online", "Offline"] as FilterType[]).map((item) => {
            const selected = filter === item;

            return (
              <TouchableOpacity
                key={item}
                onPress={() => setFilter(item)}
                style={[
                  styles.filterButton,
                  selected && styles.filterButtonSelected,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    selected && styles.filterTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {errorMessage ? (
          <View style={styles.errorCard}>
            <Ionicons
              name="alert-circle-outline"
              size={22}
              color={COLORS.red}
            />
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity onPress={handleRefresh}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredDevices.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="hardware-chip-outline"
              size={42}
              color={COLORS.gray}
            />
            <Text style={styles.emptyTitle}>
              {devices.length === 0
                ? "No assigned devices"
                : "No matching devices"}
            </Text>
            <Text style={styles.emptyText}>
              {devices.length === 0
                ? "Devices assigned to your account by the administrator will appear here."
                : "Try another search term or status filter."}
            </Text>
          </View>
        ) : (
          filteredDevices.map(({ device, online }) => {
            const expanded = expandedId === device.id;

            return (
              <TouchableOpacity
                key={device.id}
                activeOpacity={0.8}
                style={styles.deviceCard}
                onPress={() =>
                  setExpandedId(expanded ? null : device.id)
                }
              >
                <View style={styles.deviceHeader}>
                  <View
                    style={[
                      styles.deviceIcon,
                      !online && styles.deviceIconOffline,
                    ]}
                  >
                    <Ionicons
                      name="hardware-chip-outline"
                      size={25}
                      color={online ? COLORS.primary : COLORS.gray}
                    />
                  </View>

                  <View style={styles.deviceInfo}>
                    <Text style={styles.deviceName} numberOfLines={1}>
                      {device.name || "Unnamed device"}
                    </Text>

                    <Text style={styles.deviceLocation} numberOfLines={1}>
                      <Ionicons
                        name="location-outline"
                        size={12}
                        color={COLORS.gray}
                      />{" "}
                      {device.location || "Location not set"}
                    </Text>

                    <Text style={styles.lastSeen}>
                      Last seen: {formatLastSeen(device.last_seen, t)}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      online ? styles.onlineBadge : styles.offlineBadge,
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor: online
                            ? COLORS.primary
                            : COLORS.red,
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: online ? COLORS.primary : COLORS.red },
                      ]}
                    >
                      {online ? t("online") : t("offline")}
                    </Text>
                  </View>
                </View>

                {expanded && (
                  <View style={styles.details}>
                    <View style={styles.divider} />

                    <Text style={styles.detailLabel}>Device ID</Text>
                    <Text selectable style={styles.detailValue}>
                      {device.id}
                    </Text>

                    <Text style={styles.detailLabel}>IP Address</Text>
                    <Text style={styles.detailValue}>
                      {device.ip_address || "Not configured"}
                    </Text>

                    <Text style={styles.detailLabel}>Port</Text>
                    <Text style={styles.detailValue}>
                      {device.port ?? "Not configured"}
                    </Text>

                    <Text style={styles.detailLabel}>Last heartbeat</Text>
                    <Text style={styles.detailValue}>
                      {device.last_seen
                        ? new Date(device.last_seen).toLocaleString()
                        : "No heartbeat received"}
                    </Text>
                  </View>
                )}

                <View style={styles.cardFooter}>
                  <Text style={styles.expandText}>
                    {expanded ? "Show less" : "View device details"}
                  </Text>
                  <Ionicons
                    name={expanded ? "chevron-up" : "chevron-down"}
                    size={17}
                    color={COLORS.primary}
                  />
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <Text style={styles.footer}>
          SCARECROW • CLIENT MONITORING
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.gray,
    fontSize: 13,
  },
  content: {
    padding: 18,
    paddingBottom: 120,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 25,
    fontFamily: "PlusJakartaSans_700Bold",
    color: COLORS.darkGreen,
  },
  subtitle: {
    fontSize: 11,
    lineHeight: 17,
    color: COLORS.gray,
    marginTop: 4,
    fontFamily: "PlusJakartaSans_400Regular",
  },
  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    gap: 9,
    marginBottom: 17,
  },
  statCard: {
    flex: 1,
    minHeight: 100,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.veryLightGreen,
    padding: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 21,
    fontFamily: "PlusJakartaSans_700Bold",
    color: COLORS.darkGreen,
    marginTop: 5,
  },
  statLabel: {
    fontSize: 9,
    color: COLORS.gray,
    marginTop: 3,
    textAlign: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 11,
    paddingHorizontal: 12,
    height: 47,
    marginBottom: 13,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: COLORS.darkGreen,
    fontSize: 12,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 15,
  },
  filterButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 9,
    paddingHorizontal: 17,
    paddingVertical: 9,
  },
  filterButtonSelected: {
    backgroundColor: COLORS.darkGreen,
    borderColor: COLORS.darkGreen,
  },
  filterText: {
    fontSize: 11,
    color: COLORS.darkGreen,
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  filterTextSelected: {
    color: COLORS.white,
  },
  deviceCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  deviceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  deviceIcon: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: COLORS.veryLightGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  deviceIconOffline: {
    backgroundColor: COLORS.lightGray,
  },
  deviceInfo: {
    flex: 1,
    minWidth: 0,
  },
  deviceName: {
    fontSize: 13,
    color: COLORS.darkGreen,
    fontFamily: "PlusJakartaSans_700Bold",
  },
  deviceLocation: {
    fontSize: 10,
    color: COLORS.gray,
    marginTop: 4,
  },
  lastSeen: {
    fontSize: 9,
    color: COLORS.gray,
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  onlineBadge: {
    backgroundColor: COLORS.veryLightGreen,
  },
  offlineBadge: {
    backgroundColor: COLORS.lightRed,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 9,
    fontFamily: "PlusJakartaSans_700Bold",
  },
  details: {
    marginTop: 13,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 10,
    color: COLORS.gray,
    marginTop: 8,
  },
  detailValue: {
    fontSize: 11,
    color: COLORS.darkGreen,
    marginTop: 3,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 13,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  expandText: {
    fontSize: 10,
    color: COLORS.primary,
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  errorCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: COLORS.lightRed,
    alignItems: "center",
    gap: 8,
  },
  errorText: {
    color: COLORS.red,
    fontSize: 11,
    textAlign: "center",
  },
  retryText: {
    color: COLORS.darkGreen,
    fontSize: 12,
    fontWeight: "700",
  },
  emptyCard: {
    alignItems: "center",
    padding: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.veryLightGreen,
  },
  emptyTitle: {
    color: COLORS.darkGreen,
    fontSize: 14,
    fontFamily: "PlusJakartaSans_700Bold",
    marginTop: 12,
  },
  emptyText: {
    color: COLORS.gray,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 6,
  },
  footer: {
    textAlign: "center",
    color: COLORS.gray,
    fontSize: 9,
    marginTop: 20,
    letterSpacing: 0.5,
  },
});