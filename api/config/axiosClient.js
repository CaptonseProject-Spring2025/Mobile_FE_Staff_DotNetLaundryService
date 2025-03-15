import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://laundryserviceapi.azurewebsites.net/api';

// Cache for token to avoid excessive AsyncStorage reads
let tokenCache = {
  accessToken: null,
  refreshToken: null,
  lastFetched: 0
};

const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    accept: '*/*',
  },
  timeout: 15000, // Add timeout for better error handling
});

// Reset token caches (useful for logout)
export const resetTokenCache = () => {
  tokenCache = {
    accessToken: null, 
    refreshToken: null,
    lastFetched: 0
  };
};

// Keep track of refresh token requests to prevent multiple calls
let isRefreshing = false;
let failedQueue = [];
const MAX_QUEUE_SIZE = 10; // Prevent memory leaks by limiting queue size

const processQueue = (error, token = null) => {
  // Process only up to MAX_QUEUE_SIZE items to prevent memory issues
  const toProcess = failedQueue.slice(0, MAX_QUEUE_SIZE);
  failedQueue = failedQueue.slice(MAX_QUEUE_SIZE);
  
  toProcess.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
};

// Get token with caching to reduce AsyncStorage reads
const getToken = async (forceRefresh = false) => {
  // Return from cache if available and recent (less than 10 seconds old)
  const now = Date.now();
  if (!forceRefresh && 
      tokenCache.accessToken && 
      now - tokenCache.lastFetched < 10000) {
    return tokenCache.accessToken;
  }
  
  // Otherwise fetch from AsyncStorage
  try {
    const token = await AsyncStorage.getItem('token');
    tokenCache.accessToken = token;
    tokenCache.lastFetched = now;
    return token;
  } catch (error) {
    console.error('Failed to get token from AsyncStorage:', error);
    return null;
  }
};

// Request interceptor to add auth token
axiosClient.interceptors.request.use(
  async (config) => {
    // Don't add token for refresh token requests (to prevent circular issues)
    if (config.url === '/Auth/refresh-token') {
      return config;
    }
    
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Don't retry if already retried or no response
    if (
      !error.response || 
      originalRequest._retry || 
      originalRequest.url === '/Auth/refresh-token'
    ) {
      return Promise.reject(error);
    }

    // If error is 401, try to refresh token
    if (error.response.status === 401) {
      // If already refreshing, queue this request
      if (isRefreshing) {
        // Don't let the queue grow too large
        if (failedQueue.length < MAX_QUEUE_SIZE) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(token => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return axiosClient(originalRequest);
            })
            .catch(err => Promise.reject(err));
        } else {
          return Promise.reject(new Error('Too many requests waiting for token refresh'));
        }
      }

      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        // Get refresh token (don't use cache for this critical operation)
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Call refresh token endpoint (use axios directly to avoid interceptors)
        const response = await axios.post(`${BASE_URL}/Auth/refresh-token`, {
          refreshToken
        });

        // Make sure we're consistent with field names
        const newToken = response.data?.accessToken || response.data?.token;
        const newRefreshToken = response.data?.refreshToken;
        
        if (!newToken) {
          throw new Error('No token received from refresh endpoint');
        }
        
        // Update cache
        tokenCache.accessToken = newToken;
        tokenCache.lastFetched = Date.now();
        if (newRefreshToken) {
          tokenCache.refreshToken = newRefreshToken;
        }
        
        // Store new tokens
        const storagePromises = [AsyncStorage.setItem('token', newToken)];
        if (newRefreshToken) {
          storagePromises.push(AsyncStorage.setItem('refreshToken', newRefreshToken));
        }
        await Promise.all(storagePromises);
        
        // Update header for current request
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        
        // Process any requests that were waiting for the token
        processQueue(null, newToken);
        
        isRefreshing = false;
        return axiosClient(originalRequest);
      } catch (err) {
        // Handle refresh token failure
        isRefreshing = false;
        processQueue(err, null);
        resetTokenCache();
        
        // Clear auth data but do it in the background to not delay the rejection
        AsyncStorage.multiRemove([
          'token',
          'refreshToken',
          'refreshTokenExpiry',
          'userId',
          'userDetail'
        ]).catch(e => console.error('Failed to clear auth data:', e));
        
        // Return a specific error that can be handled by the app
        return Promise.reject({
          ...error,
          isAuthError: true,
          refreshFailed: true
        });
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosClient;