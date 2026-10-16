import React, { useState, useEffect } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string }>();

  // Pre-fill phone number if coming from signup
  useEffect(() => {
    if (params.phone) {
      setPhoneNumber(params.phone);
    }
  }, [params.phone]);

  const handleLogin = async () => {
    if (!phoneNumber.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    // Basic phone number validation
    if (phoneNumber.length < 10) {
      Alert.alert("Error", "Please enter a valid phone number");
      return;
    }

    setLoading(true);

    try {
      // Automatically append domain to phone number
      const email = `${phoneNumber.trim()}@scarecrow.app`;

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        Alert.alert("Login Failed", error.message);
      } else {
        // Login successful
        Alert.alert("Success", "Logged in successfully!", [
          {
            text: "OK",
            onPress: () => router.replace("/(tabs)/Home"),
          },
        ]);
      }
    } catch (error) {
      Alert.alert("Error", "Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = () => {
    router.push("/screens/SignupScreen");
  };

  const handleForgotPassword = () => {
    if (!phoneNumber.trim()) {
      Alert.alert("Error", "Please enter your phone number to reset password");
      return;
    }

    Alert.alert(
      "Reset Password",
      `A reset link will be sent to ${phoneNumber}@scarecrow.app`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send",
          onPress: async () => {
            setLoading(true);
            try {
              const email = `${phoneNumber.trim()}@scarecrow.app`;
              const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: "yourapp://reset-password", // Update this with your app scheme
              });

              if (error) {
                Alert.alert("Error", error.message);
              } else {
                Alert.alert(
                  "Password Reset",
                  "If this phone number is registered, you will receive password reset instructions."
                );
              }
            } catch (error) {
              Alert.alert("Error", "Network error. Please try again.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleSocialLogin = (provider: string) => {
    Alert.alert("Info", `${provider} login coming soon!`);
  };

  return (
    <ImageBackground
      source={require("../../assets/images/index-bg.png")}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
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
            <Text style={styles.title}>LOG IN NOW</Text>
            <Text style={styles.subtitle}>
              Please log-in your account to continue using our app
            </Text>

            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number"
                  placeholderTextColor="#808080"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>

              {/* Hint text showing the actual login format */}
              {phoneNumber.length > 0 && (
                <Text style={styles.hintText}>
                  You'll login as: {phoneNumber}@scarecrow.app
                </Text>
              )}

              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#808080"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
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
              <Text style={styles.forgotText}>Forgot Password</Text>
            </TouchableOpacity>

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

            <Text style={styles.orContinueText}>or continue with</Text>

            <View style={styles.socialContainer}>
              <TouchableOpacity onPress={() => handleSocialLogin("Facebook")} disabled={loading}>
                <Image
                  source={require("../../assets/images/fb-icon.png")}
                  style={styles.socialIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => handleSocialLogin("Google")} disabled={loading}>
                <Image
                  source={require("../../assets/images/gmail-icon.png")}
                  style={styles.socialIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    flex: 1,
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
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  title: {
    fontSize: 30,
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
  hintText: {
    fontSize: 10,
    fontFamily: "PlusJakartaSans_400Regular",
    color: "#4F8F3A",
    marginLeft: "5%",
    marginTop: -8,
    marginBottom: 8,
    fontStyle: "italic",
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
  orContinueText: {
    color: "#000000",
    fontSize: 13,
    fontFamily: "PlusJakartaSans_400Regular",
    textAlign: "center",
    marginBottom: 8,
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  socialIcon: {
    width: 70,
    height: 70,
  },
});