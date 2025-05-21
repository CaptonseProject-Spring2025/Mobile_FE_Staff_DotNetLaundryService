import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { OtpVerifyScreen } from "../../screens/authen/otpVerify";
import ResetPassword from "../../screens/authen/resetPassword";
import PhoneInput from "../../screens/authen/phoneInput";
import { AuthenNavigation } from "./authenNavigation.js";
const Stack = createNativeStackNavigator();

export const Authen = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="login"
        component={AuthenNavigation}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="InputPhone"
        component={PhoneInput}
        options={{
          headerTitle: "Nhập số điện thoại",
          headerTitleAlign: "center",
        }}
      />
      <Stack.Screen
        name="ResetPassword"
        component={ResetPassword}
        options={{
          headerTitle: "Đặt lại mật khẩu",
          headerTitleAlign: "center",
        }}
      />
      <Stack.Screen
        name="OtpVerify"
        component={OtpVerifyScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};
