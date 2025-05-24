import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosClient from "../config/axiosClient";
import {
  isTokenValid,
  isRefreshTokenValid,
  shouldRefreshToken,
  STORAGE_KEYS,
} from "../utils/authUtils";

// Centralized function to handle token refresh
let isRefreshInProgress = false;
let refreshPromise = null;

const useAuthStore = create((set, get) => ({
  userId: null,
  userDetail: null,
  token: null,
  refreshToken: null,
  refreshTokenExpiry: null,
  isAuthenticated: false,
  isLoading: false,
  otpToken: null,
  lastTokenCheck: 0, // Track when we last checked token validity
  tempResetPasswordData: {
    phoneNumber: "",
  },

  // Initialize auth state from storage
  initialize: async () => {
    try {
      // Get tokens from storage
      const [token, refreshToken, refreshTokenExpiry] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRY),
      ]);

      if (!token || !refreshToken) {
        // No tokens available, ensure logged out state
        await get().logoutSilent();
        return false;
      }

      // First check if refresh token is still valid
      if (!isRefreshTokenValid(refreshTokenExpiry)) {
        console.log("Refresh token has expired during initialization");
        await get().logoutSilent();
        return false;
      }

      // Check if token is valid
      if (!isTokenValid(token)) {
        // Token is invalid, try refreshing
        const refreshSuccess = await get().refreshAuthToken();
        if (!refreshSuccess) {
          await get().logoutSilent();
          return false;
        }
      } else {
        // Token is valid, set it in state
        set({
          token,
          refreshToken,
          refreshTokenExpiry,
          isAuthenticated: true,
          lastTokenCheck: Date.now(),
        });

        // Also try to load user ID and details
        try {
          const userId = await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);
          const userDetailStr = await AsyncStorage.getItem(
            STORAGE_KEYS.USER_DETAIL
          );

          if (userId) {
            set({ userId: parseInt(userId, 10) });

            if (userDetailStr) {
              set({ userDetail: JSON.parse(userDetailStr) });
            } else {
              // If we have userId but no details, fetch them
              await get().fetchUserDetail(parseInt(userId, 10));
            }
          }
        } catch (error) {
          console.error(
            "Error loading user data during initialization:",
            error
          );
        }
      }

      return true;
    } catch (error) {
      console.error("Failed to initialize auth state", error);
      await get().logoutSilent();
      return false;
    }
  },

  // Check token validity (can be called periodically)
  checkTokenValidity: async () => {
    const token = get().token;
    const lastCheck = get().lastTokenCheck;
    const now = Date.now();

    // Skip if we checked recently (within last 30 seconds)
    if (now - lastCheck < 30000) {
      return true;
    }

    // If token is invalid, try to refresh
    if (!isTokenValid(token)) {
      return await get().refreshAuthToken();
    }

    // If token is valid but close to expiration, refresh proactively
    if (shouldRefreshToken(token)) {
      console.log("Token will expire soon, refreshing proactively");
      return await get().refreshAuthToken();
    }

    set({ lastTokenCheck: now });
    return true;
  },

  // Login function
  login: async (phoneNumber, password) => {
    set({ isLoading: true });
    try {
      const response = await axiosClient.post("/auth/login", {
        phoneNumber,
        password,
      });

      const { userId, token, refreshToken, refreshTokenExpiry } = response.data;

      // Store all auth data at once
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.TOKEN, token],
        [STORAGE_KEYS.REFRESH_TOKEN, refreshToken],
        [STORAGE_KEYS.REFRESH_TOKEN_EXPIRY, refreshTokenExpiry],
        [STORAGE_KEYS.USER_ID, userId.toString()],
      ]);
      // Set authentication state
      set({
        token,
        refreshToken,
        refreshTokenExpiry,
        userId,
        isAuthenticated: true,
        isLoading: false,
        lastTokenCheck: Date.now(),
      });

      // Fetch complete user details after successful login
      await get().fetchUserDetail(userId);

      return { success: true, userId };
    } catch (error) {
      set({ isLoading: false });
      return {
        success: false,
        message: error.response.data || "Login failed",
      };
    }
  },

  fetchUserDetail: async (userId) => {
    if (!userId) return false;

    try {
      const response = await axiosClient.get(`/users/${userId}`);
      const userDetail = response.data;

      // Store user details
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_DETAIL,
        JSON.stringify(userDetail)
      );
      set({ userDetail });
      return true;
    } catch (error) {
      console.error("Failed to fetch user details:", error);
      return false;
    }
  },

  // Refresh authentication token - centralized function
  refreshAuthToken: async () => {
    // If a refresh is already in progress, return that promise
    if (isRefreshInProgress && refreshPromise) {
      return refreshPromise;
    }

    // Set refresh as in progress and create a new promise
    isRefreshInProgress = true;
    refreshPromise = (async () => {
      // Get refresh token from state first, fall back to storage if needed
      let refreshToken = get().refreshToken;
      let refreshTokenExpiry = get().refreshTokenExpiry;

      if (!refreshToken) {
        // If not in state, try to get from storage
        [refreshToken, refreshTokenExpiry] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
          AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRY),
        ]);

        if (!refreshToken) {
          console.log("No refresh token available");
          isRefreshInProgress = false;
          refreshPromise = null;
          return false;
        }
      }

      // Check if refresh token is expired before attempting to use it
      if (!isRefreshTokenValid(refreshTokenExpiry)) {
        console.log("Refresh token has expired, cannot refresh access token");
        await get().logoutSilent();
        isRefreshInProgress = false;
        refreshPromise = null;
        return false;
      }

      try {
        // Use direct axios call to bypass interceptors and prevent loops
        const response = await axiosClient.post("/auth/refresh-token", {
          refreshToken: refreshToken,
        });

        // Extract tokens from response
        const newToken = response.data?.accessToken || response.data?.token;
        const newRefreshToken = response.data?.refreshToken;
        const newRefreshTokenExpiry = response.data?.refreshTokenExpiry;

        if (!newToken) {
          console.error("Token refresh response did not include a token");
          isRefreshInProgress = false;
          refreshPromise = null;
          return false;
        }

        // Update tokens in storage and state
        const updates = [[STORAGE_KEYS.TOKEN, newToken]];

        if (newRefreshToken) {
          updates.push([STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken]);
        }

        if (newRefreshTokenExpiry) {
          updates.push([
            STORAGE_KEYS.REFRESH_TOKEN_EXPIRY,
            newRefreshTokenExpiry,
          ]);
        }

        await AsyncStorage.multiSet(updates);

        set({
          token: newToken,
          refreshToken: newRefreshToken || refreshToken,
          refreshTokenExpiry: newRefreshTokenExpiry || refreshTokenExpiry,
          lastTokenCheck: Date.now(),
        });

        isRefreshInProgress = false;
        refreshPromise = null;
        return true;
      } catch (error) {
        console.error("Token refresh failed", error);

        // If refresh fails with 400/401, the refresh token is likely invalid
        if (
          error.response &&
          (error.response.status === 400 || error.response.status === 401)
        ) {
          console.warn("Token refresh returned error status, logging out");
          console.log(error.response.data);
          await get().logoutSilent();
        }

        isRefreshInProgress = false;
        refreshPromise = null;
        return false;
      }
    })();

    return refreshPromise;
  },

  // Resend OTP
  resendOtp: async (phoneNumber) => {
    set({ isLoading: true });
    try {
      const response = await axiosClient.post("/otp/resend", {
        phone: phoneNumber,
      });

      set({ isLoading: false });
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return {
        success: false,
        message: error.response?.data?.message || "Failed to resend OTP",
      };
    }
  },

  // Verify OTP
  verifyOtp: async (phone, otp) => {
    set({ isLoading: true });
    try {
      const response = await axiosClient.post("/otp/verify", {
        phone,
        otp,
      });

      const { token } = response.data;
      set({ otpToken: token, isLoading: false });
      return { success: true, token };
    } catch (error) {
      set({ isLoading: false });
      return {
        success: false,
        message: error.response?.data?.message || "Failed to verify OTP",
      };
    }
  },

  // Verify OTP for password reset
  verifyOtpResetPassword: async (phone, otp) => {
    set({ isLoading: true });
    try {
      const response = await axiosClient.post("/otp/reset-password", {
        phone,
        otp,
      });

      const { token } = response.data;
      set({ otpToken: token, isLoading: false });
      return { success: true, token };
    } catch (error) {
      set({ isLoading: false });
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Failed to verify OTP for password reset",
      };
    }
  },

  // Logout
  logout: async () => {
    try {
      // Clear all auth data from storage
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN_EXPIRY,
        STORAGE_KEYS.USER_ID,
        STORAGE_KEYS.USER_DETAIL,
      ]);

      // Reset state
      set({
        token: null,
        refreshToken: null,
        refreshTokenExpiry: null,
        userId: null,
        userDetail: null,
        isAuthenticated: false,
        lastTokenCheck: 0,
      });

      return true;
    } catch (error) {
      console.error("Logout failed:", error);
      return false;
    }
  },

  logoutSilent: async () => {
    try {
      // Clear all auth data from storage
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN_EXPIRY,
        STORAGE_KEYS.USER_ID,
        STORAGE_KEYS.USER_DETAIL,
      ]);

      // Reset state
      set({
        token: null,
        refreshToken: null,
        refreshTokenExpiry: null,
        userId: null,
        userDetail: null,
        isAuthenticated: false,
        lastTokenCheck: 0,
      });
    } catch (error) {
      console.error("Silent logout failed:", error);
    }
  },

  //reset password
  resetPassword: async (formData) => {
    set({ isLoading: true });
    try {
      await axiosClient.post("/auth/reset-password", formData);

      set({
        isLoading: false,
        otpToken: null,
        tempResetPasswordData: {
          phoneNumber: "",
        },
      });
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return {
        success: false,
        message: error.response?.data?.message || "Failed to reset password",
      };
    }
  },

  // Method to update user details in authStore
  setUserDetail: (userDetail) => {
    if (!userDetail) return;

    // Update in state
    set({ userDetail });

    // Also update in AsyncStorage (ensure consistency)
    try {
      AsyncStorage.setItem(
        STORAGE_KEYS.USER_DETAIL,
        JSON.stringify(userDetail)
      );
    } catch (error) {
      console.error("Failed to save user details to storage:", error);
    }
  },

  // Debug function to log AsyncStorage contents
  debugAsyncStorage: async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const result = await AsyncStorage.multiGet(keys);

      const filteredResult = result.filter(
        (item) => !item[0].includes("persist:") && !item[0].includes("MMKV")
      );

      console.log("AsyncStorage Contents:", Object.fromEntries(filteredResult));
      return Object.fromEntries(filteredResult);
    } catch (error) {
      console.error("Failed to debug AsyncStorage:", error);
      return {};
    }
  },

  // Store temporary registration data
   setResetPasswordData: (data) => {
    set((state) => ({
      tempResetPasswordData: {
        ...state.tempResetPasswordData,
        ...data,
      },
    }));
  },
}));

export default useAuthStore;
