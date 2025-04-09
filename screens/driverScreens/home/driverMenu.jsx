import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import useAuthStore from "../../../api/store/authStore";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

const { width, height } = Dimensions.get("window");

export default function DriverMenu({ navigation }) {
  const { userDetail } = useAuthStore();
  const [notificationCount, setNotificationCount] = useState(5);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Header with greeting and notification icon */}
      <View style={styles.header}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            width: width * 0.9,
          }}
        >
          <View>
            <Text style={{ fontSize: 20, color: "#fff", fontWeight: "bold" }}>
              Xin chào 
            </Text>
            <Text style={{ fontSize: 24, color: "#fff", fontWeight: "bold" }}>
              {userDetail?.fullName}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate("DriverAccountScreen")}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="notifications-outline" size={32} color="#fff" />
              {notificationCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {notificationCount > 99 ? "99+" : notificationCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main content with order sections */}
      <View style={styles.mainContent}>
        <Text style={styles.sectionTitle}>Đơn hàng</Text>

        {/* Order pickup section */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("DriverPickupScreen")}
        >
          <View style={[styles.iconBackground, { backgroundColor: "#2FA060" }]}>
            <MaterialIcons name="local-shipping" size={28} color="#fff" />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTitle}>Đơn nhận</Text>
            <Text style={styles.menuDescription}>
              Danh sách đơn hàng cần đi lấy từ khách hàng
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#CCCCCC" />
        </TouchableOpacity>

        {/* Order delivery section */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("DriverDeliveryScreen")}
        >
          <View style={[styles.iconBackground, { backgroundColor: "#4A6FA5" }]}>
            <MaterialIcons name="local-shipping" size={28} color="#fff" />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTitle}>Đơn giao</Text>
            <Text style={styles.menuDescription}>
              Danh sách đơn hàng cần giao đến khách hàng
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#CCCCCC" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    height: width * 0.45,
    backgroundColor: "#2FA060",
    justifyContent: "center",
    alignItems: "center",
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
  },
  iconContainer: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    right: -6,
    top: -5,
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: "#fff",
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  mainContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconBackground: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  menuDescription: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
});
