import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { Divider } from "react-native-paper";

const DeliveryList = ({ searchQuery = "" }) => {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate a network request
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  const orders = [
    {
      orderId: 6834,
      customerName: "Nguyễn Văn A",
      pickupLocation: "123 Đường ABC, Quận 1",
      pickupTime: "2023-10-01T10:00:00",
      phoneNumber: "0123456789",
      note: "Gọi trước khi đến",
    },
    {
      orderId: 6835,
      customerName: "Nguyễn Văn B",
      pickupLocation: "456 Đường DEF, Quận 2",
      pickupTime: "2023-10-01T11:00:00",
      phoneNumber: "0987654321",
      note: "Không có ghi chú",
    },
    {
      orderId: 6836,
      customerName: "Nguyễn Văn C",
      pickupLocation: "789 Đường GHI, Quận 3",
      pickupTime: "2023-10-01T12:00:00",
      phoneNumber: "0123456789",
      note: "Gọi trước khi đến",
    },
  ];

  const renderOrderItem = ({ item }) => {
    return (
      <View style={styles.orderContainer}>
        <Text style={{ fontSize: 18, fontWeight: "bold" }}>
          Thông tin đơn hàng
        </Text>
        <Divider
          style={{ marginVertical: 10, backgroundColor: "black", height: 2 }}
        />
        <View style={styles.orderDetails}>
          {/* Section Mã đơn hàng & Thời gian lấy hàng */}
          <View style={styles.orderSection}>
            <View style={styles.orderInfoBlock}>
              <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                Mã đơn hàng
              </Text>
              <Text style={{ fontSize: 16, color: "#555" }}>
                {item.orderId}
              </Text>
            </View>
            <View style={styles.orderInfoBlock}>
              <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                Thời gian lấy hàng
              </Text>
              <Text style={{ fontSize: 16, color: "#555" }}>
                {new Date(item.pickupTime).toLocaleString("vi-VN", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          </View>

          {/* Section Tên khách hàng & Số điện thoại */}
          <View style={styles.orderSection}>
            <View style={styles.orderInfoBlock}>
              <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                Tên khách hàng
              </Text>
              <Text style={{ fontSize: 16, color: "#555" }}>
                {item.customerName}
              </Text>
            </View>
            <View style={styles.orderInfoBlock}>
              <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                Số điện thoại
              </Text>
              <Text style={{ fontSize: 16, color: "#555" }}>
                {item.phoneNumber}
              </Text>
            </View>
          </View>

          {/* Section Địa chỉ lấy hàng & Ghi chú */}
          <View style={styles.orderSection}>
            <View style={styles.orderInfoBlock}>
              <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                Địa chỉ lấy hàng
              </Text>
              <Text style={{ fontSize: 16, color: "#555" }}>
                {item.pickupLocation}
              </Text>
            </View>
            <View style={styles.orderInfoBlock}>
              <Text style={{ fontSize: 16, fontWeight: "bold" }}>Ghi chú</Text>
              <Text style={{ fontSize: 16, color: "#555" }}>{item.note}</Text>
            </View>
          </View>
        </View>

        {/* Button Xác nhận lấy hàng */}
        <TouchableOpacity style={styles.buttonStyle}>
          <Text style={styles.buttonTextStyle}>Xác nhận giao hàng</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={{ flex: 1,  marginHorizontal: 20, marginBottom: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", textAlign: "center" }}>
        Đơn cần giao ({orders.length})
      </Text>
      <FlatList
        data={orders.filter((order) =>
          order.customerName.toLowerCase().includes(searchQuery.toLowerCase())
        )}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.orderId.toString()}
        refreshing={refreshing}
        onRefresh={() => onRefresh()}
        showsVerticalScrollIndicator={false}
        style={{ marginTop: 10 }}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  orderContainer: {
    margin: 10,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  orderDetails: {
    flexDirection: "column",
    gap: 10,
    marginBottom: 10,
  },
  orderSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 50,
  },
  orderInfoBlock: {
    flex: 1,
  },
  buttonStyle: {
    backgroundColor: "#28a745",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonTextStyle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default DeliveryList;
