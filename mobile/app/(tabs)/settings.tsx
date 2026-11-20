
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Switch,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";

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

type AlertKey =
  | "deviceDisconnection"
  | "deviceErrors"
  | "lowBattery"
  | "deviceRecovery"
  | "birdDetection";

type Profile = {
  full_name: string | null;
  contact_number: string | null;
  province: string | null;
  municipality: string | null;
  barangay: string | null;
};

type Device = {
  id: string;
  name: string;
  location: string | null;
  ip_address: string | null;
  port: number | null;
  status: "online" | "offline";
  last_seen?: string | null;
  is_locked: boolean;
  is_archived: boolean;
};

type DeviceForm = {
  name: string;
  location: string;
  ip_address: string;
  port: string;
  status: "online" | "offline";
};

type DeviceOperation = "create" | "edit" | "archive";

const ALERT_PREFERENCES: {
  key: AlertKey;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    key: "deviceDisconnection",
    title: "Device Disconnection",
    description: "When a device stops communicating with the system.",
    icon: "cloud-offline-outline",
  },
  {
    key: "deviceErrors",
    title: "Device Errors",
    description: "When a device reports an error or malfunction.",
    icon: "alert-circle-outline",
  },
  {
    key: "lowBattery",
    title: "Low Battery",
    description: "When a device reports a low battery level.",
    icon: "battery-dead-outline",
  },
  {
    key: "deviceRecovery",
    title: "Device Reconnected",
    description: "When an offline device reconnects.",
    icon: "wifi-outline",
  },
  {
    key: "birdDetection",
    title: "Bird Detection Activity",
    description: "When a device records a bird detection event.",
    icon: "eye-outline",
  },
];

const ALERT_DATABASE_COLUMNS: Record<AlertKey, string> = {
  deviceDisconnection: "device_disconnection",
  deviceErrors: "device_errors",
  lowBattery: "low_battery",
  deviceRecovery: "device_recovery",
  birdDetection: "bird_detection",
};

// Field Scarecrow #1 is protected from archiving.
const PROTECTED_DEVICE_ID =
  "3c4e8cb6-8d71-4e8f-b00d-4cf833949d3d";

const EMPTY_FORM: DeviceForm = {
  name: "",
  location: "",
  ip_address: "",
  port: "",
  status: "offline",
};

export default function SettingsScreen() {
  const { section, t } = useLocalSearchParams<{
    section?: string;
    t?: string;
  }>();

  const router = useRouter();

  const scrollRef = React.useRef<ScrollView>(null);
  const deviceSectionY = React.useRef(0);
  const handledNav = React.useRef("");

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [email, setEmail] = React.useState<string | null>(null);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [devices, setDevices] = React.useState<Device[]>([]);

  const [notificationsOpen, setNotificationsOpen] = React.useState(true);
  const [deviceConfigOpen, setDeviceConfigOpen] = React.useState(true);
  const [accountOpen, setAccountOpen] = React.useState(true);

  const [alertSettings, setAlertSettings] = React.useState<
    Record<AlertKey, boolean>
  >({
    deviceDisconnection: true,
    deviceErrors: true,
    lowBattery: true,
    deviceRecovery: true,
    birdDetection: false,
  });

  const [preferencesSaving, setPreferencesSaving] =
    React.useState<AlertKey | null>(null);

  // Add/Edit device modal
  const [modalVisible, setModalVisible] = React.useState(false);
  const [previewVisible, setPreviewVisible] = React.useState(false);
  const [editingDevice, setEditingDevice] =
    React.useState<Device | null>(null);
  const [form, setForm] = React.useState<DeviceForm>(EMPTY_FORM);

  // Administrator verification modal
  const [passwordModalVisible, setPasswordModalVisible] =
    React.useState(false);
  const [adminPassword, setAdminPassword] = React.useState("");

  const [pendingOperation, setPendingOperation] =
    React.useState<DeviceOperation | null>(null);
  const [pendingDeviceId, setPendingDeviceId] =
    React.useState<string | null>(null);
  const [pendingPayload, setPendingPayload] =
    React.useState<Record<string, unknown> | null>(null);
  const [pendingDeviceName, setPendingDeviceName] = React.useState("");

  /* ---------------------------- Load Supabase ---------------------------- */

  const loadData = React.useCallback(async () => {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      setEmail(user?.email ?? null);

      if (!user) {
        setProfile(null);
        setDevices([]);
        return;
      }

      const [
        profileResult,
        devicesResult,
        preferencesResult,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "full_name, contact_number, province, municipality, barangay"
          )
          .eq("id", user.id)
          .maybeSingle(),

        supabase
          .from("devices")
          .select(
            "id, name, location, ip_address, port, status, last_seen, is_locked, is_archived"
          )
          .eq("is_archived", false)
          .order("name", { ascending: true }),

        supabase
          .from("notification_preferences")
          .select(
            "device_disconnection, device_errors, low_battery, device_recovery, bird_detection"
          )
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      if (profileResult.error) throw profileResult.error;
      if (devicesResult.error) throw devicesResult.error;
      if (preferencesResult.error) throw preferencesResult.error;

      setProfile(profileResult.data as Profile | null);
      setDevices((devicesResult.data ?? []) as Device[]);

      if (preferencesResult.data) {
        setAlertSettings({
          deviceDisconnection:
            preferencesResult.data.device_disconnection,
          deviceErrors: preferencesResult.data.device_errors,
          lowBattery: preferencesResult.data.low_battery,
          deviceRecovery: preferencesResult.data.device_recovery,
          birdDetection: preferencesResult.data.bird_detection,
        });
      }
    } catch (error: any) {
      Alert.alert(
        "Unable to Load Settings",
        error?.message || "Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadData();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadData();
    });

    return () => subscription.unsubscribe();
  }, [loadData]);

  /* ------------------ Focus Device Management from Home ----------------- */

  React.useEffect(() => {
    if (loading || section !== "devices") return;

    const navKey = `${section}-${t ?? ""}`;

    if (handledNav.current === navKey) return;

    handledNav.current = navKey;

    setAccountOpen(false);
    setNotificationsOpen(false);
    setDeviceConfigOpen(true);

    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(deviceSectionY.current - 20, 0),
        animated: true,
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [section, t, loading]);

  /* ------------------------- Notification Preferences -------------------- */

  const toggleAlert = async (key: AlertKey, value: boolean) => {
    if (preferencesSaving) return;

    const previousValue = alertSettings[key];

    setAlertSettings((current) => ({
      ...current,
      [key]: value,
    }));

    setPreferencesSaving(key);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error("Please log in again.");

      const column = ALERT_DATABASE_COLUMNS[key];

      const { error } = await supabase
        .from("notification_preferences")
        .upsert(
          {
            user_id: user.id,
            [column]: value,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

      if (error) throw error;
    } catch (error: any) {
      setAlertSettings((current) => ({
        ...current,
        [key]: previousValue,
      }));

      Alert.alert(
        "Notification Update Failed",
        error?.message || "Could not save this preference."
      );
    } finally {
      setPreferencesSaving(null);
    }
  };

  /* --------------------------- Device Management ------------------------- */

  const openAddDevice = () => {
    setEditingDevice(null);
    setForm(EMPTY_FORM);
    setPreviewVisible(false);
    setModalVisible(true);
  };

  const openEditDevice = (device: Device) => {
    setEditingDevice(device);

    setForm({
      name: device.name ?? "",
      location: device.location ?? "",
      ip_address: device.ip_address ?? "",
      port: device.port == null ? "" : String(device.port),
      status: device.status === "online" ? "online" : "offline",
    });

    setPreviewVisible(false);
    setModalVisible(true);
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      Alert.alert("Device Name Required", "Enter a name for this device.");
      return false;
    }

    if (!form.location.trim()) {
      Alert.alert(
        "Field Location Required",
        "Please enter the device's field location."
      );
      return false;
    }

    if (
      form.port.trim() &&
      (!/^\d+$/.test(form.port.trim()) ||
        Number(form.port) < 1 ||
        Number(form.port) > 65535)
    ) {
      Alert.alert("Invalid Port", "Enter a port between 1 and 65535.");
      return false;
    }

    return true;
  };

  const showPreview = () => {
    if (!validateForm()) return;
    setPreviewVisible(true);
  };

  const requestDeviceOperation = (
    operation: "create" | "edit",
    deviceId: string | null,
    payload: Record<string, unknown>
  ) => {
    setPendingOperation(operation);
    setPendingDeviceId(deviceId);
    setPendingPayload(payload);
    setPendingDeviceName(form.name.trim());
    setAdminPassword("");
    setPasswordModalVisible(true);
  };

  const saveDevice = () => {
    if (!validateForm()) {
      setPreviewVisible(false);
      return;
    }

    const payload = {
      name: form.name.trim(),
      location: form.location.trim(),
      ip_address: form.ip_address.trim() || null,
      port: form.port.trim() ? Number(form.port) : 5000,
      status: form.status,
    };

    requestDeviceOperation(
      editingDevice ? "edit" : "create",
      editingDevice?.id ?? null,
      payload
    );
  };

  const requestArchiveDevice = (device: Device) => {
    if (device.id === PROTECTED_DEVICE_ID) {
      Alert.alert(
        "Protected Device",
        "Field Scarecrow #1 is your primary field device and cannot be archived."
      );
      return;
    }

    Alert.alert(
      "Archive Device?",
      `You selected "${device.name}". Archiving will remove it from the active device list, but its detection history will be preserved.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          onPress: () => {
            Alert.alert(
              "Final Confirmation",
              `Are you sure you want to archive "${device.name}"?`,
              [
                { text: "Keep Device", style: "cancel" },
                {
                  text: "Archive Device",
                  style: "destructive",
                  onPress: () => {
                    setPendingOperation("archive");
                    setPendingDeviceId(device.id);
                    setPendingPayload({});
                    setPendingDeviceName(device.name);
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

  const executeDeviceOperation = async () => {
    if (!pendingOperation) return;

    if (!adminPassword.trim()) {
      Alert.alert(
        "Password Required",
        "Enter your administrator password to continue."
      );
      return;
    }

    setSaving(true);

    try {
      const {
        data: { session },
        error: authError,
      } = await supabase.auth.getSession();

      if (authError) throw authError;

      if (!session) {
        throw new Error("Your session has expired. Please log in again.");
      }

      const { data, error } = await supabase.functions.invoke(
        "manage-device",
        {
          body: {
            password: adminPassword,
            operation: pendingOperation,
            deviceId: pendingDeviceId,
            payload: pendingPayload ?? {},
          },
        }
      );

      if (error) {
        let message = error.message;

        try {
          const response = (error as any).context;

          if (response && typeof response.json === "function") {
            const body = await response.json();
            message = body?.error || message;
          }
        } catch {
          // Use the original function error message.
        }

        throw new Error(message);
      }

      if (!data?.success) {
        throw new Error(
          data?.error || "The operation was not completed."
        );
      }

      const completedOperation = pendingOperation;
      const completedName = pendingDeviceName;

      setPasswordModalVisible(false);
      setAdminPassword("");
      setPendingOperation(null);
      setPendingDeviceId(null);
      setPendingPayload(null);
      setPendingDeviceName("");

      setModalVisible(false);
      setPreviewVisible(false);
      setEditingDevice(null);
      setForm(EMPTY_FORM);

      await loadData();

      Alert.alert(
        "Operation Successful",
        completedOperation === "archive"
          ? `"${completedName}" has been archived. Its detection history is preserved.`
          : completedOperation === "edit"
            ? `"${completedName}" has been updated.`
            : `"${completedName}" has been added.`
      );
    } catch (error: any) {
      Alert.alert(
        "Device Operation Failed",
        error?.message || "The operation could not be completed."
      );
    } finally {
      setSaving(false);
      setAdminPassword("");
    }
  };

  const cancelPasswordVerification = () => {
    if (saving) return;

    setPasswordModalVisible(false);
    setAdminPassword("");
    setPendingOperation(null);
    setPendingDeviceId(null);
    setPendingPayload(null);
    setPendingDeviceName("");
  };

  /* -------------------------------- Logout ------------------------------- */

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          setSaving(true);

          try {
            const { error } = await supabase.auth.signOut();

            if (error) throw error;

            router.replace("/screens/LoginScreen");
          } catch (error: any) {
            Alert.alert(
              "Logout Failed",
              error?.message || "Please try again."
            );
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  /* --------------------------- Section Header ---------------------------- */

  const renderSectionHeader = (
    icon: keyof typeof Ionicons.glyphMap,
    title: string,
    subtitle: string,
    open: boolean,
    onPress: () => void
  ) => (
    <TouchableOpacity
      style={styles.sectionHeading}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${open ? "collapse" : "expand"} section`}
    >
      <View style={styles.settingIconWrap}>
        <Ionicons name={icon} size={19} color={COLORS.primary} />
      </View>

      <View style={styles.sectionHeadingText}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      </View>

      <Ionicons
        name={open ? "chevron-up" : "chevron-down"}
        size={18}
        color={COLORS.primary}
      />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={["top"]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </SafeAreaView>
    );
  }

  /* -------------------------------- Screen ------------------------------- */

  return (
    <View style={styles.background}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Settings</Text>
              <Text style={styles.headerSubtitle}>
                Admin and maintenance preferences
              </Text>
            </View>
          </View>

          {/* Admin Account */}
          <View style={styles.section}>
            {renderSectionHeader(
              "person-outline",
              "Admin Account",
              "Profile details from your account",
              accountOpen,
              () => setAccountOpen((value) => !value)
            )}

            {accountOpen && (
              <>
                <View style={styles.divider} />

                <View style={styles.accountRow}>
                  <View style={styles.avatar}>
                    <Ionicons
                      name="person"
                      size={22}
                      color={COLORS.primary}
                    />
                  </View>

                  <View style={styles.accountText}>
                    <Text style={styles.accountLabel}>Email</Text>
                    <Text style={styles.accountEmail}>
                      {email || "No active account"}
                    </Text>

                    <View style={styles.adminBadge}>
                      <View style={styles.statusDot} />
                      <Text style={styles.adminBadgeText}>
                        Administrator
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.profileField}>
                  <Text style={styles.fieldLabel}>Full Name</Text>
                  <Text style={styles.fieldValue}>
                    {profile?.full_name || "Not provided"}
                  </Text>
                </View>

                <View style={styles.profileField}>
                  <Text style={styles.fieldLabel}>Contact Number</Text>
                  <Text style={styles.fieldValue}>
                    {profile?.contact_number || "Not provided"}
                  </Text>
                </View>

                <View style={styles.profileField}>
                  <Text style={styles.fieldLabel}>Barangay</Text>
                  <Text style={styles.fieldValue}>
                    {profile?.barangay || "Not provided"}
                  </Text>
                </View>

                <View style={styles.profileField}>
                  <Text style={styles.fieldLabel}>Municipality</Text>
                  <Text style={styles.fieldValue}>
                    {profile?.municipality || "Not provided"}
                  </Text>
                </View>

                <View style={styles.profileField}>
                  <Text style={styles.fieldLabel}>Province</Text>
                  <Text style={styles.fieldValue}>
                    {profile?.province || "Not provided"}
                  </Text>
                </View>

                {!profile && (
                  <Text style={styles.helperText}>
                    No profile record was found for this account.
                  </Text>
                )}
              </>
            )}
          </View>

          {/* Notifications */}
          <View style={styles.section}>
            {renderSectionHeader(
              "notifications-outline",
              "Notifications",
              "Choose which device events to alert on",
              notificationsOpen,
              () => setNotificationsOpen((value) => !value)
            )}

            {notificationsOpen && (
              <>
                <View style={styles.divider} />

                <View style={styles.infoBanner}>
                  <Ionicons
                    name="information-circle-outline"
                    size={18}
                    color={COLORS.primary}
                  />
                  <Text style={styles.infoBannerText}>
                    Your notification preferences are saved to Supabase and
                    will be retained when you reopen the application.
                  </Text>
                </View>

                {ALERT_PREFERENCES.map((preference, index) => (
                  <View key={preference.key}>
                    <View style={styles.alertRow}>
                      <View style={styles.alertIconWrap}>
                        <Ionicons
                          name={preference.icon}
                          size={19}
                          color={COLORS.primary}
                        />
                      </View>

                      <View style={styles.alertText}>
                        <Text style={styles.alertTitle}>
                          {preference.title}
                        </Text>
                        <Text style={styles.alertDescription}>
                          {preference.description}
                        </Text>
                      </View>

                      <View style={styles.toggleWrap}>
                        <Switch
                          value={alertSettings[preference.key]}
                          disabled={preferencesSaving !== null}
                          onValueChange={(value) =>
                            void toggleAlert(preference.key, value)
                          }
                          trackColor={{
                            false: "#D9D9D9",
                            true: COLORS.lightGreen,
                          }}
                          thumbColor={
                            alertSettings[preference.key]
                              ? COLORS.primary
                              : "#F4F3F4"
                          }
                          ios_backgroundColor="#D9D9D9"
                          accessibilityLabel={`${preference.title} alerts`}
                        />

                        <Text
                          style={[
                            styles.toggleLabel,
                            alertSettings[preference.key] &&
                              styles.toggleLabelActive,
                          ]}
                        >
                          {preferencesSaving === preference.key
                            ? "Saving..."
                            : alertSettings[preference.key]
                              ? "Enabled"
                              : "Off"}
                        </Text>
                      </View>
                    </View>

                    {index < ALERT_PREFERENCES.length - 1 && (
                      <View style={styles.innerDivider} />
                    )}
                  </View>
                ))}
              </>
            )}
          </View>

          {/* Device Management */}
          <View
            style={styles.section}
            onLayout={(e) => {
              deviceSectionY.current = e.nativeEvent.layout.y;
            }}
          >
            {renderSectionHeader(
              "hardware-chip-outline",
              "Device Management",
              "Create, edit, and archive registered devices",
              deviceConfigOpen,
              () => setDeviceConfigOpen((value) => !value)
            )}

            {deviceConfigOpen && (
              <>
                <View style={styles.divider} />

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={openAddDevice}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={19}
                    color={COLORS.white}
                  />
                  <Text style={styles.primaryButtonText}>Add Device</Text>
                </TouchableOpacity>

                <Text style={styles.deviceCount}>
                  {devices.length} registered{" "}
                  {devices.length === 1 ? "device" : "devices"}
                </Text>

                {devices.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons
                      name="hardware-chip-outline"
                      size={30}
                      color={COLORS.primary}
                    />
                    <Text style={styles.emptyTitle}>No devices found</Text>
                    <Text style={styles.emptyText}>
                      Add a device to register it in Supabase.
                    </Text>
                  </View>
                ) : (
                  devices.map((device) => (
                    <View key={device.id} style={styles.deviceCard}>
                      <View style={styles.deviceHeader}>
                        <View style={styles.deviceIcon}>
                          <Ionicons
                            name="hardware-chip-outline"
                            size={21}
                            color={COLORS.primary}
                          />
                        </View>

                        <View style={styles.deviceHeadingText}>
                          <Text style={styles.deviceName}>
                            {device.name}
                          </Text>
                          <Text style={styles.deviceLocation}>
                            {device.location || "No location provided"}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.statusBadge,
                            device.status === "online"
                              ? styles.onlineBadge
                              : styles.offlineBadge,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              {
                                color:
                                  device.status === "online"
                                    ? COLORS.primary
                                    : COLORS.red,
                              },
                            ]}
                          >
                            {device.status || "offline"}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.deviceDetails}>
                        <Text style={styles.deviceDetailText}>
                          IP: {device.ip_address || "Not set"}
                        </Text>
                        <Text style={styles.deviceDetailText}>
                          Port: {device.port ?? "Not set"}
                        </Text>
                      </View>

                      <View style={styles.deviceActions}>
                        <TouchableOpacity
                          style={styles.editButton}
                          onPress={() => openEditDevice(device)}
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name="create-outline"
                            size={17}
                            color={COLORS.darkGreen}
                          />
                          <Text style={styles.editButtonText}>Edit</Text>
                        </TouchableOpacity>

                        {device.id !== PROTECTED_DEVICE_ID && (
                          <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => requestArchiveDevice(device)}
                            activeOpacity={0.8}
                          >
                            <Ionicons
                              name="archive-outline"
                              size={17}
                              color={COLORS.red}
                            />
                            <Text style={styles.deleteButtonText}>
                              Archive
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))
                )}

                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={() => {
                    setLoading(true);
                    void loadData();
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="refresh-outline"
                    size={17}
                    color={COLORS.primary}
                  />
                  <Text style={styles.refreshButtonText}>
                    Refresh Devices
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Maintenance */}
          <View style={styles.section}>
            <View style={styles.staticSectionHeading}>
              <View style={styles.settingIconWrap}>
                <Ionicons
                  name="construct-outline"
                  size={19}
                  color={COLORS.primary}
                />
              </View>
              <View style={styles.sectionHeadingText}>
                <Text style={styles.sectionTitle}>Maintenance</Text>
                <Text style={styles.sectionSubtitle}>
                  Field inspections and repairs
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.maintenanceNote}>
              <Ionicons
                name="clipboard-outline"
                size={20}
                color={COLORS.primary}
              />
              <Text style={styles.maintenanceNoteText}>
                Record inspection and repair history in your maintenance
                records or activity logs. This section does not save
                maintenance notes to Supabase yet.
              </Text>
            </View>
          </View>

          {/* About */}
          <View style={styles.section}>
            <View style={styles.aboutRow}>
              <View style={styles.settingIconWrap}>
                <Ionicons
                  name="information-circle-outline"
                  size={19}
                  color={COLORS.primary}
                />
              </View>
              <View style={styles.sectionHeadingText}>
                <Text style={styles.sectionTitle}>About ScareCROW</Text>
                <Text style={styles.sectionSubtitle}>
                  Admin device monitoring application
                </Text>
              </View>
              <Text style={styles.versionText}>v1.0</Text>
            </View>
          </View>

          {/* Logout */}
          <View style={styles.logoutContainer}>
            <TouchableOpacity
              style={[
                styles.logoutButton,
                saving && styles.logoutButtonDisabled,
              ]}
              onPress={handleLogout}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator color={COLORS.darkGreen} size="small" />
              ) : (
                <>
                  <Ionicons
                    name="log-out-outline"
                    size={23}
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

      {/* Add/Edit Device Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (saving) return;
          setModalVisible(false);
          setPreviewVisible(false);
        }}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>
                  {previewVisible
                    ? "Review Device Details"
                    : editingDevice
                      ? "Edit Device"
                      : "Add Device"}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {previewVisible
                    ? "Review the details before saving."
                    : "Enter the registered device information."}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => {
                  if (saving) return;
                  setModalVisible(false);
                  setPreviewVisible(false);
                }}
                style={styles.closeButton}
                accessibilityLabel="Close device form"
                disabled={saving}
              >
                <Ionicons
                  name="close"
                  size={22}
                  color={COLORS.darkGreen}
                />
              </TouchableOpacity>
            </View>

            {!previewVisible ? (
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.inputLabel}>Device Name *</Text>
                <TextInput
                  value={form.name}
                  onChangeText={(value) =>
                    setForm((current) => ({ ...current, name: value }))
                  }
                  placeholder="e.g. SCARECROW Field 01"
                  placeholderTextColor="#9A9A9A"
                  style={styles.textInput}
                />

                <Text style={styles.inputLabel}>Field Location *</Text>
                <TextInput
                  value={form.location}
                  onChangeText={(value) =>
                    setForm((current) => ({ ...current, location: value }))
                  }
                  placeholder="Barangay, municipality, province"
                  placeholderTextColor="#9A9A9A"
                  style={styles.textInput}
                />

                <Text style={styles.inputLabel}>IP Address</Text>
                <TextInput
                  value={form.ip_address}
                  onChangeText={(value) =>
                    setForm((current) => ({
                      ...current,
                      ip_address: value,
                    }))
                  }
                  placeholder="e.g. 192.168.1.50"
                  placeholderTextColor="#9A9A9A"
                  autoCapitalize="none"
                  keyboardType="decimal-pad"
                  style={styles.textInput}
                />

                <Text style={styles.inputLabel}>Port</Text>
                <TextInput
                  value={form.port}
                  onChangeText={(value) =>
                    setForm((current) => ({
                      ...current,
                      port: value.replace(/[^0-9]/g, ""),
                    }))
                  }
                  placeholder="e.g. 8000"
                  placeholderTextColor="#9A9A9A"
                  keyboardType="number-pad"
                  style={styles.textInput}
                />

                <Text style={styles.inputLabel}>Device Status</Text>
                <View style={styles.statusOptions}>
                  {(["online", "offline"] as const).map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.statusOption,
                        form.status === status &&
                          styles.statusOptionSelected,
                      ]}
                      onPress={() =>
                        setForm((current) => ({ ...current, status }))
                      }
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={
                          status === "online"
                            ? "checkmark-circle-outline"
                            : "cloud-offline-outline"
                        }
                        size={17}
                        color={
                          form.status === status
                            ? COLORS.white
                            : COLORS.darkGreen
                        }
                      />
                      <Text
                        style={[
                          styles.statusOptionText,
                          form.status === status &&
                            styles.statusOptionTextSelected,
                        ]}
                      >
                        {status === "online" ? "Online" : "Offline"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={showPreview}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="eye-outline"
                    size={18}
                    color={COLORS.white}
                  />
                  <Text style={styles.primaryButtonText}>
                    Preview Details
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {[
                  ["Device Name", form.name],
                  ["Location", form.location],
                  ["IP Address", form.ip_address || "Not set"],
                  ["Port", form.port || "5000 (default)"],
                  ["Status", form.status],
                ].map(([label, value]) => (
                  <View key={label} style={styles.previewRow}>
                    <Text style={styles.fieldLabel}>{label}</Text>
                    <Text style={styles.fieldValue}>{value}</Text>
                  </View>
                ))}

                <View style={styles.infoBanner}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={COLORS.primary}
                  />
                  <Text style={styles.infoBannerText}>
                    Administrator password verification will be required
                    before this change is submitted.
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={saveDevice}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={19}
                    color={COLORS.white}
                  />
                  <Text style={styles.primaryButtonText}>
                    {editingDevice
                      ? "Continue to Verification"
                      : "Continue to Verification"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => setPreviewVisible(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryButtonText}>
                    Back to Edit
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Administrator Password Verification */}
      <Modal
        visible={passwordModalVisible}
        transparent
        animationType="fade"
        onRequestClose={cancelPasswordVerification}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>
                  Administrator Verification
                </Text>
                <Text style={styles.modalSubtitle}>
                  Enter your password to authorize this operation.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                disabled={saving}
                onPress={cancelPasswordVerification}
              >
                <Ionicons
                  name="close"
                  size={22}
                  color={COLORS.darkGreen}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.infoBanner}>
              <Ionicons
                name="shield-checkmark-outline"
                size={19}
                color={COLORS.primary}
              />
              <Text style={styles.infoBannerText}>
                {pendingOperation === "archive"
                  ? `You are authorizing the archive of "${pendingDeviceName}".`
                  : pendingOperation === "edit"
                    ? `You are authorizing changes to "${pendingDeviceName}".`
                    : `You are authorizing the creation of "${pendingDeviceName}".`}
                {" "}Your password will not be stored.
              </Text>
            </View>

            <Text style={styles.inputLabel}>
              Administrator Password
            </Text>

            <TextInput
              value={adminPassword}
              onChangeText={setAdminPassword}
              placeholder="Enter your current password"
              placeholderTextColor="#9A9A9A"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!saving}
              style={styles.textInput}
              onSubmitEditing={() => void executeDeviceOperation()}
              returnKeyType="done"
            />

            <TouchableOpacity
              style={[
                styles.primaryButton,
                saving && styles.buttonDisabled,
              ]}
              onPress={() => void executeDeviceOperation()}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={COLORS.white}
                  />
                  <Text style={styles.primaryButtonText}>
                    Verify and Confirm
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              disabled={saving}
              onPress={cancelPasswordVerification}
            >
              <Text style={styles.secondaryButtonText}>
                Cancel Operation
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

/* -------------------------------- STYLES -------------------------------- */

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
  },
  loadingText: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 10,
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
    color: COLORS.darkGreen,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
    color: COLORS.gray,
    marginTop: 2,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    borderWidth: 1.5,
    borderColor: COLORS.darkGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    marginBottom: 14,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    overflow: "hidden",
    padding: 14,
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 46,
  },
  staticSectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 46,
  },
  sectionHeadingText: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: COLORS.darkGreen,
  },
  sectionSubtitle: {
    fontSize: 11,
    fontFamily: "PlusJakartaSans_400Regular",
    color: COLORS.gray,
    marginTop: 2,
  },
  settingIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.veryLightGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginTop: 12,
    marginBottom: 4,
  },
  innerDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 48,
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 2,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.veryLightGreen,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  accountText: {
    flex: 1,
    marginLeft: 12,
  },
  accountLabel: {
    fontSize: 11,
    fontFamily: "PlusJakartaSans_400Regular",
    color: COLORS.gray,
  },
  accountEmail: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: COLORS.darkGreen,
    marginTop: 2,
  },
  adminBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.veryLightGreen,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 7,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginRight: 5,
  },
  adminBadgeText: {
    fontSize: 10,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: COLORS.darkGreen,
  },
  profileField: {
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  fieldLabel: {
    fontSize: 10,
    fontFamily: "PlusJakartaSans_400Regular",
    color: COLORS.gray,
  },
  fieldValue: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: COLORS.darkGreen,
    marginTop: 4,
  },
  helperText: {
    fontSize: 10,
    color: COLORS.gray,
    lineHeight: 15,
    marginTop: 8,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.veryLightGreen,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    marginBottom: 6,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 15,
    fontFamily: "PlusJakartaSans_400Regular",
    color: COLORS.darkGreen,
    marginLeft: 8,
  },
  alertRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  alertIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.veryLightGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  alertText: {
    flex: 1,
    marginLeft: 10,
    marginRight: 6,
  },
  alertTitle: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: COLORS.darkGreen,
  },
  alertDescription: {
    fontSize: 10,
    lineHeight: 14,
    fontFamily: "PlusJakartaSans_400Regular",
    color: COLORS.gray,
    marginTop: 3,
  },
  toggleWrap: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 58,
  },
  toggleLabel: {
    fontSize: 9,
    fontFamily: "PlusJakartaSans_500Medium",
    color: COLORS.gray,
    marginTop: 1,
  },
  toggleLabelActive: {
    color: COLORS.primary,
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  primaryButton: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.darkGreen,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 14,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: COLORS.white,
  },
  deviceCount: {
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 14,
    marginBottom: 4,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    gap: 7,
  },
  emptyTitle: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: COLORS.darkGreen,
  },
  emptyText: {
    fontSize: 11,
    color: COLORS.gray,
    textAlign: "center",
    lineHeight: 16,
  },
  deviceCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  deviceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  deviceIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.veryLightGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  deviceHeadingText: {
    flex: 1,
  },
  deviceName: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: COLORS.darkGreen,
  },
  deviceLocation: {
    fontSize: 10,
    color: COLORS.gray,
    marginTop: 3,
  },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  onlineBadge: {
    backgroundColor: COLORS.veryLightGreen,
  },
  offlineBadge: {
    backgroundColor: COLORS.lightRed,
  },
  statusBadgeText: {
    fontSize: 9,
    fontFamily: "PlusJakartaSans_600SemiBold",
    textTransform: "capitalize",
  },
  deviceDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
  },
  deviceDetailText: {
    fontSize: 10,
    color: COLORS.gray,
  },
  deviceActions: {
    flexDirection: "row",
    gap: 9,
    marginTop: 12,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  editButtonText: {
    fontSize: 10,
    color: COLORS.darkGreen,
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: "#F4C7C3",
    backgroundColor: COLORS.lightRed,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  deleteButtonText: {
    fontSize: 10,
    color: COLORS.red,
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    marginTop: 4,
  },
  refreshButtonText: {
    fontSize: 11,
    color: COLORS.primary,
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  maintenanceNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingTop: 12,
    paddingBottom: 4,
  },
  maintenanceNoteText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: "PlusJakartaSans_400Regular",
    color: COLORS.gray,
    marginLeft: 10,
  },
  aboutRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
  },
  versionText: {
    fontSize: 11,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: COLORS.primary,
    backgroundColor: COLORS.veryLightGreen,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    overflow: "hidden",
  },
  logoutContainer: {
    marginTop: 4,
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
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  modalCard: {
    maxHeight: "88%",
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
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
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.veryLightGreen,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: COLORS.darkGreen,
    marginBottom: 7,
    marginTop: 10,
  },
  textInput: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 13,
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
    minHeight: 42,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  statusOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.darkGreen,
  },
  statusOptionText: {
    fontSize: 11,
    color: COLORS.darkGreen,
    fontFamily: "PlusJakartaSans_600SemiBold",
    textTransform: "capitalize",
  },
  statusOptionTextSelected: {
    color: COLORS.white,
  },
  previewRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  secondaryButton: {
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  secondaryButtonText: {
    fontSize: 11,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: COLORS.darkGreen,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
});