
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  ArrowLeft,
  Languages,
  MessageCircle,
  Info,
} from "lucide-react-native";

import {
  useLanguage,
  type Language,
} from "../context/LanguageContext";

import { useTheme, type ThemeColors } from "../../context/ThemeContext";

const LANGUAGES: {
  code: Language;
  name: string;
  nativeName: string;
  description: string;
}[] = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    description: "Use English throughout the application.",
  },
  {
    code: "ceb",
    name: "Cebuano",
    nativeName: "Bisaya",
    description: "Gamita ang pinulongang Cebuano sa aplikasyon.",
  },
];

export default function LanguageSettings() {
  const { colors: COLORS } = useTheme();
  const styles = React.useMemo(() => createStyles(COLORS), [COLORS]);

  const router = useRouter();

  const {
    language,
    changeLanguage,
    t,
    isLanguageReady,
  } = useLanguage();

  const [saving, setSaving] = useState(false);

  // CHANGE APPLICATION LANGUAGE
  const selectLanguage = async (newLanguage: Language) => {
    if (newLanguage === language || saving) return;

    try {
      setSaving(true);

      await changeLanguage(newLanguage);

      Alert.alert(
        newLanguage === "ceb"
          ? "Na-update ang Pinulongan"
          : "Language Updated",
        newLanguage === "ceb"
          ? "Na-save na ang imong pinulongan."
          : "Your language preference has been saved."
      );
    } catch (error) {
      console.error("Unable to save language:", error);

      Alert.alert(
        "Error",
        "Unable to save your language preference. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // BACK NAVIGATION
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/settings");
    }
  };

  // LOADING SCREEN
  if (!isLanguageReady) {
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
    <SafeAreaView
      style={styles.container}
      edges={["top", "bottom"]}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={
            language === "ceb" ? "Balik" : "Go Back"
          }
        >
          <ArrowLeft
            size={22}
            color={COLORS.darkGreen}
            strokeWidth={2}
          />
        </TouchableOpacity>

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>
            {t("language")}
          </Text>

          <Text style={styles.headerSubtitle}>
            {t("languageDescription")}
          </Text>
        </View>
      </View>

      {/* SCROLLABLE CONTENT */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* INFORMATION CARD */}
        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Languages
              size={25}
              color={COLORS.primary}
              strokeWidth={2}
            />
          </View>

          <Text style={styles.infoTitle}>
            {t("chooseLanguage")}
          </Text>

          <Text style={styles.infoDescription}>
            {t("languageDescription")}
          </Text>
        </View>

        {/* AVAILABLE LANGUAGES */}
        <Text style={styles.sectionLabel}>
          {t("availableLanguages").toUpperCase()}
        </Text>

        {LANGUAGES.map((item) => {
          const isSelected = language === item.code;

          return (
            <TouchableOpacity
              key={item.code}
              style={[
                styles.languageCard,
                isSelected && styles.selectedLanguageCard,
                saving && styles.disabledCard,
              ]}
              onPress={() => selectLanguage(item.code)}
              disabled={saving}
              activeOpacity={0.75}
              accessibilityRole="radio"
              accessibilityState={{
                checked: isSelected,
                disabled: saving,
              }}
            >
              <View style={styles.languageIcon}>
                <MessageCircle
                  size={22}
                  color={COLORS.primary}
                  strokeWidth={2}
                />
              </View>

              <View style={styles.languageInfo}>
                <Text style={styles.languageName}>
                  {item.name}
                </Text>

                <Text style={styles.nativeName}>
                  {item.nativeName}
                </Text>

                <Text style={styles.languageDescription}>
                  {item.description}
                </Text>
              </View>

              {/* RADIO BUTTON */}
              <View
                style={[
                  styles.radioOuter,
                  isSelected && styles.radioOuterSelected,
                ]}
              >
                {isSelected && (
                  <View style={styles.radioInner} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}

        {/* SAVING INDICATOR */}
        {saving && (
          <View style={styles.savingContainer}>
            <ActivityIndicator
              size="small"
              color={COLORS.primary}
            />

            <Text style={styles.savingText}>
              {t("savingPreference")}
            </Text>
          </View>
        )}

        {/* INFORMATION NOTE */}
        <View style={styles.noteCard}>
          <Info
            size={19}
            color={COLORS.primary}
            strokeWidth={2}
          />

          <Text style={styles.noteText}>
            {t("languageNote")}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// STYLES
const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 12,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.veryLightGreen,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 13,
  },

  headerTextContainer: {
    flex: 1,
  },

  headerTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 21,
    color: COLORS.darkGreen,
  },

  headerSubtitle: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 4,
    lineHeight: 17,
  },

  scrollView: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 35,
  },

  infoCard: {
    alignItems: "center",
    backgroundColor: COLORS.veryLightGreen,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 23,
    marginBottom: 27,
  },

  infoIcon: {
    width: 55,
    height: 55,
    borderRadius: 16,
    backgroundColor: COLORS.lightGreen,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  infoTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 16,
    color: COLORS.darkGreen,
    textAlign: "center",
  },

  infoDescription: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    color: COLORS.gray,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 6,
  },

  sectionLabel: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 11,
    color: COLORS.gray,
    letterSpacing: 1,
    marginBottom: 12,
  },

  languageCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },

  selectedLanguageCard: {
    backgroundColor: COLORS.veryLightGreen,
    borderColor: COLORS.primary,
    borderWidth: 1.5,
  },

  disabledCard: {
    opacity: 0.7,
  },

  languageIcon: {
    width: 43,
    height: 43,
    borderRadius: 12,
    backgroundColor: COLORS.lightGreen,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  languageInfo: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },

  languageName: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 14,
    color: COLORS.darkGreen,
  },

  nativeName: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 11,
    color: COLORS.primary,
    marginTop: 2,
  },

  languageDescription: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 10,
    color: COLORS.gray,
    marginTop: 5,
    lineHeight: 15,
  },

  radioOuter: {
    width: 21,
    height: 21,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: COLORS.gray,
    justifyContent: "center",
    alignItems: "center",
  },

  radioOuterSelected: {
    borderColor: COLORS.primary,
  },

  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },

  savingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    gap: 8,
  },

  savingText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    color: COLORS.gray,
  },

  noteCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.veryLightGreen,
    borderRadius: 12,
    padding: 13,
    marginTop: 15,
    gap: 9,
  },

  noteText: {
    flex: 1,
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 11,
    color: COLORS.gray,
    lineHeight: 17,
  },
});