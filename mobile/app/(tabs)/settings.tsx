import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Switch,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import {
  User,
  SquarePen,
  WifiOff,
  CircleAlert,
  CircleCheck,
  Languages,
  ChevronRight,
  Info,
  LogOut,
  X,
  Save,
  Sun,
  Moon,
  type LucideIcon,
} from "lucide-react-native";

import {
  useTheme,
  type ThemeColors,
} from "../../context/ThemeContext";

import { useRouter } from "expo-router";

import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  useLanguage,
  type TranslationKey,
} from "../context/LanguageContext";

import { supabase } from "../../lib/supabase";

/* TYPES */

type AlertKey =
  | "device_disconnection"
  | "device_errors"
  | "device_recovery";

type Preferences = Record<AlertKey, boolean>;

interface Profile {
  id: string;
  full_name: string | null;
  contact_number: string | null;
  province: string | null;
  municipality: string | null;
  barangay: string | null;
}

/* DEFAULT PREFERENCES */

const DEFAULT_PREFERENCES: Preferences = {
  device_disconnection: true,
  device_errors: true,
  device_recovery: true,
};

const NOTIFICATION_ITEMS: {
  key: AlertKey;
  title: TranslationKey;
  description: TranslationKey;
  icon: LucideIcon;
}[] = [
  {
    key: "device_disconnection",
    title: "deviceDisconnection",
    description: "deviceDisconnectionDescription",
    icon: WifiOff,
  },
  {
    key: "device_errors",
    title: "deviceErrors",
    description: "deviceErrorsDescription",
    icon: CircleAlert,
  },
  {
    key: "device_recovery",
    title: "deviceRecoveryTitle",
    description: "deviceRecoveryDescription",
    icon: CircleCheck,
  },
];

/* SETTINGS SCREEN */

export default function SettingsScreen() {
  const router = useRouter();

  const { t, isLanguageReady } = useLanguage();

  const insets = useSafeAreaInsets();

  const {
    colors: COLORS,
    isDark,
    isThemeReady,
    changeTheme,
  } = useTheme();

  const styles = React.useMemo(
    () => createStyles(COLORS),
    [COLORS]
  );

  const [savingTheme, setSavingTheme] =
    useState(false);

  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  const [loading, setLoading] = useState(true);

  const [savingProfile, setSavingProfile] =
    useState(false);

  const [savingPreference, setSavingPreference] =
    useState<AlertKey | null>(null);

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [email, setEmail] = useState("");

  const [preferences, setPreferences] =
    useState<Preferences>(DEFAULT_PREFERENCES);

  const [editModalVisible, setEditModalVisible] =
    useState(false);

  const [fullName, setFullName] = useState("");

  const [contactNumber, setContactNumber] =
    useState("");

  const [province, setProvince] = useState("");

  const [municipality, setMunicipality] =
    useState("");

  const [barangay, setBarangay] = useState("");

  /* DARK MODE */

  const updateTheme = async (enabled: boolean) => {
    if (savingTheme) return;

    setSavingTheme(true);

    try {
      await changeTheme(
        enabled ? "dark" : "light"
      );
    } catch (error) {
      console.error(
        "Theme update error:",
        error
      );

      Alert.alert(
        t("updateFailed"),
        t("themeSaveFailed")
      );
    } finally {
      setSavingTheme(false);
    }
  };

  /* LOAD SETTINGS */

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

      /* LOAD PROFILE */

      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select(
          "id, full_name, contact_number, province, municipality, barangay"
        )
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (profileData) {
        const loadedProfile =
          profileData as Profile;

        setProfile(loadedProfile);

        setFullName(
          loadedProfile.full_name ?? ""
        );

        setContactNumber(
          loadedProfile.contact_number ?? ""
        );

        setProvince(
          loadedProfile.province ?? ""
        );

        setMunicipality(
          loadedProfile.municipality ?? ""
        );

        setBarangay(
          loadedProfile.barangay ?? ""
        );
      } else {
        setProfile(null);
      }

      /* LOAD NOTIFICATION PREFERENCES */

      const {
        data: preferenceData,
        error: preferenceError,
      } = await supabase
        .from("notification_preferences")
        .select(
          "device_disconnection, device_errors, device_recovery"
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (preferenceError) {
        throw preferenceError;
      }

      if (preferenceData) {
        setPreferences({
          device_disconnection:
            preferenceData.device_disconnection ??
            true,

          device_errors:
            preferenceData.device_errors ??
            true,

          device_recovery:
            preferenceData.device_recovery ??
            true,
        });
      } else {
        setPreferences(DEFAULT_PREFERENCES);
      }
    } catch (error) {
      console.error(
        "Settings loading error:",
        error
      );

      Alert.alert(
        t("settingsLoadTitle"),
        t("tryLater")
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

  /* EDIT PROFILE */

  const openEditProfile = () => {
    setFullName(profile?.full_name ?? "");

    setContactNumber(
      profile?.contact_number ?? ""
    );

    setProvince(profile?.province ?? "");

    setMunicipality(
      profile?.municipality ?? ""
    );

    setBarangay(profile?.barangay ?? "");

    setEditModalVisible(true);
  };

  const closeEditProfile = () => {
    if (savingProfile) return;

    setEditModalVisible(false);
  };

  /* SAVE PROFILE */

  const saveProfile = async () => {
    if (savingProfile) return;

    if (!fullName.trim()) {
      Alert.alert(
        t("missingInformation"),
        t("enterFullName")
      );

      return;
    }

    try {
      setSavingProfile(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        Alert.alert(
          t("sessionExpired"),
          t("loginAgain")
        );

        router.replace("/screens/LoginScreen");

        return;
      }

      const updatedProfile = {
        full_name: fullName.trim(),

        contact_number:
          contactNumber.trim() || null,

        province:
          province.trim() || null,

        municipality:
          municipality.trim() || null,

        barangay:
          barangay.trim() || null,

        updated_at:
          new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("profiles")
        .update(updatedProfile)
        .eq("id", user.id)
        .select(
          "id, full_name, contact_number, province, municipality, barangay"
        )
        .maybeSingle();

      if (error) {
        console.error(
          "Supabase profile update error:",
          error
        );

        throw error;
      }

      if (!data) {
        throw new Error(
          t("profileNotUpdated")
        );
      }

      /* UPDATE AUTH METADATA */

      const { error: metadataError } =
        await supabase.auth.updateUser({
          data: {
            full_name: fullName.trim(),
          },
        });

      if (metadataError) {
        console.warn(
          "Auth metadata update warning:",
          metadataError
        );
      }

      setProfile(data as Profile);

      setEditModalVisible(false);

      Alert.alert(
        t("success"),
        t("profileUpdated")
      );
    } catch (error) {
      console.error(
        "Profile update error:",
        error
      );

      Alert.alert(
        t("updateFailed"),
        t("profileUpdateFailed")
      );
    } finally {
      setSavingProfile(false);
    }
  };

  /* NOTIFICATION PREFERENCES */

  const toggleNotification = async (
    key: AlertKey,
    value: boolean
  ) => {
    if (savingPreference !== null) return;

    const previousPreferences = preferences;

    setSavingPreference(key);

    setPreferences((current) => ({
      ...current,
      [key]: value,
    }));

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        throw new Error(t("notLoggedIn"));
      }

      const { error } = await supabase
        .from("notification_preferences")
        .upsert(
          {
            user_id: user.id,
            [key]: value,
            updated_at:
              new Date().toISOString(),
          },
          {
            onConflict: "user_id",
          }
        );

      if (error) throw error;
    } catch (error) {
      console.error(
        "Notification preference error:",
        error
      );

      setPreferences(previousPreferences);

      Alert.alert(
        t("updateFailed"),
        t("notificationUpdateFailed")
      );
    } finally {
      setSavingPreference(null);
    }
  };

  /* LOGOUT */

  const handleLogout = () => {
    Alert.alert(
      t("logout"),
      t("clientLogoutConfirmation"),
      [
        {
          text: t("cancel"),
          style: "cancel",
        },
        {
          text: t("logout"),
          style: "destructive",

          onPress: async () => {
            try {
              const { error } =
                await supabase.auth.signOut();

              if (error) throw error;

              router.replace(
                "/screens/LoginScreen"
              );
            } catch (error) {
              console.error(
                "Logout error:",
                error
              );

              Alert.alert(
                t("logoutFailed"),
                t("tryLater")
              );
            }
          },
        },
      ]
    );
  };

  /* DISPLAY NAME */

  const getDisplayName = () => {
    return (
      profile?.full_name ||
      t("clientAccount")
    );
  };

  /* LOADING SCREEN */

  if (
    (!fontsLoaded && !fontError) ||
    loading ||
    !isLanguageReady ||
    !isThemeReady
  ) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
        />

        <Text style={styles.loadingText}>
          {t("loadingSettings")}
        </Text>
      </View>
    );
  }

  /* MAIN SCREEN */

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 12,
            paddingBottom:
              130 + insets.bottom,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        bounces
        overScrollMode="auto"
        scrollEnabled
      >
        {/* PAGE HEADER */}

        <Text style={styles.pageTitle}>
          {t("settings")}
        </Text>

        <Text style={styles.pageSubtitle}>
          {t("settingsSubtitle")}
        </Text>

        {/* CLIENT ACCOUNT */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("clientAccount")}
          </Text>

          <View style={styles.accountCard}>
            <View style={styles.avatarContainer}>
              <User
                size={28}
                color={COLORS.primary}
                strokeWidth={2}
              />
            </View>

            <View style={styles.accountInfo}>
              <Text
                style={styles.accountName}
                numberOfLines={1}
              >
                {getDisplayName()}
              </Text>

              <Text
                style={styles.accountEmail}
                numberOfLines={1}
              >
                {email}
              </Text>

              <View style={styles.clientBadge}>
                <Text
                  style={styles.clientBadgeText}
                >
                  {t("clientAccount")}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.editIconButton}
              onPress={openEditProfile}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t("editProfile")}
            >
              <SquarePen
                size={19}
                color={COLORS.primary}
                strokeWidth={2}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* NOTIFICATION PREFERENCES */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("notificationPreferences")}
          </Text>

          <View style={styles.card}>
            {NOTIFICATION_ITEMS.map(
              (item, index) => {
                const NotificationIcon =
                  item.icon;

                return (
                  <View key={item.key}>
                    <View
                      style={styles.notificationRow}
                    >
                      <View
                        style={
                          styles.notificationIcon
                        }
                      >
                        <NotificationIcon
                          size={21}
                          color={COLORS.primary}
                          strokeWidth={2}
                        />
                      </View>

                      <View
                        style={
                          styles.notificationInfo
                        }
                      >
                        <Text
                          style={
                            styles.notificationTitle
                          }
                        >
                          {t(item.title)}
                        </Text>

                        <Text
                          style={
                            styles.notificationDescription
                          }
                        >
                          {t(item.description)}
                        </Text>
                      </View>

                      {savingPreference ===
                      item.key ? (
                        <ActivityIndicator
                          size="small"
                          color={COLORS.primary}
                        />
                      ) : (
                        <Switch
                          value={
                            preferences[item.key]
                          }
                          disabled={
                            savingPreference !==
                            null
                          }
                          onValueChange={(value) =>
                            toggleNotification(
                              item.key,
                              value
                            )
                          }
                          trackColor={{
                            false: COLORS.switchOff,
                            true: COLORS.lightGreen,
                          }}
                          thumbColor={
                            preferences[item.key]
                              ? COLORS.primary
                              : COLORS.white
                          }
                          accessibilityLabel={
                            t(item.title)
                          }
                        />
                      )}
                    </View>

                    {index !==
                      NOTIFICATION_ITEMS.length -
                        1 && (
                      <View
                        style={styles.separator}
                      />
                    )}
                  </View>
                );
              }
            )}
          </View>
        </View>

        {/* LANGUAGE SETTINGS */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("language")}
          </Text>

          <TouchableOpacity
            style={styles.menuCard}
            activeOpacity={0.7}
            onPress={() =>
              router.push(
                "/screens/LanguageSettings"
              )
            }
          >
            <View style={styles.menuIcon}>
              <Languages
                size={21}
                color={COLORS.primary}
                strokeWidth={2}
              />
            </View>

            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>
                {t("appLanguage")}
              </Text>

              <Text
                style={styles.menuDescription}
              >
                {t("choosePreferredLanguage")}
              </Text>
            </View>

            <ChevronRight
              size={20}
              color={COLORS.gray}
              strokeWidth={2}
            />
          </TouchableOpacity>
        </View>

        {/* APPEARANCE / DARK MODE */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("appearance")}
          </Text>

          <View style={styles.menuCard}>
            <View style={styles.menuIcon}>
              {isDark ? (
                <Moon
                  size={21}
                  color={COLORS.accent}
                  strokeWidth={2}
                />
              ) : (
                <Sun
                  size={21}
                  color={COLORS.primary}
                  strokeWidth={2}
                />
              )}
            </View>

            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>
                {t("darkMode")}
              </Text>

              <Text
                style={styles.menuDescription}
              >
                {t("darkModeDescription")}
              </Text>
            </View>

            {savingTheme ? (
              <ActivityIndicator
                size="small"
                color={COLORS.primary}
              />
            ) : (
              <Switch
                value={isDark}
                onValueChange={updateTheme}
                disabled={savingTheme}
                trackColor={{
                  false: COLORS.switchOff,
                  true: COLORS.switchOn,
                }}
                thumbColor={COLORS.white}
                accessibilityLabel={t("darkMode")}
              />
            )}
          </View>
        </View>

        {/* ABOUT SCARECROW */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("about")}
          </Text>

          <View style={styles.menuCard}>
            <View style={styles.menuIcon}>
              <Info
                size={21}
                color={COLORS.primary}
                strokeWidth={2}
              />
            </View>

            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>
                ScareCROW
              </Text>

              <Text
                style={styles.menuDescription}
              >
                {t("smartCropProtectionSystem")}
              </Text>
            </View>

            <Text style={styles.versionText}>
              v1.0
            </Text>
          </View>
        </View>

        {/* LOGOUT BUTTON */}

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LogOut
            size={20}
            color={COLORS.red}
            strokeWidth={2}
          />

          <Text style={styles.logoutText}>
            {t("logout")}
          </Text>
        </TouchableOpacity>

        {/* FOOTER */}

        <Text style={styles.footerText}>
          {t("mobileAppFooter")}
        </Text>
      </ScrollView>

      {/* EDIT PROFILE MODAL */}

      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={closeEditProfile}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : "height"
          }
          keyboardVerticalOffset={0}
        >
          <View style={styles.modalContainer}>
            {/* MODAL HEADER */}

            <View style={styles.modalHeader}>
              <View style={styles.modalHeading}>
                <Text style={styles.modalTitle}>
                  {t("editProfile")}
                </Text>

                <Text style={styles.modalSubtitle}>
                  {t("editProfileSubtitle")}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeEditProfile}
                disabled={savingProfile}
                accessibilityRole="button"
                accessibilityLabel={t("cancel")}
              >
                <X
                  size={22}
                  color={COLORS.darkGreen}
                  strokeWidth={2}
                />
              </TouchableOpacity>
            </View>

            {/* PROFILE FORM */}

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={
                styles.modalScrollContent
              }
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              {/* FULL NAME */}

              <Text style={styles.inputLabel}>
                {t("fullNameRequired")}
              </Text>

              <TextInput
                style={styles.textInput}
                value={fullName}
                onChangeText={setFullName}
                placeholder={
                  t("enterFullNamePlaceholder")
                }
                placeholderTextColor={
                  COLORS.placeholder
                }
                autoCapitalize="words"
                editable={!savingProfile}
              />

              {/* CONTACT NUMBER */}

              <Text style={styles.inputLabel}>
                {t("contactNumber")}
              </Text>

              <TextInput
                style={styles.textInput}
                value={contactNumber}
                onChangeText={setContactNumber}
                placeholder={
                  t("enterContactNumber")
                }
                placeholderTextColor={
                  COLORS.placeholder
                }
                keyboardType="phone-pad"
                editable={!savingProfile}
              />

              {/* PROVINCE */}

              <Text style={styles.inputLabel}>
                {t("province")}
              </Text>

              <TextInput
                style={styles.textInput}
                value={province}
                onChangeText={setProvince}
                placeholder={t("enterProvince")}
                placeholderTextColor={
                  COLORS.placeholder
                }
                autoCapitalize="words"
                editable={!savingProfile}
              />

              {/* MUNICIPALITY / CITY */}

              <Text style={styles.inputLabel}>
                {t("municipalityCity")}
              </Text>

              <TextInput
                style={styles.textInput}
                value={municipality}
                onChangeText={setMunicipality}
                placeholder={
                  t("enterMunicipalityCity")
                }
                placeholderTextColor={
                  COLORS.placeholder
                }
                autoCapitalize="words"
                editable={!savingProfile}
              />

              {/* BARANGAY */}

              <Text style={styles.inputLabel}>
                {t("barangay")}
              </Text>

              <TextInput
                style={styles.textInput}
                value={barangay}
                onChangeText={setBarangay}
                placeholder={t("enterBarangay")}
                placeholderTextColor={
                  COLORS.placeholder
                }
                autoCapitalize="words"
                editable={!savingProfile}
              />

              {/* SAVE CHANGES */}

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  savingProfile &&
                    styles.disabledButton,
                ]}
                onPress={saveProfile}
                disabled={savingProfile}
                activeOpacity={0.8}
              >
                {savingProfile ? (
                  <ActivityIndicator
                    color={COLORS.buttonText}
                  />
                ) : (
                  <>
                    <Save
                      size={19}
                      color={COLORS.buttonText}
                      strokeWidth={2}
                    />

                    <Text
                      style={styles.saveButtonText}
                    >
                      {t("saveChanges")}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* CANCEL */}

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeEditProfile}
                disabled={savingProfile}
              >
                <Text
                  style={styles.cancelButtonText}
                >
                  {t("cancel")}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

/* DYNAMIC THEME STYLES */

const createStyles = (COLORS: ThemeColors) =>
  StyleSheet.create({
    /* MAIN SCREEN */

    container: {
      flex: 1,
      width: "100%",
      backgroundColor: COLORS.background,
    },

    mainScroll: {
      flex: 1,
      width: "100%",
    },

    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 130,
    },

    /* LOADING */

    loadingContainer: {
      flex: 1,
      backgroundColor: COLORS.background,
      justifyContent: "center",
      alignItems: "center",
    },

    loadingText: {
      marginTop: 12,
      fontFamily: "PlusJakartaSans_600SemiBold",
      fontSize: 13,
      color: COLORS.gray,
    },

    /* PAGE HEADER */

    pageTitle: {
      fontFamily: "PlusJakartaSans_700Bold",
      fontSize: 25,
      color: COLORS.darkGreen,
    },

    pageSubtitle: {
      fontFamily: "PlusJakartaSans_400Regular",
      fontSize: 13,
      color: COLORS.gray,
      marginTop: 5,
      marginBottom: 25,
    },

    /* SECTIONS */

    section: {
      marginBottom: 24,
    },

    sectionTitle: {
      fontFamily: "PlusJakartaSans_700Bold",
      fontSize: 15,
      color: COLORS.darkGreen,
      marginBottom: 12,
    },

    /* CLIENT ACCOUNT CARD */

    accountCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: COLORS.veryLightGreen,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 16,
      padding: 15,
    },

    avatarContainer: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: COLORS.lightGreen,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },

    accountInfo: {
      flex: 1,
      minWidth: 0,
    },

    accountName: {
      fontFamily: "PlusJakartaSans_700Bold",
      fontSize: 14,
      color: COLORS.darkGreen,
    },

    accountEmail: {
      fontFamily: "PlusJakartaSans_400Regular",
      fontSize: 11,
      color: COLORS.gray,
      marginTop: 3,
    },

    clientBadge: {
      alignSelf: "flex-start",
      backgroundColor: COLORS.lightGreen,
      borderRadius: 20,
      paddingHorizontal: 9,
      paddingVertical: 4,
      marginTop: 7,
    },

    clientBadgeText: {
      fontFamily: "PlusJakartaSans_600SemiBold",
      fontSize: 9,
      color: COLORS.darkGreen,
    },

    editIconButton: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: COLORS.lightGreen,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 8,
    },

    /* NOTIFICATION CARD */

    card: {
      backgroundColor: COLORS.surface,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 16,
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
      borderRadius: 12,
      backgroundColor: COLORS.veryLightGreen,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 11,
    },

    notificationInfo: {
      flex: 1,
      minWidth: 0,
      marginRight: 8,
    },

    notificationTitle: {
      fontFamily: "PlusJakartaSans_600SemiBold",
      fontSize: 12,
      color: COLORS.darkGreen,
    },

    notificationDescription: {
      fontFamily: "PlusJakartaSans_400Regular",
      fontSize: 10,
      color: COLORS.gray,
      marginTop: 3,
    },

    separator: {
      height: 1,
      backgroundColor: COLORS.border,
    },

    /* MENU CARDS */

    menuCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: COLORS.surface,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 15,
      padding: 14,
    },

    menuIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: COLORS.veryLightGreen,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },

    menuInfo: {
      flex: 1,
      minWidth: 0,
    },

    menuTitle: {
      fontFamily: "PlusJakartaSans_600SemiBold",
      fontSize: 12,
      color: COLORS.darkGreen,
    },

    menuDescription: {
      fontFamily: "PlusJakartaSans_400Regular",
      fontSize: 10,
      color: COLORS.gray,
      marginTop: 3,
    },

    versionText: {
      fontFamily: "PlusJakartaSans_600SemiBold",
      fontSize: 11,
      color: COLORS.gray,
    },

    /* LOGOUT */

    logoutButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: COLORS.lightRed,
      borderRadius: 13,
      paddingVertical: 14,
      marginTop: 5,
    },

    logoutText: {
      fontFamily: "PlusJakartaSans_700Bold",
      fontSize: 13,
      color: COLORS.red,
      marginLeft: 8,
    },

    /* FOOTER */

    footerText: {
      fontFamily: "PlusJakartaSans_400Regular",
      fontSize: 10,
      color: COLORS.gray,
      textAlign: "center",
      marginTop: 20,
    },

    /* EDIT PROFILE MODAL */

    modalOverlay: {
      flex: 1,
      backgroundColor: COLORS.overlay,
      justifyContent: "flex-end",
    },

    modalContainer: {
      backgroundColor: COLORS.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      paddingTop: 22,
      paddingBottom:
        Platform.OS === "ios" ? 30 : 15,
      maxHeight: "90%",
      width: "100%",
    },

    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 22,
    },

    modalHeading: {
      flex: 1,
      marginRight: 12,
    },

    modalTitle: {
      fontFamily: "PlusJakartaSans_700Bold",
      fontSize: 19,
      color: COLORS.darkGreen,
    },

    modalSubtitle: {
      fontFamily: "PlusJakartaSans_400Regular",
      fontSize: 11,
      color: COLORS.gray,
      marginTop: 4,
    },

    closeButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: COLORS.veryLightGreen,
      alignItems: "center",
      justifyContent: "center",
    },

    modalScroll: {
      flexShrink: 1,
    },

    modalScrollContent: {
      paddingBottom: 15,
    },

    /* FORM INPUTS */

    inputLabel: {
      fontFamily: "PlusJakartaSans_600SemiBold",
      fontSize: 12,
      color: COLORS.darkGreen,
      marginBottom: 7,
      marginTop: 13,
    },

    textInput: {
      height: 48,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 11,
      paddingHorizontal: 13,
      fontFamily: "PlusJakartaSans_400Regular",
      fontSize: 12,
      color: COLORS.darkGreen,
      backgroundColor: COLORS.input,
    },

    /* SAVE BUTTON */

    saveButton: {
      height: 49,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: COLORS.primary,
      borderRadius: 12,
      marginTop: 25,
    },

    disabledButton: {
      opacity: 0.6,
    },

    saveButtonText: {
      fontFamily: "PlusJakartaSans_700Bold",
      fontSize: 13,
      color: COLORS.buttonText,
      marginLeft: 8,
    },

    /* CANCEL BUTTON */

    cancelButton: {
      alignItems: "center",
      paddingVertical: 14,
      marginTop: 5,
    },

    cancelButtonText: {
      fontFamily: "PlusJakartaSans_600SemiBold",
      fontSize: 12,
      color: COLORS.gray,
    },
  });