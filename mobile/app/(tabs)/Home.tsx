import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

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
};

/* -------------------------------------------------------------------------- */
/*                              SCARECROW ICON                                */
/* -------------------------------------------------------------------------- */

function ScarecrowIcon({ size = 36 }: { size?: number }) {
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
          backgroundColor: COLORS.primary,
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
          backgroundColor: COLORS.primary,
          borderRadius: 4,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Eyes */}
        <View
          style={{
            flexDirection: "row",
            gap: 5 * s,
          }}
        >
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
          backgroundColor: COLORS.primary,
          borderRadius: 3,
          marginTop: -14 * s,
        }}
      />

      {/* Legs */}
      <View
        style={{
          flexDirection: "row",
          gap: 6 * s,
          marginTop: 1 * s,
        }}
      >
        <View
          style={{
            width: 6 * s,
            height: 14 * s,
            backgroundColor: COLORS.primary,
            borderRadius: 2,
          }}
        />

        <View
          style={{
            width: 6 * s,
            height: 14 * s,
            backgroundColor: COLORS.primary,
            borderRadius: 2,
          }}
        />
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                              HOME SCREEN                                   */
/* -------------------------------------------------------------------------- */

export default function HomeScreen() {
  /*
   * All data below is intentionally empty.
   *
   * These values should eventually come from your backend/API.
   *
   * Example:
   * - user name       -> authenticated user
   * - WiFi             -> device/farm data
   * - farm size        -> farm data
   * - device           -> scarecrow device data
   * - bird count       -> detection records
   * - species          -> detection records
   * - activity log     -> detection history
   */

  const userName = "";

  const farmConnection = "";
  const farmSize = "";

  const deviceName = "";
  const deviceStatus = "";

  const birdsToday = "";
  const birdsThisWeek = "";

  const birdSpecies: {
    label: string;
    count: string;
    percentage: string;
    subtitle: string;
    icon: string;
  }[] = [];

  const activityLogs: {
    time: string;
    label: string;
    ago: string;
  }[] = [];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* ------------------------------------------------------------------ */}
      {/* Scrollable Content                                                  */}
      {/* ------------------------------------------------------------------ */}

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
          <Text style={styles.welcome}>
            {userName ? `Hello, ${userName}` : "Hello, Farmer!"}
          </Text>

          <TouchableOpacity
            style={styles.addBtn}
            activeOpacity={0.8}
            onPress={() => {
              // TODO: Add device / farm action
            }}
          >
            <Ionicons name="add" size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* ---------------------------------------------------------------- */}
        {/* Connection Card                                                   */}
        {/* ---------------------------------------------------------------- */}

        <View style={styles.connectionCard}>
          {/* Connection */}
          <View style={styles.connectionLeft}>
            <View style={styles.iconCircle}>
              <MaterialIcons
                name="wifi"
                size={18}
                color={COLORS.primary}
              />
            </View>

            <View style={styles.connectionText}>
              <Text style={styles.connLabel}>Connected to</Text>

              <Text
                style={[
                  styles.connValue,
                  !farmConnection && styles.emptyValue,
                ]}
              >
                {farmConnection || "—"}
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.dividerVert} />

          {/* Farm Size */}
          <View style={styles.connectionRight}>
            <View style={styles.iconCircle}>
              <Ionicons
                name="location-outline"
                size={17}
                color={COLORS.primary}
              />
            </View>

            <View style={styles.connectionText}>
              <Text style={styles.connLabel}>Farm Size</Text>

              <Text
                style={[
                  styles.connValueLarge,
                  !farmSize && styles.emptyValue,
                ]}
              >
                {farmSize || "—"}
              </Text>
            </View>
          </View>
        </View>

        {/* ---------------------------------------------------------------- */}
        {/* Device Overview                                                   */}
        {/* ---------------------------------------------------------------- */}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Device Overview
            </Text>

            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.sectionLink}>
                Manage &gt;
              </Text>
            </TouchableOpacity>
          </View>

          {/* Device */}
          <TouchableOpacity
            style={styles.deviceRow}
            activeOpacity={0.75}
          >
            <View style={styles.deviceIconWrap}>
              <ScarecrowIcon size={36} />
            </View>

            <View style={styles.deviceInfo}>
              <Text
                style={[
                  styles.deviceName,
                  !deviceName && styles.emptyText,
                ]}
              >
                {deviceName || "No device connected"}
              </Text>

              <View style={styles.statusRow}>
                {deviceStatus ? (
                  <View style={styles.statusDot} />
                ) : null}

                <Text
                  style={[
                    styles.deviceStatus,
                    !deviceStatus && styles.emptyText,
                  ]}
                >
                  {deviceStatus || "Waiting for device data"}
                </Text>
              </View>
            </View>

            <Ionicons
              name="chevron-forward"
              size={18}
              color={COLORS.primary}
            />
          </TouchableOpacity>

          {/* ---------------------------------------------------------------- */}
          {/* Bird Summary                                                     */}
          {/* ---------------------------------------------------------------- */}

          <View style={styles.birdBanner}>
            <View style={styles.birdBannerLeft}>
              <View style={styles.birdEmojiWrap}>
                <Text style={styles.birdEmoji}>🐦‍⬛</Text>
              </View>

              <Text style={styles.birdBannerText}>
                <Text style={styles.birdCount}>
                  {birdsToday || "—"}
                </Text>{" "}
                Today
              </Text>
            </View>

            <Text style={styles.birdBannerTotal}>
              <Text style={styles.birdCount}>
                {birdsThisWeek || "—"}
              </Text>{" "}
              Total This Week
            </Text>
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* Bird Species                                                     */}
          {/* ---------------------------------------------------------------- */}

          {birdSpecies.length > 0 ? (
            <View style={styles.speciesRow}>
              {birdSpecies.map((bird) => (
                <View
                  key={bird.label}
                  style={styles.speciesCard}
                >
                  <View style={styles.speciesEmojiWrap}>
                    <Text style={styles.speciesEmoji}>
                      {bird.icon}
                    </Text>
                  </View>

                  <View style={styles.speciesInfo}>
                    <Text style={styles.speciesCount}>
                      {bird.count} {bird.label}
                    </Text>

                    <Text style={styles.speciesPct}>
                      {bird.percentage}
                    </Text>

                    <Text style={styles.speciesSub}>
                      {bird.subtitle}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptySpecies}>
              <Ionicons
                name="analytics-outline"
                size={22}
                color={COLORS.gray}
              />

              <Text style={styles.emptySpeciesText}>
                Bird detection data will appear here.
              </Text>
            </View>
          )}
        </View>

        {/* ---------------------------------------------------------------- */}
        {/* Recent Activity Log                                               */}
        {/* ---------------------------------------------------------------- */}

        <View style={styles.sectionLast}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Recent Activity Log
            </Text>

            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.sectionLink}>
                View All &gt;
              </Text>
            </TouchableOpacity>
          </View>

          {activityLogs.length > 0 ? (
            activityLogs.map((log, index) => (
              <TouchableOpacity
                key={`${log.time}-${index}`}
                style={[
                  styles.logRow,
                  index < activityLogs.length - 1 &&
                    styles.logRowSpacing,
                ]}
                activeOpacity={0.75}
              >
                <View style={styles.logIconWrap}>
                  <Text style={styles.logEmoji}>🐦‍⬛</Text>
                </View>

                <View style={styles.logInfo}>
                  <View style={styles.logTitleRow}>
                    <Text style={styles.logTime}>
                      {log.time}
                    </Text>

                    <Text style={styles.logLabel}>
                      {log.label}
                    </Text>
                  </View>

                  <Text style={styles.logAgo}>
                    {log.ago}
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={COLORS.primary}
                />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyActivity}>
              <Ionicons
                name="time-outline"
                size={22}
                color={COLORS.gray}
              />

              <Text style={styles.emptyActivityText}>
                No recent activity.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
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

  /* Add button */
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

  /* ---------------------------------------------------------------------- */
  /* Connection Card                                                        */
  /* ---------------------------------------------------------------------- */

  connectionCard: {
    flexDirection: "row",

    backgroundColor: COLORS.white,

    borderRadius: 14,

    padding: 14,

    marginBottom: 14,

    borderWidth: 1.5,
    borderColor: COLORS.border,

    alignItems: "center",
  },

  connectionLeft: {
    flex: 1,

    flexDirection: "row",
    alignItems: "center",
  },

  connectionRight: {
    flex: 1,

    flexDirection: "row",
    alignItems: "center",

    paddingLeft: 12,
  },

  iconCircle: {
    width: 34,
    height: 34,

    borderRadius: 17,

    backgroundColor: COLORS.veryLightGreen,

    alignItems: "center",
    justifyContent: "center",
  },

  connectionText: {
    marginLeft: 8,
    flex: 1,
  },

  dividerVert: {
    width: 1,
    height: 36,

    backgroundColor: COLORS.border,
  },

  connLabel: {
    fontSize: 15,

    fontFamily: "PlusJakartaSans_400Regular",

    color: COLORS.gray,
  },

  connValue: {
    fontSize: 18,

    fontFamily: "PlusJakartaSans_600SemiBold",

    color: COLORS.darkGreen,

    marginTop: 2,
  },

  connValueLarge: {
    fontSize: 18,

    fontFamily: "PlusJakartaSans_700Bold",

    color: COLORS.primary,

    marginTop: 1,
  },

  emptyValue: {
    color: COLORS.gray,
  },

  /* ---------------------------------------------------------------------- */
  /* Section                                                                */
  /* ---------------------------------------------------------------------- */

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

  /* ---------------------------------------------------------------------- */
  /* Device                                                                  */
  /* ---------------------------------------------------------------------- */

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

  deviceIconWrap: {
    width: 44,
    height: 44,

    borderRadius: 10,

    backgroundColor: COLORS.veryLightGreen,

    alignItems: "center",
    justifyContent: "center",
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

  deviceStatus: {
    fontSize: 12,

    fontFamily: "PlusJakartaSans_400Regular",

    color: COLORS.primary,

    marginLeft: 1,
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

  emptyText: {
    color: COLORS.gray,
  },

  /* ---------------------------------------------------------------------- */
  /* Bird Banner                                                            */
  /* ---------------------------------------------------------------------- */

  birdBanner: {
    flexDirection: "row",

    backgroundColor: COLORS.lightGold,

    borderRadius: 10,

    padding: 10,

    marginBottom: 10,

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

  birdBannerText: {
    fontSize: 13,

    fontFamily: "PlusJakartaSans_400Regular",

    color: COLORS.darkGreen,
  },

  birdBannerTotal: {
    fontSize: 11,

    fontFamily: "PlusJakartaSans_400Regular",

    color: COLORS.darkGreen,

    textAlign: "right",
  },

  birdCount: {
    fontFamily: "PlusJakartaSans_700Bold",

    color: COLORS.primary,
  },

  /* ---------------------------------------------------------------------- */
  /* Species                                                                 */
  /* ---------------------------------------------------------------------- */

  speciesRow: {
    flexDirection: "row",

    gap: 10,
  },

  speciesCard: {
    flex: 1,

    backgroundColor: COLORS.white,

    borderRadius: 10,

    padding: 10,

    borderWidth: 1,
    borderColor: COLORS.border,

    flexDirection: "row",

    alignItems: "center",

    gap: 8,
  },

  speciesEmojiWrap: {
    width: 42,
    height: 42,

    borderRadius: 21,

    backgroundColor: COLORS.veryLightGreen,

    alignItems: "center",
    justifyContent: "center",
  },

  speciesEmoji: {
    fontSize: 25,
  },

  speciesInfo: {
    flex: 1,
  },

  speciesCount: {
    fontSize: 12,

    fontFamily: "PlusJakartaSans_600SemiBold",

    color: COLORS.darkGreen,
  },

  speciesPct: {
    fontSize: 11,

    fontFamily: "PlusJakartaSans_400Regular",

    color: COLORS.gold,

    marginTop: 2,
  },

  speciesSub: {
    fontSize: 9,

    fontFamily: "PlusJakartaSans_400Regular",

    color: COLORS.gray,

    marginTop: 1,
  },

  emptySpecies: {
    minHeight: 70,

    borderRadius: 10,

    borderWidth: 1,
    borderColor: COLORS.border,

    backgroundColor: COLORS.lightGray,

    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 20,
  },

  emptySpeciesText: {
    fontSize: 11,

    fontFamily: "PlusJakartaSans_400Regular",

    color: COLORS.gray,

    marginTop: 6,

    textAlign: "center",
  },

  /* ---------------------------------------------------------------------- */
  /* Activity Log                                                           */
  /* ---------------------------------------------------------------------- */

  logRow: {
    flexDirection: "row",

    alignItems: "center",

    backgroundColor: COLORS.white,

    borderRadius: 10,

    padding: 12,

    borderWidth: 1,
    borderColor: COLORS.border,
  },

  logRowSpacing: {
    marginBottom: 8,
  },

  logIconWrap: {
    width: 40,
    height: 40,

    borderRadius: 20,

    backgroundColor: COLORS.lightGold,

    alignItems: "center",
    justifyContent: "center",
  },

  logEmoji: {
    fontSize: 20,
  },

  logInfo: {
    flex: 1,

    marginLeft: 12,
  },

  logTitleRow: {
    flexDirection: "row",

    alignItems: "center",

    gap: 6,
  },

  logTime: {
    fontSize: 11,

    fontFamily: "PlusJakartaSans_400Regular",

    color: COLORS.gray,
  },

  logLabel: {
    fontSize: 13,

    fontFamily: "PlusJakartaSans_600SemiBold",

    color: COLORS.darkGreen,
  },

  logAgo: {
    fontSize: 10,

    fontFamily: "PlusJakartaSans_400Regular",

    color: COLORS.gray,

    marginTop: 2,
  },

  emptyActivity: {
    minHeight: 70,

    borderRadius: 10,

    borderWidth: 1,
    borderColor: COLORS.border,

    backgroundColor: COLORS.lightGray,

    alignItems: "center",
    justifyContent: "center",
  },

  emptyActivityText: {
    fontSize: 11,

    fontFamily: "PlusJakartaSans_400Regular",

    color: COLORS.gray,

    marginTop: 6,
  },
});