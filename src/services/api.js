import axios from 'axios';
import { getApiBaseUrl } from "@/utils/runtimeConfig";
import { getAccessToken, setAccessToken, clearTokens } from "./tokenManager";

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

const refreshAccessToken = async () => {
  console.warn("Interceptor: Refreshing access token...");
  const { data } = await axios.get(`${API_BASE_URL}/auth/refresh`, {
    withCredentials: true,
  });
  const token = data?.data?.accessToken;
  if (!token) {
    throw new Error("Refresh endpoint did not return access token");
  }
  setAccessToken(token);
  console.log("Interceptor: Token refreshed successfully.");
  return token;
};

// Global variables to handle token refresh logic
let isRefreshing = false;
let failedQueue = [];

// Process queued requests after token refresh
const processQueue = (error, token = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// Attach accessToken to each request
api.interceptors.request.use(
  (config) => {
    const accessToken = getAccessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle expired access tokens & refresh automatically
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || "";

    // Avoid looping for login & refresh endpoints
    if (requestUrl.includes("/auth/refresh") || requestUrl.includes("/auth/login")) {
      return Promise.reject(error);
    }

    // If token expired (401), try refreshing
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        const newAccessToken = await refreshAccessToken();
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);
        return api(originalRequest);
      } catch (refreshError) {
        console.error("❌ Interceptor: Refresh failed:", refreshError.response?.data?.message || refreshError.message);
        processQueue(refreshError, null);
        clearTokens();
        if (typeof window !== "undefined") {
          window.location.href = "/login"; // Redirect to login
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
