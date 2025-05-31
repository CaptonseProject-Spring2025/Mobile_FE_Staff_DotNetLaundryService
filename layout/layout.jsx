import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Loading from "../screens/loading.jsx";
import { Authen } from "../navigation/authenNavigation/authen.js";
import DriverBottomNavigationTab from "../navigation/driverNavigation/driverBottomNavigation.js";
import StaffBottomNavigationTab from "../navigation/staffNavigation/staffBottomNavigation.js";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import useAuthStore from "../api/store/authStore";
import PayosWebView from "../screens/driverScreens/orders/payment/payosWebView.jsx";
import messaging from "@react-native-firebase/messaging";
import { Alert, Platform } from "react-native";
import useNotificationStore from "../api/store/notificationStore.js";

const Stack = createNativeStackNavigator();

const Layout = () => {
  const [isLoading, setIsLoading] = useState(true);
  const initialize = useAuthStore((state) => state.initialize);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const checkTokenValidity = useAuthStore((state) => state.checkTokenValidity);
  const userDetail = useAuthStore((state) => state.userDetail);
  const { deleteToken } = useNotificationStore();
  // Request location permissions
  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Location Permission Required",
          "This app needs access to your location to find nearby laundry services.",
          [{ text: "OK" }]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error requesting location permission:", error);
      return false;
    }
  };

  // Request notification permissions
  const requestNotificationPermission = async () => {
    try {
      // Check if device is capable of receiving notifications
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Only ask for permission if not already granted
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        Alert.alert(
          "Notification Permission",
          "Enable notifications to receive updates about your laundry orders.",
          [{ text: "OK" }]
        );
        return false;
      }

      // For Android, set notification channel (required for Android 8.0+)
      if (Platform.OS === "android") {
        Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
      }

      // Request Firebase messaging permission for iOS (Android doesn't need this)
      if (Platform.OS === "ios") {
        await messaging().requestPermission();
      }

      return true;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  };

  const hasValidRole = () => {
    if (!isAuthenticated || !userDetail) return false;
    return userDetail.role === "Staff" || userDetail.role === "Driver";
  };

  //check if user has valid role after authentication
  useEffect(() => {
    // Check for invalid roles after authentication
    if (isAuthenticated && userDetail && !hasValidRole()) {
      Alert.alert(
        "Không có quyền truy cập",
        "Bạn không có quyền truy cập ứng dụng này. Ứng dụng này chỉ dành cho nhân viên và tài xế.",
        [
          {
            text: "Ok",
            onPress: async () => {
              if (userDetail.userId) {
                await deleteToken(userDetail.userId);
              }
              const logout = useAuthStore.getState().logout;
              await logout();
            },
          },
        ]
      );
    }
  }, [isAuthenticated, userDetail]);

  useEffect(() => {
    let delayTimerId;
    let loadingTimerId;

    // Initialize auth state with better error handling
    const initApp = async () => {
      try {
        // Small delay to ensure AsyncStorage is ready
        await new Promise((resolve) => {
          delayTimerId = setTimeout(resolve, 500);
        });

        // Request permissions
        await requestLocationPermission();
        await requestNotificationPermission();

        // Initialize auth
        await initialize();
        // Keep loading screen visible for at least 2 seconds
        loadingTimerId = setTimeout(() => {
          setIsLoading(false);
        }, 2000);
      } catch (error) {
        console.error("App initialization failed:", error);
        // Still proceed to main app after error
        loadingTimerId = setTimeout(() => {
          setIsLoading(false);
        }, 1000);
      }
    };

    initApp();

    // Clean up all timers on unmount
    return () => {
      if (delayTimerId) clearTimeout(delayTimerId);
      if (loadingTimerId) clearTimeout(loadingTimerId);
    };
  }, [initialize]);

  // Add periodic token check effect
  useEffect(() => {
    let tokenCheckInterval;

    if (isAuthenticated) {
      // Check token validity every 5 minutes
      tokenCheckInterval = setInterval(() => {
        checkTokenValidity();
      }, 5 * 60 * 1000);
    }

    return () => {
      if (tokenCheckInterval) {
        clearInterval(tokenCheckInterval);
      }
    };
  }, [isAuthenticated, checkTokenValidity]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <>
      <Stack.Navigator>
        {isAuthenticated && hasValidRole() ? (
          userDetail?.role === "Staff" ? (
            <Stack.Screen
              name="StaffHome"
              component={StaffBottomNavigationTab}
              options={{ headerShown: false }}
            />
          ) : (
            <>
              <Stack.Screen
                name="DriverHome"
                component={DriverBottomNavigationTab}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="PayosWebView"
                component={PayosWebView}
                options={{
                  headerShown: false,
                }}
              />
            </>
          )
        ) : (
          // Show authentication flow when not authenticated or invalid role
          <Stack.Screen
            name="Authentication"
            component={Authen}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>

      <StatusBar translucent style="dark" />
    </>
  );
};

export default Layout;
