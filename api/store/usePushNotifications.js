import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import messaging from "@react-native-firebase/messaging";
import { useNavigation } from "@react-navigation/native";
import useNotificationStore from "./notificationStore";
import useOrderStore from "./orderStore";

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function usePushNotifications() {
  const navigation = useNavigation();
  const { fetchNotifications } = useNotificationStore();
  const { fetchAssignmentList } = useOrderStore();

  // Handle notification taps
  const handleNotificationResponse = (response) => {
    const data = response.notification?.request?.content?.data;

    if (data) {
      const { notificationType } = data;

      if (notificationType === "AssignedPickup") {
        console.log("Navigating to DriverPickupScreen");
        navigation.navigate("DriverPickupScreen");
      } else if (notificationType === "AssignedDelivery") {
        console.log("Navigating to DriverDeliveryScreen");
        navigation.navigate("DriverDeliveryScreen");
      } else {
        console.log("Navigating to Notification screen");
        // Navigate to Notification screen for other types
        navigation.navigate("Thông báo", { screen: "DriverNotification" });
      }
    }
  };

  useEffect(() => {
    // Set up foreground message handler
    const unsubscribeForeground = messaging().onMessage(
      async (remoteMessage) => {

        // Extract notification data
        const { notification, data } = remoteMessage;

        // Show the notification using Expo's API
        await Notifications.scheduleNotificationAsync({
          content: {
            title: notification?.title || "Thông báo mới",
            body: notification?.body || "Bạn có thông báo mới",
            data: {
              ...data,
              notificationType: data?.notificationType || "general",
              orderId: data?.orderId || null,
            },
          },
          trigger: null, // Show immediately
        });

        // Refresh notification list
        fetchNotifications();

        //Refresh assignments list
        fetchAssignmentList();
      }
    );

    // Handle notification taps when app is in foreground
    const notificationResponseSubscription =
      Notifications.addNotificationResponseReceivedListener(
        handleNotificationResponse
      );

    // Handle notification taps when app is opened from background
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log("Notification opened app from background:", remoteMessage);
      if (remoteMessage.data) {
        const { notificationType } = remoteMessage.data;

        if (notificationType === "AssignedPickup") {
          console.log("Navigating to DriverPickupScreen");
          navigation.navigate("DriverPickupScreen");
        } else if (notificationType === "AssignedDelivery") {
          console.log("Navigating to DriverDeliveryScreen");
          navigation.navigate("DriverDeliveryScreen");
        } else {
          console.log("Navigating to Notification screen");
          navigation.navigate("Thông báo", { screen: "DriverNotification" });
        }
      }
    });

    // Check if app was opened from a quit state via notification
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log("App opened from quit state:", remoteMessage);

          // Handle navigation after a delay to ensure navigation is ready
          setTimeout(() => {
            if (remoteMessage.data) {
              const { notificationType } = remoteMessage.data;

              if (notificationType === "AssignedPickup") {
                console.log("Navigating to DriverPickupScreen");

                navigation.navigate("DriverPickupScreen");
              } else if (notificationType === "AssignedDelivery") {
                console.log("Navigating to DriverDeliveryScreen");

                navigation.navigate("DriverDeliveryScreen");
              } else {
                console.log("Navigating to Notification screen");
                navigation.navigate("Thông báo");
                navigation.navigate("Thông báo", {
                  screen: "DriverNotification",
                });
              }
            }
          }, 1000);
        }
      });

    // Register background message handler
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log("Background message received:", remoteMessage);

      return Promise.resolve();
    });

    // Clean up subscriptions
    return () => {
      unsubscribeForeground();
      notificationResponseSubscription.remove();
    };
  }, [navigation, fetchNotifications]);

  return null;
}
