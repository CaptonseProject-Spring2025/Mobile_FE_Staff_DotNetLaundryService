import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DriverMenu from "../../screens/driverScreens/home/driverMenu.jsx";
import ProfileMenu from "../../screens/driverScreens/profile/profileMenu.jsx";
import UpdateUser from "../../screens/staffScreens/profile/updateUserScreen.jsx";
import DeliveryScreen from "../../screens/driverScreens/orders/delivery/deliveryScreen.jsx";
import PickupScreen from "../../screens/driverScreens/orders/pickup/pickupScreen.jsx";
const Stack = createNativeStackNavigator();

//man hinh menu
export function DriverHomeScreen() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="DriverMenu"
        component={DriverMenu}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DriverPickupScreen"
        component={PickupScreen}
        options={{
          headerTitle: "Đơn nhận hàng",
          headerTitleAlign: "center",
          headerStyle: { height: 100 },
        }}
      />
      <Stack.Screen
        name="DriverDeliveryScreen"
        component={DeliveryScreen}
        options={{
          headerTitle: "Đơn giao hàng",
          headerTitleAlign: "center",
          headerStyle: { height: 100 },
        }}
      />
    </Stack.Navigator>
  );
}

//man hinh thong ke
export function DriverStatisticScreen() {
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

//man hinh chat
export function DriverChatScreen() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="DriverChat"
        component={DriverChat}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

//man hinh thong bao
export function DriverNotificationScreen() {
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
export function DriverAccountScreen() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="DriverAccount"
        component={ProfileMenu}
        options={{
          headerTitle: "Hồ sơ Cá nhân",
          headerTitleAlign: "left",
          headerStyle: { height: 100 },
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
