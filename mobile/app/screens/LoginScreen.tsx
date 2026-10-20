import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
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

  const passwordRef = useRef<TextInput>(null);
  const router = useRouter();
  const params = useLocalSearchParams<{ username?: string; phone?: string }>();

  // Pre-fill username if coming from signup (still accepts the old `phone` param)
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

    // A full email is also accepted; otherwise only characters that are
    // valid in the first part of an email address.
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
      const email = isEmail ? cleanUsername : `${cleanUsername}@${EMAIL_DOMAIN}`;

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        Alert.alert("Login Failed", friendlyAuthError(error.message));
        return;
      }

      // Logged in — go straight to the app
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

  const handleSignUp = () => {
    router.push("/screens/SignupScreen");
  };

  // Admin-only app: passwords are reset by the administrator / maintenance,
  // so just show a banner instead of sending a reset email.
  const handleForgotPassword = () => {
    setShowForgotBanner((visible) => !visible);
  };

  return (
    <ImageBackground
      source={require("../../assets/images/index-bg.png")}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Logo + App Name + Abbreviation */}
            <View style={styles.brandingContainer}>
              <Image
                source={require("../../assets/images/app-logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.appName}>
                SCARE<Text style={styles.appNameBold}>CROW</Text>
              </Text>
              <Text style={styles.abbrName}>Crop Reliable Operative Warden</Text>
            </View>

            {/* Login card */}
            <View style={styles.loginCard}>
              <Text style={styles.title}>ADMIN PORTAL</Text>
              <Text style={styles.subtitle}>
                Authorized personnel only. Please sign in to continue.
              </Text>

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
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={22}
                      color="#4F8F3A"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.forgotContainer}
                onPress={handleForgotPassword}
                disabled={loading}
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>

              {/* Forgot password banner */}
              {showForgotBanner && (
                <View style={styles.banner} accessibilityLiveRegion="polite">
                  <Ionicons
                    name="information-circle"
                    size={22}
                    color="#4F8F3A"
                    style={styles.bannerIcon}
                  />

                  <Text style={styles.bannerText}>
                    Please contact your{" "}
                    <Text style={styles.bannerBold}>Administrator</Text> or the{" "}
                    <Text style={styles.bannerBold}>Maintenance team</Text> to have
                    your password reset.
                  </Text>

                  <TouchableOpacity
                    onPress={() => setShowForgotBanner(false)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={18} color="#123B25" />
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.loginButtonText}>LOG IN</Text>
                )}
              </TouchableOpacity>

              <View style={styles.signUpContainer}>
                <Text style={styles.signUpText}>Don't have account? </Text>
                <TouchableOpacity onPress={handleSignUp} disabled={loading}>
                  <Text style={styles.signUpLink}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
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
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  brandingContainer: {
    alignItems: "center",
    marginTop: 15,
    marginBottom: 30,
  },
  logo: {
    width: 300,
    height: 300,
    marginBottom: 12,
  },
  appName: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 50,
    letterSpacing: 3,
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
    letterSpacing: 1.2,
    color: "#004E00",
    textAlign: "center",
    marginTop: 4,
    opacity: 0.85,
  },
  loginCard: {
    backgroundColor: "rgba(232, 240, 184, 0.35)",
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  title: {
    fontSize: 25,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#000000",
    marginBottom: 5,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "PlusJakartaSans_400Regular",
    color: "#000000",
    marginBottom: 20,
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 30,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    backgroundColor: "rgba(255, 255, 255, 0.35)",
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1.5,
    width: "95%",
    alignSelf: "center",
    height: 50,
    borderColor: "#123B25",
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontSize: 15,
    fontFamily: "PlusJakartaSans_400Regular",
    color: "#000000",
  },
  eyeIcon: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "transparent",
  },
  forgotContainer: {
    alignItems: "flex-end",
    marginTop: -10,
    right: 12,
    marginBottom: 20,
  },
  forgotText: {
    color: "#4F8F3A",
    fontSize: 15,
    fontFamily: "PlusJakartaSans_500Medium",
  },
  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
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
  loginButton: {
    backgroundColor: "#4F8F3A",
    borderRadius: 18,
    paddingVertical: 6,
    alignItems: "center",
    marginTop: -10,
    marginBottom: 20,
    width: "40%",
    height: 55,
    alignSelf: "center",
    borderWidth: 1.5,
    borderColor: "#123B25",
    justifyContent: "center",
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontFamily: "PlusJakartaSans_600SemiBold",
    letterSpacing: 0.5,
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 12,
  },
  signUpText: {
    color: "#000000",
    fontSize: 15,
    fontFamily: "PlusJakartaSans_400Regular",
  },
  signUpLink: {
    color: "#30ac07",
    fontSize: 15,
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
});