"use client";
import { useRouter } from "next/navigation";
import { Box, Typography, IconButton, Button } from "@mui/material";
import LoginIcon from "@mui/icons-material/Login";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import TvIcon from "@mui/icons-material/Tv";
import LanguageSelector from "@/app/components/LanguageSelector";
import { useLanguage } from "@/app/context/LanguageContext";
import { useTheme } from "@mui/material/styles";

export default function Home() {
  const router = useRouter();
  const { language } = useLanguage();
  const theme = useTheme();

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
        background: theme.custom.gradients.hero,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      {/* Language Selector */}
      <LanguageSelector />

      {/* Main Content */}
      <Box
        sx={{
          position: "relative",
          zIndex: 2,
          background: "rgba(248, 252, 246, 0.16)",
          borderRadius: 3,
          padding: { xs: 3, sm: 5 },
          maxWidth: 560,
          width: "90%",
          textAlign: "center",
          boxShadow: "0 30px 70px rgba(7, 40, 11, 0.25)",
          backdropFilter: "blur(14px)",
          border: "1px solid rgba(248, 252, 246, 0.2)",
        }}
      >
        <Typography
          variant="h2"
          color="#F8FCF6"
          fontWeight="bold"
          gutterBottom
          dir={language === "ar" ? "rtl" : "ltr"}
          sx={{
            fontFamily: '"Tajawal", sans-serif',
            textShadow: "0 10px 30px rgba(7, 40, 11, 0.35)",
          }}
        >
          {translations[language].title}
        </Typography>

        <Typography
          variant="h6"
          dir={language === "ar" ? "rtl" : "ltr"}
          sx={{ color: "rgba(248, 252, 246, 0.88)", mb: 4 }}
        >
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
              boxShadow: "0 14px 28px rgba(7, 40, 11, 0.28)",
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
              color: "#F8FCF6",
              "&:hover": {
                backgroundColor: "secondary.dark",
              },
              boxShadow: "0 14px 28px rgba(57, 0, 66, 0.28)",
            }}
          >
            {translations[language].bigScreen}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
