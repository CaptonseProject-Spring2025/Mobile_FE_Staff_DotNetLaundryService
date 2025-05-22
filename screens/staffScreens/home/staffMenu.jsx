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
import { useFocusEffect } from '@react-navigation/native';
import useAuthStore from "../../../api/store/authStore";
import Ionicons from "react-native-vector-icons/Ionicons";
import useCheckOrderStore from '../../../api/store/checkOrderStore';

const { width } = Dimensions.get("window");

export default function StaffrMenu({ navigation }) {
  const { userDetail } = useAuthStore();
  const [notificationCount, setNotificationCount] = useState(5);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const {
    orderInstore, fetchOrderInstore,
    orderChecking, fetchOrderChecking,
    orderChecked, fetchOrderChecked,
    orderWashing, fetchOrderWashing,
    orderWashed, fetchOrderWashed
  } = useCheckOrderStore();

  const loadAllOrders = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchOrderInstore(),
        fetchOrderChecking(),
        fetchOrderChecked(),
        fetchOrderWashing(),
        fetchOrderWashed()
      ]);
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
      
      // Auto refresh every 30 seconds
      const interval = setInterval(() => {
        loadAllOrders();
      }, 30000);

      return () => clearInterval(interval);
    }, [])
  );

  const menuItems = [
    {
      icon: "📋",
      title: "Đơn Xử lý",
      description: "Danh sách đơn hàng cần xử lý",
      route: "OrderListScreen",
      bgColor: "bg-emerald-500",
      count: orderInstore?.length || 0
    },
    {
      icon: "✓",
      title: "Đơn Nhận Check",
      description: "Danh sách đơn hàng nhận check",
      route: "OrderCheckingListScreen",
      bgColor: "bg-amber-500",
      count: orderChecking?.length || 0
    },
    {
      icon: "✓✓",
      title: "Đơn Nhận Checked",
      description: "Danh sách đơn hàng nhận checked",
      route: "OrderListCheckedScreen",
      bgColor: "bg-orange-500",
      count: orderChecked?.length || 0
    },
    {
      icon: "👕",
      title: "Đơn nhận đang được giặt",
      description: "Danh sách đơn hàng nhận đang được giặt",
      route: "OrderWashingListScreen",
      bgColor: "bg-blue-500",
      count: orderWashing?.length || 0
    },
    {
      icon: "💧",
      title: "Đơn nhận đã giặt xong",
      description: "Danh sách đơn hàng nhận đã giặt xong",
      route: "OrderWashedListScreen",
      bgColor: "bg-gray-500",
      count: orderWashed?.length || 0
    }
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
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

          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => navigation.navigate(item.route)}
            >
              <View className={`${item.bgColor} rounded-full items-center justify-center`} style={styles.iconBackground}>
                <Text className="text-white text-xl">{item.icon}</Text>
              </View>
              <View style={styles.menuTextContainer}>
                <View className="flex-row justify-between items-center">
                  <Text className="text-lg font-semibold text-gray-800">
                    {item.title}
                  </Text>
                  {item.count > 0 && (
                    <View className={`${item.bgColor} px-3 py-1 rounded-full`}>
                      <Text className="text-white font-bold">
                        {item.count}
                      </Text>
                    </View>
                  )}
                </View>
                <Text className="text-sm text-gray-500 mt-1">
                  {item.description}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#CCCCCC" />
            </TouchableOpacity>
          ))}
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
