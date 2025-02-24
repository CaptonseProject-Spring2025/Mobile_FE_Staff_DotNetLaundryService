import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LoginScreen } from "../../screens/authen/login";
const Stack = createNativeStackNavigator();

export const AuthenNavigation = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};
