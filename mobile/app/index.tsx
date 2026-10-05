import { useEffect, useRef } from "react";
import { View, ImageBackground, StyleSheet, Text, Animated, Easing } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useFonts, PlusJakartaSans_400Regular, PlusJakartaSans_700Bold } from "@expo-google-fonts/plus-jakarta-sans";

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

    // Redirect after 3 seconds (no out animation)
    const timer = setTimeout(() => {
      router.push("/screens/LoginScreen");
    }, 5000);

    return () => clearTimeout(timer);
  }, [router, fontsLoaded]);

  return (
    <ImageBackground
      source={require("../assets/images/index-bg.png")}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
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

          {/* App Name + Abbreviation */}
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
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 300,
    height: 300,
    marginTop: -200,
    marginBottom: 25,
  },
  textContainer: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  appName: {
    fontFamily: "PlusJakartaSans_500Regular",
    fontSize: 50,
    letterSpacing: 5,
    color: "#004E00",
    textAlign: "center",
  },
  appNameBold: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontWeight: "700",
  },
  abbrName: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 20,
    letterSpacing: 1.5,
    color: "#004E00",
    textAlign: "center",
    marginTop: 8,
    opacity: 0.85,
  },
});