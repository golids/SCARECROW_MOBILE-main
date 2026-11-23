
import React, { useCallback, useEffect, useState } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { supabase } from "../../lib/supabase";

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

const DEFAULT_PREFERENCES: Preferences = {
  device_disconnection: true,
  device_errors: true,
  device_recovery: true,
};

const NOTIFICATION_ITEMS: {
  key: AlertKey;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    key: "device_disconnection",
    title: "Device Disconnection",
    description: "When an assigned device goes offline.",
    icon: "wifi-outline",
  },
  {
    key: "device_errors",
    title: "Device Errors",
    description: "When an error is recorded by a device.",
    icon: "alert-circle-outline",
  },
  {
    key: "device_recovery",
    title: "Device Reconnection",
    description: "When an assigned device reconnects.",
    icon: "checkmark-circle-outline",
  },
];

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPreference, setSavingPreference] =
    useState<AlertKey | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");

  const [preferences, setPreferences] =
    useState<Preferences>(DEFAULT_PREFERENCES);

  const [editModalVisible, setEditModalVisible] = useState(false);

  const [fullName, setFullName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [province, setProvince] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [barangay, setBarangay] = useState("");

  // LOAD SETTINGS
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

      const { data: profileData, error: profileError } =
        await supabase
          .from("profiles")
          .select(
            "id, full_name, contact_number, province, municipality, barangay"
          )
          .eq("id", user.id)
          .maybeSingle();

      if (profileError) throw profileError;

      if (profileData) {
        const loadedProfile = profileData as Profile;

        setProfile(loadedProfile);
        setFullName(loadedProfile.full_name ?? "");
        setContactNumber(loadedProfile.contact_number ?? "");
        setProvince(loadedProfile.province ?? "");
        setMunicipality(loadedProfile.municipality ?? "");
        setBarangay(loadedProfile.barangay ?? "");
      } else {
        setProfile(null);
      }

      const { data: preferenceData, error: preferenceError } =
        await supabase
          .from("notification_preferences")
          .select(
            "device_disconnection, device_errors, device_recovery"
          )
          .eq("user_id", user.id)
          .maybeSingle();

      if (preferenceError) throw preferenceError;

      if (preferenceData) {
        setPreferences({
          device_disconnection:
            preferenceData.device_disconnection ?? true,
          device_errors: preferenceData.device_errors ?? true,
          device_recovery: preferenceData.device_recovery ?? true,
        });
      } else {
        setPreferences(DEFAULT_PREFERENCES);
      }
    } catch (error: any) {
      console.error("Settings loading error:", error);

      Alert.alert(
        "Unable to Load Settings",
        error?.message ?? "Please try again later."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // EDIT PROFILE
  const openEditProfile = () => {
    setFullName(profile?.full_name ?? "");
    setContactNumber(profile?.contact_number ?? "");
    setProvince(profile?.province ?? "");
    setMunicipality(profile?.municipality ?? "");
    setBarangay(profile?.barangay ?? "");
    setEditModalVisible(true);
  };

  // SAVE PROFILE
  const saveProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert("Missing Information", "Please enter your full name.");
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
        Alert.alert("Session Expired", "Please log in again.");
        router.replace("/screens/LoginScreen");
        return;
      }

      const updatedProfile = {
        full_name: fullName.trim(),
        contact_number: contactNumber.trim() || null,
        province: province.trim() || null,
        municipality: municipality.trim() || null,
        barangay: barangay.trim() || null,
        updated_at: new Date().toISOString(),
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
        console.error("Supabase profile update error:", error);
        throw error;
      }

      if (!data) {
        throw new Error(
          "No profile was updated. Check whether the logged-in user's ID matches profiles.id."
        );
      }

      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim(),
        },
      });

      if (metadataError) {
        console.warn("Auth metadata update warning:", metadataError);
      }

      setProfile(data as Profile);
      setEditModalVisible(false);

      Alert.alert("Success", "Your profile has been updated.");
    } catch (error: any) {
      console.error("Profile update error:", error);

      Alert.alert(
        "Update Failed",
        error?.message ?? "Unable to update your profile."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  // NOTIFICATION PREFERENCES
  const toggleNotification = async (
    key: AlertKey,
    value: boolean
  ) => {
    const previousPreferences = preferences;

    setPreferences((current) => ({
      ...current,
      [key]: value,
    }));

    try {
      setSavingPreference(key);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        throw new Error("You are not logged in.");
      }

      const { error } = await supabase
        .from("notification_preferences")
        .upsert(
          {
            user_id: user.id,
            [key]: value,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id",
          }
        );

      if (error) throw error;
    } catch (error: any) {
      console.error("Notification preference error:", error);

      setPreferences(previousPreferences);

      Alert.alert(
        "Update Failed",
        error?.message ?? "Unable to save notification preference."
      );
    } finally {
      setSavingPreference(null);
    }
  };

  // LOGOUT
  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out of your account?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase.auth.signOut();

            if (error) {
              Alert.alert("Logout Failed", error.message);
              return;
            }

            router.replace("/screens/LoginScreen");
          },
        },
      ]
    );
  };

  const getDisplayName = () => {
    return profile?.full_name || "Client Account";
  };

  // LOADING SCREEN
  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* MAIN SETTINGS SCROLLVIEW */}
      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 12,
            paddingBottom: 130 + insets.bottom,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
        bounces={true}
        overScrollMode="auto"
        scrollEnabled={true}
      >
        <Text style={styles.pageTitle}>Settings</Text>

        <Text style={styles.pageSubtitle}>
          Manage your account and app preferences.
        </Text>

        {/* CLIENT ACCOUNT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client Account</Text>

          <View style={styles.accountCard}>
            <View style={styles.avatarContainer}>
              <Ionicons
                name="person-outline"
                size={28}
                color={COLORS.primary}
              />
            </View>

            <View style={styles.accountInfo}>
              <Text style={styles.accountName} numberOfLines={1}>
                {getDisplayName()}
              </Text>

              <Text style={styles.accountEmail} numberOfLines={1}>
                {email}
              </Text>

              <View style={styles.clientBadge}>
                <Text style={styles.clientBadgeText}>
                  Client Account
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.editIconButton}
              onPress={openEditProfile}
              activeOpacity={0.7}
            >
              <Ionicons
                name="create-outline"
                size={19}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* NOTIFICATION PREFERENCES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Notification Preferences
          </Text>

          <View style={styles.card}>
            {NOTIFICATION_ITEMS.map((item, index) => (
              <View key={item.key}>
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
                      {item.title}
                    </Text>

                    <Text style={styles.notificationDescription}>
                      {item.description}
                    </Text>
                  </View>

                  {savingPreference === item.key ? (
                    <ActivityIndicator
                      size="small"
                      color={COLORS.primary}
                    />
                  ) : (
                    <Switch
                      value={preferences[item.key]}
                      onValueChange={(value) =>
                        toggleNotification(item.key, value)
                      }
                      trackColor={{
                        false: "#D9D9D9",
                        true: COLORS.lightGreen,
                      }}
                      thumbColor={
                        preferences[item.key]
                          ? COLORS.primary
                          : "#F4F3F4"
                      }
                    />
                  )}
                </View>

                {index !== NOTIFICATION_ITEMS.length - 1 && (
                  <View style={styles.separator} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* LANGUAGE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Language</Text>

          <TouchableOpacity
            style={styles.menuCard}
            activeOpacity={0.7}
            onPress={() => router.push("/screens/LanguageSettings")}
          >
            <View style={styles.menuIcon}>
              <Ionicons
                name="language-outline"
                size={21}
                color={COLORS.primary}
              />
            </View>

            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>App Language</Text>
              <Text style={styles.menuDescription}>
                Choose your preferred language.
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={20}
              color={COLORS.gray}
            />
          </TouchableOpacity>
        </View>

        {/* ABOUT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <View style={styles.menuCard}>
            <View style={styles.menuIcon}>
              <Ionicons
                name="information-circle-outline"
                size={21}
                color={COLORS.primary}
              />
            </View>

            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>ScareCROW</Text>
              <Text style={styles.menuDescription}>
                Smart Crop Protection System
              </Text>
            </View>

            <Text style={styles.versionText}>v1.0</Text>
          </View>
        </View>

        {/* LOGOUT */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons
            name="log-out-outline"
            size={20}
            color={COLORS.red}
          />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          ScareCROW Mobile App
        </Text>
      </ScrollView>

      {/* EDIT PROFILE MODAL */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Edit Profile</Text>
                <Text style={styles.modalSubtitle}>
                  Update your account information.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Ionicons
                  name="close"
                  size={22}
                  color={COLORS.darkGreen}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={styles.textInput}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                placeholderTextColor="#A0A0A0"
                autoCapitalize="words"
              />

              <Text style={styles.inputLabel}>Contact Number</Text>
              <TextInput
                style={styles.textInput}
                value={contactNumber}
                onChangeText={setContactNumber}
                placeholder="Enter your contact number"
                placeholderTextColor="#A0A0A0"
                keyboardType="phone-pad"
              />

              <Text style={styles.inputLabel}>Province</Text>
              <TextInput
                style={styles.textInput}
                value={province}
                onChangeText={setProvince}
                placeholder="Enter your province"
                placeholderTextColor="#A0A0A0"
                autoCapitalize="words"
              />

              <Text style={styles.inputLabel}>Municipality / City</Text>
              <TextInput
                style={styles.textInput}
                value={municipality}
                onChangeText={setMunicipality}
                placeholder="Enter your municipality or city"
                placeholderTextColor="#A0A0A0"
                autoCapitalize="words"
              />

              <Text style={styles.inputLabel}>Barangay</Text>
              <TextInput
                style={styles.textInput}
                value={barangay}
                onChangeText={setBarangay}
                placeholder="Enter your barangay"
                placeholderTextColor="#A0A0A0"
                autoCapitalize="words"
              />

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  savingProfile && styles.disabledButton,
                ]}
                onPress={saveProfile}
                disabled={savingProfile}
                activeOpacity={0.8}
              >
                {savingProfile ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Ionicons
                      name="save-outline"
                      size={19}
                      color={COLORS.white}
                    />
                    <Text style={styles.saveButtonText}>
                      Save Changes
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditModalVisible(false)}
                disabled={savingProfile}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // MAIN SCREEN
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: COLORS.white,
  },

  // MAIN SCROLLVIEW
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

  // LOADING
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 12,
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 13,
    color: COLORS.gray,
  },

  // PAGE HEADER
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

  // SECTIONS
  section: {
    marginBottom: 24,
  },

  sectionTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 15,
    color: COLORS.darkGreen,
    marginBottom: 12,
  },

  // ACCOUNT CARD
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

  // NOTIFICATION CARD
  card: {
    backgroundColor: COLORS.white,
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

  // MENU CARDS
  menuCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
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

  // LOGOUT
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

  footerText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 10,
    color: COLORS.gray,
    textAlign: "center",
    marginTop: 20,
  },

  // EDIT PROFILE MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },

  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: Platform.OS === "ios" ? 30 : 15,
    maxHeight: "90%",
    width: "100%",
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
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
    backgroundColor: COLORS.white,
  },

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
    color: COLORS.white,
    marginLeft: 8,
  },

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