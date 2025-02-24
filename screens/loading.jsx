import React, { useEffect, useRef, useState } from "react";
import { SafeAreaView, StyleSheet, Animated, Image } from "react-native";
import { Asset } from "expo-asset";

export default function SplashScreenComponent() {
  const topAnim = useRef(new Animated.Value(-80)).current; // initial offset for top vector
  const bottomAnim = useRef(new Animated.Value(80)).current; // initial offset for bottom vector
  const [assetsLoaded, setAssetsLoaded] = useState(false);

  useEffect(() => {
    async function loadAssetsAsync() {
      await Asset.loadAsync([
        require("../assets/images/logo-removebg-preview.png"),
        require("../assets/images/Vector3.png"),
        require("../assets/images/Vector4.png"),
      ]);
      setAssetsLoaded(true);
    }
    loadAssetsAsync();
  }, []);

  useEffect(() => {
    if (assetsLoaded) {
      Animated.parallel([
        Animated.timing(topAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(bottomAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [assetsLoaded, topAnim, bottomAnim]);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.Image
        source={require("../assets/images/Vector3.png")}
        style={[
          styles.topVector,
          {
            transform: [{ translateY: topAnim }],
          },
        ]}
      />
      <Image
        source={require("../assets/images/logo-removebg-preview.png")}
        style={styles.logo}
      />
      <Animated.Image
        source={require("../assets/images/Vector4.png")}
        style={[
          styles.bottomVector,
          {
            transform: [{ translateY: bottomAnim }],
          },
        ]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  topVector: {
    position: "absolute",
    right: 0,
    top: -2, // final position offset
  },
  logo: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -100 }, { translateY: -100 }],
    width: 200,
    height: 200,
  },
  bottomVector: {
    position: "absolute",
    left: 0,
    bottom: -1, // final position offset
  },
});
