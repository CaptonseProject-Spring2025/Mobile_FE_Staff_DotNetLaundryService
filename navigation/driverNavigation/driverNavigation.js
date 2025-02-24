import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DriverMenu from "../../screens/driverScreens/menu/driverMenu.jsx";

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
        </Stack.Navigator>
    );
}

//man hinh thong ke
export function DriverStatisticScreen() {
    return (
        <Stack.Navigator>
        <Stack.Screen
            name="DriverStatistic"
            component={DriverStatistic}
            options={{ headerShown: false }}
        />
        </Stack.Navigator>
    );
}

//man hinh chat
export function DriverChatScreen() {
    return(
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
            component={DriverAccount}
            options={{ headerShown: false }}
        />
        </Stack.Navigator>
    );
}
