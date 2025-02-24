import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { Image } from "expo-image";
const { width } = Dimensions.get("window");
export function LoginScreen({ navigation }) {
  const [passwordVisible, setPasswordVisible] = useState(false);

  const handleLogin = () => {
    navigation.navigate("Driver");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="position">
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
            <TextInput style={styles.input} keyboardType="number-pad" />
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
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.inputPassword, { flex: 1 }]}
                secureTextEntry={!passwordVisible}
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
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Đăng Nhập</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.orText}>Hoặc đăng nhập với</Text>
            <View style={styles.line} />
          </View>

          <View style={styles.socialButtonsContainer}>
            <TouchableOpacity style={styles.socialButton}>
              <Image
                source={require("../../assets/images/pngtree-google-internet-icon-vector-png-image_9183287.png")}
                style={styles.socialIcon}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Image
                source={require("../../assets/images/Facebook-logo.png")}
                style={styles.socialIconFacebook}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </SafeAreaView>
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
    marginTop: 40,
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
  inputPassword: {
    height: 40,
    paddingHorizontal: 10,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: "#63B35C",
    paddingVertical: 15,
    borderRadius: 5,
    width: width * 0.9,
    alignItems: "center",
    marginBottom: 20,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#ccc",
    marginHorizontal: 30,
  },
  orText: {
    fontSize: 14,
    color: "#666",
  },
  socialButtonsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 10,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 20,
  },
  socialIcon: {
    width: 24,
    height: 24,
  },
  socialIconFacebook: {
    width: 34,
    height: 34,
  },
});
