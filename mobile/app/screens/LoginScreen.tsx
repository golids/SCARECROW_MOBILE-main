
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";

// Supabase Auth needs an email, so the username is turned into
// <username>@scarecrow.app behind the scenes.
const EMAIL_DOMAIN = "scarecrow.app";

function friendlyAuthError(message: string) {
  const m = message.toLowerCase();

  if (m.includes("invalid login credentials")) {
    return "Incorrect username or password.";
  }

  if (m.includes("email not confirmed")) {
    return "This account hasn't been confirmed yet. Please contact your administrator.";
  }

  return message;
}

export default function LoginScreen() {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showForgotBanner, setShowForgotBanner] = useState<boolean>(false);

  const passwordRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const router = useRouter();

  const params = useLocalSearchParams<{
    username?: string;
    phone?: string;
  }>();

  // Pre-fill username if coming from an older navigation route.
  useEffect(() => {
    const prefill = params.username ?? params.phone;

    if (prefill) {
      setUsername(prefill);
    }
  }, [params.username, params.phone]);

  const handleLogin = async () => {
    const cleanUsername = username.trim().toLowerCase();

    if (!cleanUsername || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    // Accept either a full email or a username.
    const isEmail = cleanUsername.includes("@");

    if (!isEmail && !/^[a-z0-9._-]+$/.test(cleanUsername)) {
      Alert.alert(
        "Error",
        "Username can only contain letters, numbers, dots, dashes and underscores."
      );
      return;
    }

    setLoading(true);

    try {
      const email = isEmail
        ? cleanUsername
        : `${cleanUsername}@${EMAIL_DOMAIN}`;

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        Alert.alert("Login Failed", friendlyAuthError(error.message));
        return;
      }

      // Successful login: navigate to the Home screen.
      router.replace("/(tabs)/Home");
    } catch (error) {
      Alert.alert(
        "Error",
        "Network error. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Admin-only app: password resets are handled by
  // the administrator or maintenance team.
  const handleForgotPassword = () => {
    setShowForgotBanner((visible) => !visible);
  };

    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar
          style="dark"

          hidden={false}
        />

        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
        >
          {/* Logo + App Name + Abbreviation */}
          <View style={styles.brandingContainer}>
            <Image
              source={require("../../assets/images/app-icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />

            <Text style={styles.appName}>
              SCARE<Text style={styles.appNameBold}>CROW</Text>
            </Text>

            <Text style={styles.abbrName}>
              Crop Reliable Operative Warden
            </Text>
          </View>

          {/* Login Card */}
          <View style={styles.loginCard}>
            <Text style={styles.title}>ADMIN PORTAL</Text>

            <Text style={styles.subtitle}>
              Authorized personnel only. Please sign in to continue.
            </Text>

            {/* Username and Password */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  placeholderTextColor="#808080"
                  value={username}
                  onChangeText={setUsername}
                  keyboardType="default"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="username"
                  textContentType="username"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  blurOnSubmit={false}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputWrapper}>
                <TextInput
                  ref={passwordRef}
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#808080"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="password"
                  textContentType="password"
                  returnKeyType="go"
                  onSubmitEditing={handleLogin}
                  editable={!loading}
                />

                {/* Show / Hide Password */}
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={
                      showPassword
                        ? "eye-off-outline"
                        : "eye-outline"
                    }
                    size={22}
                    color="#4F8F3A"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotContainer}
              onPress={handleForgotPassword}
              disabled={loading}
            >
              <Text style={styles.forgotText}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

            {/* Forgot Password Information Banner */}
            {showForgotBanner && (
              <View
                style={styles.banner}
                accessibilityLiveRegion="polite"
              >
                <Ionicons
                  name="information-circle"
                  size={22}
                  color="#4F8F3A"
                  style={styles.bannerIcon}
                />

                <Text style={styles.bannerText}>
                  Please contact your{" "}
                  <Text style={styles.bannerBold}>
                    Administrator
                  </Text>{" "}
                  or the{" "}
                  <Text style={styles.bannerBold}>
                    Maintenance team
                  </Text>{" "}
                  to have your password reset.
                </Text>

                <TouchableOpacity
                  onPress={() => setShowForgotBanner(false)}
                  hitSlop={{
                    top: 10,
                    bottom: 10,
                    left: 10,
                    right: 10,
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="close"
                    size={18}
                    color="#123B25"
                  />
                </TouchableOpacity>
              </View>
            )}

            {/* Login Button */}
            <TouchableOpacity
              style={[
                styles.loginButton,
                loading && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator
                  color="#FFFFFF"
                  size="small"
                />
              ) : (
                <Text style={styles.loginButtonText}>
                  LOG IN
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Main screen background
  screen: {
    flex: 1,
    backgroundColor: "#F7F9E9",
  },

  container: {
    flex: 1,
    backgroundColor: "#F7F9E9",
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    paddingVertical: 20,
  },

  // Branding
  brandingContainer: {
    alignItems: "center",
    marginTop: 15,
    marginBottom: 30,
  },

  logo: {
    width: 180,
    height: 180,
    marginBottom: 8,
  },

  appName: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 42,
    letterSpacing: 3,
    color: "#123B25",
    textAlign: "center",
  },

  appNameBold: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontWeight: "700",
  },

  abbrName: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 15,
    letterSpacing: 1,
    color: "#123B25",
    textAlign: "center",
    marginTop: 4,
    opacity: 0.85,
  },

  // Login Card
  loginCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E5E9D2",
    elevation: 3,
    shadowColor: "#123B25",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },

  title: {
    fontSize: 25,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#123B25",
    marginBottom: 5,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_400Regular",
    color: "#808080",
    marginBottom: 20,
    textAlign: "center",
    paddingHorizontal: 10,
    lineHeight: 23,
  },

  // Input Fields
  inputContainer: {
    marginBottom: 16,
  },

  inputWrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    width: "95%",
    alignSelf: "center",
    height: 50,
    borderColor: "#E5E9D2",
    flexDirection: "row",
    alignItems: "center",
  },

  input: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontSize: 15,
    fontFamily: "PlusJakartaSans_400Regular",
    color: "#123B25",
  },

  eyeIcon: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "transparent",
  },

  // Forgot Password
  forgotContainer: {
    alignItems: "flex-end",
    marginTop: -10,
    right: 12,
    marginBottom: 20,
  },

  forgotText: {
    color: "#123B25",
    fontSize: 14,
    fontFamily: "PlusJakartaSans_500Medium",
  },

  // Forgot Password Banner
  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#F7F9E9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#4F8F3A",
    padding: 12,
    width: "95%",
    alignSelf: "center",
    marginTop: -8,
    marginBottom: 30,
  },

  bannerIcon: {
    marginTop: 1,
  },

  bannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "PlusJakartaSans_400Regular",
    color: "#123B25",
  },

  bannerBold: {
    fontFamily: "PlusJakartaSans_600SemiBold",
  },

  // Login Button
  loginButton: {
    backgroundColor: "#4F8F3A",
    borderRadius: 12,
    paddingVertical: 6,
    alignItems: "center",
    marginTop: -10,
    marginBottom: 10,
    width: "60%",
    height: 52,
    alignSelf: "center",
    justifyContent: "center",
  },

  loginButtonDisabled: {
    opacity: 0.7,
  },

  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "PlusJakartaSans_600SemiBold",
    letterSpacing: 0.5,
  },
});