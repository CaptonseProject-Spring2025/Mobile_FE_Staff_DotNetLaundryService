import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { Divider } from "react-native-paper";
import useOrderStore from "../../../../api/store/orderStore";
import Toast from "react-native-toast-message";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import Ionicons from "react-native-vector-icons/Ionicons";

const DeliveryList = ({ searchQuery = "" }) => {
  const [refreshing, setRefreshing] = useState(false);
  const {
    assignmentList,
    isLoadingOrderList,
    fetchAssignmentList,
    isLoadingStartDelivery,
    startDelivery,
    isLoadingCancelDelivery,
    cancelDelivery,
  } = useOrderStore();
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [images, setImages] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    fetchAssignmentList();
  }, [fetchAssignmentList]);

  useEffect(() => {
    if (assignmentList) {
      setFilteredOrders(
        assignmentList.filter(
          (order) =>
            order.status === "ASSIGNED_DELIVERY" &&
            (order.currentStatus === "SCHEDULED_DELIVERY" ||
              order.currentStatus === "DELIVERING")
        )
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

  const handleCancelDelivery = async () => {
    try {
      // Check if orderId exists
      if (!currentOrderId) {
        return Alert.alert(
          "Lỗi",
          "Không tìm thấy mã đơn hàng. Vui lòng thử lại.",
          [{ text: "OK" }]
        );
      }

      // Validate image requirement
      if (!images || images.length === 0) {
        return Alert.alert(
          "Thiếu thông tin",
          "Vui lòng gửi ít nhất một ảnh chứng minh lý do huỷ đơn",
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
      formData.append("reason", cancelReason);

      // Append image with proper structure for FormData
      const imageUri = images[0];
      const imageName = imageUri.split("/").pop();
      const imageType =
        "image/" + (imageName.split(".").pop() === "png" ? "png" : "jpeg");

      formData.append("image", {
        uri: imageUri,
        name: imageName,
        type: imageType,
      });

      // Send the request
      await cancelPickUp(formData);

      // Close modal and show success toast
      setCancelModalVisible(false);
      setCancelReason("");
      setImages([]);

      Toast.show({
        type: "success",
        text1: "Đã hủy xác nhận lấy hàng.",
      });

      // Refresh list
      fetchAssignmentList();
    } catch (error) {
      console.log("Cancel pick up error:", error);
      Alert.alert(
        "Lỗi",
        cancelPickUpError || "Đã xảy ra lỗi khi hủy xác nhận lấy hàng.",
        [{ text: "OK" }]
      );
    }
  };

  const handleDelivery = async (assignmentId, orderId) => {
    try {
      const response = await startDelivery(orderId);
      if (response && response.status === 200) {
        navigation.navigate("DriverDeliveryOrderDetailScreen", {
          assignmentId: assignmentId,
        });
      }
      console.log("Pick up response:", response.status);
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

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      allowsMultipleSelection: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      if (result.assets && result.assets.length > 0) {
        const newImageUris = result.assets.map((asset) => asset.uri);
        setImages([...images, ...newImageUris]);
      } else if (result.uri) {
        setImages([...images, result.uri]);
      }
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    console.log("Trạng thái quyền camera:", status);

    if (status !== "granted") {
      Alert.alert(
        "Quyền truy cập bị từ chối",
        "Bạn cần cấp quyền truy cập camera."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 1,
    });

    console.log("Kết quả từ camera:", result);

    if (result.canceled) {
      console.log("Người dùng đã hủy chụp ảnh.");
      return;
    }

    if (result.assets && result.assets.length > 0) {
      const newImageUris = result.assets.map((asset) => asset.uri);
      setImages([...images, ...newImageUris]);
    } else if (result.uri) {
      setImages([...images, result.uri]);
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
                Thời gian giao hàng
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
              isLoadingCancelDelivery && { backgroundColor: "#aaa" },
            ]}
            onPress={() => {
              setCancelModalVisible(true);
              setCurrentOrderId(item.orderId);
            }}
            disabled={isLoadingCancelDelivery}
          >
            {isLoadingCancelDelivery ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.cancelButtonText}>Hủy</Text>
            )}
          </TouchableOpacity>
          {item.currentStatus === "DELIVERING" ? (
            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: "#1E88E5" }]}
              onPress={() =>
                navigation.navigate("DriverDeliveryOrderDetailScreen", {
                  assignmentId: item.assignmentId,
                })
              }
            >
              <Text style={styles.buttonTextStyle}>Đang đi giao</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.confirmButton,
                isLoadingStartDelivery && { backgroundColor: "#6c757d" },
              ]}
              onPress={() => handleDelivery(item.assignmentId, item.orderId)}
              disabled={isLoadingStartDelivery}
            >
              {isLoadingStartDelivery ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonTextStyle}>
                  Xác nhận đi giao hàng
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, marginHorizontal: 20, marginBottom: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", textAlign: "center" }}>
        Đơn cần giao ({filteredOrders?.length || 0})
      </Text>
      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.orderId.toString()}
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
              numberOfLines={4}
              mode="outlined"
            />
            <View className="flex-row justify-between gap-x-8">
              <TouchableOpacity
                style={styles.imagePickerButton}
                onPress={handleTakePhoto}
              >
                <Ionicons name="camera" size={24} color="#63B35C" />
                <Text style={styles.imagePickerButtonText}>Chụp ảnh</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.imagePickerButton}
                onPress={pickImage}
              >
                <Ionicons name="image" size={24} color="#63B35C" />
                <Text style={styles.imagePickerButtonText}>Chọn ảnh</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.imagePreviewContainer}>
              {images.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.imagesScrollContainer}
                >
                  {images.map((imageUri, index) => (
                    <View key={index} style={styles.imageWrapper}>
                      <Image
                        source={{ uri: imageUri }}
                        style={styles.imagePreview}
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => {
                          const newImages = [...images];
                          newImages.splice(index, 1);
                          setImages(newImages);
                        }}
                      >
                        <Ionicons name="close-circle" size={24} color="red" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <Text style={{ color: "#777" }}>Chưa có ảnh</Text>
              )}
            </View>
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
                  handleCancelDelivery();
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
    margin: 2,
    padding: 12,
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
    padding: 25,
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
    height: 40,
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
    width: 80,
    height: 80,
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
    width: 250,
    height: 180,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 5,
    overflow: "hidden" 
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

export default DeliveryList;
