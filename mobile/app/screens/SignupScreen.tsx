import React, { useState } from "react";
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
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabase";

export default function SignUpScreen() {
  const [name, setName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [province, setProvince] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [barangay, setBarangay] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async () => {
    // Validation checks
    if (
      !name.trim() ||
      !contactNumber.trim() ||
      !province.trim() ||
      !municipality.trim() ||
      !barangay.trim() ||
      !password.trim()
    ) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    // Validate phone number (basic validation)
    if (contactNumber.length < 10) {
      Alert.alert("Error", "Please enter a valid contact number (at least 10 digits)");
      return;
    }

    setLoading(true);

    try {
      // Automatically append domain to contact number
      const email = `${contactNumber.trim()}@scarecrow.app`;

      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: name.trim(),
            contact_number: contactNumber.trim(),
            province: province.trim(),
            municipality: municipality.trim(),
            barangay: barangay.trim(),
          },
        },
      });

      if (error) {
        Alert.alert("Sign Up Failed", error.message);
        return;
      }

      // If signup successful and user exists, update the profile with complete address
      if (data.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert(
            {
              id: data.user.id,
              full_name: name.trim(),
              contact_number: contactNumber.trim(),
              province: province.trim(),
              municipality: municipality.trim(),
              barangay: barangay.trim(),
            },
            {
              onConflict: "id",
            }
          );

        if (profileError) {
          console.warn("Profile update error:", profileError.message);
        }
      }

      // Since email confirmation is disabled, we can offer to log them in immediately
      Alert.alert(
        "Success",
        "Account created successfully! Would you like to log in now?",
        [
          {
            text: "Login Now",
            onPress: () => {
              // Automatically fill login screen with phone number
              router.replace({
                pathname: "/screens/LoginScreen",
                params: { phone: contactNumber.trim() }, // Pre-fill phone number
              });
            },
          },
          {
            text: "Later",
            style: "cancel",
          },
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require("../../assets/images/index-bg.png")}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
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

            {/* Sign up card */}
            <View style={styles.signUpCard}>
              {/* Title */}
              <Text style={styles.title}>SIGN UP</Text>
              <Text style={styles.subtitle}>Please fill-in the details</Text>

              {/* Form */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="NAME"
                    placeholderTextColor="#808080"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    editable={!loading}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="CONTACT NUMBER"
                    placeholderTextColor="#808080"
                    value={contactNumber}
                    onChangeText={setContactNumber}
                    keyboardType="phone-pad"
                    editable={!loading}
                  />
                </View>

                {/* Hint text for phone number format */}
                {contactNumber.length > 0 && (
                  <Text style={styles.hintText}>
                    You'll use {contactNumber} to log in
                  </Text>
                )}

                <Text style={styles.sectionLabel}>ADDRESS</Text>

                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="PROVINCE"
                    placeholderTextColor="#808080"
                    value={province}
                    onChangeText={setProvince}
                    autoCapitalize="words"
                    editable={!loading}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="MUNICIPALITY / CITY"
                    placeholderTextColor="#808080"
                    value={municipality}
                    onChangeText={setMunicipality}
                    autoCapitalize="words"
                    editable={!loading}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="BARANGAY"
                    placeholderTextColor="#808080"
                    value={barangay}
                    onChangeText={setBarangay}
                    autoCapitalize="words"
                    editable={!loading}
                  />
                </View>

                <View style={[styles.inputWrapper, styles.passwordWrapper]}>
                  <TextInput
                    style={styles.input}
                    placeholder="CREATE PASSWORD"
                    placeholderTextColor="#808080"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoComplete="password-new"
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Sign Up Button */}
              <TouchableOpacity
                style={[styles.signUpButton, loading && styles.signUpButtonDisabled]}
                onPress={handleSignUp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.signUpButtonText}>SIGN UP</Text>
                )}
              </TouchableOpacity>

              {/* Login Link */}
              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <TouchableOpacity
                  onPress={() => router.replace("/screens/LoginScreen")}
                  disabled={loading}
                >
                  <Text style={styles.loginLink}>Log In</Text>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 40,
    justifyContent: "center",
  },
  brandingContainer: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 12,
  },
  appName: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 30,
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
    fontSize: 15,
    letterSpacing: 1.2,
    color: "#004E00",
    textAlign: "center",
    marginTop: 4,
    opacity: 0.85,
  },
  signUpCard: {
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
    textAlign: "center",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "PlusJakartaSans_400Regular",
    color: "#000000",
    textAlign: "center",
    marginBottom: 20,
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
  },
  passwordWrapper: {
    marginTop: 8,
  },
  input: {
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontSize: 15,
    fontFamily: "PlusJakartaSans_400Regular",
    color: "#000000",
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
  sectionLabel: {
    fontSize: 12,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: "#4F8F3A",
    marginLeft: "2.5%",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  signUpButton: {
    backgroundColor: "#4F8F3A",
    borderRadius: 18,
    paddingVertical: 6,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 20,
    width: "40%",
    height: 55,
    alignSelf: "center",
    borderWidth: 1.5,
    borderColor: "#123B25",
    justifyContent: "center",
  },
  signUpButtonDisabled: {
    opacity: 0.7,
  },
  signUpButtonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontFamily: "PlusJakartaSans_600SemiBold",
    letterSpacing: 0.5,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  loginText: {
    color: "#000000",
    fontSize: 15,
    fontFamily: "PlusJakartaSans_400Regular",
  },
  loginLink: {
    color: "#30ac07",
    fontSize: 15,
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
});