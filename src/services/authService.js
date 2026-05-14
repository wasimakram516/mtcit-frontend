import axios from "axios";
import api from "./api";
import { getApiBaseUrl } from "@/utils/runtimeConfig";
import { getAccessToken, setAccessToken, clearTokens } from "./tokenManager";

const API_BASE_URL = getApiBaseUrl();

export { getAccessToken, setAccessToken, clearTokens };

// **Login API Call**
export const login = async (email, password) => {
  const { data } = await api.post("/auth/login", { email, password });
  const token = data.data.accessToken;
  setAccessToken(token);
  return token;
};

// **Refresh Access Token**
export const refreshAccessToken = async () => {
  try {
    console.warn("🔄 Manual Refresh: Attempting to refresh access token...");
    const { data } = await axios.get(`${API_BASE_URL}/auth/refresh`, {
      withCredentials: true,
    });
    
    const newToken = data?.data?.accessToken;
    if (!newToken) throw new Error("No token returned");
    
    setAccessToken(newToken);
    console.log("✅ Manual Refresh: Token refreshed successfully.");
    return newToken;
  } catch (error) {
    console.error("❌ Manual Refresh failed:", error.response?.data?.message || error.message);
    clearTokens();
    throw error;
  }
};

// **Logout API Call**
export const logoutUser = async () => {
  try {
    await api.post("/auth/logout");
  } catch (error) {
    console.error("Failed to logout on server:", error);
  } finally {
    clearTokens();
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }
};
