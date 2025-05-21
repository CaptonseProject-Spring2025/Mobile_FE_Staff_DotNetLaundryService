import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import useAuthStore from "../../api/store/authStore";

const { width } = Dimensions.get("window");

const ResetPassword = ({ navigation }) => {
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const { resetPassword, isLoading, tempResetPasswordData, otpToken } =
    useAuthStore();

  const validatePassword = () => {
    if (!password) {
      setPasswordError("Vui lòng nhập mật khẩu");
      return false;
    }
    // Password validation: at least 8 chars, 1 special char, 1 letter, 1 number
    const passwordRegex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      setPasswordError(
        "Mật khẩu phải có ít nhất 8 ký tự, 1 chữ cái, 1 số và 1 ký tự đặc biệt"
      );
      return false;
    }
    setPasswordError("");
    return true;
  };

  const validateConfirmPassword = () => {
    if (!confirmPassword) {
      setConfirmPasswordError("Vui lòng xác nhận mật khẩu");
      return false;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError("Mật khẩu xác nhận không khớp");
      return false;
    }
    setConfirmPasswordError("");
    return true;
  };

  const handleResetPassword = async () => {
    const isValidPassword = validatePassword();
    const isValidConfirmPassword = validateConfirmPassword();
    if (!isValidPassword || !isValidConfirmPassword) {
      return;
    }
    // Call the API to reset the password
    try {
      const formData = {
        phoneNumber: tempResetPasswordData.phoneNumber,
        newPassword: password,
        otpToken: otpToken,
      };

      const result = await resetPassword(formData);
      console.log("Reset password result:", result);
      if (result.success) {
        Alert.alert(
          "Thành công",
          "Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập lại.",
          [
            {
              text: "OK",
              onPress: () => {
                navigation.navigate("Login");
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error("Error resetting password:", error.response.data.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "position"}
        style={{ flex: 1, alignItems: "center" }}
      >
        <View style={styles.inputContainer}>
          <View style={styles.inputContainer}>
            <View style={styles.labelContainer}>
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
                style={[styles.inputPassword]}
                secureTextEntry={!passwordVisible}
                value={password}
                onChangeText={setPassword}
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
                />
              </TouchableOpacity>
            </View>
            {passwordError ? (
              <Text style={styles.errorText}>{passwordError}</Text>
            ) : null}
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.labelContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={24}
                color="#333"
                style={styles.icon}
              />
              <Text style={styles.label}>XÁC NHẬN MẬT KHẨU</Text>
            </View>
            <View
              style={[
                styles.passwordContainer,
                confirmPasswordError ? styles.inputError : null,
              ]}
            >
              <TextInput
                style={[styles.inputPassword]}
                secureTextEntry={!confirmPasswordVisible}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onBlur={validateConfirmPassword}
                placeholder="Xác nhận mật khẩu"
              />
              <TouchableOpacity
                onPress={() =>
                  setConfirmPasswordVisible(!confirmPasswordVisible)
                }
              >
                <Ionicons
                  name={
                    confirmPasswordVisible ? "eye-outline" : "eye-off-outline"
                  }
                  size={24}
                  color="#333"
                />
              </TouchableOpacity>
            </View>
            {confirmPasswordError ? (
              <Text style={styles.errorText}>{confirmPasswordError}</Text>
            ) : null}
          </View>
        </View>
        <TouchableOpacity
          style={[
            styles.doneButton,
            isLoading ? styles.doneButtonDisabled : null,
          ]}
          onPress={handleResetPassword}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.doneButtonText}>Hoàn Tất</Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingVertical: 20,
  },
  header: {
    marginBottom: 30,
    marginTop: 45,
    marginLeft: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "black",
  },
  text: {
    fontSize: 16,
    color: "black",
    textAlign: "center",
  },
  formContainer: {
    width: "100%",
    alignItems: "center",
    paddingTop: 10,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  icon: {
    marginRight: 10,
  },
  inputContainer: {
    width: width * 0.9,
    marginBottom: 20,
    marginTop: 10,
  },
  continueButton: {
    backgroundColor: "#63B35C",
    paddingVertical: 15,
    borderRadius: 5,
    width: width * 0.8,
    maxWidth: 350,
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  continueButtonDisabled: {
    backgroundColor: "#a9d8a4",
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
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
  doneButton: {
    backgroundColor: "#63B35C",
    paddingVertical: 15,
    borderRadius: 5,
    width: width * 0.9,
    maxWidth: 350,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    alignSelf: "center",
  },
  doneButtonDisabled: {
    backgroundColor: "#a9d8a4",
  },
  doneButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#ccc",
    borderRadius: 0,
    paddingHorizontal: 10,
  },
  inputPassword: {
    flex: 1,
    height: 40,
    paddingHorizontal: 10,
  },
  continueButton: {
    backgroundColor: "#63B35C",
    paddingVertical: 15,
    borderRadius: 5,
    width: width * 0.9,
    maxWidth: 350,
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },
});

export default ResetPassword;
