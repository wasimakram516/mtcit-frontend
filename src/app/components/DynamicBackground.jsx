"use client";
import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { io } from "socket.io-client";
import { getApiBaseUrl, getWebSocketHost } from "@/utils/runtimeConfig";
import BackgroundSlideshow from "./BackgroundSlideshow";

export default function DynamicBackground({ language = "en" }) {
  const [backgrounds, setBackgrounds] = useState([]);

  const WS_HOST = getWebSocketHost();
  const API_URL = getApiBaseUrl();

  useEffect(() => {
    const fetchBackgrounds = async () => {
      try {
        const response = await fetch(`${API_URL}/backgrounds/active`);
        if (response.ok) {
          const data = await response.json();
          setBackgrounds(data.data || []);
        }
      } catch (error) {
        console.error("❌ Failed to fetch backgrounds:", error);
      }
    };

    fetchBackgrounds();

    if (WS_HOST) {
      const socket = io(WS_HOST, { transports: ["websocket"] });

      socket.on("backgroundUpdate", (updatedBackgrounds) => {
        setBackgrounds(updatedBackgrounds || []);
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [WS_HOST, API_URL]);

  if (!backgrounds.length) {
    return (
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(135deg, #07280B 0%, #1C932D 52%, #390042 100%)",
        }}
      />
    );
  }

  return <BackgroundSlideshow slides={backgrounds} language={language} />;
}
