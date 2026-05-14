"use client";
import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { io } from "socket.io-client";
import { getApiBaseUrl, getWebSocketHost } from "@/utils/runtimeConfig";

export default function DynamicBackground({ language = "en" }) {
  const [backgrounds, setBackgrounds] = useState([]);
  const [loading, setLoading] = useState(true);

  const backgroundWidth = "2200px";
  const backgroundHeight = "1400px";

  const WS_HOST = getWebSocketHost();
  const API_URL = getApiBaseUrl();

  useEffect(() => {
    // Fetch initial backgrounds
    const fetchBackgrounds = async () => {
      try {
        const response = await fetch(`${API_URL}/backgrounds/active`);
        if (response.ok) {
          const data = await response.json();
          setBackgrounds(data.data || []);
        }
      } catch (error) {
        console.error("❌ Failed to fetch backgrounds:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBackgrounds();

    // Connect to WebSocket for real-time updates
    if (WS_HOST) {
      const socket = io(WS_HOST, { transports: ["websocket"] });

      socket.on("backgroundUpdate", (updatedBackgrounds) => {
        console.log("🔄 Background update received:", updatedBackgrounds);
        setBackgrounds(updatedBackgrounds || []);
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [WS_HOST, API_URL]);

  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -5,
        overflow: "hidden",
        backgroundColor: "#ffffff",
      }}
    >
      {/* Background images stacked by layer */}
      {backgrounds.length > 0 ? (
        backgrounds.map((bg, index) => {
          const isAr = language === "ar";
          const src = isAr ? (bg.imageUrlAr || bg.imageUrl) : (bg.imageUrlEn || bg.imageUrl);

          if (!src) return null;

          return (
            <Box
              key={bg._id}
              sx={{
                position: "absolute",
                top: `${bg.position?.y || 0}%`,
                left: `${bg.position?.x || 0}%`,
                width: `clamp(240px, ${bg.size?.width || 100}%, ${backgroundWidth})`,
                height: `clamp(160px, ${bg.size?.height || 100}%, ${backgroundHeight})`,
                backgroundImage: `url(${src})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                opacity: bg.opacity || 1,
                transform: `rotate(${bg.rotation || 0}deg)`,
                zIndex: bg.layer || index,
                transition: "all 0.3s ease",
              }}
              role="img"
              aria-label={`Background: ${bg.title}`}
            />
          );
        })
      ) : (
        // Fallback: gradient background
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          }}
        />
      )}
    </Box>
  );
}
