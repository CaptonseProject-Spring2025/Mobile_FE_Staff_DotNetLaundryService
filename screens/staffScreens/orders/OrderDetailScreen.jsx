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

const OrderDetailScreen = ({ route, navigation }) => {
  const { orderId, orderDetail } = route.params;
  const [photos, setPhotos] = useState([]);
  const [note, setNote] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

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
  }, []);

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

  const handleUploadPhoto = async () => {
    if (photos.length === 0) {
      Alert.alert("Lỗi", "Vui lòng chụp ảnh trước khi upload.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();

    // Thêm orderId vào formData
    formData.append("orderId", orderId);

    // Thêm notes vào formData
    formData.append("notes", note);

    // Thêm files vào formData đúng định dạng
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

        // Quan trọng: Tên tham số phải là 'files' (số nhiều, không thêm index)
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
            { text: "Tiếp tục", onPress: () => performUpload(formData) },
          ]
        );
      } else {
        await performUpload(formData);
      }
    } catch (error) {
      console.error("Lỗi chuẩn bị dữ liệu:", error);
      Alert.alert(
        "Lỗi",
        "Không thể chuẩn bị dữ liệu upload. Vui lòng thử lại."
      );
      setIsUploading(false);
    }
  };

  const performUpload = async (formData) => {
    try {
      const response = await axiosClient.post(
        "/staff/orders/checking/update",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
          },
          timeout: 60000, // 60 giây
        }
      );

      console.log("Upload response:", response.data);

      // Cập nhật danh sách ảnh từ response
      if (response.data && response.data.photoUrls) {
        const uploadedPhotos = response.data.photoUrls.map((item) => ({
          uri: item.photoUrl,
          createdAt: item.createdAt,
        }));

        setPhotos(uploadedPhotos);
        setNote(""); // Xóa note sau khi upload thành công
        Alert.alert("Thành công", "Ảnh và ghi chú đã được cập nhật!");
      } else {
        Alert.alert(
          "Thông báo",
          "Cập nhật thành công nhưng không nhận được thông tin ảnh."
        );
      }
    } catch (error) {
      console.error(
        "Lỗi upload:",
        error.response?.data || error.message || error
      );

      let errorMessage = "Không thể upload ảnh. Vui lòng thử lại.";
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
          errorMessage = "Lỗi upload ảnh. Vui lòng thử lại sau.";
        }
      }

      Alert.alert("Lỗi", errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmOrder = async () => {
    setIsConfirming(true);
    if (!note) {
      Alert.alert("Lỗi", "Vui lòng nhập ghi chú trước khi xác nhận đơn hàng.");
      setIsConfirming(false);
      return;
    }
    if (photos.length === 0) {
      Alert.alert("Lỗi", "Vui lòng upload ảnh trước khi xác nhận đơn hàng.");
      setIsConfirming(false);
      return;
    }
    try {
      await axiosClient.post(
        `staff/orders/checking/confirm?orderId=${orderId}&notes=${note}`
      );
      Alert.alert("Thành công", "Đơn hàng đã được xác nhận!", [
        {
          text: "OK",
          onPress: () => {
            navigation.navigate("OrderListCheckedScreen");
          },
        },
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert("Lỗi", "Không thể xác nhận đơn hàng. Vui lòng thử lại.");
    } finally {
      setIsConfirming(false);
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
            <View className="bg-white rounded-xl shadow-sm p-5 mb-5">              <View className="flex-row justify-between items-center mb-3">
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
                  <View className="bg-amber-100 px-3 py-1 rounded-full">
                    <Text className="text-amber-700 font-medium text-xs">
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
                Ghi chú đơn hàng
              </Text>
              <TextInput
                placeholder="Nhập ghi chú cho đơn hàng này..."
                value={note}
                onChangeText={setNote}
                className="border border-gray-300 rounded-lg p-3 bg-white text-gray-800"
                multiline={true}
                numberOfLines={3}
              />
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

            {/* Action Buttons */}
            <View className="mb-8">
              <TouchableOpacity
                onPress={handleUploadPhoto}
                disabled={isUploading}
                className={`mb-3 py-3 rounded-lg items-center justify-center ${
                  isUploading ? "bg-amber-300" : "bg-amber-500"
                }`}
              >
                {isUploading ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator size="small" color="white" />
                    <Text className="text-white font-bold ml-2">
                      Đang Upload...
                    </Text>
                  </View>
                ) : (
                  <View className="flex-row items-center">
                    <Ionicons
                      name="cloud-upload-outline"
                      size={20}
                      color="white"
                    />
                    <Text className="text-white font-bold ml-2">
                      UPLOAD ẢNH VÀ GHI CHÚ
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirmOrder}
                disabled={isConfirming}
                className={`py-3 rounded-lg items-center justify-center ${
                  isConfirming ? "bg-blue-300" : "bg-blue-500"
                }`}
              >
                {isConfirming ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator size="small" color="white" />
                    <Text className="text-white font-bold ml-2">
                      Đang Xác Nhận...
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
                      XÁC NHẬN ĐƠN HÀNG
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

export default OrderDetailScreen;
