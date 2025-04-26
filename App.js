import React from "react";
import Layout from "./layout/layout.jsx";
import { PaperProvider } from "react-native-paper";
import { registerRootComponent } from "expo";
import "expo-dev-client";
import "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { enableScreens } from "react-native-screens";
import MapboxGL from "@rnmapbox/maps";
import Toast from "react-native-toast-message";
import "./global.css";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as Notifications from "expo-notifications";
import { KeyboardProvider } from "react-native-keyboard-controller";

const tokenAccess =
  "pk.eyJ1IjoidGhhbmhidCIsImEiOiJjbThrY3U3cm4wOWliMm5zY2YxZHphcGhxIn0.XFTGLomzaK65jyUYJCLUZw";

MapboxGL.setAccessToken(tokenAccess);

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

enableScreens();

function AppContents() {
  // This component will have access to navigation
  const Navigation = require("./api/store/usePushNotifications").default;
  return (
    <>
      <KeyboardProvider>
        <Layout />
        <Navigation />
      </KeyboardProvider>
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider>
          <NavigationContainer>
            <AppContents />
          </NavigationContainer>
        </PaperProvider>
        <Toast />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

registerRootComponent(App);
