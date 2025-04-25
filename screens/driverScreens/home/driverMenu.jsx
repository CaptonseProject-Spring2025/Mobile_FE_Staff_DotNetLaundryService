import React, { useState, useCallback } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import useAuthStore from "../../../api/store/authStore";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import useOrderStore from "../../../api/store/orderStore";

const { width, height } = Dimensions.get("window");

export default function DriverMenu({ navigation }) {
  const { userDetail } = useAuthStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { assignmentList, fetchAssignmentList } = useOrderStore();

  // Filter orders by status
  const pickupOrders =
    assignmentList?.filter(
      (order) =>
        order.status === "ASSIGNED_PICKUP" &&
        (order.currentStatus === "SCHEDULED_PICKUP" ||
          order.currentStatus === "PICKINGUP")
    ) || [];

  const deliveryOrders =
    assignmentList?.filter(
      (order) =>
        order.status === "ASSIGNED_DELIVERY" &&
        (order.currentStatus === "SCHEDULED_DELIVERY" ||
          order.currentStatus === "DELIVERING")
    ) || [];

  const confirmOrders =
    assignmentList?.filter(
      (order) =>
        (order.status === "ASSIGNED_PICKUP" &&
          order.currentStatus === "PICKEDUP") ||
        (order.status === "ASSIGNED_DELIVERY" &&
          order.currentStatus === "DELIVERED")
    ) || [];

  const loadAllOrders = async () => {
    setIsRefreshing(true);
    try {
      await fetchAssignmentList();
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    await loadAllOrders();
  };

  useFocusEffect(
    useCallback(() => {
      loadAllOrders();
    }, [])
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffff" }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={["#2FA060"]}
          />
        }
      >
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
            <View
              style={[styles.iconBackground, { backgroundColor: "#2FA060" }]}
            >
              <MaterialIcons name="local-shipping" size={28} color="#fff" />
            </View>
            <View style={styles.menuTextContainer}>
              <View style={styles.menuTitleContainer}>
                <Text style={styles.menuTitle}>Đơn nhận</Text>
                {pickupOrders.length > 0 && (
                  <View
                    style={[styles.countBadge, { backgroundColor: "#2FA060" }]}
                  >
                    <Text style={styles.countText}>{pickupOrders.length}</Text>
                  </View>
                )}
              </View>
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
            <View
              style={[styles.iconBackground, { backgroundColor: "#4A6FA5" }]}
            >
              <MaterialIcons name="local-shipping" size={28} color="#fff" />
            </View>
            <View style={styles.menuTextContainer}>
              <View style={styles.menuTitleContainer}>
                <Text style={styles.menuTitle}>Đơn giao</Text>
                {deliveryOrders.length > 0 && (
                  <View
                    style={[styles.countBadge, { backgroundColor: "#4A6FA5" }]}
                  >
                    <Text style={styles.countText}>
                      {deliveryOrders.length}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.menuDescription}>
                Danh sách đơn hàng cần giao đến khách hàng
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#CCCCCC" />
          </TouchableOpacity>

          {/* Order confirm section */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate("ConfirmPickup")}
          >
            <View
              style={[styles.iconBackground, { backgroundColor: "#037bfc" }]}
            >
              <Ionicons name="list-outline" size={28} color="#fff" />
            </View>
            <View style={styles.menuTextContainer}>
              <View style={styles.menuTitleContainer}>
                <Text style={styles.menuTitle}>Xác nhận đã lấy hàng</Text>
                {confirmOrders.length > 0 && (
                  <View
                    style={[styles.countBadge, { backgroundColor: "#037bfc" }]}
                  >
                    <Text style={styles.countText}>{confirmOrders.length}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.menuDescription}>
                Danh sách đơn hàng cần xác nhận đã lấy hàng
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
    paddingBottom: 30,
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
  menuTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: "center",
  },
  countText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  Flowcontainer: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    marginHorizontal: 20,
    width: width * 0.9,
    height: height * 0.13,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.32,
    shadowRadius: 5.46,
    elevation: 9,
    backgroundColor: "white",
    padding: 10,
  },
});
