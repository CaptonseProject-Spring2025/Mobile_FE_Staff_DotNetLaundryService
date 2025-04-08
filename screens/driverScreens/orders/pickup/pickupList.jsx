import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Divider } from "react-native-paper";
import useOrderStore from "../../../../api/store/orderStore";
const PickupList = ({ searchQuery = "" }) => {
  const [refreshing, setRefreshing] = useState(false);
  const { assignmentList, isLoadingOrderList, fetchAssignmentList } =
    useOrderStore();
  const [filteredOrders, setFilteredOrders] = useState([]);

  useEffect(() => {
    fetchAssignmentList();
  }, [fetchAssignmentList]);

  useEffect(() => {
    // Filter orders with status "ASSIGNED_PICKUP"
    if (assignmentList) {
      setFilteredOrders(
        assignmentList.filter((order) => order.status === "ASSIGNED_PICKUP")
      );
    }
  }, [assignmentList]);

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate a network request
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  if (isLoadingOrderList) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#63B35C" />
        <Text style={{ fontSize: 18 }}>Đang tải đơn hàng...</Text>
      </View>
    );
  }

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
                {new Date(item.assignedAt).toLocaleString("vi-VN", {
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
                {item.fullname}
              </Text>
            </View>
            <View style={styles.orderInfoBlock}>
              <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                Số điện thoại
              </Text>
              <Text style={{ fontSize: 16, color: "#555" }}>
                {item.phonenumber}
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
                {item.address}
              </Text>
            </View>
            <View style={styles.orderInfoBlock}>
              <Text style={{ fontSize: 16, fontWeight: "bold" }}>Ghi chú</Text>
              <Text style={{ fontSize: 16, color: "#555" }}>
                {item.note || "N/A"}
              </Text>
            </View>
          </View>
        </View>

        {/* Button Xác nhận lấy hàng */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Hủy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.confirmButton}>
            <Text style={styles.buttonTextStyle}>Xác nhận giao hàng</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, marginHorizontal: 10, marginBottom: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", textAlign: "center" }}>
        Đơn cần lấy ({filteredOrders?.length || 0})
      </Text>
      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.assignmentId.toString()}
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
    margin: 5,
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
  buttonTextStyle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  confirmButton: {
    backgroundColor: "#28a745",
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    flex: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cancelButton: {
    backgroundColor: "#dc3545",
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    flex: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default PickupList;
