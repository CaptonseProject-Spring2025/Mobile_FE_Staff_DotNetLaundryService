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
  KeyboardAvoidingView,
  Image
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
const { width } = Dimensions.get("window");


export function LoginScreen({ navigation }) {
  const [passwordVisible, setPasswordVisible] = useState(false);

  const handleLogin = () => {
    navigation.navigate("Driver");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Image
          source={require("../../assets/logo-removebg-preview.png")}
          style={styles.logo}
        />
      </View>
        <KeyboardAvoidingView  behavior="position">
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
  },
  header: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
    backgroundColor: "#fff",
  },
  logo: {
    width: 200,
    height: 200,
  },
  icon: {
    marginRight: 10,
  },
  inputContainer: {
    width: width * 0.9,
    marginBottom: 20,
    marginTop: 20,
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
});
