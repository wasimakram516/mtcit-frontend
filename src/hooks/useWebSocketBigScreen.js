"use client";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { getWebSocketHost } from "@/utils/runtimeConfig";

function normalizeDisplayMediaPayload(raw) {
  if (raw == null || typeof raw !== "object") return raw;
  const media = { ...raw };
  media.layers = Array.isArray(media.layers) ? media.layers : [];
  media.mediaLayers = Array.isArray(media.mediaLayers) ? media.mediaLayers : [];

  if (
    media.mediaLayers.length === 0 &&
    media.media &&
    typeof media.media === "object" &&
    (media.media.en?.url || media.media.ar?.url)
  ) {
    const en = media.media.en;
    const ar = media.media.ar;
    media.mediaLayers = [
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

  return media;
}

export default function useWebSocketBigScreen() {
  const [allMedia, setAllMedia] = useState([]);
  const [currentMedia, setCurrentMedia] = useState(null);
  const [currentExperience, setCurrentExperience] = useState(null);
  const [currentExperienceState, setCurrentExperienceState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState("en");
  const [carbonActive, setCarbonActive] = useState(false);
  const [carbonLevel, setCarbonLevel] = useState(50);
  const [categoryTree, setCategoryTree] = useState(null);

  const WS_HOST = getWebSocketHost();

  useEffect(() => {
    if (!WS_HOST) {
      console.error("WebSocket Host is not defined.");
      return;
    }

    const socketInstance = io(WS_HOST, { transports: ["websocket"] });

    socketInstance.on("connect", () => {
      console.log("Connected to WebSocket Server (Big Screen)", socketInstance.id);
      socketInstance.emit("register", "big-screen");
      setIsLoading(false);
    });

    socketInstance.on("mediaUpdate", (mediaList) => {
      console.log("All media loaded", mediaList);
      setAllMedia(mediaList);
    });

    socketInstance.on("categorySelected", () => {
      console.log("Category selected - clearing stage, loading");
      setCurrentMedia(null);
      setCurrentExperience(null);
      setIsLoading(true);
    });

    socketInstance.on("displayMedia", (mediaData) => {
      console.log("Display media received:", mediaData);
      const next = mediaData == null ? null : normalizeDisplayMediaPayload(mediaData);
      setCurrentMedia(next);
      if (next) {
        setCurrentExperience(null);
      }
      setIsLoading(false);
    });

    socketInstance.on("displayExperience", (payload) => {
      console.log("Display experience received:", payload);
      setCurrentExperience(payload || null);
      if (payload) {
        setCurrentMedia(null);
      }
      setIsLoading(false);
    });

    socketInstance.on("experienceStateChanged", (payload) => {
      console.log("Experience state changed:", payload);
      setCurrentExperienceState(payload || null);
    });

    socketInstance.on("languageChanged", (language) => {
      console.log("Language changed to:", language);
      setCurrentLanguage(language);
    });

    socketInstance.on("carbonMode", ({ active, value }) => {
      console.log("Carbon Mode:", active, value);
      setCarbonActive(active);
      setCarbonLevel(value);
    });

    socketInstance.on("categoryTree", (tree) => {
      console.log("Received category tree (big-screen):", tree);
      setCategoryTree(tree);
    });

    socketInstance.on("disconnect", () => {
      console.log("WebSocket disconnected");
    });

    return () => socketInstance.disconnect();
  }, [WS_HOST]);

  return {
    currentMedia,
    currentExperience,
    currentExperienceState,
    isLoading,
    currentLanguage,
    allMedia,
    carbonActive,
    carbonLevel,
    categoryTree,
  };
}
