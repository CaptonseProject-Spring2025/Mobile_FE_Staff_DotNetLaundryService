import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, Text, StyleSheet , TouchableOpacity} from "react-native";
import Loading from "../screens/loading.jsx";
import { AuthenNavigation } from "../navigation/authenNavigation/authenNavigation.js";
import DriverBottomNavigationTab from "../navigation/driverNavigation/driverBottomNavigation.js";
import StaffBottomNavigationTab from "../navigation/staffNavigation/staffBottomNavigation.js";
import "../global.css";
import useAuthStore from "../api/store/authStore";

const Stack = createNativeStackNavigator();

const UnauthorizedScreen = ({ onLogout }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Access Denied</Text>
      <Text style={styles.message}>
        You don't have permission to use this application.
      </Text>
      <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const Layout = () => {
  const [isLoading, setIsLoading] = useState(true);
  const initialize = useAuthStore((state) => state.initialize);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userDetail = useAuthStore((state) => state.userDetail);
  const logout = useAuthStore((state) => state.logout);

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

  // Check if user has a valid role
  const hasValidRole =
    userDetail && (userDetail.role === "Driver" || userDetail.role === "Staff");

  // Handle unauthorized user
  const handleUnauthorizedLogout = async () => {
    await logout();
  };

  const getInitialRouteName = () => {
    if (!userDetail || !userDetail.role) {
      return "Driver"; // Default fallback if role is missing
    }
    return userDetail.role === "Driver" ? "Driver" : "Staff";
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {isAuthenticated ? (
          hasValidRole ? (
            // Set the initial route based on user role for valid users
            <Stack.Screen
              name={getInitialRouteName()}
              component={
                userDetail?.role === "Staff"
                  ? StaffBottomNavigationTab
                  : DriverBottomNavigationTab
              }
              options={{ headerShown: false }}
            />
          ) : (
            // Show the unauthorized screen for authenticated users with invalid roles
            <Stack.Screen name="Unauthorized" options={{ headerShown: false }}>
              {(props) => (
                <UnauthorizedScreen
                  {...props}
                  onLogout={handleUnauthorizedLogout}
                />
              )}
            </Stack.Screen>
          )
        ) : (
          <Stack.Screen
            name="authen"
            component={AuthenNavigation}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>

      <StatusBar translucent style="dark" />
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "red",
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 10,
    color: "#333",
  },
  logoutButton: {
    backgroundColor: "#63B35C",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 5,
    marginTop: 20,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default Layout;
