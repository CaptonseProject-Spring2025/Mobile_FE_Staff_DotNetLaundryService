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
  ScrollView,
} from "react-native";
import { Divider } from "react-native-paper";
import useOrderStore from "../../../../api/store/orderStore";
import Toast from "react-native-toast-message";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import Ionicons from "react-native-vector-icons/Ionicons";

const PickupList = ({ searchQuery = "" }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [images, setImages] = useState([]);
  const navigation = useNavigation();
  const {
    assignmentList,
    isLoadingOrderList,
    fetchAssignmentList,
    startPickUp,
    isLoadingPickUp,
    pickUpError,
    cancelPickUpError,
    isLoadingCancelPickUp,
    cancelPickUp,
  } = useOrderStore();
  const [filteredOrders, setFilteredOrders] = useState([]);

  useFocusEffect(
    useCallback(() => {
      fetchAssignmentList();
    }, [])
  );
  useEffect(() => {
    if (assignmentList) {
      setFilteredOrders(
        assignmentList.filter(
          (order) =>
            order.status === "ASSIGNED_PICKUP" &&
            (order.currentStatus === "SCHEDULED_PICKUP" ||
              order.currentStatus === "PICKINGUP")
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

  const handlePickUp = async (assignmentId, orderId) => {
    try {
      const response = await startPickUp(orderId);
      // Only navigate if the API call was successful
      if (response && response.status === 200) {
        navigation.navigate("DriverOrderPickupDetailScreen", {
          assignmentId: assignmentId,
        });
      }
      console.log("Pick up response:", response);
    } catch (error) {
      console.error("Error picking up order:", error);
      const errorMessage =
        error.response?.data?.message ||
        pickUpError ||
        error.message ||
        "Đã xảy ra lỗi khi xác nhận lấy hàng.";

      // Show the error in an alert
      Alert.alert("Lỗi", errorMessage, [{ text: "OK" }]);
    }
  };

  const handleCancelPickUp = async () => {
    try {
      // Check if orderId exists
      if (!currentOrderId) {
        return Alert.alert(
          "Lỗi",
          "Không tìm thấy mã đơn hàng. Vui lòng thử lại.",
          [{ text: "OK" }]
        );
      }

      // Validate reason
      if (!cancelReason || cancelReason.trim() === "") {
        return Alert.alert("Thiếu thông tin", "Vui lòng nhập lý do huỷ đơn", [
          { text: "OK" },
        ]);
      }

      // Create form data with proper structure
      const formData = new FormData();
      formData.append("orderId", currentOrderId);
      formData.append("cancelReason", cancelReason);

      console.log("Form data for cancel pick up:", formData);

      // Send the request
      const response = await cancelPickUp(formData);
      if (response && response.status === 200) {
        // Close modal and show success toast
        setCancelModalVisible(false);
        setCancelReason("");
        Toast.show({
          type: "success",
          text1: "Đã hủy xác nhận lấy hàng.",
        });
        // Refresh list
        fetchAssignmentList();
      }
    } catch (error) {
      console.log("Cancel pick up error:", error);
      Alert.alert(
        "Lỗi",
        cancelPickUpError ||
          error.reponsse.data.message ||
          "Đã xảy ra lỗi khi hủy xác nhận lấy hàng.",
        [{ text: "OK" }]
      );
    }
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
          <TouchableOpacity
            style={[
              styles.cancelButton,
              isLoadingCancelPickUp && { backgroundColor: "#aaa" },
            ]}
            onPress={() => {
              setCancelModalVisible(true);
              setCurrentOrderId(item.orderId);
            }}
            disabled={isLoadingCancelPickUp}
          >
            {isLoadingCancelPickUp ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.cancelButtonText}>Hủy</Text>
            )}
          </TouchableOpacity>
          {item.currentStatus === "PICKINGUP" ? (
            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: "#1E88E5" }]}
              onPress={() =>
                navigation.navigate("DriverOrderPickupDetailScreen", {
                  assignmentId: item.assignmentId,
                })
              }
            >
              <Text style={styles.buttonTextStyle}>Đang đi lấy hàng</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.confirmButton,
                isLoadingPickUp && { backgroundColor: "#6c757d" },
              ]}
              onPress={() => handlePickUp(item.assignmentId, item.orderId)}
              disabled={isLoadingPickUp}
            >
              {isLoadingPickUp ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonTextStyle}>Xác nhận đi lấy hàng</Text>
              )}
            </TouchableOpacity>
          )}
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
      {/* Cancel Reason Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={cancelModalVisible}
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.centeredView}
        >
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Lý do hủy đơn</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nhập lý do hủy đơn hàng"
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline={true}
              numberOfLines={3}
              mode="outlined"
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.buttonCancel]}
                onPress={() => {
                  setCancelModalVisible(false);
                  setCancelReason("");
                  setImages([]);
                }}
              >
                <Text style={styles.buttonCancelText}>Đóng</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.buttonConfirm]}
                onPress={() => {
                  handleCancelPickUp();
                  setCancelModalVisible(false);
                  setCancelReason("");
                  setImages([]);
                }}
              >
                <Text style={styles.buttonConfirmText}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    maxheight: 100,
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 8,
  },
  imagePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
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
    marginVertical: 15,
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
    width: 250,
    height: 180,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 5,
    overflow: "hidden",
  },
  imagesScrollContainer: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  imageWrapper: {
    width: 250,
    height: 150,
    position: "relative",
    marginRight: 12,
    borderRadius: 8,
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  removeImageButton: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "white",
    borderRadius: 12,
    zIndex: 1,
  },
});

export default PickupList;
