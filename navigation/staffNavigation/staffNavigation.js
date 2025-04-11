import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DriverMenu from "../../screens/driverScreens/home/driverMenu.jsx";
import ProfileMenu from "../../screens/driverScreens/profile/profileMenu.jsx";
import UpdateUser from "../../screens/staffScreens/profile/updateUserScreen.jsx";
import StaffrMenu from "../../screens/staffScreens/home/staffMenu.jsx";
import OrderCheckingListScreen from "../../screens/staffScreens/orders/OrderCheckingListScreen.jsx";
import OrderListScreen from "../../screens/staffScreens/orders/OrderListScreen.jsx";
import OrderDetailScreen from "../../screens/staffScreens/orders/OrderDetailScreen.jsx";
import OrderListCheckedScreen from "../../screens/staffScreens/orders/OrderListCheckedScreen.jsx";
import OrderDetailCheckedSceen from "../../screens/staffScreens/orders/OrderDetailCheckedSceen.jsx";
import OrderWashingListSceen from "../../screens/staffScreens/orders/OrderWashingListSceen.jsx";
import OrderDetailWashingScreen from "../../screens/staffScreens/orders/OrdeDetailWashingScreen.jsx";
import OrderWashedListScreen from "../../screens/staffScreens/orders/OrderWashedListScreen.jsx";
import OrderDetailWashedScreen from "../../screens/staffScreens/orders/OrderDetailWashedScreen.jsx";
import UserListScreen from '../../screens/staffScreens/chat/UserListScreen.jsx';
import ChatScreen from '../../screens/staffScreens/chat/ChatScreen.jsx';

const Stack = createNativeStackNavigator();

//man hinh menu
export function StaffHomeScreen() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="StaffMenu"
        component={StaffrMenu}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="OrderListScreen" // Sửa lại tên màn hình cho đúng
        component={OrderListScreen}
        options={{
          headerTitle: "Danh sách đơn hàng",
          headerTitleAlign: "center",
        }}
      />
      <Stack.Screen
        name="OrderCheckingListScreen"
        component={OrderCheckingListScreen}
        options={{
          headerTitle: "Danh sách đơn hàng",
          headerTitleAlign: "center",
        }}
      />
      <Stack.Screen
        name="OrderDetailScreen"
        component={OrderDetailScreen}
        options={{
          headerTitle: "Chi tiết đơn hàng",
          headerTitleAlign: "center",
        }}
      />
      <Stack.Screen
        name="OrderListCheckedScreen"
        component={OrderListCheckedScreen}
        options={{
          headerTitle: "Danh sách đơn hàng",
          headerTitleAlign: "center",
        }}
      />
      <Stack.Screen
        name="OrderDetailCheckedSceen"
        component={OrderDetailCheckedSceen}
        options={{
          headerTitle: "Chi tiết đơn hàng",
          headerTitleAlign: "center",
        }}
      />
      <Stack.Screen
        name="OrderWashingListSceen"
        component={OrderWashingListSceen}
        options={{
          headerTitle: "Chi tiết đơn hàng",
          headerTitleAlign: "center",
        }}
      />
      <Stack.Screen
        name="OrderDetailWashingScreen"
        component={OrderDetailWashingScreen}
        options={{
          headerTitle: "Chi tiết đơn hàng đang giặt",
          headerTitleAlign: "center",
        }}
      />
      <Stack.Screen
        name="OrderWashedListScreen"
        component={OrderWashedListScreen}
        options={{
          headerTitle: "Chi tiết đơn hàng",
          headerTitleAlign: "center",
        }}
      />
      <Stack.Screen
        name="OrderDetailWashedScreen"
        component={OrderDetailWashedScreen}
        options={{
          headerTitle: "Chi tiết đơn hàng đang giặt",
          headerTitleAlign: "center",
        }}
      />
    </Stack.Navigator>
  );
}

//man hinh thong ke
export function StaffStatisticScreen() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="StaffStatistic"
        component={DriverMenu}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

//màn hình chat

export function StaffChatScreen() {
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
