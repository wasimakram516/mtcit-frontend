"use client";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { getWebSocketHost } from "@/utils/runtimeConfig";

function normalizeDisplayMediaPayload(raw) {
  if (raw == null || typeof raw !== "object") return raw;
  const m = { ...raw };
  m.layers = Array.isArray(m.layers) ? m.layers : [];
  m.mediaLayers = Array.isArray(m.mediaLayers) ? m.mediaLayers : [];

  if (
    m.mediaLayers.length === 0 &&
    m.media &&
    typeof m.media === "object" &&
    (m.media.en?.url || m.media.ar?.url)
  ) {
    const en = m.media.en;
    const ar = m.media.ar;
    m.mediaLayers = [
      {
        fileEn: en?.url ? { type: en.type || "image", url: en.url } : undefined,
        fileAr: ar?.url ? { type: ar.type || "image", url: ar.url } : undefined,
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
        zIndex: 0,
        isActive: true,
      },
    ];
  }

  return m;
}

export default function useWebSocketBigScreen() {
  const [socket, setSocket] = useState(null);
  const [allMedia, setAllMedia] = useState([]);
  const [currentMedia, setCurrentMedia] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState("en");
  const [carbonActive, setCarbonActive] = useState(false);
  const [carbonLevel, setCarbonLevel] = useState(50);
  const [categoryTree, setCategoryTree] = useState(null);

  const WS_HOST = getWebSocketHost();

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

    // Controller picked a category path: clear stage and show loader until displayMedia(null|payload) arrives.
    socketInstance.on("categorySelected", () => {
      console.log("⏳ Category selected – clearing stage, loading");
      setCurrentMedia(null);
      setIsLoading(true);
    });

    socketInstance.on("displayMedia", (mediaData) => {
      console.log("🖥️ Display media received:", mediaData);
      const next = mediaData == null ? null : normalizeDisplayMediaPayload(mediaData);
      setCurrentMedia(next);
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

    socketInstance.on("categoryTree", (tree) => {
      console.log("📂 Received category tree (big-screen):", tree);
      setCategoryTree(tree);
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
    categoryTree,
  };
}
