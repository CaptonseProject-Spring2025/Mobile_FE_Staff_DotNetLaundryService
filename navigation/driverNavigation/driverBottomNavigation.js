import React, { useState, useEffect } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  DriverHomeScreen,
  DriverAccountScreen,
  DriverChatScreen,
  DriverNotificationScreen,
} from "./driverNavigation.js";
import Octicons from "react-native-vector-icons/Octicons";
import useNotificationStore from "../../api/store/notificationStore";
import useAuthStore from "../../api/store/authStore";
import { View, Text, StyleSheet } from "react-native";
const Tab = createBottomTabNavigator();

const DriverBottomNavigationTab = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { notificationList, fetchNotifications } = useNotificationStore();
  const { isAuthenticated } = useAuthStore();

  // Fetch notifications and update unread count when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated]);

  // Calculate unread notifications whenever the notification list changes
  useEffect(() => {
    if (notificationList && notificationList.length > 0) {
      const unread = notificationList.filter((item) => !item.isRead).length;
      setUnreadCount(unread);
    } else {
      setUnreadCount(0);
    }
  }, [notificationList]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => {
          let iconName;
          if (route.name === "Trang chủ") {
            iconName = focused ? "home" : "home";
          } else if (route.name === "Thống kê") {
            iconName = focused ? "checklist" : "checklist";
          } else if (route.name === "Inbox") {
            iconName = focused ? "comment-discussion" : "comment-discussion";
          } else if (route.name === "Thông báo") {
            iconName = focused ? "bell" : "bell";
            // Return custom component for notification tab to include badge
            if (unreadCount > 0) {
              return (
                <View style={styles.iconContainer}>
                  <Octicons name={iconName} color={color} size={24} />
                  <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </Text>
                  </View>
                </View>
              );
            }
          } else if (route.name === "Thông báo") {
            iconName = focused ? "bell" : "bell";
          } else if (route.name === "Tài khoản") {
            iconName = focused ? "person" : "person";
          }
          return <Octicons name={iconName} color={color} size={24} />;
        },
        tabBarActiveTintColor: "#63B35C",
        tabBarInactiveTintColor: "gray",
        animation: "fade", // animation when switching between tabs
      })}
    >
      <Tab.Screen
        name="Trang chủ"
        component={DriverHomeScreen}
        options={{
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Thống kê"
        component={DriverHomeScreen}
        options={{
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Thông báo"
        component={DriverNotificationScreen}
        options={{
          headerShown: false,
        }}
      />

      <Tab.Screen
        name="Inbox"
        component={DriverChatScreen}
        options={{
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Tài khoản"
        component={DriverAccountScreen}
        options={{
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: "center",
  },
  badgeContainer: {
    position: "absolute",
    right: -10,
    top: -5,
    backgroundColor: "red",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
});

export default DriverBottomNavigationTab;
