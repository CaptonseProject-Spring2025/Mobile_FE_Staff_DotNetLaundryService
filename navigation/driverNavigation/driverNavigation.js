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
import UserListScreen from "../../screens/driverScreens/chat/UserListScreen.jsx";
import ChatScreen from "../../screens/driverScreens/chat/ChatScreen.jsx";
import { TouchableOpacity, Text } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import Notification from "../../screens/driverScreens/notification/notification.jsx";
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
        name="ChatScreen"
        component={ChatScreen}
        options={{
          headerTitle: "Tin nhắn",
          headerTitleAlign: "center",
        }}
      />
      <Stack.Screen
        name="DriverPickupScreen"
        component={PickupScreen}
        options={({ navigation }) => ({
          headerTitle: "Đơn nhận hàng",
          headerTitleAlign: "center",
          headerStyle: { height: 100 },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate("DriverMenu")}
              style={{ marginRight: 15 }}
            >
              <Ionicons name="arrow-back" size={25} color="#000" />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="DriverDeliveryScreen"
        component={DeliveryScreen}
        options={({ navigation }) => ({
          headerTitle: "Đơn giao hàng",
          headerTitleAlign: "center",
          headerStyle: { height: 100 },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate("DriverMenu")}
              style={{ marginRight: 15 }}
            >
              <Ionicons name="arrow-back" size={25} color="#000" />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="DriverDeliveryOrderDetailScreen"
        component={OrderDetail}
        options={({ navigation }) => ({
          headerTitle: "Chi tiết đơn hàng",
          headerTitleAlign: "center",
          headerStyle: { height: 100 },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate("DriverDeliveryScreen")}
              style={{ marginRight: 15 }}
            >
              <Ionicons name="arrow-back" size={25} color="#000" />
            </TouchableOpacity>
          ),
        })}
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
        options={({ navigation }) => ({
          headerTitle: "Chi tiết đơn hàng",
          headerTitleAlign: "center",
          headerStyle: { height: 100 },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate("DriverPickupScreen")}
              style={{ marginRight: 15 }}
            >
              <Ionicons name="arrow-back" size={25} color="#000" />
            </TouchableOpacity>
          ),
        })}
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
export function DriverChatScreen() {
  return (
    <Stack.Navigator initialRouteName="UserListScreen">
      <Stack.Screen
        name="UserListScreen"
        component={UserListScreen}
        options={{ headerTitle: "Trò chuyện", headerTitleAlign: "center" }}
      />
      <Stack.Screen
        name="ChatScreen"
        component={ChatScreen}
        options={{
          headerTitle: "Tin nhắn",
          headerTitleAlign: "center",
        }}
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
        component={Notification}
        options={{ headerTitle: "Thông báo", headerTitleAlign: "center" }}
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
