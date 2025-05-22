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
import UserListScreen from "../../screens/staffScreens/chat/UserListScreen.jsx";
import ChatScreen from "../../screens/staffScreens/chat/ChatScreen.jsx";
import Ionicons from "react-native-vector-icons/Ionicons";
import { TouchableOpacity } from "react-native";

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
        name="OrderListScreen"
        component={OrderListScreen}
        options={({ navigation }) => ({
          headerTitle: "Danh sách đơn hàng",
          headerTitleAlign: "center",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate("StaffMenu")}
              style={{ marginRight: 15 }}
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="OrderCheckingListScreen"
        component={OrderCheckingListScreen}
        options={({ navigation }) => ({
          headerTitle: "Danh sách đơn hàng đang xử lý",
          headerTitleAlign: "center",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate("StaffMenu")}
              style={{ marginRight: 15 }}
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="OrderDetailScreen"
        component={OrderDetailScreen}
        options={({ navigation }) => ({
          headerTitle: "Chi tiết đơn hàng đang xử lý",
          headerTitleAlign: "center",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate("OrderCheckingListScreen")}
              style={{ marginRight: 15 }}
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="OrderListCheckedScreen"
        component={OrderListCheckedScreen}
        options={({ navigation }) => ({
          headerTitle: "Danh sách đơn hàng đã kiểm tra",
          headerTitleAlign: "center",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate("StaffMenu")}
              style={{ marginRight: 15 }}
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="OrderDetailCheckedSceen"
        component={OrderDetailCheckedSceen}
        options={({ navigation }) => ({
          headerTitle: "Chi tiết đơn hàng đã kiểm tra",
          headerTitleAlign: "center",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate("OrderListCheckedScreen")}
              style={{ marginRight: 15 }}
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="OrderWashingListScreen"
        component={OrderWashingListSceen}
        options={({ navigation }) => ({
          headerTitle: "Danh sách đơn hàng đang giặt",
          headerTitleAlign: "center",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate("StaffMenu")}
              style={{ marginRight: 15 }}
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="OrderDetailWashingScreen"
        component={OrderDetailWashingScreen}
        options={({ navigation }) => ({
          headerTitle: "Chi tiết đơn hàng đang giặt",
          headerTitleAlign: "center",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate("OrderWashingListScreen")}
              style={{ marginRight: 15 }}
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="OrderWashedListScreen"
        component={OrderWashedListScreen}
        options={({ navigation }) => ({
          headerTitle: "Danh sách đơn hàng đã giặt",
          headerTitleAlign: "center",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate("StaffMenu")}
              style={{ marginRight: 15 }}
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="OrderDetailWashedScreen"
        component={OrderDetailWashedScreen}
        options={({ navigation }) => ({
          headerTitle: "Chi tiết đơn hàng đã giặt",
          headerTitleAlign: "center",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate("OrderWashedListScreen")}
              style={{ marginRight: 15 }}
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
          ),
        })}
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
