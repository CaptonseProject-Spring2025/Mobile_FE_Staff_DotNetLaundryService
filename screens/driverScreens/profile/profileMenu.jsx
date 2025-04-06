import React, { useState, useEffect, useRef } from "react";
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import {  Avatar } from "react-native-paper";
import useAuthStore from "../../../api/store/authStore";

export default function ProfileMenu({ navigation }) {
  
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated, logout, userDetail } = useAuthStore();

  // Initialize auth state and fetch user details when component mounts
  useEffect(() => {
    const initializeAuth = async () => {
      await useAuthStore.getState().initialize();
    };
    initializeAuth();
  }, []);

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        onPress: async () => {
          try {
            setIsLoading(true);
            const result = await logout();

            if (!result) {
              Alert.alert("Lỗi", "Không thể đăng xuất. Vui lòng thử lại.");
            }
          } catch (error) {
            console.error("Error during logout:", error);
            Alert.alert("Lỗi", "Đã xảy ra lỗi khi đăng xuất.");
          } finally {
            setIsLoading(false);
          }
        },
        style: "destructive",
      },
    ]);
  };
  // Menu items
  const menuItems = [
    {
      id: "1",
      title: "Thông tin cá nhân",
      icon: "location-outline",
      screen: "updateProfile",
      requiresAuth: true,
    },
    {
      id: "2",
      title: "Cài đặt",
      icon: "cog-outline",
      screen: "HelpCenter",
      requiresAuth: true,
    },
  ];

  // Filter menu items
  const filteredMenuItems = menuItems;

  const handleMenuItemPress = (item) => {
    navigation.navigate(item.screen);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#63B35C" />
        <Text style={styles.loadingText}>Đang xử lý...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#FFFFFF", padding: 20 }}>
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
          {userDetail?.avatar ? (
            <Avatar.Image
              source={{ uri: userDetail?.avatar }}
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
        </View>

        {/* User Info */}
        <View
          style={{
            flexDirection: "column",
            alignItems: "center", // Center text horizontally
            paddingTop: 15, // Space between avatar and text
          }}
        >
          <Text
            style={{
              fontSize: 30, 
              fontWeight: "bold",
              color: "#000000", 
              marginBottom: 5,
            }}
          >
            {userDetail?.fullName || "USER NAME"}
          </Text>
          <Text
            style={{
              fontSize: 16, // Smaller text for company
              color: "#000000", // Black text to match the image
              marginBottom: 5,
            }}
          >
            {userDetail?.role || "N/A"}
          </Text>
          <Text
            style={{
              fontSize: 16, // Same size as company
              color: "#000000", // Black text to match the image
            }}
          >
            {userDetail?.phoneNumber || "0908091213"}
          </Text>
        </View>
      </View>

      {/* Menu Items List */}
      <View style={styles.menuList}>
        {filteredMenuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={() => handleMenuItemPress(item)}
          >
            <Ionicons name={item.icon} size={24} color="#000000" />
            <Text style={styles.menuItemText}>{item.title}</Text>
            <Ionicons
              name="chevron-forward"
              size={24}
              color="#000000"
              style={styles.chevron}
            />
          </TouchableOpacity>
        ))}

        {/* Logout option only visible when logged in */}
        {isAuthenticated && (
          <TouchableOpacity
            style={styles.logoutMenuItem}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
            <Text style={[styles.menuItemText, styles.logoutText]}>
              Đăng xuất
            </Text>
            <Ionicons
              name="chevron-forward"
              size={24}
              color="#FF3B30"
              style={styles.chevron}
            />
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  editButton: {
    position: "absolute", // Position the edit button over the avatar
    bottom: 0,
    right: 0,
    backgroundColor: "#63B35C", // Green background to match the theme
    borderRadius: 50, // Circular shape
    padding: 8, // Padding to make the button larger
    justifyContent: "center",
    alignItems: "center",
  },
  editProfileText: {
    color: "#FFFFFF",
    fontSize: 14,
    marginLeft: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#63B35C",
  },
  menuList: {
    marginTop: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  menuItemText: {
    flex: 1,
    color: "#000000",
    fontSize: 18,
    marginLeft: 10,
  },
  logoutMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 20,
  },
  logoutText: {
    color: "#FF3B30",
  },
  chevron: {
    marginLeft: 10,
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 10,
  },
  notificationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  notificationText: {
    fontWeight: "bold",
    fontSize: 20,
  },
});
