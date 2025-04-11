import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DriverMenu from "../../screens/driverScreens/home/driverMenu.jsx";
import ProfileMenu from "../../screens/driverScreens/profile/profileMenu.jsx";
import UpdateUser from "../../screens/staffScreens/profile/updateUserScreen.jsx";
import DeliveryScreen from "../../screens/driverScreens/orders/delivery/deliveryScreen.jsx";
import PickupScreen from "../../screens/driverScreens/orders/pickup/pickupScreen.jsx";
import OrderDetail from "../../screens/driverScreens/orders//delivery/orderDetail.jsx";
import AddressNavigateMap from "../../screens/driverScreens/orders/pickup/addressNavigateMap.jsx";
import OrderPickupDetail from "../../screens/driverScreens/orders/pickup/orderPickupDetail.jsx";
import AddressDeliveryNavigateMap from "../../screens/driverScreens/orders/delivery/addressDeliveryNavigation.jsx";
import ConfirmPickup from "../../screens/driverScreens/orders/confirmOrder/confirmPickup.jsx";
import UserListScreen from '../../screens/driverScreens/chat/UserListScreen.jsx';
import ChatScreen from '../../screens/driverScreens/chat/ChatScreen.jsx';
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
      <Stack.Screen
        name="DriverDeliveryOrderDetailScreen"
        component={OrderDetail}
        options={{
          headerTitle: "Chi tiết đơn hàng",
          headerTitleAlign: "center",
          headerStyle: { height: 100 },
        }}
      />
      <Stack.Screen
        name="AddressNavigateMap"
        component={AddressNavigateMap}
        options={{
          headerTitle: "Bản đồ",
          headerTitleAlign: "center",
          headerStyle: { height: 100 },
        }}
      />
      <Stack.Screen
        name="AddressDeliveryNavigateMap"
        component={AddressDeliveryNavigateMap}
        options={{
          headerTitle: "Bản đồ",
          headerTitleAlign: "center",
          headerStyle: { height: 100 },
        }}
      />
      <Stack.Screen
        name="DriverOrderPickupDetailScreen"
        component={OrderPickupDetail}
        options={{
          headerTitle: "Chi tiết đơn hàng",
          headerTitleAlign: "center",
          headerStyle: { height: 100 },
        }}
      />
      <Stack.Screen
        name="ConfirmPickup"
        component={ConfirmPickup}
        options={{
          headerTitle: "Xác nhận đơn hàng",
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
//màn hình chat

export function DriverChatScreen() {
  return (
    <Stack.Navigator initialRouteName="UserListScreen">
      <Stack.Screen name="UserListScreen" component={UserListScreen} options={{ headerShown: false }}/>
      <Stack.Screen name="ChatScreen" component={ChatScreen}  options={{
          headerTitle: "Trò chuyện",
          headerTitleAlign: "center",
        }}/>
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
