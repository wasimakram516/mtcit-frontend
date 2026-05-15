"use client";
import { useCallback, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { getWebSocketHost } from "@/utils/runtimeConfig";

export default function useWebSocketController() {
  const [socket, setSocket] = useState(null);
  const [categoryOptions, setCategoryOptions] = useState({});
  const [categoryTree, setCategoryTree] = useState(null);
  const [connected, setConnected] = useState(false);
  const [displayMedia, setDisplayMedia] = useState(null);
  const [leafMedia, setLeafMedia] = useState(null);
  const [currentExperience, setCurrentExperience] = useState(null);
  const [currentExperienceState, setCurrentExperienceState] = useState(null);

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
      console.log("Connected to WebSocket Server (Kiosk)", socketInstance.id);
      setConnected(true);
      socketInstance.emit("register", "kiosk");
      socketInstance.emit("getCategoryOptions");
    });

    socketInstance.on("disconnect", () => {
      console.log("Disconnected from server");
      setConnected(false);
    });

    socketInstance.on("categoryOptions", (data) => {
      console.log("Received category options", data);
      setCategoryOptions(data);
    });

    socketInstance.on("categoryTree", (tree) => {
      console.log("Received category tree", tree);
      setCategoryTree(tree);
    });

    socketInstance.on("categoryMediaList", (payload) => {
      console.log("categoryMediaList", payload);
      setLeafMedia(
        payload && Array.isArray(payload.items)
          ? payload
          : { items: [], leafId: null, categoryPath: [] }
      );
    });

    socketInstance.on("displayExperience", (payload) => {
      console.log("displayExperience", payload);
      setCurrentExperience(payload || null);
    });

    socketInstance.on("experienceStateChanged", (payload) => {
      console.log("experienceStateChanged", payload);
      setCurrentExperienceState(payload || null);
    });
    
    socketInstance.on("displayMedia", (media) => {
      console.log("🎬 Received display media for selected leaf", media);
      setDisplayMedia(media);
    });

    // Listen for category reorder event from CMS to refresh tree
    const handleCategoryReorder = () => {
      console.log("🔄 Category reordered in CMS, requesting refresh");
      socketInstance.emit("getCategoryOptions");
    };
    window.addEventListener("categoryReordered", handleCategoryReorder);

    setSocket(socketInstance);

    return () => {
      window.removeEventListener("categoryReordered", handleCategoryReorder);
      socketInstance.disconnect();
    };
  }, []);

  const sendCategorySelection = useCallback((category, subcategory, language, categoryPath) => {
    if (!socket) return;
    if (Array.isArray(categoryPath)) {
      socket.emit("selectCategory", { categoryPath, language });
    } else {
      socket.emit("selectCategory", { categoryPath: [], language });
    }
  }, [socket]);

  const sendLanguageChange = useCallback((language) => {
    if (!socket) return;
    socket.emit("changeLanguage", language);
  }, [socket]);

  const sendCarbonMode = useCallback((active, value) => {
    if (socket) {
      socket.emit("toggleCarbonMode", { active, value });
    }
  }, [socket]);

  const sendExperienceState = useCallback((type, state) => {
    if (socket) {
      socket.emit("updateExperienceState", { type, state });
    }
  }, [socket]);

  const requestCategoryReload = useCallback(() => {
    if (socket?.connected) {
      socket.emit("getCategoryOptions");
    }
  }, [socket]);

  return {
    connected,
    sendCategorySelection,
    sendLanguageChange,
    categoryOptions,
    categoryTree,
    displayMedia,
    leafMedia,
    currentExperience,
    currentExperienceState,
    sendCarbonMode,
    sendExperienceState,
    requestCategoryReload,
  };
}
