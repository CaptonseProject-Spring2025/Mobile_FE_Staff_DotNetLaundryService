import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { Divider } from "react-native-paper";
import MapboxGL from "@rnmapbox/maps";
import useOrderStore from "../../../../api/store/orderStore";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import Ionicons from "react-native-vector-icons/Ionicons";
import Toast from "react-native-toast-message";
import usePaymentStore from "../../../../api/store/paymentStore";
import useAuthStore from "../../../../api/store/authStore";
import axiosClient from "../../../../api/config/axiosClient";
import useUserStore from "../../../../api/store/userStore";

const PaymentMethod = React.memo(({ selectedPayment, setSelectedPayment }) => {
  return (
    <View style={styles.paymentContainer}>
      <TouchableOpacity
        style={[
          styles.paymentOptionNew,
          selectedPayment === "cash" && { borderWidth: 1 },
        ]}
        onPress={() => setSelectedPayment("cash")}
      >
        <View
          style={{
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            gap: 5,
          }}
        >
          <View
            style={[
              styles.radioCircle,
              {
                borderColor: selectedPayment === "cash" ? "#02A257" : "#6C7072",
                borderWidth: 2,
              },
            ]}
          ></View>

          <Text
            style={{
              color: selectedPayment === "cash" ? "#02A257" : "#6C7072",
              fontSize: 16,
              fontWeight: "500",
              textAlign: "center",
            }}
          >
            Tiền mặt
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.paymentOptionNew,
          selectedPayment === "transfer" && { borderWidth: 1 },
        ]}
        onPress={() => setSelectedPayment("transfer")}
      >
        <View
          style={{
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            gap: 5,
          }}
        >
          <View
            style={[
              styles.radioCircle,
              {
                borderColor:
                  selectedPayment === "transfer" ? "#02A257" : "#6C7072",
                borderWidth: 2,
              },
            ]}
          ></View>

          <Text
            style={{
              color: selectedPayment === "transfer" ? "#02A257" : "#6C7072",
              fontSize: 16,
              fontWeight: "500",
              textAlign: "center",
            }}
          >
            Chuyển khoản
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
});

const OrderDetail = ({ navigation, route }) => {
  const [selectedPayment, setSelectedPayment] = useState("cash");
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [completeNote, setCompleteNote] = useState("");
  const [dataLoaded, setDataLoaded] = useState(false);
  const [images, setImages] = useState([]);
  const { assignmentId } = route.params;
  const {
    fetchOrderDetail,
    isLoadingOrderDetail,
    orderDetail,
    fetchAssignmentDetail,
    assignmentDetail,
    isLoadingAssignmentDetail,
    isLoadingCancelDelivery,
    cancelDelivery,
    confirmDelivery,
    isLoadingConfirmDelivery,
  } = useOrderStore();
  const { createPayment, isLoadingPayment } = usePaymentStore();
  const [paymentSuccess, setPaymentSuccess] = useState(
    route.params?.paymentSuccess || false
  );

  const { userDetail } = useAuthStore();
  const currentUserId = userDetail?.userId;
  const { getUserById, userInfo } = useUserStore();

  useEffect(() => {
    if (route.params?.paymentSuccess) {
      setPaymentSuccess(true);
    }
  }, [route.params?.paymentSuccess]);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        if (assignmentId) {
          try {
            setDataLoaded(false);
            await fetchAssignmentDetail(assignmentId);
          } catch (error) {
            console.error("Error fetching assignment details:", error);
            Toast.show({
              type: "error",
              text1: "Lỗi",
              text2: "Không thể tải thông tin đơn hàng",
            });
          }
        }
      };
      fetchData();
    }, [assignmentId])
  );

  useEffect(() => {
    const fetchOrderData = async () => {
      if (assignmentDetail && assignmentDetail.orderId) {
        try {
          await fetchOrderDetail(assignmentDetail.orderId);
          setDataLoaded(true);
        } catch (error) {
          console.error("Error fetching order details:", error);
          Toast.show({
            type: "error",
            text1: "Lỗi",
            text2: "Không thể tải chi tiết đơn hàng",
          });
          setDataLoaded(true);
        }
      }
    };
    fetchOrderData();
  }, [assignmentDetail]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (assignmentDetail && assignmentDetail.customerId) {
        try {
          await getUserById(assignmentDetail.customerId);
        } catch (error) {
          console.error("Error fetching user details:", error);
        }
      }
    };
    fetchUserData();
  }, [assignmentDetail]);

  const startConversation = async (receiverId) => {
    try {
      const response = await axiosClient.get(
        `Conversations/${receiverId}?currentUserId=${currentUserId}`
      );
      const data = response.data;
      const userData = userDetail;
      const customerData = userInfo;

      if (!data.exists) {
        const createResponse = await axiosClient.post("/Conversations", {
          userOneId: currentUserId,
          userTwoId: receiverId,
        });

        navigation.navigate("ChatScreen", {
          conversationId: createResponse.data.conversationId,
          userId: receiverId,
          currentUserId: currentUserId,
          name: userData.fullName,
          avatar: userData.avatar,
          userName: customerData?.fullName || "Customer",
          userAvatar: customerData?.avatar || null,
        });
      } else {
        navigation.navigate("ChatScreen", {
          conversationId: data.conversationId,
          userId: receiverId,
          currentUserId: currentUserId,
          userName: userData.fullName,
          userAvatar: userData.avatar,
          receiverName: customerData?.fullName || "Customer",
          receiverAvatar: customerData?.avatar || null,
        });
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
    }
  };

  const handleCancelDelivery = async () => {
    try {
      // Check if orderId exists
      if (!assignmentDetail.orderId) {
        return Alert.alert("Lỗi", "Không tìm thấy mã đơn hàng", [
          { text: "OK" },
        ]);
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
      formData.append("orderId", assignmentDetail.orderId);
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

      // Close modal BEFORE sending the request
      setCancelModalVisible(false);

      // Send the request
      await cancelDelivery(formData);

      // Reset form state
      setCancelReason("");
      setImages([]);

      // Show success toast with correct message
      Toast.show({
        type: "success",
        text1: "Đã hủy giao hàng thành công.",
      });

      // Navigate back
      navigation.goBack();
    } catch (error) {
      console.log("Cancel delivery error:", error);

      // Fixed error message - removed undefined variable
      Alert.alert("Lỗi", "Đã xảy ra lỗi khi hủy giao hàng.", [{ text: "OK" }]);
    }
  };

  const handleConfirmDelivery = async () => {
    try {
      if (!images || images.length === 0) {
        return Alert.alert(
          "Thiếu thông tin",
          "Vui lòng gửi ít nhất một ảnh xác nhận giao hàng",
          [{ text: "OK" }]
        );
      }

      // Require notes field
      if (!completeNote || completeNote.trim() === "") {
        return Alert.alert("Thiếu thông tin", "Vui lòng nhập ghi chú", [
          { text: "OK" },
        ]);
      }
      // Create form data with proper structure
      const formData = new FormData();
      formData.append("orderId", assignmentDetail.orderId);
      formData.append("notes", completeNote);

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

      setCompleteModalVisible(false);
      // Call the API
      await confirmDelivery(formData);
      // Close modal and reset values
      setCompleteNote("");
      setImages([]);

      Toast.show({
        type: "success",
        text1: "Đơn hàng đã hoàn thành",
        text2: "Xác nhận lấy hàng thành công",
      });
      navigation.navigate("DriverDeliveryScreen");
    } catch (error) {
      console.error("Error confirming pick up:", error);

      // Show specific validation errors if available
      const errorMsg = error.response?.data?.errors?.notes
        ? error.response.data.errors.notes[0]
        : "Không thể xác nhận lấy hàng";

      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: errorMsg,
      });
      console.log("Confirm pick up error:", error.response?.data);
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

  const handleMakePayment = async () => {
    try {
      // Create form data for the payment request
      const formData = new FormData();
      formData.append("orderId", assignmentDetail.orderId);
      formData.append("description", `Đơn hàng ${assignmentDetail.orderId}`);

      // Call API to create payment
      const response = await createPayment(formData);

      if (response && response.data && response.data.checkoutUrl) {
        // Navigate to PayOS WebView with the checkout URL
        navigation.navigate("PayosWebView", {
          checkoutUrl: response.data.checkoutUrl,
          orderId: assignmentDetail.orderId,
          returnToScreen: "OrderDetail",
          assignmentId: assignmentId,
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: "Không thể tạo liên kết thanh toán",
        });
      }
    } catch (error) {
      console.error("Payment error:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi thanh toán",
        text2: error.message || "Đã xảy ra lỗi khi tạo thanh toán",
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Loading overlay  */}
      {(isLoadingOrderDetail || isLoadingAssignmentDetail) && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#02A257" />
          <Text style={styles.loadingText}>
            {isLoadingAssignmentDetail
              ? "Đang tải thông tin đơn hàng..."
              : isLoadingOrderDetail
              ? "Đang tải chi tiết đơn hàng..."
              : "Đang tải dữ liệu..."}
          </Text>
        </View>
      )}

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
                <View className="items-center justify-center">
                  <Ionicons name="images-outline" size={32} color="#9CA3AF" />
                  <Text className="text-gray-500 mt-2">Chưa có hình ảnh</Text>
                </View>
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
                onPress={handleCancelDelivery}
              >
                <Text style={styles.buttonConfirmText}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Complete Order Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={completeModalVisible}
        onRequestClose={() => setCompleteModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.centeredView}
        >
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Xác nhận hoàn thành đơn</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nhập ghi chú"
              value={completeNote}
              onChangeText={setCompleteNote}
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
                <View className="items-center justify-center">
                  <Ionicons name="images-outline" size={32} color="#9CA3AF" />
                  <Text className="text-gray-500 mt-2">Chưa có hình ảnh</Text>
                </View>
              )}
            </View>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.buttonCancel]}
                onPress={() => {
                  setCompleteModalVisible(false);
                  setCompleteNote("");
                  setImages([]);
                }}
              >
                <Text style={styles.buttonCancelText}>Đóng</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.buttonConfirm]}
                onPress={() => {
                  handleConfirmDelivery();
                }}
              >
                <Text style={styles.buttonConfirmText}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ScrollView
        style={{ marginBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Order ID section */}
        <View style={styles.orderRow}>
          <Text style={styles.orderLabel}>Mã đơn hàng</Text>
          <Text style={styles.orderValue}>
            {orderDetail.orderId ? orderDetail.orderId.split("-").pop() : "N/A"}
          </Text>
        </View>
        <View style={styles.sectionDivider} />
        {/* Order summary section */}
        <View>
          <Text style={[styles.sectionTitle, { paddingHorizontal: 20 }]}>
            Tóm tắt đơn hàng
          </Text>
          <Divider style={{ marginVertical: 10 }} />
          <View style={styles.orderSummaryContainer}>
            {/* Map through cart items */}
            {orderDetail?.orderSummary?.items?.length > 0 ? (
              orderDetail.orderSummary.items.map((item, index) => (
                <View key={index} style={styles.orderRow}>
                  <View style={{ flexDirection: "column", gap: 8, flex: 1 }}>
                    <Text style={{ fontSize: 14 }}>
                      {item.quantity}x {item.serviceName} (
                      {item.servicePrice
                        ? `${item.servicePrice.toLocaleString()}đ`
                        : ""}
                      )
                    </Text>

                    {/* Show extras if they exist */}
                    {item.extras && item.extras.length > 0 && (
                      <View style={{ marginLeft: 15 }}>
                        {item.extras.map((extra, extraIndex) => (
                          <Text
                            key={`${index}-${extraIndex}`}
                            style={{ fontSize: 14, color: "#666" }}
                          >
                            + {item.quantity}x {extra.extraName} (
                            {(
                              extra.extraPrice * item.quantity
                            ).toLocaleString()}
                            đ )
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: "500" }}>
                    {item.subTotal?.toLocaleString()}đ
                  </Text>
                </View>
              ))
            ) : (
              <Text style={{ textAlign: "center", padding: 15, color: "#666" }}>
                Chưa có dịch vụ nào trong giỏ hàng
              </Text>
            )}
            {/* Subtotal */}
            <View style={[styles.orderRow, { marginTop: 15 }]}>
              <Text style={{ fontSize: 16 }}>Tổng tạm tính dịch vụ</Text>
              <Text style={{ fontSize: 16 }}>
                {orderDetail?.orderSummary?.estimatedTotal?.toLocaleString()}đ
              </Text>
            </View>

            {/* Shipping Fee */}
            <View style={styles.orderRow}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ fontSize: 16 }}>Phí ship</Text>
              </View>
              <Text style={{ fontSize: 16 }}>
                {orderDetail?.orderSummary?.shippingFee?.toLocaleString()}đ
              </Text>
            </View>

            {/*additional fee */}
            <View style={styles.orderRow}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ fontSize: 16 }}>Phí áp dụng</Text>
              </View>
              <Text style={{ fontSize: 16 }}>
                {orderDetail?.orderSummary?.applicableFee?.toLocaleString()}đ
              </Text>
            </View>

            <Divider style={{ marginVertical: 10 }} />
            {/* Total Fee */}
            <View style={styles.orderRow}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ fontSize: 16 }}>Tổng</Text>
              </View>
              <Text style={{ fontSize: 16 }}>
                {orderDetail?.orderSummary?.totalPrice?.toLocaleString()}đ
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.sectionDivider} />
        {/* User Information Section */}
        <View>
          <View style={styles.userInfoContainer}>
            <View style={styles.userInfoHeader}>
              <Text style={styles.userInfoTitle}>Thông tin khách hàng</Text>
              <TouchableOpacity
                style={styles.chatButton}
                onPress={() => {
                  startConversation(assignmentDetail?.customerId);
                }}
              >
                <Ionicons name="chatbubble-outline" size={20} color="#63B35C" />
                <Text style={styles.chatButtonText}>Nhắn tin</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.userInfoRow}>
              <Ionicons name="person-outline" size={20} color="#02A257" />
              <Text style={styles.userInfoLabel}>Họ tên:</Text>
              <Text style={styles.userInfoValue}>
                {assignmentDetail?.fullname || "Chưa có thông tin"}
              </Text>
            </View>
            <View style={styles.userInfoRow}>
              <Ionicons name="call-outline" size={20} color="#02A257" />
              <Text style={styles.userInfoLabel}>Số điện thoại:</Text>
              <Text style={styles.userInfoValue}>
                {assignmentDetail?.phonenumber || "Chưa có thông tin"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionDivider} />
        {/* Location section */}
        <View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingHorizontal: 20,
            }}
          >
            <Text style={styles.sectionTitle}>Địa chỉ nhận hàng</Text>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("AddressDeliveryNavigateMap", {
                  userData: {
                    deliveryLongitude: orderDetail.deliveryLongitude,
                    deliveryLatitude: orderDetail.deliveryLatitude,
                    deliveryName:
                      orderDetail.deliveryName || assignmentDetail?.fullname,
                    deliveryPhone:
                      orderDetail.deliveryPhone ||
                      assignmentDetail?.phonenumber,
                    deliveryAddressDetail:
                      orderDetail.deliveryAddressDetail ||
                      assignmentDetail?.deliveryAddress,
                  },
                  showDrivingView: false, // Initially show the overview map
                  showTravelingArrow: true,
                })
              }
              className="flex-row items-center gap-x-2"
            >
              <Ionicons name="map-outline" size={20} color="#63B35C" />
              <Text style={{ color: "#63B35C" }}>Chỉ đường</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.addressContainer, { paddingHorizontal: 20 }]}>
            <MapboxGL.MapView
              style={styles.map}
              compassEnabled={false}
              zoomEnabled={false}
              scrollEnabled={false}
              rotateEnabled={false}
              logoEnabled={false}
              scaleBarEnabled={false}
            >
              {orderDetail?.deliveryLatitude &&
                orderDetail?.deliveryLongitude && (
                  <>
                    <MapboxGL.Camera
                      zoomLevel={15}
                      centerCoordinate={[
                        orderDetail.deliveryLongitude,
                        orderDetail.deliveryLatitude,
                      ]}
                    />
                    <MapboxGL.PointAnnotation
                      id="pickupLocation"
                      coordinate={[
                        orderDetail.deliveryLongitude,
                        orderDetail.deliveryLatitude,
                      ]}
                    />
                  </>
                )}
            </MapboxGL.MapView>
            <View
              style={{
                flexDirection: "column",
                justifyContent: "flex-start",
                gap: 10,
              }}
            >
              {assignmentDetail ? (
                <>
                  <Text style={{ fontSize: 14, fontWeight: "600" }}>
                    {assignmentDetail.fullname} - {assignmentDetail.phonenumber}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      flexShrink: 1,
                      maxWidth: "80%",
                    }}
                    numberOfLines={3}
                    ellipsizeMode="tail"
                  >
                    {assignmentDetail.deliveryAddress}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={{ fontSize: 14 }}>Không tìm thấy địa chỉ </Text>
                  <Text style={{ fontSize: 11 }}>Vui lòng thêm địa chỉ</Text>
                </>
              )}
            </View>
          </View>
        </View>
        <View style={styles.sectionDivider} />
        {/* Notes Section */}
        <View style={[styles.section, { paddingHorizontal: 20 }]}>
          <Text style={styles.sectionTitle}>Ghi chú</Text>
          <View style={{ marginTop: 10 }}>
            <TextInput
              mode="flat"
              style={{ backgroundColor: "white" }}
              theme={{ colors: { primary: "gray" } }}
              multiline={true}
              numberOfLines={5}
              dense={true}
              value={assignmentDetail?.note || "N/A"}
              editable={false}
            />
          </View>
        </View>
        <View style={styles.sectionDivider} />
        {/* Payment method section */}
        <View>
          <Text
            style={[
              styles.sectionTitle,
              { paddingHorizontal: 20, marginBottom: 15 },
            ]}
          >
            Hình thức thanh toán
          </Text>

          <PaymentMethod
            selectedPayment={selectedPayment}
            setSelectedPayment={setSelectedPayment}
          />
        </View>
        <View
          style={{
            height: 10,
            backgroundColor: "#f5f5f5",
            width: "100%",
            marginBottom: 10,
          }}
        />
      </ScrollView>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            styles.cancelButton,
            isLoadingCancelDelivery && { backgroundColor: "#6c757d" },
          ]}
          onPress={() => setCancelModalVisible(true)}
          disabled={isLoadingCancelDelivery || paymentSuccess}
        >
          {isLoadingCancelDelivery ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.cancelButtonText}>Hủy đơn</Text>
          )}
        </TouchableOpacity>

        {selectedPayment === "cash" || paymentSuccess ? (
          <TouchableOpacity
            style={[
              styles.button,
              styles.completeButton,
              isLoadingConfirmDelivery && { backgroundColor: "#6c757d" },
            ]}
            onPress={() => setCompleteModalVisible(true)}
            disabled={isLoadingConfirmDelivery}
          >
            {isLoadingConfirmDelivery ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.completeButtonText}>Hoàn thành đơn</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.button,
              styles.completeButton,
              isLoadingPayment && { backgroundColor: "#6c757d" },
            ]}
            onPress={handleMakePayment}
            disabled={isLoadingPayment}
          >
            {isLoadingPayment ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.completeButtonText}>Thanh toán</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 20,
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    zIndex: 999,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#02A257",
    fontWeight: "500",
  },
  sectionDivider: {
    height: 10,
    backgroundColor: "#f5f5f5",
    width: "100%",
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 10,
  },
  sectionSubtitle: {
    color: "green",
    marginBottom: 10,
  },
  addressContainer: {
    borderRadius: 5,
    flexDirection: "row",
    gap: 20,
    padding: 10,
  },
  map: {
    width: 80,
    height: 80,
  },
  serviceName: {
    fontSize: 10,
    textAlign: "center",
  },
  orderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  orderLabel: {
    fontWeight: "bold",
    fontSize: 20,
  },
  orderValue: {
    fontWeight: "bold",
    fontSize: 18,
  },
  orderSummaryContainer: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    gap: 10,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    gap: 8,
    width: "100%",
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  paymentOptionNew: {
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 0,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: "#e0e0e0",
    backgroundColor: "white",
    height: 80,
    width: "50%",
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  paymentContainer: {
    padding: 0,
    backgroundColor: "#fff",
    borderRadius: 5,
    flexDirection: "row",
    gap: 1,
    width: "100%",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  button: {
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#f8f8f8",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  completeButton: {
    backgroundColor: "#02A257",
    marginLeft: 8,
  },
  cancelButtonText: {
    color: "#333",
    fontWeight: "600",
    fontSize: 16,
  },
  completeButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
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
  userInfoContainer: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    gap: 10,
  },
  userInfoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  userInfoTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  chatButtonText: {
    fontSize: 14,
    color: "#63B35C",
  },
  userInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  userInfoLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  userInfoValue: {
    fontSize: 14,
    color: "#666",
  },
});

export default OrderDetail;
