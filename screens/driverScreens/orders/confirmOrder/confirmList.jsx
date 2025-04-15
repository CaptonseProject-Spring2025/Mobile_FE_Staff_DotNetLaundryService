import React, { useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  TextInput,
  KeyboardAvoidingView,
  Image,
} from "react-native";
import { Divider } from "react-native-paper";
import useOrderStore from "../../../../api/store/orderStore";
import Toast from "react-native-toast-message";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";

const ConfirmList = ({ searchQuery = "" }) => {
  const [refreshing, setRefreshing] = useState(false);
  const {
    assignmentList,
    isLoadingOrderList,
    fetchAssignmentList,
    isLoadingRevicedPickUp,
    revicedPickUp,
    revicedPickUpError,
    finishDelivery,
    isLoadingFinishDelivery,
  } = useOrderStore();
  const [filteredOrders, setFilteredOrders] = useState([]);

  useEffect(() => {
    fetchAssignmentList();
  }, [fetchAssignmentList]);

  useFocusEffect(
    useCallback(() => {
      fetchAssignmentList();
    }, [fetchAssignmentList])
  );

  useEffect(() => {
    if (assignmentList) {
      setFilteredOrders(
        assignmentList.filter(
          (order) =>
            (order.status === "ASSIGNED_PICKUP" && order.currentStatus === "PICKEDUP") ||
            (order.status === "ASSIGNED_DELIVERY" && order.currentStatus === "DELIVERED")
        )
      );
    }
  }, [assignmentList]);

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate a network request
    setTimeout(() => {
      fetchAssignmentList();
      setRefreshing(false);
    }, 2000);
  };

  const handleConfirmPickup = async (orderId) => {
    try {
      await revicedPickUp(orderId);

      Toast.show({
        type: "success",
        text1: "Xác nhận thành công",
        text2: "Đơn hàng đã được xác nhận.",
      });
      fetchAssignmentList();
    } catch (error) {
      Alert.alert("Lỗi", error?.response?.data);
      console.log("Error message:", error?.message);
      console.log("Error status:", error?.response?.status);
    }
  };

  const handleConfirmDelivery = async (orderId) => {
    try {
      await finishDelivery(orderId);

      Toast.show({
        type: "success",
        text1: "Xác nhận thành công",
        text2: "Đơn hàng đã được xác nhận.",
      });
      fetchAssignmentList();
    } catch (error) {
      Alert.alert("Lỗi", error?.response?.data);
      console.log("Error message:", error?.message);
      console.log("Error status:", error?.response?.status);
    }
  }

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

        {/* Button Xác nhận lấy hàng hoặc giao hàng */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.confirmButton,
              { backgroundColor: "#1E88E5" },
              (isLoadingRevicedPickUp || isLoadingFinishDelivery) && { opacity: 0.7 },
            ]}
            onPress={() => {
              if (item.status === "ASSIGNED_PICKUP" && item.currentStatus === "PICKEDUP") {
                handleConfirmPickup(item.orderId);
              } else if (item.status === "ASSIGNED_DELIVERY" && item.currentStatus === "DELIVERED") {
                handleConfirmDelivery(item.orderId);
              }
            }}
            disabled={isLoadingRevicedPickUp || isLoadingFinishDelivery}
          >
            {isLoadingRevicedPickUp || isLoadingFinishDelivery ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonTextStyle}>
                {item.status === "ASSIGNED_PICKUP" && item.currentStatus === "PICKEDUP"
                  ? "Xác nhận đơn hàng đã lấy"
                  : "Xác nhận đơn hàng đã giao"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, marginHorizontal: 10, marginBottom: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", textAlign: "center" }}>
        Đơn cần xác nhận ({filteredOrders?.length || 0})
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
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  modalInput: {
    width: 250,
    height: 100,
    marginBottom: 15,
  },
  imagePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  imagePickerButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#555",
  },
  imagePreview: {
    width: 100,
    height: 100,
    marginBottom: 15,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    width: "45%",
    alignItems: "center",
  },
  buttonCancel: {
    backgroundColor: "#f8f8f8",
  },
  buttonConfirm: {
    backgroundColor: "#02A257",
  },
  buttonCancelText: {
    color: "#333",
    fontWeight: "600",
  },
  buttonConfirmText: {
    color: "#fff",
    fontWeight: "600",
  },
  imagePreviewContainer: {
    width: "100%",
    minHeight: 120,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
  },
  imageWrapper: {
    width: 120,
    height: 120,
    position: "relative",
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  removeImageButton: {
    position: "absolute",
    top: -10,
    right: -10,
    backgroundColor: "white",
    borderRadius: 12,
  },
});

export default ConfirmList;
