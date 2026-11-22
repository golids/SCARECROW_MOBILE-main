
import { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Text,
  Animated,
  Easing,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";

const COLORS = {
  background: "#F7F9E9",
  darkGreen: "#123B25",
  primary: "#4F8F3A",
  lightGreen: "#E8F0B8",
};

export default function Index() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Animation values
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    if (!fontsLoaded) return;

    // Entrance animations
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 60,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Redirect after 2 seconds
    const timer = setTimeout(() => {
      router.replace("/screens/LoginScreen");
    }, 2000);

    return () => clearTimeout(timer);
  }, [
    router,
    fontsLoaded,
    logoOpacity,
    logoScale,
    textOpacity,
    textTranslateY,
  ]);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      {/* Phone Status Bar */}
      <StatusBar
        style="dark"
        hidden={false}
      />

      <View style={styles.content}>
        {/* Logo */}
        <Animated.Image
          source={require("../assets/images/app-logo.png")}
          style={[
            styles.logo,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
          resizeMode="contain"
        />

        {/* App Name and Abbreviation */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: textOpacity,
              transform: [{ translateY: textTranslateY }],
            },
          ]}
        >
          <Text style={styles.appName}>
            SCARE<Text style={styles.appNameBold}>CROW</Text>
          </Text>

          <Text style={styles.abbrName}>
            Crop Reliable Operative Warden
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 500,
    height: 500,
    marginBottom: -100,
    marginTop: -200,
    marginRight: -50,
  },
  textContainer: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  appName: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 50,
    letterSpacing: 5,
    color: COLORS.darkGreen,
    textAlign: "center",
  },
  appNameBold: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontWeight: "700",
    color: COLORS.primary,
  },
  abbrName: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 20,
    letterSpacing: 1.5,
    color: COLORS.darkGreen,
    textAlign: "center",
    marginTop: 8,
    opacity: 0.85,
  },
});