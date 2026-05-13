"use client";
import { Box, IconButton, Typography, Paper } from "@mui/material";
import { useState, useEffect } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import { useRouter } from "next/navigation";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import useWebSocketController from "@/hooks/useWebSocketController";
import CarbonSlider from "@/app/components/CarbonSlider";
import LanguageSelector from "@/app/components/LanguageSelector";
import { Aurora } from "ambient-cbg";

export default function CarbonFootprintPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { sendCarbonMode, connected } = useWebSocketController();
  const [carbonValue, setCarbonValue] = useState(100);

  const translations = {
    en: {
      title: "Reduce carbon footprint...",
      subtitle: "and see the city turn green!",
    },
    ar: {
      title: "قلل من البصمة الكربونية...",
      subtitle: "وشاهد المدينة تتحول إلى الخُضرة!",
    },
  };

  useEffect(() => {
    if (connected) {
      sendCarbonMode(true, 100);
    }
  }, [connected]);

  return (
    <Box
      sx={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "center",
        gap: "4rem",
        position: "relative",
        overflow: "hidden",
        px: "3rem",
        textAlign: "center",
      }}
    >
      {/* Back Button */}
      <IconButton
        sx={{
          position: "absolute",
          top: 20,
          left: 20,
          color: "#fff",
          zIndex: 10,
        }}
        onClick={() => {
          sendCarbonMode(false, 0);
          router.push("/controller");
        }}
      >
        <ArrowBackIcon />
      </IconButton>
      <LanguageSelector />
      <Box sx={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <Aurora />
      </Box>

      {/* Main Content Box */}
      <Paper
        elevation={4}
        sx={{
          width: "100%",
          maxWidth: 500,
          p: 4,
          borderRadius: 4,
          textAlign: "center",
          background:"rgba(255,255,255,0.9)",
          display: "flex",
          flexDirection: "column",
          gap: 3,
          alignItems: "center",
          zIndex:99
        }}
      >
        <Typography
          variant="h5"
          fontWeight="bold"
          dir={language === "ar" ? "rtl" : "ltr"}
          sx={{ color: "#333", letterSpacing: 1 }}
        >
          {translations[language]?.title || translations.en.title}
        </Typography>

        <CarbonSlider
          value={carbonValue}
          onChange={(val) => {
            setCarbonValue(val);
            sendCarbonMode(true, val);
          }}
        />

        <Typography
          variant="h6"
          fontWeight="bold"
          dir={language === "ar" ? "rtl" : "ltr"}
          sx={{ color: "#444", letterSpacing: 1 }}
        >
          {translations[language]?.subtitle || translations.en.subtitle}
        </Typography>
      </Paper>
    </Box>
  );
}
