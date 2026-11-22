
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { useLanguage } from "../context/LanguageContext";

const COLORS = {
  white: "#FFFFFF",
  darkGreen: "#123B25",
  primary: "#4F8F3A",
  lightGreen: "#E8F0B8",
  veryLightGreen: "#F7F9E9",
  gold: "#D9B83F",
  gray: "#808080",
  lightGray: "#F5F5F5",
  border: "#E5E9D2",
  red: "#D32F2F",
};

type AlertKey =
  | "device_disconnection"
  | "device_errors"
  | "low_battery"
  | "device_recovery"
  | "bird_detection";

type NotificationPreferences = Record<AlertKey, boolean>;

const DEFAULT_PREFERENCES: NotificationPreferences = {
  device_disconnection: true,
  device_errors: true,
  low_battery: true,
  device_recovery: true,
  bird_detection: true,
};

const NOTIFICATION_ITEMS: {
  key: AlertKey;
  titleKey:
    | "deviceDisconnectionTitle"
    | "deviceErrorsTitle"
    | "lowBatteryTitle"
    | "deviceRecoveryTitle"
    | "birdDetectionTitle";
  descriptionKey:
    | "getNotifiedWhenOffline"
    | "receiveDeviceErrors"
    | "lowBatteryDescription"
    | "deviceRecoveryDescription"
    | "birdDetectionDescription";
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    key: "device_disconnection",
    titleKey: "deviceDisconnectionTitle",
    descriptionKey: "getNotifiedWhenOffline",
    icon: "wifi-outline",
  },
  {
    key: "device_errors",
    titleKey: "deviceErrorsTitle",
    descriptionKey: "receiveDeviceErrors",
    icon: "alert-circle-outline",
  },
  {
    key: "low_battery",
    titleKey: "lowBatteryTitle",
    descriptionKey: "lowBatteryDescription",
    icon: "battery-half-outline",
  },
  {
    key: "device_recovery",
    titleKey: "deviceRecoveryTitle",
    descriptionKey: "deviceRecoveryDescription",
    icon: "checkmark-circle-outline",
  },
  {
    key: "bird_detection",
    titleKey: "birdDetectionTitle",
    descriptionKey: "birdDetectionDescription",
    icon: "eye-outline",
  },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { language, t, isLanguageReady } = useLanguage();

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("Administrator");

  const [preferences, setPreferences] =
    useState<NotificationPreferences>(DEFAULT_PREFERENCES);

  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<AlertKey | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        router.replace("/screens/LoginScreen");
        return;
      }

      setEmail(user.email ?? "");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      setFullName(profile?.full_name || "Administrator");

      const { data: savedPreferences, error } = await supabase
        .from("notification_preferences")
        .select(
          "device_disconnection, device_errors, low_battery, device_recovery, bird_detection"
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (savedPreferences) {
        setPreferences({
          device_disconnection:
            savedPreferences.device_disconnection ?? true,
          device_errors: savedPreferences.device_errors ?? true,
          low_battery: savedPreferences.low_battery ?? true,
          device_recovery: savedPreferences.device_recovery ?? true,
          bird_detection: savedPreferences.bird_detection ?? true,
        });
      } else {
        setPreferences(DEFAULT_PREFERENCES);
      }
    } catch (error: any) {
      console.error("Settings loading error:", error);

      Alert.alert(
        t("error"),
        error?.message || t("settingsLoadError")
      );
    } finally {
      setLoading(false);
    }
  }, [router, t]);

  useEffect(() => {
    if (isLanguageReady) {
      void loadSettings();
    }
  }, [loadSettings, isLanguageReady]);

  const toggleNotification = async (
    key: AlertKey,
    value: boolean
  ) => {
    if (savingKey !== null) return;

    const previousValue = preferences[key];

    const updatedPreferences = {
      ...preferences,
      [key]: value,
    };

    setPreferences(updatedPreferences);
    setSavingKey(key);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        throw new Error(t("adminSessionNotFound"));
      }

      const { error } = await supabase
        .from("notification_preferences")
        .upsert(
          {
            user_id: user.id,
            ...updatedPreferences,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

      if (error) throw error;
    } catch (error: any) {
      console.error("Notification update error:", error);

      setPreferences((current) => ({
        ...current,
        [key]: previousValue,
      }));

      Alert.alert(
        t("notificationUpdateFailed"),
        error?.message || t("notificationUpdateFailed")
      );
    } finally {
      setSavingKey(null);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t("logOut"),
      t("logoutConfirmation"),
      [
        {
          text: t("cancel"),
          style: "cancel",
        },
        {
          text: t("logOut"),
          style: "destructive",
          onPress: async () => {
            try {
              setLoggingOut(true);

              const { error } = await supabase.auth.signOut();

              if (error) throw error;

              router.replace("/screens/LoginScreen");
            } catch (error: any) {
              Alert.alert(
                t("logoutFailed"),
                error?.message || t("logoutFailed")
              );
            } finally {
              setLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  const openLanguageSettings = () => {
    router.push("/screens/LanguageSettings");
  };

  if (loading || !isLanguageReady) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
        />
        <Text style={styles.loadingText}>
          {t("loading")}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {t("settings")}
          </Text>

          <Text style={styles.headerSubtitle}>
            {t("settingsSubtitle")}
          </Text>
        </View>

        {/* Administrator Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("administratorAccount")}
          </Text>

          <View style={styles.accountCard}>
            <View style={styles.avatar}>
              <Ionicons
                name="person"
                size={27}
                color={COLORS.white}
              />
            </View>

            <View style={styles.accountInfo}>
              <Text style={styles.accountName}>
                {fullName}
              </Text>

              <Text style={styles.accountEmail}>
                {email || t("noActiveAccount")}
              </Text>

              <View style={styles.adminBadge}>
                <Ionicons
                  name="shield-checkmark"
                  size={12}
                  color={COLORS.primary}
                />

                <Text style={styles.adminBadgeText}>
                  {t("administrator")}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Language */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("language")}
          </Text>

          <TouchableOpacity
            style={styles.navigationCard}
            onPress={openLanguageSettings}
            activeOpacity={0.75}
          >
            <View style={styles.navigationIcon}>
              <Ionicons
                name="language-outline"
                size={22}
                color={COLORS.primary}
              />
            </View>

            <View style={styles.navigationInfo}>
              <Text style={styles.navigationTitle}>
                {t("appLanguage")}
              </Text>

              <Text style={styles.navigationSubtitle}>
                {t("choosePreferredLanguage")}
              </Text>
            </View>

            <View style={styles.languageValue}>
              <Text style={styles.languageValueText}>
                {language === "ceb" ? "Cebuano" : "English"}
              </Text>

              <Ionicons
                name="chevron-forward"
                size={18}
                color={COLORS.gray}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Notification Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("notificationPreferences")}
          </Text>

          <Text style={styles.sectionDescription}>
            {t("chooseScarecrowNotifications")}
          </Text>

          <View style={styles.notificationCard}>
            {NOTIFICATION_ITEMS.map((item, index) => (
              <React.Fragment key={item.key}>
                <View style={styles.notificationRow}>
                  <View style={styles.notificationIcon}>
                    <Ionicons
                      name={item.icon}
                      size={21}
                      color={COLORS.primary}
                    />
                  </View>

                  <View style={styles.notificationInfo}>
                    <Text style={styles.notificationTitle}>
                      {t(item.titleKey)}
                    </Text>

                    <Text style={styles.notificationDescription}>
                      {t(item.descriptionKey)}
                    </Text>
                  </View>

                  {savingKey === item.key ? (
                    <ActivityIndicator
                      size="small"
                      color={COLORS.primary}
                    />
                  ) : (
                    <Switch
                      value={preferences[item.key]}
                      disabled={savingKey !== null}
                      onValueChange={(value) =>
                        void toggleNotification(item.key, value)
                      }
                      trackColor={{
                        false: COLORS.border,
                        true: COLORS.lightGreen,
                      }}
                      thumbColor={
                        preferences[item.key]
                          ? COLORS.primary
                          : COLORS.gray
                      }
                      accessibilityLabel={t(item.titleKey)}
                    />
                  )}
                </View>

                {index !== NOTIFICATION_ITEMS.length - 1 && (
                  <View style={styles.separator} />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("about")}
          </Text>

          <View style={styles.aboutCard}>
            <View style={styles.aboutLogo}>
              <Image
                source={require("../../assets/images/app-icon.png")}
                style={styles.aboutLogoImage}
                resizeMode="contain"
              />
            </View>

            <View style={styles.aboutInfo}>
              <Text style={styles.aboutTitle}>
                {t("appName")}
              </Text>

              <Text style={styles.aboutSubtitle}>
                {t("smartCropProtectionSystem")}
              </Text>

              <Text style={styles.versionText}>
                {t("version")} 1.0
              </Text>
            </View>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={[
            styles.logoutButton,
            loggingOut && styles.logoutButtonDisabled,
          ]}
          onPress={handleLogout}
          disabled={loggingOut}
          activeOpacity={0.8}
        >
          {loggingOut ? (
            <ActivityIndicator
              size="small"
              color={COLORS.red}
            />
          ) : (
            <>
              <Ionicons
                name="log-out-outline"
                size={20}
                color={COLORS.red}
              />

              <Text style={styles.logoutText}>
                {t("logOut")}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.footerText}>
          {t("scarecrowAdminApplication")}
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
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.gray,
    fontSize: 13,
  },
  content: {
    padding: 20,
    paddingBottom: 110,
  },
  header: {
    marginBottom: 25,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: COLORS.darkGreen,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 5,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.darkGreen,
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 12,
    color: COLORS.gray,
    lineHeight: 18,
    marginTop: -5,
    marginBottom: 12,
  },
  accountCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: COLORS.veryLightGreen,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 13,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.darkGreen,
  },
  accountEmail: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 3,
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: COLORS.lightGreen,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 8,
    gap: 4,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.darkGreen,
  },
  navigationCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  navigationIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.veryLightGreen,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  navigationInfo: {
    flex: 1,
  },
  navigationTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.darkGreen,
  },
  navigationSubtitle: {
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 4,
  },
  languageValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  languageValueText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primary,
  },
  notificationCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
  },
  notificationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
  },
  notificationIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: COLORS.veryLightGreen,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },
  notificationInfo: {
    flex: 1,
    paddingRight: 8,
  },
  notificationTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.darkGreen,
  },
  notificationDescription: {
    fontSize: 10,
    color: COLORS.gray,
    marginTop: 4,
    lineHeight: 15,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  aboutCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 14,
    backgroundColor: COLORS.veryLightGreen,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  aboutLogo: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: COLORS.lightGreen,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  aboutLogoImage: {
  width: 38,
  height: 38,
  borderRadius: 8,
},

  aboutInfo: {
    flex: 1,
  },
  aboutTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.darkGreen,
  },
  aboutSubtitle: {
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 3,
  },
  versionText: {
    fontSize: 10,
    color: COLORS.primary,
    marginTop: 5,
    fontWeight: "600",
  },
  logoutButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    borderWidth: 1,
    borderColor: "#F2D5D5",
    backgroundColor: "#FFF8F8",
    borderRadius: 12,
    gap: 9,
    marginTop: 2,
  },
  logoutButtonDisabled: {
    opacity: 0.6,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.red,
  },
  footerText: {
    fontSize: 10,
    color: COLORS.gray,
    textAlign: "center",
    marginTop: 20,
  },
});