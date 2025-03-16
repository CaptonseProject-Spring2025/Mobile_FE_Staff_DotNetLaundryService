import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Checkbox } from "react-native-paper";
import { Avatar } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import useUserStore from "../../../api/store/userStore";
import useAuthStore from "../../../api/store/authStore";

export default function UpdateUser({ route, navigation }) {
  // Get user details from route params
  const { userDetail } = useAuthStore();
  const userId = useAuthStore((state) => state.userId);
  const updateUser = useUserStore((state) => state.updateUser);
  const isLoading = useUserStore((state) => state.isLoading);
  const error = useUserStore((state) => state.error);

  // Local state for form fields
  const [gender, setGender] = useState(userDetail?.gender || "");
  const [fullName, setFullName] = useState(userDetail?.fullName || "");
  const [email, setEmail] = useState(userDetail?.email || "");
  const [dob, setDob] = useState(userDetail?.dob || "");
  const [date, setDate] = useState(
    userDetail?.dob ? new Date(userDetail.dob) : new Date()
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [avatar, setAvatar] = useState(userDetail?.avatar || null);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);

  useEffect(() => {
    if (userDetail?.gender) {
      if (userDetail.gender === "Male") {
        setGender("Nam");
      } else if (userDetail.gender === "Female") {
        setGender("Nữ");
      } else {
        // If the gender is already in Vietnamese, use it directly
        setGender(userDetail.gender);
      }
    }

    // Set avatar from user details
    if (userDetail?.avatar) {
      setAvatar(userDetail.avatar);
    }
  }, [userDetail]);
 
  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditing(true);
  };

  // Cancel edits
  const cancelEdit = () => {
    // Reset form fields to original values
    setFullName(userDetail?.fullName || "");
    setEmail(userDetail?.email || "");
    setDob(userDetail?.dob || "");
    setAvatar(userDetail?.avatar || null);

    if (userDetail?.gender) {
      if (userDetail.gender === "Male") {
        setGender("Nam");
      } else if (userDetail.gender === "Female") {
        setGender("Nữ");
      } else {
        setGender(userDetail.gender);
      }
    }

    setIsEditing(false);
  };

  // Handle gender selection
  const handleGenderSelect = (selectedGender) => {
    if (!isEditing) return; // Prevent changes if not in edit mode
    setGender((prevGender) =>
      prevGender === selectedGender ? "" : selectedGender
    );
  };

  const formatDate = (dateString) => {
    // Convert from "YYYY-MM-DD" to "DD/MM/YYYY" format
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  };

  // Permission check for camera and image library
  const requestPermission = async (type) => {
    try {
      if (type === "camera") {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Required",
            "Camera access is needed to take photos. Please enable camera permissions in your device settings.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Settings", onPress: () => Linking.openSettings() }
            ]
          );
        }
        return status === "granted";
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Required",
            "Media library access is needed to select photos. Please enable media library permissions in your device settings.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Settings", onPress: () => Linking.openSettings() }
            ]
          );
        }
        return status === "granted";
      }
    } catch (error) {
      console.error("Permission request error:", error);
      return false;
    }
  };


  // Pick an image from the gallery
  const pickImage = async () => {
    const hasPermission = await requestPermission("library");
    if (!hasPermission) {
      Alert.alert(
        "Permission Required",
        "Please grant media library permission to select photos."
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatar(result.assets[0].uri);
        setShowImagePickerModal(false);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
      console.error(error);
    }
  };

  // Handle update
  const handleUpdate = async () => {
    if (!userDetail.userId) {
      Alert.alert("Error", "User ID not found");
      return;
    }

    // Convert Vietnamese gender to English for API
    let apiGender = gender;
    if (gender === "Nam") {
      apiGender = "Male";
    } else if (gender === "Nữ") {
      apiGender = "Female";
    }

    // Create the updated user object
    const updatedUser = {
      fullName,
      email,
      dob,
      gender: apiGender,
      avatar: avatar,
    };

    try {
      const result = await updateUser(userDetail.userId, updatedUser);

      if (result) {
        // Update the auth store with the new user details
        await useAuthStore.getState().setUserDetail(result);

        // Turn off editing mode
        setIsEditing(false);

        // Update local state with the returned data to reflect changes immediately
        setFullName(result.fullName || "");
        setEmail(result.email || "");
        setDob(result.dob || "");
        setAvatar(result.avatar || null);

        // Handle gender display in Vietnamese
        if (result.gender === "Male") {
          setGender("Nam");
        } else if (result.gender === "Female") {
          setGender("Nữ");
        } else {
          setGender(result.gender || "");
        }

        // Show success message
        Alert.alert("Success", "Profile updated successfully");
      } else {
        Alert.alert("Error", error || "Failed to update profile");
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred");
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.contentContainer}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View
          style={{
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            paddingVertical: 20,
          }}
        >
          {/* Avatar */}
          <View style={{ position: "relative" }}>
            {avatar ? (
              <Avatar.Image
                source={{ uri: avatar }}
                size={100}
                resizeMode="cover"
              />
            ) : (
              <Avatar.Icon
                icon="account"
                size={100}
                style={{ backgroundColor: "gray" }}
                color="#FFFFFF"
              />
            )}
            {/* Edit Button - only visible in edit mode */}
            {isEditing && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setShowImagePickerModal(true)}
              >
                <Ionicons name="pencil" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Họ và tên</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.disabledInput]}
            placeholder="Nhập họ và tên"
            value={fullName}
            onChangeText={setFullName}
            editable={isEditing}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.disabledInput]}
            placeholder="Nhập email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            editable={isEditing}
          />
        </View>

        <View style={styles.checkBoxView}>
          <Text style={styles.label}>Giới tính:</Text>
          <View style={styles.checkboxContainer}>
            <View style={styles.checkboxRow}>
              <Checkbox.Android
                style={styles.checkbox}
                status={gender === "Nam" ? "checked" : "unchecked"}
                onPress={() => handleGenderSelect("Nam")}
                color={gender === "Nam" ? "#63B35C" : undefined}
                disabled={!isEditing}
              />
              <Text style={styles.checkboxLabel}>Nam</Text>
            </View>
            <View style={styles.checkboxRow}>
              <Checkbox.Android
                style={styles.checkbox}
                status={gender === "Nữ" ? "checked" : "unchecked"}
                onPress={() => handleGenderSelect("Nữ")}
                color={gender === "Nữ" ? "#63B35C" : undefined}
                disabled={!isEditing}
              />
              <Text style={styles.checkboxLabel}>Nữ</Text>
            </View>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Ngày sinh</Text>
          <TouchableOpacity
            style={[styles.input, !isEditing && styles.disabledInput]}
            onPress={() => isEditing && setShowDatePicker(true)}
            disabled={!isEditing}
          >
            <Text>{dob ? formatDate(dob) : "Chọn ngày sinh"}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setDate(selectedDate);
                  setDob(selectedDate.toISOString().split("T")[0]);
                }
              }}
            />
          )}
        </View>

        {/* Conditional rendering of buttons */}
        {isEditing ? (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={cancelEdit}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Huỷ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.updateButton]}
              onPress={handleUpdate}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.updateButtonText}>Lưu</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.updateButton}
            onPress={toggleEditMode}
          >
            <Text style={styles.updateButtonText}>Cập nhật</Text>
          </TouchableOpacity>
        )}

        {/* Image Picker Modal */}
        <Modal
          transparent={true}
          visible={showImagePickerModal}
          onRequestClose={() => setShowImagePickerModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowImagePickerModal(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Chọn ảnh đại diện</Text>
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={pickImage}
                >
                  <Ionicons name="image" size={24} color="#63B35C" />
                  <Text style={styles.modalOptionText}>Chọn từ thư viện</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.closeModalButton}
                  onPress={() => setShowImagePickerModal(false)}
                >
                  <Text style={styles.closeModalButtonText}>Đóng</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: "#fff",
  },
  indicator: {
    width: 40,
    height: 4,
    backgroundColor: "#DDDDDD",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  editButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#63B35C",
    borderRadius: 50,
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  editProfileText: {
    color: "#FFFFFF",
    fontSize: 14,
    marginLeft: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 5,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  updateButton: {
    backgroundColor: "#63B35C",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  updateButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  checkBoxView: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 10,
  },
  checkboxLabel: {
    marginRight: 10,
  },
  disabledInput: {
    backgroundColor: "#f5f5f5",
    color: "#666",
  },

  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  actionButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#e0e0e0",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  cancelButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "bold",
  },
  updateButton: {
    backgroundColor: "#63B35C",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  updateButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    overflow: "hidden",
  },
  modalContent: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalOptionText: {
    fontSize: 16,
    marginLeft: 15,
  },
  closeModalButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    alignItems: "center",
  },
  closeModalButtonText: {
    fontSize: 16,
    color: "#333",
  },
});
