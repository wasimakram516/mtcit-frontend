"use client";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { getWebSocketHost } from "@/utils/runtimeConfig";

export default function useWebSocketController() {
  const [socket, setSocket] = useState(null);
  const [categoryOptions, setCategoryOptions] = useState({});
  const [categoryTree, setCategoryTree] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io(getWebSocketHost(), {
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

    setSocket(socketInstance);

    return () => socketInstance.disconnect();
  }, []);

  const sendCategorySelection = (category, subcategory, language, categoryPath) => {
    if (socket) {
      if (Array.isArray(categoryPath)) {
        socket.emit("selectCategory", { categoryPath, language });
      } else {
        socket.emit("selectCategory", { category, subcategory, language });
      }
    }
  };

  const sendLanguageChange = (language) => {
    if (socket) {
      socket.emit("changeLanguage", language);
    }
  };

  const sendCarbonMode = (active, value) => {
    if (socket) {
      socket.emit("toggleCarbonMode", { active, value });
    }
  };
  
  

  return { connected, sendCategorySelection, sendLanguageChange, categoryOptions, categoryTree, sendCarbonMode };
}
