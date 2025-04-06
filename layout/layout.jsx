import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Loading from "../screens/loading.jsx";
import { AuthenNavigation } from "../navigation/authenNavigation/authenNavigation.js";
import DriverBottomNavigationTab from "../navigation/driverNavigation/driverBottomNavigation.js";
import StaffBottomNavigationTab from "../navigation/staffNavigation/staffBottomNavigation.js";
import * as Location from "expo-location";
import useAuthStore from "../api/store/authStore";

const Stack = createNativeStackNavigator();

const Layout = () => {
  const [isLoading, setIsLoading] = useState(true);
  const initialize = useAuthStore((state) => state.initialize);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const checkTokenValidity = useAuthStore((state) => state.checkTokenValidity);
  const userDetail = useAuthStore((state) => state.userDetail);

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


  useEffect(() => {
    // Initialize auth state with better error handling
    const initApp = async () => {
      try {
        // Small delay to ensure AsyncStorage is ready
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Request permissions
        await requestLocationPermission();
       

        // Initialize auth
        await initialize();
        // Keep loading screen visible for at least 2 seconds
        setTimeout(() => {
          setIsLoading(false);
        }, 2000);
      } catch (error) {
        console.error("App initialization failed:", error);
        // Still proceed to main app after error
        setTimeout(() => {
          setIsLoading(false);
        }, 1000);
      }
    };

    initApp();
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
        {isAuthenticated ? (
          userDetail?.role === "Staff" ? (
            <Stack.Screen
              name="StaffHome"
              component={StaffBottomNavigationTab}
              options={{ headerShown: false }}
            />
          ) : (
            <Stack.Screen
              name="DriverHome"
              component={DriverBottomNavigationTab}
              options={{ headerShown: false }}
            />
          )
        ) : (
          // Show authentication flow when not authenticated
          <Stack.Screen
            name="Authentication"
            component={AuthenNavigation}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>

      <StatusBar translucent style="dark" />
    </>
  );
};

export default Layout;
