import axios from 'axios';
import { getApiBaseUrl } from "@/utils/runtimeConfig";

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Removed authentication interceptors as per user request to allow open access.

export default api;
