import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import messaging from "@react-native-firebase/messaging";
import { useNavigation } from "@react-navigation/native";
import useNotificationStore from "./notificationStore";

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

  // Handle notification taps
  const handleNotificationResponse = (response) => {
    const data = response.notification?.request?.content?.data;

    if (data) {
      // Navigate based on notification type
      if (data.notificationType === "OrderPlaced" && data.orderId) {
        console.log("Navigating to OrderDetail with orderId:", data.orderId);
        navigation.navigate("Đơn hàng", {
          screen: "OrderDetail",
          params: { orderId: data.orderId },
        });
      } else {
        // For other notification types, go to notification list
        navigation.navigate("User", { screen: "Notification" });
      }
    }
  };

  useEffect(() => {
    // Set up foreground message handler
    const unsubscribeForeground = messaging().onMessage(
      async (remoteMessage) => {
        console.log("Foreground notification received:", remoteMessage);

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
      }
    );

    // Handle notification taps when app is in foreground
    const notificationResponseSubscription =
      Notifications.addNotificationResponseReceivedListener(
        handleNotificationResponse
      );

    // Handle notification taps when app is opened from background
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log("Notification opened app:", remoteMessage);
      if (remoteMessage.data) {
        const { notificationType, orderId } = remoteMessage.data;

        if (notificationType === "OrderPlaced" && orderId) {
          console.log("Navigating to OrderDetail with orderId:", orderId);
          navigation.navigate("Đơn hàng", {
            screen: "OrderDetail",
            params: { orderId: orderId },
          });
        } else {
          navigation.navigate("Thông báo", { screen: "Notification" });
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
              const { notificationType, orderId } = remoteMessage.data;

              if (notificationType === "OrderPlaced" && orderId) {
                // First ensure we're in the User screen if coming from a notification
                navigation.navigate("User");
                console.log("Navigating to OrderDetail with orderId:", orderId);
                // Then navigate to the OrderScreen tab and its OrderDetail screen
                navigation.navigate("Đơn hàng", {
                  screen: "OrderDetail",
                  params: { orderId: orderId },
                });
              } else {
                navigation.navigate("User");
                navigation.navigate("Thông báo");
              }
            }
          }, 1000);
        }
      });

    // Register background message handler
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log("Background message received:", remoteMessage);
      // No need to show notification as the system will do it automatically
      return Promise.resolve();
    });

    // Clean up subscriptions
    return () => {
      unsubscribeForeground();
      notificationResponseSubscription.remove();
    };
  }, [navigation, fetchNotifications]);

  return null; // No UI to render
}
