import React, { useState, useEffect } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  DriverHomeScreen,
  DriverAccountScreen,
  DriverChatScreen,
} from "./driverNavigation.js";
import Octicons from "react-native-vector-icons/Octicons";
const Tab = createBottomTabNavigator();

const DriverBottomNavigationTab = () => {
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

export default DriverBottomNavigationTab;
