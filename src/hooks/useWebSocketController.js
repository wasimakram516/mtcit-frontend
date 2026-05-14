"use client";
import { useCallback, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { getWebSocketHost } from "@/utils/runtimeConfig";

export default function useWebSocketController() {
  const [socket, setSocket] = useState(null);
  const [categoryOptions, setCategoryOptions] = useState({});
  const [categoryTree, setCategoryTree] = useState(null);
  const [connected, setConnected] = useState(false);
  /** Latest media list for the selected leaf category (from server). */
  const [leafMedia, setLeafMedia] = useState(null);

  useEffect(() => {
    const websocketHost = getWebSocketHost();
    if (!websocketHost) {
      console.warn("WebSocket host is not configured for controller.");
      return undefined;
    }

    const socketInstance = io(websocketHost, {
      transports: ["websocket"],
    });

    socketInstance.on("connect", () => {
      console.log("✅ Connected to WebSocket Server (Kiosk)", socketInstance.id);
      setConnected(true);
      socketInstance.emit("register", "kiosk");
      socketInstance.emit("getCategoryOptions");
    });

    socketInstance.on("disconnect", () => {
      console.log("❌ Disconnected from server");
      setConnected(false);
    });

    socketInstance.on("categoryOptions", (data) => {
      console.log("📂 Received category options", data);
      setCategoryOptions(data);
    });

    socketInstance.on("categoryTree", (tree) => {
      console.log("📂 Received category tree", tree);
      setCategoryTree(tree);
    });

    socketInstance.on("categoryMediaList", (payload) => {
      console.log("📋 categoryMediaList", payload);
      setLeafMedia(payload && Array.isArray(payload.items) ? payload : { items: [], leafId: null, categoryPath: [] });
    });

    setSocket(socketInstance);

    return () => socketInstance.disconnect();
  }, []);

  const sendCategorySelection = useCallback((category, subcategory, language, categoryPath) => {
    if (!socket) return;
    if (Array.isArray(categoryPath)) {
      socket.emit("selectCategory", { categoryPath, language });
    } else {
      socket.emit("selectCategory", { categoryPath: [], language });
    }
  }, [socket]);

  const sendSelectMedia = useCallback((slug, language = "en") => {
    if (socket && slug) {
      socket.emit("selectMedia", { slug, language });
    }
  }, [socket]);

  const sendLanguageChange = useCallback((language) => {
    if (socket) {
      socket.emit("changeLanguage", language);
    }
  }, [socket]);

  const sendCarbonMode = useCallback((active, value) => {
    if (socket) {
      socket.emit("toggleCarbonMode", { active, value });
    }
  }, [socket]);

  /** Ask server to re-send categoryOptions + categoryTree (e.g. after CMS category CRUD). */
  const requestCategoryReload = useCallback(() => {
    if (socket?.connected) {
      socket.emit("getCategoryOptions");
    }
  }, [socket]);

  return {
    connected,
    sendCategorySelection,
    sendSelectMedia,
    sendLanguageChange,
    categoryOptions,
    categoryTree,
    leafMedia,
    sendCarbonMode,
    requestCategoryReload,
  };
}
