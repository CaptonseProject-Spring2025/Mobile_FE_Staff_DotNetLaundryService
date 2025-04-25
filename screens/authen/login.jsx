import React, { useState } from "react";
import {
  Platform,
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import useAuthStore from "../../api/store/authStore";
import useNotificationStore from "../../api/store/notificationStore";
const { width } = Dimensions.get("window");

export default function LoginScreen({ navigation }) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loginError, setLoginError] = useState("");
  const { login, isLoading } = useAuthStore();
  const { saveToken } = useNotificationStore();

  const validatePhone = () => {
    if (!phoneNumber) {
      setPhoneError("Vui lòng nhập số điện thoại");
      return false;
    }

    // Remove any non-digit characters
    const digitsOnly = phoneNumber.replace(/\D/g, "");

    // Check length requirements (7-11 digits)
    if (digitsOnly.length < 7) {
      setPhoneError("Số điện thoại phải có ít nhất 7 chữ số");
      return false;
    }

    if (digitsOnly.length > 11) {
      setPhoneError("Số điện thoại không được vượt quá 11 chữ số");
      return false;
    }

    // Basic format validation for Vietnamese phone numbers
    // This allows for formats like:
    // 0912345678, 0123456789, 84912345678, +84912345678, etc.
    const phoneRegex = /^(0|\+84|84)([0-9]{1})([0-9]{7,9})$/;
    if (!phoneRegex.test(phoneNumber)) {
      setPhoneError("Số điện thoại không đúng định dạng");
      return false;
    }

    setPhoneError("");
    return true;
  };

  const validatePassword = () => {
    if (!password) {
      setPasswordError("Vui lòng nhập mật khẩu");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const handleLogin = async () => {
    setLoginError("");
    setIsLoading(true); // Start loading

    const isPhoneValid = validatePhone();
    const isPasswordValid = validatePassword();

    if (!isPhoneValid || !isPasswordValid) {
      setIsLoading(false);
      return;
    }

    try {
      const result = await login(phoneNumber, password);
      if (!result || !result.success) {
        setLoginError(result?.message || "Sai số điện thoại hoặc mật khẩu");
      } else {
        const userRole = useAuthStore.getState().userDetail?.role;

        if (userRole === "Customer" || userRole === "Admin") {
          // User has an invalid role for this app
          const logout = useAuthStore.getState().logout;
          await logout(); // Log them out immediately
          Alert.alert(
            "Lỗi Đăng Nhập",
            "Bạn không có quyền đăng nhập vào ứng dụng này."
          );
        } else {
          try {
            await saveToken(result.userId);
          } catch (tokenError) {
            console.error("Token save error:", tokenError);
            setLoginError("Đã xảy ra lỗi khi lưu thông tin đăng nhập.");
          }
        }
      }
    } catch (error) {
      // Catch errors specifically from the login API call
      console.error("Login API error:", error);
      setLoginError(
        "Đã xảy ra lỗi trong quá trình đăng nhập. Vui lòng thử lại."
      );
    } finally {
      // This block will always execute, ensuring loading state is reset
      setIsLoading(false);
    }
  };

  // Format phone number as user types
  const handlePhoneChange = (text) => {
    // Allow only digits, '+', and leading spaces
    const formattedText = text.replace(/[^\d+\s]/g, "");
    setPhoneNumber(formattedText);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 300 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inputContainer}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons
              name="call-outline"
              size={24}
              color="#333"
              style={styles.icon}
            />
            <Text style={styles.label}>SỐ ĐIỆN THOẠI</Text>
          </View>
          <TextInput
            style={[styles.input, phoneError ? styles.inputError : null]}
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={handlePhoneChange}
            onBlur={validatePhone}
            placeholder="Nhập số điện thoại (7-11 chữ số)"
          />
          {phoneError ? (
            <Text style={styles.errorText}>{phoneError}</Text>
          ) : null}
        </View>

        <View style={styles.inputContainer}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons
              name="lock-closed-outline"
              size={24}
              color="#333"
              style={styles.icon}
            />
            <Text style={styles.label}>MẬT KHẨU</Text>
          </View>
          <View
            style={[
              styles.passwordContainer,
              passwordError ? styles.inputError : null,
            ]}
          >
            <TextInput
              style={[styles.inputPassword, { flex: 1 }]}
              secureTextEntry={!passwordVisible}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                // Clear login error when user starts typing again
                if (loginError) setLoginError("");
              }}
              onBlur={validatePassword}
              placeholder="Nhập mật khẩu"
            />
            <TouchableOpacity
              onPress={() => setPasswordVisible(!passwordVisible)}
            >
              <Ionicons
                name={passwordVisible ? "eye-outline" : "eye-off-outline"}
                size={24}
                color="#333"
                style={styles.icon}
              />
            </TouchableOpacity>
          </View>
          {passwordError ? (
            <Text style={styles.errorText}>{passwordError}</Text>
          ) : loginError ? (
            <Text style={styles.errorText}>{loginError}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={[
            styles.loginButton,
            isLoading ? styles.loginButtonDisabled : null,
          ]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>Đăng Nhập</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    width: width * 1,
  },
  scrollContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  icon: {
    marginRight: 10,
  },
  inputContainer: {
    width: width * 0.9,
    marginBottom: 20,
    marginTop: 10,
    paddingHorizontal: 5,
  },
  label: {
    marginVertical: 5,
    fontSize: 16,
    color: "#333",
  },
  input: {
    height: 40,
    borderBottomWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  inputError: {
    borderColor: "red",
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 5,
  },
  inputPassword: {
    height: 40,
    paddingHorizontal: 5,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    paddingHorizontal: 5,
  },
  loginButton: {
    backgroundColor: "#63B35C",
    paddingVertical: 15,
    borderRadius: 5,
    width: width * 0.9,
    alignItems: "center",
    marginBottom: 20,
  },
  loginButtonDisabled: {
    backgroundColor: "#a9d8a4",
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
