import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import useAuthStore from "../../api/store/authStore";

export function OtpVerifyScreen({ navigation, route }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]); // Changed to 6 digits
  const [timer, setTimer] = useState(30);
  const inputRefs = useRef([]);
  const intervalRef = useRef(null);

  const { phoneNumber } = route.params || {};
  const { verifyOtp, resendOtp, isLoading } = useAuthStore();

  // Clear the interval on unmount
  useEffect(() => {
    startTimer();
    return () => clearInterval(intervalRef.current);
  }, []);

  // Start the timer
  const startTimer = () => {
    clearInterval(intervalRef.current);
    setTimer(30);
    intervalRef.current = setInterval(() => {
      setTimer((prevTimer) => {
        if (prevTimer <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return prevTimer - 1;
      });
    }, 1000);
  };

  // Handle Resend Code button press
  const handleResendCode = async () => {
    if (phoneNumber) {
      const result = await resendOtp(phoneNumber);

      if (result.success) {
        startTimer();
        Alert.alert("Thông báo", "Mã OTP đã được gửi lại");
      } else {
        Alert.alert("Lỗi", result.message || "Không thể gửi lại mã OTP");
      }
    }
  };

  // Handle OTP input change
  const handleChangeText = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    // Automatically focus on the next input if the current is filled
    if (text && index < 5) {
      const nextInput = index + 1;
      inputRefs.current[nextInput].focus();
    }
  };

  // Handle backspace key press to move focus to the previous input
  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && otp[index] === "") {
      if (index > 0) {
        const prevInput = index - 1;
        inputRefs.current[prevInput].focus();
      }
    }
  };

  // Submit OTP verification
  const handleVerifyOtp = async () => {
    const otpCode = otp.join("");

    if (otpCode.length !== 6) {
      Alert.alert("Lỗi", "Vui lòng nhập đủ mã OTP 6 chữ số");
      return;
    }

    const result = await verifyOtp(phoneNumber, otpCode);

    if (result.success) {
      navigation.navigate("ResetPassword");
    } else {
      Alert.alert("Lỗi", result.message || "Mã OTP không chính xác");
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons
          name="arrow-back-outline"
          size={24}
          color="#333"
          style={styles.icon}
        />
      </TouchableOpacity>

      <Text style={styles.title}>Xác minh số điện thoại</Text>
      <Text style={styles.subtitle}>
        Mã đã được gửi tới zalo số điện thoại{" "}
        {phoneNumber
          ? `${phoneNumber.substring(0, 4)}****${phoneNumber.slice(-4)}`
          : ""}
      </Text>

      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(input) => (inputRefs.current[index] = input)}
            style={styles.otpInput}
            keyboardType="number-pad"
            maxLength={1}
            onChangeText={(text) => handleChangeText(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            value={digit}
          />
        ))}
      </View>

      <Text style={styles.timerText}>
        Không nhận được mã?{" "}
        <Text style={styles.timer}>
          00 : {timer.toString().padStart(2, "0")}
        </Text>
      </Text>

      <TouchableOpacity
        style={[styles.resendButton, timer > 0 && styles.resendButtonDisabled]}
        disabled={timer > 0 || isLoading}
        onPress={handleResendCode}
      >
        <Text
          style={[styles.resendText, timer > 0 && styles.resendTextDisabled]}
        >
          Gửi lại mã
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.verifyButton, isLoading && styles.verifyButtonDisabled]}
        onPress={handleVerifyOtp}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.verifyText}>Xác minh</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    padding: 20,
  },
  backButton: {
    alignSelf: "flex-start",
    marginVertical: 40,
  },
  icon: {
    marginRight: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#63B35C",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 30,
    textAlign: "center",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
    marginBottom: 20,
  },
  otpInput: {
    borderBottomWidth: 2,
    borderBottomColor: "#ccc",
    fontSize: 18,
    textAlign: "center",
    width: 40,
    height: 50,
  },
  timerText: {
    color: "#666",
    fontSize: 14,
  },
  timer: {
    color: "#000",
    fontWeight: "bold",
  },
  resendButton: {
    marginTop: 10,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendText: {
    color: "#63B35C",
    fontSize: 16,
    fontWeight: "bold",
  },
  resendTextDisabled: {
    color: "#ccc",
  },
  verifyButton: {
    marginTop: 30,
    backgroundColor: "#63B35C",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 30,
    width: 200,
    alignItems: "center",
    justifyContent: "center",
    height: 45,
  },
  verifyButtonDisabled: {
    backgroundColor: "#a9d8a4",
  },
  verifyText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
