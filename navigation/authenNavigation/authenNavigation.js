import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../../screens/authen/login";
import { View, Image, StyleSheet } from "react-native";
const Stack = createNativeStackNavigator();

export const AuthenNavigation = () => {
  return (
    <>
      <View style={styles.header}>
        <Image
          source={require("../../assets/logo-removebg-preview.png")}
          style={styles.logo}
        />
      </View>
      <Stack.Navigator>
        <Stack.Screen
          name="login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
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
