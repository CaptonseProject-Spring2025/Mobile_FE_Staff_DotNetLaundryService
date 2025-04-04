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

enableScreens();

const tokenAccess =
  "pk.eyJ1IjoidGhhbmhidCIsImEiOiJjbThrY3U3cm4wOWliMm5zY2YxZHphcGhxIn0.XFTGLomzaK65jyUYJCLUZw";

MapboxGL.setAccessToken(tokenAccess);

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
