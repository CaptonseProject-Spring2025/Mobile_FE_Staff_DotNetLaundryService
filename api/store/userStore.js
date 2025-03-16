import { create } from "zustand";
import axiosClient from "../config/axiosClient";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEYS = {
  USER_DETAIL: "userDetail",
};

const useUserStore = create((set, get) => ({
  isLoading: false,
  error: null,
  userDetails: null,
  // Update user details
  updateUser: async (userId, updatedUser) => {
    if (!userId) {
      console.log("No userId provided to updateUser");
      return null;
    }

    set({ isLoading: true, error: null });
    try {
      let response;
      console.log("Updating user with ID:", userId);

      // Check if there's a new avatar that's a local URI
      if (updatedUser.avatar && updatedUser.avatar.startsWith("file:")) {
        console.log("Uploading new avatar image");
        // Create form data for image upload with all user data
        const formData = new FormData();
        const filename = updatedUser.avatar.split("/").pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";

        // Add all other user data to FormData with correct field capitalization
        formData.append("UserId", userId);
        formData.append("FullName", updatedUser.fullName);
        formData.append("Email", updatedUser.email || "");
        formData.append("Gender", updatedUser.gender);
        formData.append("Dob", updatedUser.dob);

        // Add image to FormData
        formData.append("Avatar", {
          uri: updatedUser.avatar,
          name: filename,
          type,
        });

        console.log("Sending FormData with fields:", {
          UserId: userId,
          FullName: updatedUser.fullName,
          Email: updatedUser.email || "",
          Gender: updatedUser.gender,
          Dob: updatedUser.dob,
          Avatar: "Image file",
        });

        response = await axiosClient.put(`/users/update-profile`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        console.log("Updating user without avatar change");

        // Create FormData even for non-image updates
        const formData = new FormData();

        // Add all fields with correct capitalization
        formData.append("UserId", userId);
        formData.append("FullName", updatedUser.fullName);
        formData.append("Email", updatedUser.email || "");
        formData.append("Gender", updatedUser.gender);
        formData.append("Dob", updatedUser.dob);
        // Add empty Avatar field if no new image
        formData.append("Avatar", "");

        console.log("Sending FormData with fields:", {
          UserId: userId,
          FullName: updatedUser.fullName,
          Email: updatedUser.email || "",
          Gender: updatedUser.gender,
          Dob: updatedUser.dob,
        });

        response = await axiosClient.put(`/users/update-profile`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      console.log("Update response:", response.data);
      const updatedUserDetails = response.data;

      // Save updated user details to AsyncStorage
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_DETAIL,
        JSON.stringify(updatedUserDetails)
      );

      // Update authStore's userDetail to keep data in sync
      const authStore = await import("./authStore").then(module => module.default);
      if (authStore) {
        authStore.getState().setUserDetail(updatedUserDetails);
      }

      console.log("User details saved to AsyncStorage and synced with authStore successfully");

      // Update state with new user details
      set({
        userDetails: updatedUserDetails,
        isLoading: false,
      });

      return updatedUserDetails;
    } catch (error) {
      console.error("Failed to update user details", error.response || error);
      console.error("Status:", error.response?.status);
      console.error("Data:", error.response?.data);
      console.error("Request URL:", error.config?.url);
      console.error("Request method:", error.config?.method);

      set({
        isLoading: false,
        error: error.response?.data?.message || "Failed to update user details",
      });
      return null;
    }
  },

  // Initialize user details from AsyncStorage on app start
  initUserDetails: async () => {
    try {
      const userDetailJson = await AsyncStorage.getItem(
        STORAGE_KEYS.USER_DETAIL
      );
      if (userDetailJson) {
        const userDetail = JSON.parse(userDetailJson);
        set({ userDetails: userDetail });
        return userDetail;
      }
      return null;
    } catch (error) {
      console.error("Failed to initialize user details from storage", error);
      return null;
    }
  },

  // Get current user details
  getUserDetails: () => {
    return get().userDetails;
  },
}));

export default useUserStore;
