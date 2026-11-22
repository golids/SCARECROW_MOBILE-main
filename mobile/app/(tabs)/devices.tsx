import React from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useLanguage , TranslationKey } from "../context/LanguageContext";

import {
  Device as DbDevice,
  fetchDevices,
  fetchArchivedDevices,
  isRecentlyAlive,
  subscribeToDevices,
} from "../../lib/devices";

import { supabase } from "../../lib/supabase";

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

const PROTECTED_DEVICE_ID = "3c4e8cb6-8d71-4e8f-b00d-4cf833949d3d";

type FilterType = "All" | "Active" | "Inactive";
type ProtectedAction = "edit" | "archive";

type DeviceWithStatus = {
  device: DbDevice;
  isActive: boolean;
};

type DeviceForm = {
  name: string;
  location: string;
  ip_address: string;
  port: string;
  status: "online" | "offline";
};

const EMPTY_FORM: DeviceForm = {
  name: "",
  location: "",
  ip_address: "",
  port: "5000",
  status: "offline",
};

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

function formatLastSeen(
  value: string | null,
  t: (key: TranslationKey) => string
) {
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

  if (seconds < 172800) {
    return `${t("yesterday")}, ${date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    })}`;
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/* -------------------------------------------------------------------------- */
/*                              STAT CARD                                     */
/* -------------------------------------------------------------------------- */

function StatCard({
  icon,
  label,
  value,
  alert = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  alert?: boolean;
}) {
  return (
    <View style={styles.statCard}>
      <View
        style={[
          styles.statIcon,
          alert && value > 0 && styles.statIconAlert,
        ]}
      >
        <Ionicons
          name={icon}
          size={17}
          color={alert && value > 0 ? COLORS.red : COLORS.primary}
        />
      </View>

      <Text
        style={[
          styles.statValue,
          alert && value > 0 && styles.alertText,
        ]}
      >
        {value}
      </Text>

      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                              DEVICE CARD                                   */
/* -------------------------------------------------------------------------- */

function DeviceCard({
  device,
  isActive,
  isArchived = false,
  expanded,
  onPress,
  onEdit,
  onArchive,
}: {
  device: DbDevice;
  isActive: boolean;
  isArchived?: boolean;
  expanded: boolean;
  onPress: () => void;
  onEdit: () => void;
  onArchive: () => void;
}) {
  const { t } = useLanguage();
  const isProtected = device.id === PROTECTED_DEVICE_ID;

  return (
    <TouchableOpacity
      style={[
        styles.deviceCard,
        expanded && styles.deviceCardExpanded,
        isArchived && styles.archivedDeviceCard,
      ]}
      activeOpacity={0.75}
      onPress={onPress}
    >
      <View style={styles.deviceMain}>
        <View
          style={[
            styles.deviceIcon,
            (!isActive || isArchived) && styles.deviceIconInactive,
          ]}
        >
          <Ionicons
            name="hardware-chip-outline"
            size={27}
            color={isActive && !isArchived ? COLORS.primary : COLORS.gray}
          />
        </View>

        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName} numberOfLines={1}>
            {device.name || t("unnamedDevice")}
          </Text>

          <View style={styles.locationRow}>
            <Ionicons
              name="location-outline"
              size={12}
              color={COLORS.gray}
            />
            <Text style={styles.locationText} numberOfLines={1}>
              {device.location || t("locationMissing")}
            </Text>
          </View>

          <View style={styles.lastSeenRow}>
            <View
              style={[
                styles.statusDot,
                (!isActive || isArchived) && styles.statusDotInactive,
              ]}
            />
            <Text
              style={[
                styles.lastSeenText,
                (!isActive || isArchived) && styles.inactiveText,
              ]}
            >
              {isArchived
                ? t("archivedDevice")
                : formatLastSeen(device.last_seen, t)}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.statusBadge,
            isArchived
              ? styles.archivedBadge
              : isActive
                ? styles.activeBadge
                : styles.inactiveBadge,
          ]}
        >
          <Text
            style={[
              styles.statusBadgeText,
              isArchived
                ? styles.archivedBadgeText
                : isActive
                  ? styles.activeBadgeText
                  : styles.inactiveBadgeText,
            ]}
          >
            {isArchived
              ? t("archived")
              : isActive
                ? t("active")
                : t("inactive")}
          </Text>
        </View>

        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={COLORS.primary}
        />
      </View>

      {expanded && (
        <View style={styles.deviceDetails}>
          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <View style={styles.detailLabel}>
              <Ionicons name="location-outline" size={15} color={COLORS.gray} />
              <Text style={styles.detailLabelText}>{t("location")}</Text>
            </View>
            <Text style={styles.detailValue}>
              {device.location || t("notSet")}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailLabel}>
              <Ionicons name="wifi-outline" size={15} color={COLORS.gray} />
              <Text style={styles.detailLabelText}>{t("ipAddress")}</Text>
            </View>
            <Text style={styles.detailValue}>
              {device.ip_address || t("notConfigured")}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailLabel}>
              <Ionicons name="git-network-outline" size={15} color={COLORS.gray} />
              <Text style={styles.detailLabelText}>{t("port")}</Text>
            </View>
            <Text style={styles.detailValue}>
              {device.port ?? t("notConfigured")}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailLabel}>
              <Ionicons name="time-outline" size={15} color={COLORS.gray} />
              <Text style={styles.detailLabelText}>{t("lastHeartbeat")}</Text>
            </View>
            <Text style={styles.detailValue}>
              {formatLastSeen(device.last_seen, t)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailLabel}>
              <Ionicons
                name="hardware-chip-outline"
                size={15}
                color={COLORS.gray}
              />
              <Text style={styles.detailLabelText}>{t("deviceId")}</Text>
            </View>
            <Text style={styles.deviceId} numberOfLines={1}>
              {device.id}
            </Text>
          </View>

          {isArchived ? (
            <View style={styles.archivedNotice}>
              <Ionicons
                name="archive-outline"
                size={17}
                color={COLORS.gray}
              />
              <Text style={styles.archivedNoticeText}>
                {t("archivedDeviceNotice")}
              </Text>
            </View>
          ) : (
            !isActive && (
              <View style={styles.maintenanceNotice}>
                <Ionicons
                  name="heart-dislike-outline"
                  size={17}
                  color={COLORS.red}
                />
                <Text style={styles.maintenanceText}>
                  {t("inactiveDeviceNotice")}
                </Text>
              </View>
            )
          )}

          {isProtected && (
            <View style={styles.protectedNotice}>
              <Ionicons
                name="shield-checkmark-outline"
                size={17}
                color={COLORS.primary}
              />
              <Text style={styles.protectedText}>
                {t("protectedDeviceNotice")}
              </Text>
            </View>
          )}

          <View style={styles.deviceActions}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={onEdit}
              activeOpacity={0.8}
            >
              <Ionicons
                name="create-outline"
                size={17}
                color={COLORS.white}
              />
              <Text style={styles.editButtonText}>
                {t("editDevice")}
              </Text>
            </TouchableOpacity>

            {!isArchived && (
              <TouchableOpacity
                style={[
                  styles.archiveButton,
                  isProtected && styles.archiveButtonDisabled,
                ]}
                onPress={onArchive}
                disabled={isProtected}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="archive-outline"
                  size={17}
                  color={isProtected ? COLORS.gray : COLORS.red}
                />
                <Text
                  style={[
                    styles.archiveButtonText,
                    isProtected && styles.archiveButtonTextDisabled,
                  ]}
                >
                  {t("archive")}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

/* -------------------------------------------------------------------------- */
/*                              DEVICES SCREEN                                */
/* -------------------------------------------------------------------------- */

export default function DevicesScreen() {
  const { t } = useLanguage();

  const [devices, setDevices] = React.useState<DbDevice[]>([]);
  const [archivedDevices, setArchivedDevices] = React.useState<DbDevice[]>([]);

  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<FilterType>("All");

  const [expandedDeviceId, setExpandedDeviceId] =
    React.useState<string | null>(null);

  const [tick, setTick] = React.useState(0);

  /* ---------------------------- EDIT DEVICE STATE ------------------------- */

  const [editModalVisible, setEditModalVisible] = React.useState(false);
  const [editingDevice, setEditingDevice] =
    React.useState<DbDevice | null>(null);

  const [deviceForm, setDeviceForm] =
    React.useState<DeviceForm>(EMPTY_FORM);

  const [showEditPreview, setShowEditPreview] = React.useState(false);

  /* -------------------------- PASSWORD VERIFICATION ---------------------- */

  const [passwordModalVisible, setPasswordModalVisible] =
    React.useState(false);

  const [adminPassword, setAdminPassword] = React.useState("");

  const [protectedAction, setProtectedAction] =
    React.useState<ProtectedAction | null>(null);

  const [actionLoading, setActionLoading] = React.useState(false);

  /* ----------------------------- LOAD DEVICES ----------------------------- */

  const loadDevices = React.useCallback(async () => {
    try {
      setErrorMessage("");

      const [activeData, archivedData] = await Promise.all([
        fetchDevices(),
        fetchArchivedDevices(),
      ]);

      setDevices(activeData);
      setArchivedDevices(archivedData);
    } catch (error) {
      console.warn("Failed to load devices:", error);
      setErrorMessage(t("loadDevicesError"));
    }
  }, [t]);

  /* -------------------------- INITIAL LOAD + REALTIME -------------------- */

  React.useEffect(() => {
    let mounted = true;

    const loadInitial = async () => {
      try {
        const [activeData, archivedData] = await Promise.all([
          fetchDevices(),
          fetchArchivedDevices(),
        ]);

        if (mounted) {
          setDevices(activeData);
          setArchivedDevices(archivedData);
          setErrorMessage("");
        }
      } catch (error) {
        console.warn("Failed to load devices:", error);

        if (mounted) {
          setErrorMessage(t("loadDevicesError"));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadInitial();

    const unsubscribe = subscribeToDevices(() => {
      if (mounted) void loadDevices();
    });

    const timer = setInterval(() => {
      if (mounted) setTick((previous) => previous + 1);
    }, 15_000);

    return () => {
      mounted = false;
      unsubscribe();
      clearInterval(timer);
    };
  }, [loadDevices, t]);

  /* -------------------------------- REFRESH ------------------------------- */

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      await loadDevices();
    } finally {
      setRefreshing(false);
    }
  };

  /* ------------------------------ STATISTICS ------------------------------ */

  const activeCount = devices.filter((device) =>
    isRecentlyAlive(device)
  ).length;

  const inactiveCount = devices.length - activeCount;
  const totalCount = devices.length;

  /* ----------------------------- DEVICE FILTER ---------------------------- */

  const matchesSearch = React.useCallback(
    (device: DbDevice) => {
      const query = search.trim().toLowerCase();

      return (
        !query ||
        device.name?.toLowerCase().includes(query) ||
        device.location?.toLowerCase().includes(query) ||
        device.ip_address?.toLowerCase().includes(query)
      );
    },
    [search]
  );

  const filteredDevices = React.useMemo<DeviceWithStatus[]>(() => {
    return devices
      .map((device) => ({
        device,
        isActive: isRecentlyAlive(device),
      }))
      .filter(({ device, isActive }) => {
        const matchesFilter =
          filter === "All" ||
          (filter === "Active" && isActive) ||
          (filter === "Inactive" && !isActive);

        return matchesSearch(device) && matchesFilter;
      })
      .sort((a, b) => {
        if (a.isActive !== b.isActive) {
          return a.isActive ? 1 : -1;
        }

        return a.device.name.localeCompare(b.device.name);
      });
  }, [devices, matchesSearch, filter, tick]);

  const filteredArchivedDevices = React.useMemo(() => {
    return archivedDevices
      .filter(matchesSearch)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [archivedDevices, matchesSearch]);

  /* ------------------------------- EDIT SETUP ----------------------------- */

  const openEditModal = (device: DbDevice) => {
    setEditingDevice(device);

    setDeviceForm({
      name: device.name || "",
      location: device.location || "",
      ip_address: device.ip_address || "",
      port: String(device.port ?? 5000),
      status: device.status === "online" ? "online" : "offline",
    });

    setShowEditPreview(false);
    setEditModalVisible(true);
  };

  const closeEditModal = () => {
    if (actionLoading) return;

    setEditModalVisible(false);
    setEditingDevice(null);
    setDeviceForm(EMPTY_FORM);
    setShowEditPreview(false);
  };

  const updateFormField = (key: keyof DeviceForm, value: string) => {
    setDeviceForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const validateDeviceForm = () => {
    if (!deviceForm.name.trim()) {
      Alert.alert(t("requiredField"), t("enterDeviceName"));
      return false;
    }

    if (!deviceForm.location.trim()) {
      Alert.alert(t("requiredField"), t("enterDeviceLocation"));
      return false;
    }

    const port = Number(deviceForm.port);

    if (
      !deviceForm.port.trim() ||
      !Number.isInteger(port) ||
      port < 1 ||
      port > 65535
    ) {
      Alert.alert(t("invalidPort"), t("validPortMessage"));
      return false;
    }

    return true;
  };

  const requestEditConfirmation = () => {
    if (!editingDevice || !validateDeviceForm()) return;

    setShowEditPreview(true);
  };

  const requestEditPassword = () => {
    if (!editingDevice) return;

    setProtectedAction("edit");
    setAdminPassword("");
    setPasswordModalVisible(true);
  };

  /* ------------------------------ ARCHIVE SETUP --------------------------- */

  const requestArchive = (device: DbDevice) => {
    if (device.id === PROTECTED_DEVICE_ID) {
      Alert.alert(t("protectedDevice"), t("cannotArchivePrimary"));
      return;
    }

    Alert.alert(
      t("archiveDeviceQuestion"),
      `${t("archiveDeviceMessage")} "${device.name}".\n\n${t("archiveDeviceDescription")}`,
      [
        {
          text: t("cancel"),
          style: "cancel",
        },
        {
          text: t("continue"),
          onPress: () => {
            Alert.alert(
              t("finalConfirmation"),
              `${t("confirmArchiveMessage")} "${device.name}"?\n\n${t("adminVerificationRequired")}`,
              [
                {
                  text: t("goBack"),
                  style: "cancel",
                },
                {
                  text: t("proceed"),
                  style: "destructive",
                  onPress: () => {
                    setEditingDevice(device);
                    setProtectedAction("archive");
                    setAdminPassword("");
                    setPasswordModalVisible(true);
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  /* ---------------------------- PASSWORD ACTION --------------------------- */

  const closePasswordModal = () => {
    if (actionLoading) return;

    setPasswordModalVisible(false);
    setAdminPassword("");
    setProtectedAction(null);
  };

  const executeProtectedAction = async () => {
    if (!adminPassword.trim()) {
      Alert.alert(t("passwordRequired"), t("enterAdminPassword"));
      return;
    }

    if (!editingDevice || !protectedAction) {
      Alert.alert(t("error"), t("unableDeviceAction"));
      return;
    }

    if (
      protectedAction === "archive" &&
      editingDevice.id === PROTECTED_DEVICE_ID
    ) {
      Alert.alert(t("protectedDevice"), t("cannotArchivePrimary"));
      return;
    }

    setActionLoading(true);

    try {
      let operation: "edit" | "archive";
      let payload: Record<string, unknown> | undefined;

      if (protectedAction === "edit") {
        const port = Number(deviceForm.port);

        operation = "edit";

        payload = {
          name: deviceForm.name.trim(),
          location: deviceForm.location.trim(),
          ip_address: deviceForm.ip_address.trim() || null,
          port,
          status: deviceForm.status,
        };
      } else {
        operation = "archive";
      }

      const { data, error } = await supabase.functions.invoke(
        "manage-device",
        {
          body: {
            password: adminPassword,
            operation,
            deviceId: editingDevice.id,
            ...(payload ? { payload } : {}),
          },
        }
      );

      if (error) throw error;

      if (!data?.success) {
        throw new Error(
          data?.error ||
            data?.message ||
            t("deviceOperationFailed")
        );
      }

      setPasswordModalVisible(false);
      setEditModalVisible(false);
      setAdminPassword("");
      setProtectedAction(null);
      setEditingDevice(null);
      setDeviceForm(EMPTY_FORM);
      setShowEditPreview(false);
      setExpandedDeviceId(null);

      await loadDevices();

      if (operation === "edit") {
        Alert.alert(
          t("deviceUpdated"),
          editingDevice.is_archived
            ? t("archivedDeviceUpdated")
            : t("deviceUpdatedMessage")
        );
      } else {
        Alert.alert(
          t("deviceArchived"),
          t("deviceArchivedMessage")
        );
      }
    } catch (error: any) {
      console.warn("Device operation failed:", error);

      Alert.alert(
        t("actionFailed"),
        error?.message || t("deviceOperationTryAgain")
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /*                                   UI                                     */
  /* ------------------------------------------------------------------------ */

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{t("devices")}</Text>
            <Text style={styles.subtitle}>{t("monitorDevices")}</Text>
          </View>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={refreshing}
            activeOpacity={0.8}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Ionicons name="refresh" size={21} color={COLORS.white} />
            )}
          </TouchableOpacity>
        </View>

        {/* STATISTICS */}
        <View style={styles.statsContainer}>
          <StatCard
            icon="hardware-chip-outline"
            label={t("totalDevices")}
            value={totalCount}
          />

          <View style={styles.statDivider} />

          <StatCard
            icon="checkmark-circle-outline"
            label={t("active")}
            value={activeCount}
          />

          <View style={styles.statDivider} />

          <StatCard
            icon="heart-dislike-outline"
            label={t("inactive")}
            value={inactiveCount}
            alert
          />
        </View>

        {/* REGISTERED DEVICES */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                {t("registeredDevices")}
              </Text>
              <Text style={styles.sectionSubtitle}>
                {filteredDevices.length}{" "}
                {filteredDevices.length === 1
                  ? t("device")
                  : t("devices")}{" "}
                {t("found")}
              </Text>
            </View>

            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>{t("live")}</Text>
            </View>
          </View>

          {/* SEARCH */}
          <View style={styles.searchContainer}>
            <Ionicons
              name="search-outline"
              size={19}
              color={COLORS.gray}
            />

            <TextInput
              style={styles.searchInput}
              placeholder={t("searchDevices")}
              placeholderTextColor="#A0A0A0"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />

            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons
                  name="close-circle"
                  size={19}
                  color={COLORS.gray}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* FILTERS */}
          <View style={styles.filterRow}>
            {(["All", "Active", "Inactive"] as FilterType[]).map((item) => {
              const selected = filter === item;

              const label =
                item === "All"
                  ? t("all")
                  : item === "Active"
                    ? t("active")
                    : t("inactive");

              return (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.filterChip,
                    selected && styles.filterChipSelected,
                  ]}
                  onPress={() => setFilter(item)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.filterText,
                      selected && styles.filterTextSelected,
                    ]}
                  >
                    {label}
                  </Text>

                  <Text
                    style={[
                      styles.filterCount,
                      selected && styles.filterCountSelected,
                    ]}
                  >
                    {item === "All"
                      ? devices.length
                      : item === "Active"
                        ? activeCount
                        : inactiveCount}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* LOADING */}
          {loading && (
            <View style={styles.messageBox}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.messageText}>
                {t("loadingDevices")}
              </Text>
            </View>
          )}

          {/* ERROR */}
          {!loading && errorMessage.length > 0 && (
            <View style={styles.errorBox}>
              <Ionicons
                name="alert-circle-outline"
                size={25}
                color={COLORS.red}
              />

              <Text style={styles.errorText}>{errorMessage}</Text>

              <TouchableOpacity
                style={styles.retryButton}
                onPress={handleRefresh}
              >
                <Text style={styles.retryText}>{t("tryAgain")}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* EMPTY ACTIVE DATABASE */}
          {!loading &&
            !errorMessage &&
            devices.length === 0 &&
            archivedDevices.length === 0 && (
              <View style={styles.emptyBox}>
                <View style={styles.emptyIcon}>
                  <Ionicons
                    name="hardware-chip-outline"
                    size={30}
                    color={COLORS.gray}
                  />
                </View>

                <Text style={styles.emptyTitle}>
                  {t("noDevicesRegistered")}
                </Text>

                <Text style={styles.emptyDescription}>
                  {t("noDevicesRegisteredDescription")}
                </Text>
              </View>
            )}

          {/* NO ACTIVE DEVICES */}
          {!loading &&
            !errorMessage &&
            devices.length === 0 &&
            archivedDevices.length > 0 && (
              <View style={styles.emptyBox}>
                <Ionicons
                  name="hardware-chip-outline"
                  size={30}
                  color={COLORS.gray}
                />
                <Text style={styles.emptyTitle}>
                  {t("noActiveDevices")}
                </Text>
                <Text style={styles.emptyDescription}>
                  {t("noActiveDevicesDescription")}
                </Text>
              </View>
            )}

          {/* NO SEARCH RESULTS */}
          {!loading &&
            !errorMessage &&
            devices.length > 0 &&
            filteredDevices.length === 0 && (
              <View style={styles.emptyBox}>
                <Ionicons
                  name="search-outline"
                  size={30}
                  color={COLORS.gray}
                />

                <Text style={styles.emptyTitle}>
                  {t("noMatchingDevices")}
                </Text>

                <Text style={styles.emptyDescription}>
                  {t("changeDeviceFilter")}
                </Text>

                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => {
                    setSearch("");
                    setFilter("All");
                  }}
                >
                  <Text style={styles.clearButtonText}>
                    {t("clearFilters")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

          {/* ACTIVE DEVICE CARDS */}
          {!loading &&
            !errorMessage &&
            filteredDevices.map(({ device, isActive }) => (
              <DeviceCard
                key={device.id}
                device={device}
                isActive={isActive}
                expanded={expandedDeviceId === device.id}
                onPress={() =>
                  setExpandedDeviceId((current) =>
                    current === device.id ? null : device.id
                  )
                }
                onEdit={() => openEditModal(device)}
                onArchive={() => requestArchive(device)}
              />
            ))}
        </View>

        {/* FOOTER */}
        {!loading && totalCount > 0 && (
          <View style={styles.footerInfo}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={COLORS.gray}
            />
            <Text style={styles.footerText}>
              {t("deviceStatusExplanation")}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ------------------------------------------------------------------ */}
      {/*                         EDIT DEVICE MODAL                          */}
      {/* ------------------------------------------------------------------ */}

      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeEditModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {editingDevice?.is_archived
                    ? t("editArchivedDevice")
                    : t("editDevice")}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {t("editDeviceDescription")}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={closeEditModal}
                disabled={actionLoading}
              >
                <Ionicons name="close" size={21} color={COLORS.darkGreen} />
              </TouchableOpacity>
            </View>

            {editingDevice?.is_archived && (
              <View style={styles.archivedEditNotice}>
                <Ionicons
                  name="archive-outline"
                  size={17}
                  color={COLORS.gray}
                />
                <Text style={styles.archivedEditNoticeText}>
                  {t("archivedEditNotice")}
                </Text>
              </View>
            )}

            {!showEditPreview ? (
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.inputLabel}>{t("deviceName")}</Text>
                <TextInput
                  style={styles.formInput}
                  value={deviceForm.name}
                  onChangeText={(value) => updateFormField("name", value)}
                  placeholder={t("enterDeviceNamePlaceholder")}
                  placeholderTextColor="#A0A0A0"
                />

                <Text style={styles.inputLabel}>{t("location")}</Text>
                <TextInput
                  style={styles.formInput}
                  value={deviceForm.location}
                  onChangeText={(value) => updateFormField("location", value)}
                  placeholder={t("enterFieldLocation")}
                  placeholderTextColor="#A0A0A0"
                />

                <Text style={styles.inputLabel}>{t("ipAddress")}</Text>
                <TextInput
                  style={styles.formInput}
                  value={deviceForm.ip_address}
                  onChangeText={(value) =>
                    updateFormField("ip_address", value)
                  }
                  placeholder={t("enterIpAddress")}
                  placeholderTextColor="#A0A0A0"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="numbers-and-punctuation"
                />

                <Text style={styles.inputLabel}>{t("port")}</Text>
                <TextInput
                  style={styles.formInput}
                  value={deviceForm.port}
                  onChangeText={(value) => updateFormField("port", value)}
                  placeholder="5000"
                  placeholderTextColor="#A0A0A0"
                  keyboardType="number-pad"
                />

                <Text style={styles.inputLabel}>{t("deviceStatus")}</Text>
                <View style={styles.statusOptions}>
                  {(["online", "offline"] as const).map((status) => {
                    const selected = deviceForm.status === status;

                    return (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.statusOption,
                          selected && styles.statusOptionSelected,
                        ]}
                        onPress={() => updateFormField("status", status)}
                      >
                        <Text
                          style={[
                            styles.statusOptionText,
                            selected && styles.statusOptionTextSelected,
                          ]}
                        >
                          {status === "online"
                            ? t("online")
                            : t("offline")}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.formNotice}>
                  <Ionicons
                    name="information-circle-outline"
                    size={17}
                    color={COLORS.primary}
                  />
                  <Text style={styles.formNoticeText}>
                    {t("reviewDeviceChangesNotice")}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.primaryModalButton}
                  onPress={requestEditConfirmation}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryModalButtonText}>
                    {t("reviewChanges")}
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={17}
                    color={COLORS.white}
                  />
                </TouchableOpacity>
              </ScrollView>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.previewNotice}>
                  <Ionicons
                    name="eye-outline"
                    size={20}
                    color={COLORS.primary}
                  />
                  <Text style={styles.previewNoticeText}>
                    {t("reviewUpdatedInformation")}
                  </Text>
                </View>

                {[
                  [t("deviceName"), deviceForm.name],
                  [t("location"), deviceForm.location],
                  [
                    t("ipAddress"),
                    deviceForm.ip_address || t("notConfigured"),
                  ],
                  [t("port"), deviceForm.port],
                  [
                    t("deviceStatus"),
                    deviceForm.status === "online"
                      ? t("online")
                      : t("offline"),
                  ],
                  ...(editingDevice?.is_archived
                    ? [[t("archiveStatus"), t("remainsArchived")]]
                    : []),
                ].map(([label, value]) => (
                  <View style={styles.previewRow} key={label}>
                    <Text style={styles.previewLabel}>{label}</Text>
                    <Text style={styles.previewValue}>{value}</Text>
                  </View>
                ))}

                <View style={styles.previewActions}>
                  <TouchableOpacity
                    style={styles.secondaryModalButton}
                    onPress={() => setShowEditPreview(false)}
                  >
                    <Text style={styles.secondaryModalButtonText}>
                      {t("goBack")}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.primaryModalButton}
                    onPress={requestEditPassword}
                  >
                    <Text style={styles.primaryModalButtonText}>
                      {t("confirmEdit")}
                    </Text>
                    <Ionicons
                      name="checkmark"
                      size={17}
                      color={COLORS.white}
                    />
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ------------------------------------------------------------------ */}
      {/*                       ADMIN PASSWORD MODAL                         */}
      {/* ------------------------------------------------------------------ */}

      <Modal
        visible={passwordModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closePasswordModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.passwordModal}>
            <View style={styles.passwordIcon}>
              <Ionicons
                name="shield-checkmark-outline"
                size={29}
                color={COLORS.primary}
              />
            </View>

            <Text style={styles.passwordTitle}>
              {t("adminVerification")}
            </Text>

            <Text style={styles.passwordDescription}>
              {protectedAction === "edit"
                ? t("verifyEditDescription")
                : t("verifyArchiveDescription")}
            </Text>

            <TextInput
              style={styles.formInput}
              value={adminPassword}
              onChangeText={setAdminPassword}
              placeholder={t("enterAdminPasswordPlaceholder")}
              placeholderTextColor="#A0A0A0"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!actionLoading}
            />

            <TouchableOpacity
              style={[
                styles.primaryModalButton,
                actionLoading && styles.disabledButton,
              ]}
              onPress={executeProtectedAction}
              disabled={actionLoading}
              activeOpacity={0.8}
            >
              {actionLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Text style={styles.primaryModalButtonText}>
                    {protectedAction === "edit"
                      ? t("verifyAndSave")
                      : t("verifyAndArchive")}
                  </Text>
                  <Ionicons
                    name="lock-closed-outline"
                    size={16}
                    color={COLORS.white}
                  />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelPasswordButton}
              onPress={closePasswordModal}
              disabled={actionLoading}
            >
              <Text style={styles.cancelPasswordText}>
                {t("cancel")}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 120,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
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
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
    color: COLORS.gray,
    marginTop: 3,
  },
  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.darkGreen,
    marginLeft: 12,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 5,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
  },
  statIcon: {
    width: 33,
    height: 33,
    borderRadius: 17,
    backgroundColor: COLORS.veryLightGreen,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
  },
  statIconAlert: {
    backgroundColor: COLORS.lightRed,
  },
  statValue: {
    fontSize: 21,
    fontFamily: "PlusJakartaSans_700Bold",
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: "PlusJakartaSans_500Medium",
    color: COLORS.gray,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 45,
    backgroundColor: COLORS.border,
  },
  alertText: {
    color: COLORS.red,
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "PlusJakartaSans_700Bold",
    color: COLORS.darkGreen,
  },
  sectionSubtitle: {
    fontSize: 11,
    fontFamily: "PlusJakartaSans_400Regular",
    color: COLORS.gray,
    marginTop: 3,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.veryLightGreen,
    borderRadius: 15,
    paddingHorizontal: 9,
    paddingVertical: 5,
    gap: 5,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  liveText: {
    fontSize: 10,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: COLORS.primary,
  },
  searchContainer: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.lightGray,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    gap: 9,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
    color: COLORS.darkGreen,
    paddingVertical: 0,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 15,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  filterChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 11,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: COLORS.gray,
  },
  filterTextSelected: {
    color: COLORS.white,
  },
  filterCount: {
    fontSize: 10,
    fontFamily: "PlusJakartaSans_700Bold",
    color: COLORS.primary,
  },
  filterCountSelected: {
    color: COLORS.white,
  },
  deviceCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 11,
    padding: 11,
    marginBottom: 10,
  },
  deviceCardExpanded: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.veryLightGreen,
  },
  archivedDeviceCard: {
    backgroundColor: "#FAFAFA",
  },
  deviceMain: {
    flexDirection: "row",
    alignItems: "center",
  },
  deviceIcon: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: COLORS.veryLightGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  deviceIconInactive: {
    backgroundColor: COLORS.lightGray,
  },
  deviceInfo: {
    flex: 1,
    marginLeft: 11,
    marginRight: 5,
  },
  deviceName: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_700Bold",
    color: COLORS.darkGreen,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
    gap: 3,
  },
  locationText: {
    flex: 1,
    fontSize: 10,
    fontFamily: "PlusJakartaSans_400Regular",
    color: COLORS.gray,
  },
  lastSeenRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    gap: 5,
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
  lastSeenText: {
    fontSize: 10,
    fontFamily: "PlusJakartaSans_500Medium",
    color: COLORS.primary,
  },
  inactiveText: {
    color: COLORS.gray,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 7,
  },
  activeBadge: {
    backgroundColor: COLORS.veryLightGreen,
    borderColor: COLORS.primary,
  },
  inactiveBadge: {
    backgroundColor: COLORS.lightGray,
    borderColor: COLORS.border,
  },
  archivedBadge: {
    backgroundColor: COLORS.lightGray,
    borderColor: COLORS.border,
  },
  statusBadgeText: {
    fontSize: 9,
    fontFamily: "PlusJakartaSans_700Bold",
  },
  activeBadgeText: {
    color: COLORS.primary,
  },
  inactiveBadgeText: {
    color: COLORS.gray,
  },
  archivedBadgeText: {
    color: COLORS.gray,
  },
  deviceDetails: {
    marginTop: 10,
  },
  detailDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 7,
    gap: 10,
  },
  detailLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  detailLabelText: {
    fontSize: 11,
    fontFamily: "PlusJakartaSans_500Medium",
    color: COLORS.gray,
  },
  detailValue: {
    flex: 1,
    textAlign: "right",
    fontSize: 11,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: COLORS.darkGreen,
  },
  deviceId: {
    flex: 1,
    textAlign: "right",
    fontSize: 9,
    fontFamily: "PlusJakartaSans_400Regular",
    color: COLORS.gray,
  },
  maintenanceNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.lightRed,
    borderRadius: 8,
    padding: 10,
    marginTop: 9,
    gap: 7,
  },
  maintenanceText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 15,
    fontFamily: "PlusJakartaSans_500Medium",
    color: COLORS.red,
  },
  protectedNotice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.veryLightGreen,
    borderRadius: 8,
    padding: 10,
    marginTop: 9,
    gap: 7,
  },
  protectedText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 15,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: COLORS.primary,
  },
  archivedNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 10,
    marginTop: 9,
    gap: 7,
  },
  archivedNoticeText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 15,
    fontFamily: "PlusJakartaSans_500Medium",
    color: COLORS.gray,
  },
  deviceActions: {
    flexDirection: "row",
    gap: 9,
    marginTop: 13,
  },
  editButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 10,
  },
  editButtonText: {
    fontSize: 11,
    fontFamily: "PlusJakartaSans_700Bold",
    color: COLORS.white,
  },
  archiveButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
    backgroundColor: COLORS.lightRed,
    borderWidth: 1,
    borderColor: "#F4C7C3",
    borderRadius: 8,
    paddingVertical: 10,
  },
  archiveButtonDisabled: {
    backgroundColor: COLORS.lightGray,
    borderColor: COLORS.border,
  },
  archiveButtonText: {
    fontSize: 11,
    fontFamily: "PlusJakartaSans_700Bold",
    color: COLORS.red,
  },
  archiveButtonTextDisabled: {
    color: COLORS.gray,
  },
  archivedSection: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: 14,
    marginTop: 15,
  },
  archivedHeaderText: {
    flex: 1,
  },
  archivedTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  archivedCountBadge: {
    minWidth: 29,
    height: 29,
    borderRadius: 15,
    backgroundColor: COLORS.lightGray,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  archivedCountText: {
    fontSize: 11,
    fontFamily: "PlusJakartaSans_700Bold",
    color: COLORS.gray,
  },
  archivedEmptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 25,
    paddingHorizontal: 15,
    backgroundColor: COLORS.lightGray,
    borderRadius: 10,
  },
  archivedEmptyTitle: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_700Bold",
    color: COLORS.darkGreen,
    marginTop: 9,
  },
  archivedEmptyDescription: {
    fontSize: 10,
    lineHeight: 15,
    fontFamily: "PlusJakartaSans_400Regular",
    color: COLORS.gray,
    textAlign: "center",
    marginTop: 5,
  },
  archivedEditNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.lightGray,
    borderRadius: 9,
    padding: 11,
    marginBottom: 5,
    gap: 8,
  },
  archivedEditNoticeText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 15,
    fontFamily: "PlusJakartaSans_500Medium",
    color: COLORS.gray,
  },
  messageBox: {
    minHeight: 150,
    alignItems: "center",
    justifyContent: "center",
  },
  messageText: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
    color: COLORS.gray,
    marginTop: 10,
  },
  errorBox: {
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
    backgroundColor: COLORS.lightRed,
    borderRadius: 10,
  },
  errorText: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "PlusJakartaSans_400Regular",
    color: COLORS.red,
    textAlign: "center",
    marginTop: 8,
  },
  retryButton: {
    backgroundColor: COLORS.red,
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginTop: 12,
  },
  retryText: {
    fontSize: 11,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: COLORS.white,
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 30,
    backgroundColor: COLORS.lightGray,
    borderRadius: 10,
  },
  emptyIcon: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_700Bold",
    color: COLORS.darkGreen,
    marginTop: 8,
  },
  emptyDescription: {
    fontSize: 11,
    lineHeight: 17,
    fontFamily: "PlusJakartaSans_400Regular",
    color: COLORS.gray,
    textAlign: "center",
    marginTop: 5,
  },
  clearButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginTop: 14,
  },
  clearButtonText: {
    fontSize: 11,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: COLORS.white,
  },
  footerInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    marginTop: 13,
    paddingHorizontal: 3,
  },
  footerText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 15,
    fontFamily: "PlusJakartaSans_400Regular",
    color: COLORS.gray,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
  },
  modalContainer: {
    width: "100%",
    maxHeight: "90%",
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 19,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 19,
    fontFamily: "PlusJakartaSans_700Bold",
    color: COLORS.darkGreen,
  },
  modalSubtitle: {
    fontSize: 11,
    fontFamily: "PlusJakartaSans_400Regular",
    color: COLORS.gray,
    marginTop: 3,
  },
  modalCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.lightGray,
    alignItems: "center",
    justifyContent: "center",
  },
  inputLabel: {
    fontSize: 11,
    fontFamily: "PlusJakartaSans_700Bold",
    color: COLORS.darkGreen,
    marginBottom: 7,
    marginTop: 12,
  },
  formInput: {
    height: 45,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 9,
    paddingHorizontal: 12,
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
    color: COLORS.darkGreen,
    backgroundColor: COLORS.white,
  },
  statusOptions: {
    flexDirection: "row",
    gap: 10,
  },
  statusOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 9,
    paddingVertical: 11,
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  statusOptionSelected: {
    backgroundColor: COLORS.veryLightGreen,
    borderColor: COLORS.primary,
  },
  statusOptionText: {
    fontSize: 11,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: COLORS.gray,
  },
  statusOptionTextSelected: {
    color: COLORS.primary,
  },
  formNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.veryLightGreen,
    borderRadius: 9,
    padding: 11,
    marginTop: 18,
    gap: 8,
  },
  formNoticeText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 15,
    fontFamily: "PlusJakartaSans_400Regular",
    color: COLORS.darkGreen,
  },
  primaryModalButton: {
    flex: 1,
    minHeight: 45,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginTop: 18,
  },
  primaryModalButtonText: {
    fontSize: 11,
    fontFamily: "PlusJakartaSans_700Bold",
    color: COLORS.white,
  },
  previewNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.veryLightGreen,
    padding: 11,
    borderRadius: 9,
    marginBottom: 13,
  },
  previewNoticeText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 15,
    fontFamily: "PlusJakartaSans_400Regular",
    color: COLORS.darkGreen,
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 10,
  },
  previewLabel: {
    flex: 1,
    fontSize: 11,
    fontFamily: "PlusJakartaSans_500Medium",
    color: COLORS.gray,
  },
  previewValue: {
    flex: 1,
    textAlign: "right",
    fontSize: 11,
    fontFamily: "PlusJakartaSans_700Bold",
    color: COLORS.darkGreen,
  },
  previewActions: {
    flexDirection: "row",
    gap: 9,
    marginTop: 5,
  },
  secondaryModalButton: {
    flex: 1,
    minHeight: 45,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 9,
    marginTop: 18,
    paddingHorizontal: 10,
  },
  secondaryModalButtonText: {
    fontSize: 11,
    fontFamily: "PlusJakartaSans_700Bold",
    color: COLORS.darkGreen,
  },
  passwordModal: {
    width: "100%",
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 22,
    alignItems: "center",
  },
  passwordIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.veryLightGreen,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 13,
  },
  passwordTitle: {
    fontSize: 17,
    fontFamily: "PlusJakartaSans_700Bold",
    color: COLORS.darkGreen,
    textAlign: "center",
  },
  passwordDescription: {
    fontSize: 11,
    lineHeight: 17,
    fontFamily: "PlusJakartaSans_400Regular",
    color: COLORS.gray,
    textAlign: "center",
    marginTop: 7,
    marginBottom: 16,
  },
  cancelPasswordButton: {
    paddingVertical: 12,
  },
  cancelPasswordText: {
    fontSize: 11,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: COLORS.gray,
  },
  disabledButton: {
    opacity: 0.6,
  },
});