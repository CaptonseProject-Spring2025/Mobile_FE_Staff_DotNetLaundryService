import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Alert,
  TextInput,
  Image,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  BackHandler,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import axiosClient from "../../../api/config/axiosClient";
import {
  Keyboard,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Checkbox } from "react-native-paper";

const OrderDetailWashedScreen = ({ route, navigation }) => {
  const { orderId, orderDetail } = route.params;
  const [photos, setPhotos] = useState([]);
  const [note, setNote] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isFail, setIsFail] = useState(false);
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Xử lý back button
  const handleGoBack = () => {
    console.log("Navigating back...");
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("OrderWashedListScreen");
    }
    return true;
  };

  useEffect(() => {
    // Animation when screen loads
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Cấu hình header với nút back
    navigation.setOptions({
      headerTitle: "Chi tiết đơn hàng",
      headerTitleStyle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#374151",
      },
      headerLeft: () => (
        <TouchableOpacity
          onPress={handleGoBack}
          style={{ padding: 10, marginLeft: 5 }}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
      ),
      headerShown: true,
      headerTitleAlign: "center",
    });

    // Handle hardware back button
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      handleGoBack
    );

    return () => backHandler.remove();
  }, [navigation]);

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
      aspect: [4, 3],
      exif: false,
    });

    if (result.canceled) {
      return;
    }

    if (result.assets && result.assets.length > 0) {
      const selectedPhoto = result.assets[0];
      // Animation for new photo
      const newPhotoAnim = new Animated.Value(0);
      Animated.spring(newPhotoAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }).start();

      setPhotos((prevPhotos) => [...prevPhotos, selectedPhoto]);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Quyền truy cập bị từ chối",
        "Bạn cần cấp quyền truy cập thư viện ảnh."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
      aspect: [4, 3],
      exif: false,
      allowsMultipleSelection: true,
      selectionLimit: 5,
    });

    if (result.canceled) {
      return;
    }

    if (result.assets && result.assets.length > 0) {
      // Animation for new photos
      const newPhotoAnim = new Animated.Value(0);
      Animated.spring(newPhotoAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }).start();

      setPhotos((prevPhotos) => [...prevPhotos, ...result.assets]);
    }
  };
  const prepareAndUploadFormData = () => {
    setIsUploading(true);
    const formData = new FormData();

    // Thêm orderId vào formData
    formData.append("orderId", orderId);

    // Thêm notes vào formData
    formData.append("notes", note);

    // Add the isFail flag to formData
    formData.append("isFail", isFail);

    // Thêm files vào formData
    try {
      let totalSize = 0;
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];

        // Kiểm tra kích thước file
        if (photo.fileSize) {
          totalSize += photo.fileSize;
          // Nếu ảnh quá lớn, hiển thị cảnh báo
          if (photo.fileSize > 5 * 1024 * 1024) {
            // 5MB
            Alert.alert(
              "Cảnh báo",
              `Ảnh thứ ${i + 1} có kích thước lớn (${(
                photo.fileSize /
                1024 /
                1024
              ).toFixed(2)}MB) và có thể gây lỗi khi upload.`
            );
          }
        }

        // Quan trọng: Sử dụng tham số 'files' thay vì files[${index}]
        formData.append("files", {
          uri: photo.uri,
          type: photo.mimeType || "image/jpeg",
          name: photo.fileName || `photo_${i + 1}.jpg`,
        });
      }

      // Log tổng kích thước
      console.log(
        `Tổng kích thước ảnh: ${(totalSize / 1024 / 1024).toFixed(2)}MB`
      );

      // Nếu tổng kích thước quá lớn, hiển thị cảnh báo
      if (totalSize > 10 * 1024 * 1024) {
        // 10MB
        Alert.alert(
          "Cảnh báo",
          `Tổng kích thước ảnh (${(totalSize / 1024 / 1024).toFixed(
            2
          )}MB) có thể quá lớn. Bạn có muốn tiếp tục?`,
          [
            {
              text: "Hủy",
              onPress: () => setIsUploading(false),
              style: "cancel",
            },
            { text: "Tiếp tục", onPress: () => performQualityCheck(formData) },
          ]
        );
      } else {
        performQualityCheck(formData);
      }
    } catch (error) {
      console.error("Lỗi chuẩn bị dữ liệu:", error);
      Alert.alert("Lỗi", "Không thể chuẩn bị dữ liệu. Vui lòng thử lại.");
      setIsUploading(false);
    }
  };

  const handleWashedConfirm = async () => {
    if (!orderId) {
      Alert.alert("Lỗi", "Không tìm thấy mã đơn hàng.");
      return;
    }
    if (!note) {
      Alert.alert("Lỗi", "Vui lòng nhập ghi chú kiểm tra chất lượng.");
      return;
    }
    if (photos.length === 0) {
      Alert.alert("Lỗi", "Vui lòng chọn ít nhất một ảnh.");
      return;
    }

    // Check if the order is marked as damaged and show confirmation alert
    if (isFail) {
      Alert.alert(
        "Xác nhận đơn hàng hỏng",
        "Bạn đã đánh dấu đơn hàng này là hỏng. Bạn có chắc chắn muốn tiếp tục không?",
        [
          {
            text: "Hủy",
            style: "cancel",
          },
          {
            text: "Tiếp tục",
            onPress: () => prepareAndUploadFormData(),
          },
        ]
      );
    } else {
      prepareAndUploadFormData();
    }
  };

  const performQualityCheck = async (formData) => {
    try {
      const response = await axiosClient.post(
        "staff/orders/washed/quality-check",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
          },
          timeout: 60000,
        }
      );

      console.log("Xác nhận thành công:", response.data);
      Alert.alert("Thành công", "Đơn hàng đã được kiểm tra chất lượng!", [
        {
          text: "OK",
          onPress: handleGoBack,
        },
      ]);
    } catch (error) {
      console.error(
        "Lỗi xác nhận:",
        error.response?.data || error.message || error
      );

      let errorMessage = "Không thể xác nhận đơn hàng. Vui lòng thử lại.";
      if (error.response) {
        if (error.response.status === 400) {
          errorMessage = "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.";
        } else if (error.response.status === 401) {
          errorMessage = "Bạn không có quyền cập nhật đơn hàng này.";
        } else if (error.response.status === 404) {
          errorMessage = "Không tìm thấy đơn hàng.";
        } else if (error.response.status === 413) {
          errorMessage =
            "Kích thước ảnh quá lớn. Vui lòng giảm số lượng ảnh hoặc chụp với độ phân giải thấp hơn.";
        } else if (error.response.status === 500) {
          errorMessage = "Lỗi cập nhật đơn hàng. Vui lòng thử lại sau.";
        }
      }

      Alert.alert("Lỗi", errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <Animated.View
          className="flex-1 bg-white"
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <ScrollView className="flex-1 p-4">
            {/* Order Info Card */}
            <View className="bg-white rounded-xl shadow-sm p-5 mb-5">
              <View className="flex-row justify-between items-center mb-3">
                <View className="bg-green-50 px-3 py-1 rounded-full">
                  <Text className="text-green-600 font-medium">
                    Mã đơn: {orderId}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  {orderDetail.emergency && (
                    <View className="bg-red-500 px-3 py-1 rounded-full mr-2">
                      <Text className="text-white font-medium text-xs">
                        Khẩn cấp
                      </Text>
                    </View>
                  )}
                  <View className="bg-green-100 px-3 py-1 rounded-full">
                    <Text className="text-green-700 font-medium text-xs">
                      {orderDetail.currentStatus}
                    </Text>
                  </View>
                </View>
              </View>
              <View className="border-b border-gray-100 pb-3 mb-3">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="person-outline" size={18} color="#4B5563" />
                  <Text className="text-gray-700 ml-2">
                    {orderDetail.customerInfo.customerName}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="call-outline" size={18} color="#4B5563" />
                  <Text className="text-gray-600 ml-2">
                    {orderDetail.customerInfo.customerPhone}
                  </Text>
                </View>
              </View>
              <View className="border-b border-gray-100 pb-3 mb-3">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="shirt-outline" size={18} color="#4B5563" />
                  <Text className="text-gray-700 ml-2">
                    {orderDetail.serviceNames}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="cash-outline" size={18} color="#E53E3E" />
                  <Text className="text-red-600 font-bold ml-2">
                    {orderDetail.totalPrice.toLocaleString()} VND
                  </Text>
                </View>
              </View>
              <View>
                <View className="flex-row items-center mb-2">
                  <Ionicons name="calendar-outline" size={18} color="#4B5563" />
                  <Text className="text-gray-600 ml-2">
                    Ngày đặt:
                    {format(new Date(orderDetail.orderDate), "dd/MM/yyyy", {
                      locale: vi,
                    })}
                  </Text>
                </View>
                <View className="flex-row items-center mb-2">
                  <Ionicons name="time-outline" size={18} color="#4B5563" />
                  <Text className="text-gray-600 ml-2">
                    Thời gian lấy:
                    {format(
                      new Date(orderDetail.pickupTime),
                      "dd/MM/yyyy HH:mm",
                      { locale: vi }
                    )}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="time-outline" size={18} color="#4B5563" />
                  <Text className="text-gray-600 ml-2">
                    Thời gian giao:
                    {format(
                      new Date(orderDetail.deliveryTime),
                      "dd/MM/yyyy HH:mm",
                      { locale: vi }
                    )}
                  </Text>
                </View>
              </View>
            </View>

            {/* Note Input */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">
                Ghi chú kiểm tra chất lượng
              </Text>
              <TextInput
                placeholder="Nhập ghi chú đánh giá chất lượng..."
                value={note}
                onChangeText={setNote}
                className="border border-gray-300 rounded-lg p-3 bg-white text-gray-800"
                multiline={true}
                numberOfLines={3}
              />
            </View>
            {/* Failed Order Checkbox  */}
            <View className="mb-4 flex-row items-center">
              <Checkbox
                status={isFail ? "checked" : "unchecked"}
                onPress={() => setIsFail(!isFail)}
                color="#EF4444" // Red color for the checkbox
              />
              <Text className="text-gray-700 font-medium ml-2">
                Đánh dấu đơn hàng có vấn đề/hư hỏng
              </Text>
            </View>

            {/* Photo Gallery */}
            <View className="mb-6">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-gray-700 font-medium">
                  Hình ảnh đính kèm
                </Text>
                <View className="flex-row">
                  <TouchableOpacity
                    onPress={handlePickImage}
                    className="bg-blue-500 px-3 py-2 rounded-lg flex-row items-center mr-2"
                  >
                    <Ionicons name="image-outline" size={18} color="white" />
                    <Text className="text-white font-medium ml-1">
                      Chọn ảnh
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleTakePhoto}
                    className="bg-green-500 px-3 py-2 rounded-lg flex-row items-center"
                  >
                    <Ionicons name="camera-outline" size={18} color="white" />
                    <Text className="text-white font-medium ml-1">
                      Chụp ảnh
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {photos.length > 0 ? (
                <ScrollView
                  horizontal={true}
                  showsHorizontalScrollIndicator={false}
                  className="flex-row mb-2"
                >
                  {photos.map((photo, index) => (
                    <Animated.View
                      key={index}
                      className="mr-3"
                      style={{
                        transform: [{ scale: fadeAnim }],
                      }}
                    >
                      <Image
                        source={{ uri: photo.uri }}
                        className="w-28 h-28 rounded-lg"
                        resizeMode="cover"
                      />
                      <View className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full items-center justify-center">
                        <TouchableOpacity
                          onPress={() => {
                            setPhotos(photos.filter((_, i) => i !== index));
                          }}
                        >
                          <Ionicons name="close" size={12} color="white" />
                        </TouchableOpacity>
                      </View>
                    </Animated.View>
                  ))}
                </ScrollView>
              ) : (
                <View className="h-24 bg-gray-100 rounded-lg items-center justify-center">
                  <Ionicons name="images-outline" size={32} color="#9CA3AF" />
                  <Text className="text-gray-500 mt-2">Chưa có hình ảnh</Text>
                </View>
              )}
            </View>

            {/* Action Button */}
            <View className="mb-4">
              <TouchableOpacity
                onPress={handleWashedConfirm}
                disabled={isUploading}
                className={`py-3 rounded-lg items-center justify-center ${
                  isUploading ? "bg-green-300" : "bg-green-600"
                }`}
              >
                {isUploading ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator size="small" color="white" />
                    <Text className="text-white font-bold ml-2">
                      Đang xác nhận...
                    </Text>
                  </View>
                ) : (
                  <View className="flex-row items-center">
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={20}
                      color="white"
                    />
                    <Text className="text-white font-bold ml-2">
                      XÁC NHẬN KIỂM TRA CHẤT LƯỢNG
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default OrderDetailWashedScreen;
