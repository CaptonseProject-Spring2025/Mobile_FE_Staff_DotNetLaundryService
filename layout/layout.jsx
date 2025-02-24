import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Loading from "../screens/loading.jsx";
import { AuthenNavigation } from "../navigation/authenNavigation/authenNavigation.js";
import DriverBottomNavigationTab from "../navigation/driverNavigation/driverBottomNavigation.js";
import "../global.css";

const Stack = createNativeStackNavigator();

const Layout = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  }, []);

  return (
      <NavigationContainer>
        {isLoading ? (
          <Loading />
        ) : (
          <Stack.Navigator initialRouteName="User">
            <Stack.Screen
              name="Driver"
              component={DriverBottomNavigationTab}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="authen"
              component={AuthenNavigation}
              options={{ headerShown: false }}
            />
          </Stack.Navigator>
        )}
        <StatusBar translucent style="dark" />
      </NavigationContainer>
  );
};

export default Layout;
