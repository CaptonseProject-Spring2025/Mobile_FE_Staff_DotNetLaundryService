import { create } from "zustand";
import axiosClient from "../config/axiosClient.js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEYS = {
  TOKEN: "token",
  REFRESH_TOKEN: "refreshToken",
  REFRESH_TOKEN_EXPIRY: "refreshTokenExpiry",
  USER_ID: "userId",
  USER_DETAIL: "userDetail",
  USER: "user", 
};

const isTokenValid = (token) => {
  if (!token) return false;

  try {
    const decoded = parseJwt(token);
    const currentTime = Date.now() / 1000;

    // Check if token is expired or will expire in the next 2 minutes
    return decoded.exp && decoded.exp > currentTime + 120;
  } catch (error) {
    return false;
  }
};

const useAuthStore = create((set, get) => ({
  userId: null,
  userDetail: null,
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  otpToken: null,
  lastTokenCheck: 0, // Track when we last checked token validity
  tempRegisterData: {
    phoneNumber: "",
    password: "",
  },
  // Check if token is valid (can be used elsewhere in the app)
  isTokenValid,

  // Initialize auth state from storage
  initialize: async () => {
    try {
      // Get tokens from storage
      const [token, refreshToken] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
      ]);

      if (!token || !refreshToken) {
        // No tokens available, ensure logged out state
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
        set({ token, refreshToken });
      }

      // Load user data
      const [userIdStr, userDetailJson] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER_ID),
        AsyncStorage.getItem(STORAGE_KEYS.USER_DETAIL),
      ]);

      const userId = userIdStr || null;
      const userDetail = userDetailJson ? JSON.parse(userDetailJson) : null;

      // If we have a userId but no detail, try to fetch it
      if (userId && !userDetail) {
        const fetchSuccess = await get().fetchUserDetail(userId);
        if (!fetchSuccess) {
          // Continue anyway since we have valid tokens
          console.log("Failed to fetch user details but continuing with auth");
        }
      } else if (userId && userDetail) {
        // Set user details from storage
        set({ userDetail });
      } else if (!userId) {
        // If we don't have a userId, something's wrong
        console.error("No userId found during initialization");
        await get().logoutSilent();
        return false;
      }

      // Set auth state with available data
      set({
        userId,
        isAuthenticated: true,
        lastTokenCheck: Date.now(),
      });

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
        message: error.response?.data?.message || "Login failed",
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

  // Refresh authentication token
  refreshAuthToken: async () => {
    // Get refresh token from state first, fall back to storage if needed
    let refreshToken = get().refreshToken;

    if (!refreshToken) {
      // If not in state, try to get from storage
      refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (!refreshToken) {
        console.log("No refresh token available");
        return false;
      }
    }

    try {
      const response = await axiosClient.post("/auth/refresh-token", {
        refreshToken,
      });

      // Extract tokens from response
      const newToken = response.data?.accessToken;
      const newRefreshToken = response.data?.refreshToken;

      if (!newToken) {
        console.error("Token refresh response did not include a token");
        return false;
      }

      // CRITICAL: If no new refresh token is provided, logout the user
      // because the old refresh token is likely invalid now
      if (!newRefreshToken) {
        console.warn("No new refresh token provided, forcing logout");
        await get().logoutSilent();
        return false;
      }

      // Update tokens in storage and state
      const updates = [
        [STORAGE_KEYS.TOKEN, newToken],
        [STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken]
      ];

      await AsyncStorage.multiSet(updates);

      set({
        token: newToken,
        refreshToken: newRefreshToken, 
        lastTokenCheck: Date.now(),
      });

      return true;
    } catch (error) {
      console.error("Token refresh failed", error);
      
      // If refresh fails with 400/401, the refresh token is likely invalid
      if (error.response && (error.response.status === 400 || error.response.status === 401)) {
        console.warn("Token refresh returned error status, logging out");
        await get().logoutSilent();
      }
      
      return false;
    }
  },

  // Send OTP
  sendOtp: async (phoneNumber) => {
    set({ isLoading: true });
    try {
      await axiosClient.post("/otp/send", { phone: phoneNumber });
      set({ isLoading: false });
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return {
        success: false,
        message: error.response?.data?.message || "Failed to send OTP",
      };
    }
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

  // Register user
  register: async (registerData, otpToken) => {
    set({ isLoading: true });
    try {
      const response = await axiosClient.post(
        `/Auth/register?otpToken=${otpToken}`,
        registerData
      );

      const { userId, token, refreshToken } = response.data;

      // Store essential auth data all at once
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.TOKEN, token],
        [STORAGE_KEYS.REFRESH_TOKEN, refreshToken],
        [STORAGE_KEYS.USER_ID, userId.toString()],
      ]);

      // Update state
      set({
        token,
        refreshToken,
        userId,
        isAuthenticated: true,
        isLoading: false,
        otpToken: null,
        lastTokenCheck: Date.now(),
        tempRegisterData: {
          phoneNumber: "",
          password: "",
        },
      });

      // Fetch complete user details
      await get().fetchUserDetail(userId);
      return { success: true, userId };
    } catch (error) {
      set({ isLoading: false });
      return {
        success: false,
        message: error.response?.data?.message || "Registration failed",
      };
    }
  },

  // Logout
  logout: async () => {
    try {
      // Try to call logout API
      const token = get().token;
      if (token) {
        try {
          await axiosClient.post("/Auth/logout");
        } catch (error) {
          // Continue with local logout even if API call fails
        }
      }

      // Perform local logout
      await get().logoutSilent();
      console.log("check storage", await AsyncStorage.getAllKeys());
      return true;
    } catch (error) {
      console.error("Logout failed:", error);
      return false;
    }
  },

  logoutSilent: async () => {
    try {
      // Clear all auth data
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN_EXPIRY,
        STORAGE_KEYS.USER_ID,
        STORAGE_KEYS.USER_DETAIL,
        STORAGE_KEYS.USER,
      ]);

      // Reset state
      set({
        token: null,
        refreshToken: null,
        userId: null,
        userDetail: null,
        isAuthenticated: false,
        otpToken: null,
        lastTokenCheck: 0,
        tempRegisterData: {
          phoneNumber: "",
          password: "",
        },
      });

      return true;
    } catch (error) {
      console.error("Silent logout failed:", error);
      return false;
    }
  },

  //reset password
  resetPassword: async (phone, password) => {
    set({ isLoading: true });
    try {
      const response = await axiosClient.post("/Auth/reset-password", {
        phone,
        password,
      });

      set({ isLoading: false });
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return {
        success: false,
        message: error.response?.data?.message || "Failed to reset password",
      };
    }
  },

  // Debug function to log AsyncStorage contents
  debugAsyncStorage: async () => {
    try {
      // Get all auth-related items
      const [token, refreshToken, refreshTokenExpiry, userJson] =
        await Promise.all([
          AsyncStorage.getItem("token"),
          AsyncStorage.getItem("refreshToken"),
          AsyncStorage.getItem("refreshTokenExpiry"),
          AsyncStorage.getItem("user"),
        ]);

      const user = userJson ? JSON.parse(userJson) : null;

      console.log("===== AsyncStorage Debug =====");
      console.log("Token exists:", !!token);
      if (token) {
        // Only log a part of the token for security
        console.log("Token preview:", token.substring(0, 15) + "...");

        // Parse and show expiration
        const tokenData = parseJwt(token);
        const expDate = new Date(tokenData.exp * 1000);
        console.log("Token expires:", expDate.toLocaleString());
      }

      console.log("RefreshToken exists:", !!refreshToken);
      if (refreshToken) {
        // Only log a part of the refresh token for security
        console.log(
          "Refresh Token preview:",
          refreshToken.substring(0, 10) + "..."
        );
      }

      console.log("RefreshTokenExpiry:", refreshTokenExpiry || "Not set");
      if (refreshTokenExpiry) {
        const expiryDate = new Date(refreshTokenExpiry);
        console.log("Refresh Token expires:", expiryDate.toLocaleString());
      }

      console.log("User data:", user);
      console.log("===== End Debug =====");

      return {
        hasToken: !!token,
        hasRefreshToken: !!refreshToken,
        hasRefreshTokenExpiry: !!refreshTokenExpiry,
        hasUserData: !!user,
      };
    } catch (error) {
      console.error("Error debugging AsyncStorage:", error);
      return null;
    }
  },

  // Store temporary registration data
  setTempRegisterData: (data) => {
    set((state) => ({
      tempRegisterData: {
        ...state.tempRegisterData,
        ...data,
      },
    }));
  },
}));

// Helper function to parse JWT token
function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return {};
  }
}

export default useAuthStore;
