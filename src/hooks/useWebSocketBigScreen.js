"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { getWebSocketHost } from "@/utils/runtimeConfig";

// Extract the first visible media URL from a display media object for preloading
function getFirstMediaUrl(media) {
  // Check dedicated background layers first
  const layers = media?.layers || [];
  for (const layer of layers) {
    if (layer.isActive === false) continue;
    const url = layer.fileEn?.url || layer.fileAr?.url;
    if (url) return url;
  }
  // Then foreground media layers
  const mlayers = media?.mediaLayers || [];
  for (const layer of mlayers) {
    if (layer.isActive === false) continue;
    const url = layer.fileEn?.url || layer.fileAr?.url;
    if (url) return url;
  }
  return null;
}

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
  const [activeBackgrounds, setActiveBackgrounds] = useState([]);
  const [currentMedia, setCurrentMedia] = useState(null);
  const [currentExperience, setCurrentExperience] = useState(null);
  const [currentExperienceState, setCurrentExperienceState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState("en");
  const loadingStartRef = useRef(0);
  const socketRef = useRef(null);
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
    socketRef.current = socketInstance;

    socketInstance.on("connect", () => {
      console.log("Connected to WebSocket Server (Big Screen)", socketInstance.id);
      socketInstance.emit("register", "big-screen");
      setIsLoading(false);
    });

    socketInstance.on("mediaUpdate", (mediaList) => {
      console.log("All media loaded", mediaList);
      setAllMedia(mediaList);
    });

    socketInstance.on("backgroundUpdate", (backgrounds) => {
      console.log("Active backgrounds loaded", backgrounds);
      setActiveBackgrounds(Array.isArray(backgrounds) ? backgrounds : []);
    });

    socketInstance.on("categorySelected", () => {
      console.log("Category selected - clearing stage, loading");
      loadingStartRef.current = Date.now();
      setCurrentMedia(null);
      setCurrentExperience(null);
      setIsLoading(true);
    });

    socketInstance.on("displayMedia", (mediaData) => {
      console.log("Display media received:", mediaData);
      const next = mediaData == null ? null : normalizeDisplayMediaPayload(mediaData);
      setCurrentMedia(next);
      if (next) setCurrentExperience(null);

      const elapsed = Date.now() - loadingStartRef.current;
      // Ignore immediate null clears sent right after categorySelected
      if (!next && elapsed <= 800) return;
      if (!next) { setIsLoading(false); return; }

      // Extract first media URL to preload before revealing
      const firstUrl = getFirstMediaUrl(next);
      if (!firstUrl) { setIsLoading(false); return; }

      const reveal = () => { setIsLoading(false); socketInstance.emit("bigScreenReady"); };
      const isVideo = /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(firstUrl);
      if (isVideo) {
        setTimeout(reveal, 800);
      } else {
        const img = new window.Image();
        const timeout = setTimeout(reveal, 6000);
        img.onload = img.onerror = () => { clearTimeout(timeout); reveal(); };
        img.src = firstUrl;
        if (img.complete) { clearTimeout(timeout); reveal(); }
      }
    });

    socketInstance.on("displayExperience", (payload) => {
      console.log("Display experience received:", payload);
      setCurrentExperience(payload || null);
      setCurrentMedia(null); // always clear media when experience changes (or resets)

      if (!payload) {
        // null = idle/reset — always clear immediately, no guard
        setIsLoading(false);
        return;
      }

      // Real experience arriving — only skip the immediate-null-clear guard for non-null
      setTimeout(() => { setIsLoading(false); socketInstance.emit("bigScreenReady"); }, 400);
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

    return () => { socketInstance.disconnect(); socketRef.current = null; };
  }, [WS_HOST]);

  // Called when media actually finishes loading on big screen — tells controller to clear ring
  const notifyMediaReady = useCallback(() => {
    socketRef.current?.emit("bigScreenReady");
  }, []);

  return {
    currentMedia,
    activeBackgrounds,
    currentExperience,
    currentExperienceState,
    isLoading,
    notifyMediaReady,
    currentLanguage,
    allMedia,
    carbonActive,
    carbonLevel,
    categoryTree,
  };
}
