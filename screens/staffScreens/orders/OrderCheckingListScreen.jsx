import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Button, Alert, Image, TouchableOpacity } from "react-native";
import * as ImagePicker from "expo-image-picker";
import useCheckOrderStore from "../../../api/store/checkOrderStore";


function OrderCheckingListScreen({ navigation }) {
  const {
    orderChecking,
    isLoadingOrderChecking,
    fetchOrderChecking,
  } = useCheckOrderStore();

  useEffect(() => {
    fetchOrderChecking(); // Gọi API để lấy danh sách đơn hàng CHECKING
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchOrderChecking(); // Gọi lại API khi màn hình được focus
    });
  
    return unsubscribe; // Hủy đăng ký sự kiện khi component bị unmount
  }, [navigation]);



  const renderOrderItem = ({ item }) => (
    <TouchableOpacity
      className="bg-gray-100 p-4 rounded-lg mb-4 shadow"
      onPress={() =>
        navigation.navigate("OrderDetailScreen", {
          orderId: item.orderId,
          orderDetail: item,
        })
      }
    >
      <Text className="text-lg font-bold text-green-600">
        Mã đơn: {item.orderId}
      </Text>
      <Text className="text-base text-gray-800">
        Khách hàng: {item.customerInfo.customerName}
      </Text>
      <Text className="text-base text-gray-600">
        SĐT: {item.customerInfo.customerPhone}
      </Text>
      <Text className="text-base text-gray-800">
        Dịch vụ: {item.serviceNames}
      </Text>
      <Text className="text-base text-red-500">
        Tổng tiền: {item.totalPrice.toLocaleString()} VND
      </Text>
      <Text className="text-sm text-gray-500">
        Trạng thái: {item.currentStatus}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-white p-4">
      <Text className="text-xl font-bold text-gray-800 mb-4">
        Danh sách đơn hàng đang CHECKING
      </Text>
      {isLoadingOrderChecking ? (
        <Text className="text-center text-gray-500">Đang tải...</Text>
      ) : (
        <FlatList
          data={orderChecking}
          keyExtractor={(item) => item.orderId}
          renderItem={renderOrderItem}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      )}
    </View>
  );
}

export default OrderCheckingListScreen;
