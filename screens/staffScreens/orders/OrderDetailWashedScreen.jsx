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

const OrderDetailWashedScreen = ({ route, navigation }) => {
  const { orderId, orderDetail } = route.params; // Nhận orderId và thông tin đơn hàng từ navigation
  const [photos, setPhotos] = useState([]); // Lưu trữ danh sách ảnh

  const [note, setNote] = useState("");
  const [isUploadingWashedUpdate, setIsUploadingWashedUpdate] = useState(false); // Trạng thái loading cho nút "Upload Ảnh và Ghi Chú"  
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

  const handleWashedConfirm = async () => {
    console.log("photos", photos);
    if (!orderId) {
      Alert.alert("Lỗi", "Không tìm thấy mã đơn hàng.");
      return;
    }
  
    setIsUploadingWashedUpdate(true); // Bắt đầu trạng thái loading
  
    const formData = new FormData();
    formData.append("orderId", orderId); // Thêm orderId
    formData.append("notes", note); // Thêm ghi chú (nếu có)
  
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
        "staff/orders/washed/quality-check",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
  
      console.log("Cập nhật thành công:", response.data);
      Alert.alert("Thành công", "Đơn hàng đã được cập nhật!");
      // navigation.goBack(); // Quay lại màn hình trước
    } catch (error) {
      console.error("Lỗi cập nhật:", error);
      if (error.response) {
        console.log("Response data:", error.response.data);
        Alert.alert("Lỗi", error.response.data.message || "Có lỗi xảy ra.");
      } else {
        Alert.alert("Lỗi", "Không thể kết nối đến server. Vui lòng thử lại.");
      }
    } finally {
      setIsUploadingWashedUpdate(false); // Kết thúc trạng thái loading
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
          {photos.length > 0 && (
            <ScrollView
              horizontal={true} // Kích hoạt cuộn ngang
              showsHorizontalScrollIndicator={false} // Ẩn thanh cuộn ngang
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
          )}
          <View style={{ marginBottom: 16 }}>
            {isUploadingWashedUpdate ? (
              <Button
                title="Đang load..."
                disabled={true} // Vô hiệu hóa nút khi đang loading
                color="#c0392b"
              />
            ) : (
              <Button
                title="Xác nhận đơn hàng đã kiểm tra chất lượng đơn hàng"
                onPress={handleWashedConfirm}
                color="#c0392b"
              />
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default OrderDetailWashedScreen;
