import React, { useState, useEffect, useRef } from "react";
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import { Switch, Avatar } from "react-native-paper";
import useAuthStore from "../../../api/store/authStore";

export default function ProfileMenu({ navigation }) {
  const [isSwitchOn, setIsSwitchOn] = useState(false);
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
      title: "Địa chỉ của tôi",
      icon: "location-outline",
      screen: "Address",
      requiresAuth: true,
    },
    {
      id: "2",
      title: "Chat",
      icon: "chatbubble-outline",
      screen: "Messages",
      requiresAuth: true,
    },
    {
      id: "3",
      title: "Hỗ trợ",
      icon: "help-circle-outline",
      screen: "HelpCenter",
      requiresAuth: false,
    },
    {
      id: "4",
      title: "Khiếu nại",
      icon: "alert-circle-outline",
      screen: "Complaints",
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
          flexDirection: "row",
          alignItems: "center",
          width: "100%",
        }}
      >
        <View>
          {userDetail?.avatar ? (
            <Avatar.Image
              source={{ uri: userDetail?.avatar }}
              size={70}
              resizeMode="cover"
            />
          ) : (
            <Avatar.Icon
              icon="account"
              size={70}
              style={{ backgroundColor: "gray" }}
              color="#FFFFFF"
            />
          )}
        </View>
        <View
          style={{
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "flex-start",
            paddingLeft: 20,
            flex: 1,
          }}
        >
          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              color: "#63B35C",
              marginBottom: 5,
            }}
          >
            {userDetail?.fullName}
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 5,
            }}
          >
            <Ionicons name="call" size={20} color="gray" />
            <Text style={{ fontSize: 16, color: "gray", marginLeft: 5 }}>
              (+84) {userDetail?.phoneNumber}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="mail" size={20} color="gray" />
            <Text style={{ fontSize: 16, color: "gray", marginLeft: 5 }}>
              {userDetail?.email || "N/A"}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() =>
            navigation.navigate("UpdateUser", { userDetail: userDetail })
          }
        >
          <Ionicons name="pencil" size={16} color="#FFFFFF" />
        </TouchableOpacity>
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
            style={[styles.menuItem, styles.logoutMenuItem]}
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

      <View style={styles.divider} />

      <View style={styles.notificationContainer}>
        <Text style={styles.notificationText}>Nhận thông báo</Text>
        <Switch
          value={isSwitchOn}
          onValueChange={setIsSwitchOn}
          color="#63B35C"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    width: "100%",
    padding: 15,
    minHeight: 100,
  },
  loginButtonGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "80%",
    height: 64,
    borderRadius: 25,
    backgroundColor: "#fff",
    gap: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  buttonText: {
    color: "#63B35C",
    fontSize: 20,
    fontWeight: "bold",
  },
  userProfileContainer: {
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    padding: 10,
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  userInfoContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  userContact: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
    marginBottom: 2,
  },
  editButton: {
    marginLeft: "auto", // Keep the button aligned to the right
    backgroundColor: "#63B35C", // Orange background to match the image
    borderRadius: 50, // Circular shape
    padding: 8, // Padding to make the button larger and center the icon
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
    paddingVertical: 15,
  },
  menuItemText: {
    flex: 1,
    color: "#000000",
    fontSize: 18,
    marginLeft: 10,
  },
  logoutMenuItem: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    paddingTop: 20,
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
