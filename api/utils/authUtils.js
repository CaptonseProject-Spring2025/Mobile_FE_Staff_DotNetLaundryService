// Helper function to parse JWT token
export function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Error parsing JWT token:', e);
    return {};
  }
}

// Token validation functions
export const isTokenValid = (token) => {
  if (!token) return false;

  try {
    const decoded = parseJwt(token);
    const currentTime = Date.now() / 1000;

    // Token is considered valid if it doesn't expire in the next 5 minutes (300 seconds)
    return decoded.exp && decoded.exp > currentTime;
  } catch (error) {
    return false;
  }
};

export const isRefreshTokenValid = (refreshTokenExpiry) => {
  if (!refreshTokenExpiry) return false;

  try {
    // Compare refresh token expiry timestamp with current time
    const expiryTime = new Date(refreshTokenExpiry).getTime();
    const currentTime = new Date().getTime();

    // Return true if refresh token has not expired
    return expiryTime > currentTime;
  } catch (error) {
    return false;
  }
};

// Check if token needs refresh (between 5-10 minutes before expiry)
export const shouldRefreshToken = (token) => {
  if (!token) return false;

  try {
    const decoded = parseJwt(token);
    const currentTime = Date.now() / 1000;

    // If token will expire in the next 5 minutes (300 seconds), it should be refreshed
    return (
      decoded.exp &&
      decoded.exp > currentTime &&
      decoded.exp - currentTime < 300
    );
  } catch (error) {
    return false;
  }
};

// Storage keys
export const STORAGE_KEYS = {
  TOKEN: "token",
  REFRESH_TOKEN: "refreshToken",
  REFRESH_TOKEN_EXPIRY: "refreshTokenExpiry", 
  USER_ID: "userId",
  USER_DETAIL: "userDetail",
  USER: "user",
};