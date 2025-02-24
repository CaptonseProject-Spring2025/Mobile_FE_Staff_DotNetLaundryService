import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { LoginScreen } from "../../screens//authen/login.jsx";
import { View, Image, StyleSheet } from "react-native";

const Tab = createMaterialTopTabNavigator();

export const TabAuthenNavigation = () => {
  return (
    <>
      <View style={styles.header}>
        <Image
          source={require("../../assets/images/logo-removebg-preview.png")}
          style={styles.logo}
        />
      </View>
      <Tab.Navigator
        initialRouteName="Đăng Nhập"
        screenOptions={{
          swipeEnabled: false,  // disable swipe to avoid overlapping transitions
          animationEnabled: false, // disable animations to prevent state mismatches
          tabBarActiveTintColor: "#02A257",
          tabBarInactiveTintColor: "#000000",
          tabBarIndicatorStyle: {
            backgroundColor: "#02A257",
          },
          tabBarLabelStyle: {
            fontSize: 14,
          },
          tabBarStyle: {
            backgroundColor: "#fff",
          },
        }}
      >
        <Tab.Screen
          name="Đăng Nhập"
          component={LoginScreen}
          options={{
            headerShown: false,
          }}
        />
      </Tab.Navigator>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
    backgroundColor: "#fff",
  },
  logo: {
    width: 200,
    height: 200,
  },
});
