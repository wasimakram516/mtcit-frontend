const DEFAULT_API_URL = "http://localhost:4000/api";

export const getApiBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_URL;

export const getWebSocketHost = () => {
  const explicitHost = process.env.NEXT_PUBLIC_WEBSOCKET_HOST;
  if (explicitHost) return explicitHost;

  const apiUrl = getApiBaseUrl();

  try {
    const parsedUrl = new URL(apiUrl);
    parsedUrl.pathname = "";
    parsedUrl.search = "";
    parsedUrl.hash = "";
    return parsedUrl.toString().replace(/\/+$/, "");
  } catch {
    return apiUrl.replace(/\/api\/?$/, "");
  }
};
