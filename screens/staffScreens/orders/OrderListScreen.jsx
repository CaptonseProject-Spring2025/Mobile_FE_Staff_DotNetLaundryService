import React, { useEffect } from "react";
import { View, Text, FlatList, Button, Alert } from "react-native";
import useCheckOrderStore from "../../../api/store/checkOrderStore";

const OrderListScreen = () => {
  const { fetchOrderInstore, orderInstore, reciveToChecking } = useCheckOrderStore();

  useEffect(() => {
    fetchOrderInstore(); // Fetch orders when the component mounts
  }, []);

  const handleReceiveCheck = async (orderId) => {
    try {
      const response = await reciveToChecking(orderId); // Gọi hàm từ store
      Alert.alert("Thành công", "Đơn hàng đã được nhận check!");
      fetchOrderInstore(); // Refresh danh sách đơn hàng
    } catch (error) {
      Alert.alert("Lỗi", error.message || "Không thể nhận check đơn hàng.");
    }
  };

  const renderOrderItem = ({ item }) => (
    <View className="bg-gray-100 p-4 rounded-lg mb-4 shadow">
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
      <Text className="text-sm text-gray-500">
        Ngày đặt: {new Date(item.orderDate).toLocaleDateString()}
      </Text>
      <Text className="text-sm text-gray-500">
        Thời gian lấy: {new Date(item.pickupTime).toLocaleString()}
      </Text>
      <Text className="text-sm text-gray-500">
        Thời gian giao: {new Date(item.deliveryTime).toLocaleString()}
      </Text>
      <Button
        title="Nhận Check"
        onPress={() => handleReceiveCheck(item.orderId)}
        color="#FFA500"
      />
    </View>
  );

  return (
    <View className="flex-1 bg-white p-4">
      <Text className="text-xl font-bold text-gray-800 mb-4">
        Danh sách đơn hàng cần xử lý
      </Text>
      <FlatList
        data={orderInstore}
        keyExtractor={(item) => item.orderId}
        renderItem={renderOrderItem}
        contentContainerStyle={{ paddingBottom: 16 }}
      />
    </View>
  );
};

export default OrderListScreen;