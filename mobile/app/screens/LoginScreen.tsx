
import React, { useRef, useState } from "react";
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
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";

const EMAIL_DOMAIN = "scarecrow.app";

function friendlyAuthError(message: string) {
  const value = message.toLowerCase();

  if (value.includes("invalid login credentials")) {
    return "Incorrect username or password. Please check your login details.";
  }

  if (value.includes("email not confirmed")) {
    return "Your account has not been confirmed. Please contact the administrator.";
  }

  return message;
}

export default function LoginScreen() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotInfo, setShowForgotInfo] = useState(false);

  const passwordRef = useRef<React.ElementRef<typeof TextInput>>(null);

  const handleLogin = async () => {
    const cleanUsername = username.trim().toLowerCase();

    if (!cleanUsername || !password) {
      Alert.alert("Missing information", "Enter your username and password.");
      return;
    }

    const validUsername = /^[a-z0-9._-]+$/.test(cleanUsername);

    if (!validUsername) {
      Alert.alert(
        "Invalid username",
        "Enter the username provided by your administrator."
      );
      return;
    }

    setLoading(true);

    try {
      const email = `${cleanUsername}@${EMAIL_DOMAIN}`;

      const { error: loginError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (loginError) {
        Alert.alert("Login failed", friendlyAuthError(loginError.message));
        return;
      }

      // Keep administrator accounts out of the Client App.
      const { data: isAdmin, error: roleError } =
        await supabase.rpc("is_scarecrow_admin");

      if (roleError) {
        await supabase.auth.signOut();

        Alert.alert(
          "Account verification failed",
          "We could not verify your account type. Please try again or contact the administrator."
        );
        return;
      }

      if (isAdmin === true) {
        await supabase.auth.signOut();

        Alert.alert(
          "Administrator account",
          "This account belongs to the administrator. Please use the ScareCROW Admin Web App."
        );
        return;
      }

      router.replace("/(tabs)/Home");
    } catch (error: any) {
      console.error("Client login error:", error);

      await supabase.auth.signOut();

      Alert.alert(
        "Connection error",
        error?.message ||
          "Unable to sign in. Check your internet connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.branding}>
            <Image
              source={require("../../assets/images/app-icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />

            <Text style={styles.appName}>
              SCARE<Text style={styles.appNameBold}>CROW</Text>
            </Text>

            <Text style={styles.tagline}>
              Crop Reliable Operative Warden
            </Text>
          </View>

          <View style={styles.loginCard}>
            <View style={styles.heading}>
              <Text style={styles.title}>CLIENT LOGIN</Text>
              <Text style={styles.subtitle}>
                Sign in to monitor your assigned ScareCROW devices.
              </Text>
            </View>

            <Text style={styles.label}>Username</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="person-outline"
                size={19}
                color="#808080"
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your username"
                placeholderTextColor="#999999"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                editable={!loading}
              />
            </View>

            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="lock-closed-outline"
                size={19}
                color="#808080"
              />
              <TextInput
                ref={passwordRef}
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#999999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                returnKeyType="go"
                onSubmitEditing={handleLogin}
                editable={!loading}
              />

              <TouchableOpacity
                onPress={() => setShowPassword((value) => !value)}
                disabled={loading}
                hitSlop={10}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={21}
                  color="#4F8F3A"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.forgotButton}
              onPress={() => setShowForgotInfo((value) => !value)}
              disabled={loading}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {showForgotInfo && (
              <View style={styles.infoBox}>
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color="#4F8F3A"
                />
                <Text style={styles.infoText}>
                  Please contact your administrator to request a password reset.
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.loginButton,
                loading && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>SIGN IN</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.footerNote}>
              Your account must be created by a ScareCROW administrator.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7F9E9",
  },
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 23,
    paddingVertical: 25,
  },
  branding: {
    alignItems: "center",
    marginBottom: 25,
  },
  logo: {
    width: 145,
    height: 145,
    marginBottom: 5,
  },
  appName: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 37,
    letterSpacing: 3,
    color: "#123B25",
  },
  appNameBold: {
    fontFamily: "PlusJakartaSans_700Bold",
  },
  tagline: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 11,
    color: "#123B25",
    marginTop: 4,
  },
  loginCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#E5E9D2",
    padding: 21,
    elevation: 3,
    shadowColor: "#123B25",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  heading: {
    alignItems: "center",
    marginBottom: 23,
  },
  title: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 22,
    color: "#123B25",
  },
  subtitle: {
    fontFamily: "PlusJakartaSans_400Regular",
    color: "#808080",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 6,
  },
  label: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 11,
    color: "#123B25",
    marginBottom: 7,
  },
  inputWrapper: {
    minHeight: 49,
    borderWidth: 1,
    borderColor: "#E5E9D2",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 9,
    marginBottom: 17,
  },
  input: {
    flex: 1,
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    color: "#123B25",
    paddingVertical: 10,
  },
  forgotButton: {
    alignSelf: "flex-end",
    marginTop: -7,
    marginBottom: 17,
  },
  forgotText: {
    color: "#123B25",
    fontSize: 11,
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F7F9E9",
    borderWidth: 1,
    borderColor: "#E5E9D2",
    borderRadius: 10,
    padding: 11,
    marginBottom: 15,
  },
  infoText: {
    flex: 1,
    color: "#123B25",
    fontSize: 10,
    lineHeight: 16,
  },
  loginButton: {
    height: 49,
    borderRadius: 11,
    backgroundColor: "#4F8F3A",
    alignItems: "center",
    justifyContent: "center",
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "PlusJakartaSans_700Bold",
    letterSpacing: 0.5,
  },
  footerNote: {
    color: "#808080",
    fontSize: 9,
    lineHeight: 14,
    textAlign: "center",
    marginTop: 16,
  },
});