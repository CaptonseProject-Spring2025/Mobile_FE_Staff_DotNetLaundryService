import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Loading from "../screens/loading.jsx";
import { AuthenNavigation } from "../navigation/authenNavigation/authenNavigation.js";
import DriverBottomNavigationTab from "../navigation/driverNavigation/driverBottomNavigation.js";
import StaffBottomNavigationTab from "../navigation/staffNavigation/staffBottomNavigation.js";
import "../global.css";
import useAuthStore from "../api/store/authStore";

const Stack = createNativeStackNavigator();

const Layout = () => {
  const [isLoading, setIsLoading] = useState(true);
  const initialize = useAuthStore((state) => state.initialize);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userDetail = useAuthStore((state) => state.userDetail);

  useEffect(() => {
    // Initialize auth state with better error handling
    const initApp = async () => {
      try {
        // Small delay to ensure AsyncStorage is ready
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Initialize auth
        await initialize();

        // Keep loading screen visible for at least 1.5 seconds
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

  if (isLoading) {
    return <Loading />;
  }

  return (
    <NavigationContainer>
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
    </NavigationContainer>
  );
};

export default Layout;