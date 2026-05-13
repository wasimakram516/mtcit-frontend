"use client";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export default function useWebSocketBigScreen() {
  const [socket, setSocket] = useState(null);
  const [allMedia, setAllMedia] = useState([]);
  const [currentMedia, setCurrentMedia] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState("en");
  const [carbonActive, setCarbonActive] = useState(false);
  const [carbonLevel, setCarbonLevel] = useState(50);

  const WS_HOST = process.env.NEXT_PUBLIC_WEBSOCKET_HOST;

  useEffect(() => {
    if (!WS_HOST) {
      console.error("❌ WebSocket Host is not defined.");
      return;
    }

    const socketInstance = io(WS_HOST, { transports: ["websocket"] });

    socketInstance.on("connect", () => {
      console.log(
        "✅ Connected to WebSocket Server (Big Screen)",
        socketInstance.id
      );
      socketInstance.emit("register", "big-screen");
      setIsLoading(false);
    });

    socketInstance.on("mediaUpdate", (mediaList) => {
      console.log("📦 All media loaded", mediaList);
      setAllMedia(mediaList);
    });

    // Show loading when a category is selected
    socketInstance.on("categorySelected", () => {
      console.log("⏳ Category selected – show loading");
      setIsLoading(true);
      setCurrentMedia(null);
    });

    // Media arrives
    socketInstance.on("displayMedia", (mediaData) => {
      console.log("🖥️ Display media:", mediaData);
      setCurrentMedia(mediaData);
      setIsLoading(false);
    });

    socketInstance.on("languageChanged", (language) => {
      console.log("🌐 Language changed to:", language);
      setCurrentLanguage(language);
    });

    socketInstance.on("carbonMode", ({ active, value }) => {
      console.log("🌍 Carbon Mode:", active, value);
      setCarbonActive(active);
      setCarbonLevel(value);
    });

    socketInstance.on("disconnect", () => {
      console.log("❌ WebSocket disconnected");
    });

    setSocket(socketInstance);

    return () => socketInstance.disconnect();
  }, [WS_HOST]);

  return {
    currentMedia,
    isLoading,
    currentLanguage,
    allMedia,
    carbonActive,
    carbonLevel,
  };
}
