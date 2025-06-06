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
  Linking,
} from "react-native";
import { Divider } from "react-native-paper";
import MapboxGL from "@rnmapbox/maps";
import useOrderStore from "../../../../api/store/orderStore";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import useAuthStore from "../../../../api/store/authStore";
import axiosClient from "../../../../api/config/axiosClient";
import useUserStore from "../../../../api/store/userStore";

const OrderPickupDetail = ({ navigation, route }) => {
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [completeNote, setCompleteNote] = useState("");
  const [dataLoaded, setDataLoaded] = useState(false);
  const [images, setImages] = useState([]);
  const { assignmentId } = route.params;
  const {
    cancelPickUp,
    isLoadingCancelPickUp,
    cancelPickUpError,
    fetchOrderDetail,
    isLoadingOrderDetail,
    orderDetail,
    fetchAssignmentDetail,
    assignmentDetail,
    isLoadingAssignmentDetail,
    confirmPickUp,
    isLoadingConfirmPickUp,
    confirmPickUpError,
    cancelPickupNoshow,
    isLoadingCancelNoshow,
    cancelNoshowError,
    noshow,
    noshowfee,
    isLoaidngNoshow,
  } = useOrderStore();

  const { userDetail } = useAuthStore();
  const { getUserById, userInfo } = useUserStore();
  const currentUserId = userDetail?.userId;

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
            setDataLoaded(true);
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

  useEffect(() => {
    const fetchNoshowFee = async () => {
      if (assignmentDetail?.orderId) {
        try {
          await noshow(assignmentDetail.orderId);
        } catch (error) {
          console.error("Error fetching noshow fee:", error);
        }
      }
    };

    fetchNoshowFee();
  }, [assignmentDetail?.orderId]);

  const startConversation = async (receiverId) => {
    try {
      const response = await axiosClient.get(
        `Conversations/${receiverId}?currentUserId=${currentUserId}`
      );
      const data = response.data;
      const userData = userDetail;
      const customerData = userInfo;

      if (data.exists !== true) {
        const createResponse = await axiosClient.post("/Conversations", {
          userOneId: currentUserId,
          userTwoId: receiverId,
        });
        navigation.navigate("ChatScreen", {
          chatId: createResponse.data.conversationId,
          userId: receiverId,
          currentUserId: currentUserId,
          name: customerData.fullName,
          avatar: customerData.avatar,
        });
      } else {
        navigation.navigate("ChatScreen", {
          chatId: data.currenUserId,
          userId: receiverId,
          currentUserId: currentUserId,
          userName: customerData.fullName,
          userAvatar: customerData.avatar,
        });
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
    }
  };

  const handleCancelPickUp = async () => {
    try {
      if (!assignmentDetail.orderId) {
        return Alert.alert("Lỗi", "Không tìm thấy mã đơn hàng", [
          { text: "OK" },
        ]);
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
      formData.append("cancelReason", cancelReason);

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
        navigation.goBack();
      }
    } catch (error) {
      console.log("Cancel pick up error:", error);
      Alert.alert(
        "Lỗi",
        cancelPickUpError || "Đã xảy ra lỗi khi hủy xác nhận lấy hàng.",
        [{ text: "OK" }]
      );
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
      quality: 0.5,
      base64: false,
      exif: false,
    });

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

  const handlePickedUpOrder = async () => {
    try {
      // Validate image requirement
      if (!images || images.length === 0) {
        return Alert.alert(
          "Thiếu thông tin",
          "Vui lòng gửi ít nhất một ảnh xác nhận lấy hàng",
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

      for (let i = 0; i < images.length; i++) {
        const imageUri = images[i];
        const imageName = imageUri.split("/").pop();
        const imageType =
          "image/" + (imageName.split(".").pop() === "png" ? "png" : "jpeg");

        formData.append("files", {
          uri: imageUri,
          name: imageName,
          type: imageType,
        });
      }

      console.log(
        "Form data prepared for pickup confirmation with",
        images.length,
        "images"
      );

      setCompleteModalVisible(false);
      // Call the API
      await confirmPickUp(formData);

      // Close modal and reset values
      setCompleteNote("");
      setImages([]);

      Toast.show({
        type: "success",
        text1: "Đơn hàng đã hoàn thành",
        text2: "Xác nhận lấy hàng thành công",
      });
      navigation.goBack();
    } catch (error) {
      console.error("Error confirming pick up:", error);

      // Show specific validation errors if available
      const errorMsg = error.response?.data?.errors?.notes
        ? error.response.data.errors.notes[0]
        : confirmPickUpError || "Không thể xác nhận lấy hàng";

      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: errorMsg,
      });
      console.log("Confirm pick up error:", error.response?.data);
    }
  };

  const handleCall = () => {
    let phoneNumber = assignmentDetail.phonenumber;
    if (Platform.OS === "android") {
      phoneNumber = `tel:${phoneNumber}`;
    } else {
      phoneNumber = `telprompt:${phoneNumber}`;
    }
    Linking.openURL(phoneNumber).catch((err) =>
      console.error("Error opening dialer:", err)
    );
  };

  const handleCancelNoshow = async () => {
    try {
      if (!assignmentDetail || !assignmentDetail.orderId) {
        Alert.alert("Lỗi", "Không tìm thấy mã đơn hàng");
        return;
      }

      const response = await cancelPickupNoshow(assignmentDetail.orderId);

      if (response && response.status === 200) {
        Toast.show({
          type: "success",
          text1: "Thành công",
          text2: "Đã đánh dấu khách hàng không có mặt",
        });
        navigation.goBack();
      }
    } catch (error) {
      console.error("Error when marking customer as not present:", error);
      Alert.alert(
        "Lỗi",
        error.response?.data?.message ||
          cancelNoshowError ||
          "Đã xảy ra lỗi khi xử lý yêu cầu"
      );
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
            <View style={{ ...styles.modalButtonContainer, marginTop: 10 }}>
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
                }}
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
                  handlePickedUpOrder();
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

            {/* Noshow Fee */}
            {noshowfee && noshowfee.total > 0 && (
              <View style={styles.orderRow}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={{ fontSize: 16 }}>Phí không có mặt</Text>
                  <TouchableOpacity
                    style={{ marginLeft: 5 }}
                    onPress={() => {
                      Alert.alert(
                        "Thông tin phí không có mặt",
                        `Nếu khách hàng không có mặt tại địa chỉ nhận hoặc trả hàng khi tài xế đến, hệ thống sẽ tính thêm phí ship.\n\n${
                          noshowfee.pickupFailCount > 0
                            ? `• Phí không có mặt lúc lấy hàng (${
                                noshowfee.pickupFailCount
                              } lần): ${noshowfee.pickupFailFee.toLocaleString()}đ\n`
                            : ""
                        }${
                          noshowfee.deliveryFailCount > 0
                            ? `• Phí không có mặt lúc giao hàng (${
                                noshowfee.deliveryFailCount
                              } lần): ${noshowfee.deliveryFailFee.toLocaleString()}đ`
                            : ""
                        }\n\nTổng phí: ${noshowfee.total.toLocaleString()}đ`
                      );
                    }}
                  >
                    <Ionicons
                      name="information-circle-outline"
                      size={18}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
                <Text style={{ fontSize: 16 }}>
                  {noshowfee.total.toLocaleString()}đ
                </Text>
              </View>
            )}

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
                {(
                  (orderDetail?.orderSummary?.totalPrice || 0) +
                  (noshowfee?.total || 0)
                ).toLocaleString()}
                đ
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
              <TouchableOpacity onPress={handleCall}>
                <Ionicons name="call-outline" size={20} color="#02A257" />
              </TouchableOpacity>
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
                navigation.navigate("AddressNavigateMap", {
                  userData: {
                    pickupLongitude: orderDetail.pickupLongitude,
                    pickupLatitude: orderDetail.pickupLatitude,
                    pickupName:
                      orderDetail.pickupName || assignmentDetail?.fullname,
                    pickupPhone:
                      orderDetail.pickupPhone || assignmentDetail?.phonenumber,
                    pickupAddressDetail:
                      orderDetail.pickupAddressDetail ||
                      assignmentDetail?.pickupAddress,
                  },
                  showDrivingView: false, // Initially show the overview map
                  showTravelingArrow: true,
                  orderId: orderDetail.orderId,
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
              {orderDetail?.pickupLatitude && orderDetail?.pickupLongitude && (
                <>
                  <MapboxGL.Camera
                    zoomLevel={15}
                    centerCoordinate={[
                      orderDetail.pickupLongitude,
                      orderDetail.pickupLatitude,
                    ]}
                  />
                  <MapboxGL.PointAnnotation
                    id="pickupLocation"
                    coordinate={[
                      orderDetail.pickupLongitude,
                      orderDetail.pickupLatitude,
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
                    {assignmentDetail.pickupAddress}
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
      </ScrollView>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.buttonNoShow,
            isLoadingCancelNoshow && {
              backgroundColor: "#e9ecef",
              borderColor: "#ced4da",
            },
          ]}
          onPress={() => {
            Alert.alert("Xác nhận", "Bạn có muốn tiếp tục không?", [
              { text: "Huỷ", style: "cancel" },
              { text: "Xác nhận", onPress: handleCancelNoshow },
            ]);
          }}
          disabled={isLoadingCancelNoshow}
        >
          {isLoadingCancelNoshow ? (
            <ActivityIndicator size="small" color="#6c757d" />
          ) : (
            <Text style={[styles.noShowButtonText, { color: "#6c757d" }]}>
              Khách không có mặt
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.bottomButtonRow}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.cancelButton,
              isLoadingCancelPickUp && { backgroundColor: "#6c757d" },
            ]}
            onPress={() => setCancelModalVisible(true)}
            disabled={isLoadingCancelPickUp}
          >
            {isLoadingCancelPickUp ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.cancelButtonText}>Hủy đơn</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.completeButton,
              isLoadingConfirmPickUp && { backgroundColor: "#6c757d" },
            ]}
            onPress={() => setCompleteModalVisible(true)}
            disabled={isLoadingConfirmPickUp}
          >
            {isLoadingConfirmPickUp ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.completeButtonText}>Hoàn thành đơn</Text>
            )}
          </TouchableOpacity>
        </View>
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
  buttonContainer: {
    flexDirection: "column",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fff",
    gap: 10,
  },
  bottomButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  buttonNoShow: {
    backgroundColor: "#fff0f0",
    borderWidth: 1,
    borderColor: "#ffcccc",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  noShowButtonText: {
    color: "#d9534f",
    fontWeight: "600",
    fontSize: 16,
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
    margin: 10,
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

export default OrderPickupDetail;
