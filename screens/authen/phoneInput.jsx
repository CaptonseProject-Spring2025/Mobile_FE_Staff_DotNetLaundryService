import React, { useState, useEffect } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TextInput,
  Alert,
  TouchableOpacity,
} from "react-native";
import useAuthStore from "../../api/store/authStore";
import Ionicons from "react-native-vector-icons/Ionicons";
import { ActivityIndicator } from "react-native-paper";

const { width } = Dimensions.get("window");

const PhoneInput = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const { verifyOtpResetPassword, setResetPasswordData, isLoading } =
    useAuthStore();

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
    // 0912345678, 0123456789, 84912345678, +84912345678, etc.
    const phoneRegex = /^(0|\+84|84)([0-9]{1})([0-9]{7,9})$/;
    if (!phoneRegex.test(phoneNumber)) {
      setPhoneError("Số điện thoại không đúng định dạng");
      return false;
    }

    setPhoneError("");
    return true;
  };

  const handleContinue = async () => {
    const isPhoneValid = validatePhone();
    if (!isPhoneValid) {
      return;
    }

    // Store temp data
    setResetPasswordData({ phoneNumber });
    // Send OTP
    const result = await verifyOtpResetPassword(phoneNumber);

    if (result.success) {
      navigation.navigate("OtpVerify", { phoneNumber });
    } else {
      Alert.alert(
        "Lỗi",
        result.message || "Không thể gửi mã OTP. Vui lòng thử lại sau."
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white p-5">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 300 : 100}
        style={{ flex: 1 }}
      >
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <View style={styles.labelContainer}>
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
              keyboardType="number-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              onBlur={validatePhone}
              placeholder="Nhập số điện thoại (7-11 chữ số)"
            />
            {phoneError ? (
              <Text style={styles.errorText}>{phoneError}</Text>
            ) : null}
          </View>
          <TouchableOpacity
            style={[
              styles.continueButton,
              isLoading ? styles.continueButtonDisabled : null,
            ]}
            onPress={handleContinue}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.continueButtonText}>Tiếp tục</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
    paddingHorizontal: 5,
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
});

export default PhoneInput;
