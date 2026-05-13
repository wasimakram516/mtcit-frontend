"use client";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export default function useWebSocketController() {
  const [socket, setSocket] = useState(null);
  const [categoryOptions, setCategoryOptions] = useState({});
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_WEBSOCKET_HOST, {
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

    setSocket(socketInstance);

    return () => socketInstance.disconnect();
  }, []);

  const sendCategorySelection = (category, subcategory, language) => {
    if (socket) {
      socket.emit("selectCategory", { category, subcategory, language });
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
  
  

  return { connected, sendCategorySelection, sendLanguageChange, categoryOptions, sendCarbonMode };
}
