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
import { Mapboxtoken } from "@env";

enableScreens();

MapboxGL.setAccessToken(Mapboxtoken);

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <NavigationContainer>
          <Layout />
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

registerRootComponent(App);
