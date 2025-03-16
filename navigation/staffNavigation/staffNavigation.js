import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DriverMenu from "../../screens/driverScreens/home/driverMenu.jsx";
import ProfileMenu from "../../screens/driverScreens/profile/profileMenu.jsx";
import UpdateUser from "../../screens/staffScreens/profile/updateUserScreen.jsx";

const Stack = createNativeStackNavigator();

//man hinh menu
export function StaffHomeScreen() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="DriverMenu"
        component={DriverMenu}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

//man hinh thong ke
export function StaffStatisticScreen() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="DriverStatistic"
        component={DriverMenu}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

//man hinh thong bao
export function StaffNotificationScreen() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="DriverNotification"
        component={DriverNotification}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

//man hinh tai khoan
export function StaffAccountScreen() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="StaffAccount"
        component={ProfileMenu}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="updateProfile"
        component={UpdateUser}
        options={{
          headerTitle: "Cập nhật thông tin",
          headerTitleAlign: "center",
          headerStyle: { height: 100 },
        }}
      />
    </Stack.Navigator>
  );
}
