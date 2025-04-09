import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Button,
  Alert,
  TextInput,
  Image,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import axiosClient from "../../../api/config/axiosClient";
import {
  Keyboard,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";

const OrderDetailScreen = ({ route, navigation }) => {
  const { orderId, orderDetail } = route.params; // Nhận orderId và thông tin đơn hàng từ navigation
  const [photos, setPhotos] = useState([]); // Lưu trữ danh sách ảnh

  const [note, setNote] = useState("");
  const [isUploading, setIsUploading] = useState(false); // Trạng thái loading cho nút "Upload Ảnh và Ghi Chú"
  const [isConfirming, setIsConfirming] = useState(false);
  console.log("photos", photos);
  console.log("note", note);

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
      const selectedPhoto = result.assets[0];
      console.log("Ảnh đã chọn:", selectedPhoto);
      setPhotos((prevPhotos) => [...prevPhotos, selectedPhoto]); // Thêm ảnh vào danh sách
    } else {
      console.log("Không tìm thấy ảnh trong kết quả.");
    }
  };

  const handleUploadPhoto = async () => {
    console.log("photos", photos);
    if (!photos) {
      Alert.alert("Lỗi", "Vui lòng chụp ảnh trước khi upload.");
      return;
    }

    setIsUploading(true); // Bắt đầu loading
    const formData = new FormData();
    formData.append("orderId", orderId);
    formData.append("notes", note);
    // Thêm từng ảnh vào FormData
    photos.forEach((photo, index) => {
      formData.append(`files[${index}]`, {
        uri: photo.uri, // Đường dẫn file ảnh
        type: photo.mimeType || "image/jpeg", // Loại file (mime type)
        name: photo.fileName || `photo_${index + 1}.jpg`, // Tên file
      });
    });

    try {
      const response = await axiosClient.post(
        "/staff/orders/checking/update",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      console.log("Upload thành công:", response.data); // Log kết quả thành công

      // Cập nhật danh sách ảnh từ phản hồi API
      const uploadedPhotos = response.data.photoUrls.map((item) => ({
        uri: item.photoUrl,
        createdAt: item.createdAt,
      }));

      setPhotos(uploadedPhotos); // Cập nhật danh sách ảnh
      Alert.alert("Thành công", "Ảnh và ghi chú đã được cập nhật!");
    } catch (error) {
      console.error("Lỗi upload:", error); // Log toàn bộ lỗi
      if (error.response) {
        // Lỗi từ server (HTTP status code không phải 2xx)
        console.log("Response data:", error.response.data);
        console.log("Response status:", error.response.status);
        console.log("Response headers:", error.response.headers);
      } else if (error.request) {
        // Không nhận được phản hồi từ server
        console.log("Request data:", error.request);
      } else {
        // Lỗi khác
        console.log("Error message:", error.message);
      }
      Alert.alert("Lỗi", "Không thể upload ảnh. Vui lòng thử lại.");
    } finally {
      setIsUploading(false); // Kết thúc loading
    }
  };

  const handleConfirmOrder = async () => {
    setIsConfirming(true); // Bắt đầu loading
    try {
      await axiosClient.post(
        `staff/orders/checking/confirm?orderId=${orderId}&notes=${note}`
      );
      Alert.alert("Thành công", "Đơn hàng đã được xác nhận!");
      navigation.goBack(); // Quay lại màn hình trước
    } catch (error) {
      console.error(error);
      Alert.alert("Lỗi", "Không thể xác nhận đơn hàng. Vui lòng thử lại.");
    } finally {
      setIsConfirming(false); // Kết thúc loading
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1, backgroundColor: "white", padding: 16 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              color: "#2FA060",
              marginBottom: 8,
            }}
          >
            Mã đơn: {orderId}
          </Text>
          <Text style={{ fontSize: 16, color: "#333" }}>
            Khách hàng: {orderDetail.customerInfo.customerName}
          </Text>
          <Text style={{ fontSize: 16, color: "#555" }}>
            SĐT: {orderDetail.customerInfo.customerPhone}
          </Text>
          <Text style={{ fontSize: 16, color: "#333" }}>
            Dịch vụ: {orderDetail.serviceNames}
          </Text>
          <Text style={{ fontSize: 16, color: "#FF3B30" }}>
            Tổng tiền: {orderDetail.totalPrice.toLocaleString()} VND
          </Text>
          <Text style={{ fontSize: 14, color: "#888" }}>
            Trạng thái: {orderDetail.currentStatus}
          </Text>
          <Text className="text-sm text-gray-500">
            Ngày đặt: {new Date(orderDetail.orderDate).toLocaleDateString()}
          </Text>
          <Text className="text-sm text-gray-500">
            Thời gian lấy: {new Date(orderDetail.pickupTime).toLocaleString()}
          </Text>
          <Text className="text-sm text-gray-500">
            Thời gian giao:{" "}
            {new Date(orderDetail.deliveryTime).toLocaleString()}
          </Text>
          <TextInput
            placeholder="Nhập ghi chú"
            value={note}
            onChangeText={setNote}
            style={{
              borderWidth: 1,
              borderColor: "#ccc",
              borderRadius: 8,
              padding: 8,
              marginVertical: 16,
            }}
          />
          <View style={{ marginBottom: 16 }}>
            <Button
              title="Chụp ảnh"
              onPress={handleTakePhoto}
              color="#2FA060"
            />
          </View>
          <ScrollView
            horizontal={true} // Kích hoạt cuộn ngang
            showsHorizontalScrollIndicator={false} // Ẩn thanh cuộn ngang
            style={{ marginBottom: 16 }}
          >
            {photos.map((photo, index) => (
              <Image
                key={index}
                source={{ uri: photo.uri }}
                style={{
                  width: 100,
                  height: 100,
                  marginRight: 10, // Khoảng cách giữa các ảnh
                  borderRadius: 8, // Bo góc ảnh
                }}
              />
            ))}
          </ScrollView>
          <View style={{ marginBottom: 16 }}>
            {isUploading ? (
              <Button
                title="Đang Upload..."
                disabled={true} // Vô hiệu hóa nút khi đang loading
                color="#FFA500"
              />
            ) : (
              <Button
                title="Upload Ảnh và Ghi Chú"
                onPress={handleUploadPhoto}
                color="#FFA500"
              />
            )}
          </View>
          <View>
            {isConfirming ? (
              <Button
                title="Đang Xác Nhận..."
                disabled={true} // Vô hiệu hóa nút khi đang loading
                color="#007AFF"
              />
            ) : (
              <Button
                title="Xác Nhận Đơn Hàng"
                onPress={handleConfirmOrder}
                color="#007AFF"
              />
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default OrderDetailScreen;
