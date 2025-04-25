import { create } from "zustand";
import axiosClient from "../../api/config/axiosClient";
import messaging from "@react-native-firebase/messaging";
import firebase from "@react-native-firebase/app";

// Check Firebase initialization
if (!firebase.apps.length) {
  console.log("Firebase is not initialized");
} else {
  console.log("Firebase is initialized successfully");
}

const useNotificationStore = create((set, get) => ({
  notificationList: [],
  loading: false,
  error: null,

  fetchNotifications: async () => {
    try {
      set({ loading: true, error: null });
      const response = await axiosClient.get("/notifications/userId");
      set({ notificationList: response.data, loading: false });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      set({ loading: false, error: error.message });
    }
  },

  clearNotifications: () => {
    set({ notificationList: [], loading: false, error: null });
  },

  markAsRead: async (notificationId) => {
    try {
      const response = await axiosClient.put(
        `/notifications/${notificationId}/read`
      );

      // Update the store's notificationList to mark this notification as read
      set((state) => ({
        notificationList: state.notificationList.map((notification) =>
          notification.notificationId === notificationId
            ? { ...notification, isRead: true }
            : notification
        ),
      }));
      return response.data;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  },

  deleteNotification: async (notificationId) => {
    try {
      const response = await axiosClient.delete(
        `/notifications/${notificationId}`
      );

      // Update the store's notificationList to remove this notification
      set((state) => ({
        notificationList: state.notificationList.filter(
          (notification) => notification.notificationId !== notificationId
        ),
      }));

      return response.data;
    } catch (error) {
      console.error("Error deleting notification:", error);
      throw error;
    }
  },

  loadingSaveToken: false,
  isErrorSaveToken: null,
  saveToken: async (userId) => {
    try {
      set({ loadingSaveToken: true, isErrorSaveToken: null });

      const fcmToken = await messaging().getToken();
      console.log("FCM Token:", fcmToken);

      const response = await axiosClient.post("/firebase/save-fcmtoken", {
        userId,
        fcmToken: fcmToken,
      });
      set({ loadingSaveToken: false, isErrorSaveToken: null });
      return response.data;
    } catch (error) {
      console.error("Error saving token:", error);
      set({ loadingSaveToken: false, isErrorSaveToken: error.message });
    }
  },

  isLoadingDeleteToken: false,
  isErrorDeleteToken: null,
  deleteToken: async (userId) => {
    try {
      const fcmToken = await messaging().getToken();
      set({ loadingDeleteToken: true, isErrorDeleteToken: null });
      const response = await axiosClient.delete(
        `/firebase/${userId}/${fcmToken}`
      );
      set({ loadingDeleteToken: false, isErrorDeleteToken: null });
      return response.data;
    } catch (error) {
      console.error("Error deleting token:", error);
      set({ loadingDeleteToken: false, isErrorDeleteToken: error.message });
    }
  },

  isLoadingreadAll: false,
  isErrorReadAll: null,
  readAll: async () => {
    try {
      set({ isLoadingreadAll: true, isErrorReadAll: null });
      const response = await axiosClient.put("/notifications/read-all");
      set({ isLoadingreadAll: false, isErrorReadAll: null });
      return response.data;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      set({ isLoadingreadAll: false, isErrorReadAll: error.message });
    }
  },

  isLoadingDeleteAll: false,
  isErrorDeleteAll: null,
  deleteAll: async () => {
    try {
      set({ isLoadingDeleteAll: true, isErrorDeleteAll: null });
      const response = await axiosClient.delete("/notifications/clear-all");
      set({ isLoadingDeleteAll: false, isErrorDeleteAll: null });
      return response.data;
    } catch (error) {
      console.error("Error deleting all notifications:", error);
      set({ isLoadingDeleteAll: false, isErrorDeleteAll: error.message });
    }
  },
}));
export default useNotificationStore;
