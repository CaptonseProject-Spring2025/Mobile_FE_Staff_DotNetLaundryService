import React, { useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import useCheckOrderStore from "../../../api/store/checkOrderStore";

function OrderWashingListSceen({ navigation }) {
  const {
    orderWashing,
    isLoadingOrderWashing,
    orderWashingError,
    fetchOrderWashing,
  } = useCheckOrderStore();

  // Gọi API khi màn hình được mount
  useEffect(() => {
    fetchOrderWashing();
  }, []);

  const renderOrderItem = ({ item }) => (
    <TouchableOpacity className="bg-gray-100 p-4 rounded-lg mb-4 shadow">
      <Text className="text-lg font-bold text-blue-600">
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

  if (isLoadingOrderWashing) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-lg text-gray-500">Đang tải...</Text>
      </View>
    );
  }

  if (orderWashingError) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-lg text-red-500">Lỗi: {orderWashingError}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white p-4">
      <Text className="text-xl font-bold text-gray-800 mb-4">
        Danh sách đơn hàng đang giặt
      </Text>
      <FlatList
        data={orderWashing}
        keyExtractor={(item) => item.orderId}
        renderItem={renderOrderItem}
        contentContainerStyle={{ paddingBottom: 16 }}
      />
    </View>
  );
}

export default OrderWashingListSceen;
