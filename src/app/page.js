"use client";
import { useRouter } from "next/navigation";
import { Box, Typography, IconButton, Button } from "@mui/material";
import LoginIcon from "@mui/icons-material/Login";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import TvIcon from "@mui/icons-material/Tv";
import LanguageSelector from "@/app/components/LanguageSelector";
import { useLanguage } from "@/app/context/LanguageContext";

export default function Home() {
  const router = useRouter();
  const { language } = useLanguage();

  const translations = {
    en: {
      title: "Interactive Timeline",
      subtitle: "Choose your mode to begin",
      controller: "Controller",
      bigScreen: "Big Screen",
    },
    ar: {
      title: "الجدول الزمني التفاعلي",
      subtitle: "اختر الوضع للبدء",
      controller: "لوحة التحكم",
      bigScreen: "الشاشة الكبيرة",
    },
  };

  return (
    <Box
      sx={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        background: "linear-gradient(to bottom, #004e7c, #9ddced)",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      {/* Language Selector */}
      <LanguageSelector />

      {/* Login Button */}
      <IconButton
        sx={{
          position: "absolute",
          top: 60,
          right: 20,
          color: "#fff",
          zIndex: 2,
        }}
        onClick={() => router.push("/login")}
      >
        <LoginIcon />
      </IconButton>

      {/* Main Content */}
      <Box
        sx={{
          position: "relative",
          zIndex: 2,
          background: "rgba(255, 255, 255, 0.2)",
          borderRadius: 4,
          padding: { xs: 3, sm: 5 },
          maxWidth: 500,
          width: "90%",
          textAlign: "center",
          boxShadow: "0 0 30px rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(6px)",
        }}
      >
        <Typography variant="h2" color="#fff" fontWeight="bold" gutterBottom>
          {translations[language].title}
        </Typography>

        <Typography variant="h6" sx={{ color: "whitesmoke", mb: 3 }}>
          {translations[language].subtitle}
        </Typography>

        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "center",
          }}
        >
          <Button
            variant="contained"
            size="large"
            startIcon={<ScreenShareIcon />}
            onClick={() => router.push("/controller")}
            sx={{
              backgroundColor: "primary.main",
              "&:hover": {
                backgroundColor: "primary.dark",
              },
            }}
          >
            {translations[language].controller}
          </Button>

          <Button
            variant="contained"
            size="large"
            startIcon={<TvIcon />}
            onClick={() => router.push("/big-screen")}
            sx={{
              backgroundColor: "secondary.main",
              color: "#fff",
              "&:hover": {
                backgroundColor: "secondary.dark",
              },
            }}
          >
            {translations[language].bigScreen}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
