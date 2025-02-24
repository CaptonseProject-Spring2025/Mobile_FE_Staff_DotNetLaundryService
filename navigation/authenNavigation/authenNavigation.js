import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabAuthenNavigation } from "./authen.js";
import { OtpVerifyScreen } from "../../screens/authen/otpVerify.jsx";
import { ContactScreen } from "../../screens/authen/contactScreen.jsx";
const Stack = createNativeStackNavigator();

export const AuthenNavigation = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="TabAuthen"
        component={TabAuthenNavigation}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="OtpVerify"
        component={OtpVerifyScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Contact"
        component={ContactScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};
