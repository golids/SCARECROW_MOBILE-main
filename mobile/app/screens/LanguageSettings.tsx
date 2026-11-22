
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import {
  useLanguage,
  Language,
} from "../context/LanguageContext";

const COLORS = {
  white: "#FFFFFF",
  darkGreen: "#123B25",
  primary: "#4F8F3A",
  lightGreen: "#E8F0B8",
  veryLightGreen: "#F7F9E9",
  gray: "#808080",
  border: "#E5E9D2",
};

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
  const router = useRouter();

  const {
    language,
    changeLanguage,
    t,
    isLanguageReady,
  } = useLanguage();

  const [saving, setSaving] = useState(false);

  const selectLanguage = async (newLanguage: Language) => {
    if (newLanguage === language || saving) return;

    try {
      setSaving(true);

      await changeLanguage(newLanguage);

      Alert.alert(
        newLanguage === "ceb" ? "Pinulongan Gi-update" : "Language Updated",
        t("languageSaved")
      );
    } catch (error) {
      console.error("Unable to save language:", error);

      Alert.alert(
        "Error",
        newLanguage === "ceb"
          ? "Dili ma-save ang pinulongan."
          : "Unable to save your language preference."
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isLanguageReady) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>{t("loading")}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={COLORS.darkGreen}
          />
        </TouchableOpacity>

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>{t("language")}</Text>
          <Text style={styles.headerSubtitle}>
            {t("languageDescription")}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Ionicons
              name="language-outline"
              size={25}
              color={COLORS.primary}
            />
          </View>

          <Text style={styles.infoTitle}>
            {t("chooseLanguage")}
          </Text>

          <Text style={styles.infoDescription}>
            {t("languageDescription")}
          </Text>
        </View>

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
              ]}
              onPress={() => selectLanguage(item.code)}
              disabled={saving}
              activeOpacity={0.75}
            >
              <View style={styles.languageIcon}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={22}
                  color={COLORS.primary}
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

              <View
                style={[
                  styles.radioOuter,
                  isSelected && styles.radioOuterSelected,
                ]}
              >
                {isSelected && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          );
        })}

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

        <View style={styles.noteCard}>
          <Ionicons
            name="information-circle-outline"
            size={19}
            color={COLORS.primary}
          />
          <Text style={styles.noteText}>
            {t("languageNote")}
          </Text>
        </View>
      </View>
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
    fontSize: 21,
    fontWeight: "700",
    color: COLORS.darkGreen,
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 4,
  },
  content: {
    padding: 20,
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
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.darkGreen,
  },
  infoDescription: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 6,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.gray,
    letterSpacing: 1,
    marginBottom: 12,
  },
  languageCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: COLORS.white,
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
    paddingRight: 8,
  },
  languageName: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.darkGreen,
  },
  nativeName: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: "600",
    marginTop: 2,
  },
  languageDescription: {
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
    fontSize: 11,
    color: COLORS.gray,
    lineHeight: 17,
  },
});