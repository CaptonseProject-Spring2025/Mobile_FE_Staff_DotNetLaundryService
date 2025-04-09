import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from "react-native";
import useAuthStore from "../../../api/store/authStore";
import Ionicons from "react-native-vector-icons/Ionicons";

const { width } = Dimensions.get("window");

export default function StaffrMenu({ navigation }) {
  const { userDetail } = useAuthStore();
  const [notificationCount, setNotificationCount] = useState(5);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView showsVerticalScrollIndicator={false}>
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
            onPress={() => navigation.navigate("OrderListScreen")}
          >
            <View
              style={[styles.iconBackground, { backgroundColor: "#2FA060" }]}
            >
              <Ionicons name="reader-outline" size={28} color="#fff" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Đơn Xử lý</Text>
              <Text style={styles.menuDescription}>
                Danh sách đơn hàng cần xử lý
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#CCCCCC" />
          </TouchableOpacity>

          {/* Order checking section */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate("OrderCheckingListScreen")}
          >
            <View
              style={[styles.iconBackground, { backgroundColor: "#FFA500" }]}
            >
              <Ionicons name="checkmark-done-outline" size={28} color="#fff" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Đơn Nhận Check</Text>
              <Text style={styles.menuDescription}>
                Danh sách đơn hàng nhận check
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#CCCCCC" />
          </TouchableOpacity>

          {/* Order checked section */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate("OrderListCheckedScreen")}
          >
            <View
              style={[styles.iconBackground, { backgroundColor: "#e67e22" }]}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={28}
                color="#fff"
              />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Đơn Nhận Checked</Text>
              <Text style={styles.menuDescription}>
                Danh sách đơn hàng nhận checked
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#CCCCCC" />
          </TouchableOpacity>

          {/* Order washing section */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate("OrderWashingListSceen")}
          >
            <View
              style={[styles.iconBackground, { backgroundColor: "#2980b9" }]}
            >
              <Ionicons name="shirt-outline" size={28} color="#fff" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Đơn nhận đang được giặt</Text>
              <Text style={styles.menuDescription}>
                Danh sách đơn hàng nhận đang được giặt
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#CCCCCC" />
          </TouchableOpacity>

          {/* Order washed section */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate("OrderWashedListScreen")}
          >
            <View
              style={[styles.iconBackground, { backgroundColor: "#95a5a6" }]}
            >
              <Ionicons name="water-outline" size={28} color="#fff" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Đơn nhận đã giặt xong</Text>
              <Text style={styles.menuDescription}>
                Danh sách đơn hàng nhận đã giặt xong
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#CCCCCC" />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
