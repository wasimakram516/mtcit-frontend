"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import useWebSocketBigScreen from "@/hooks/useWebSocketBigScreen";
import { FourSquare } from "react-loading-indicators";
import { motion } from "framer-motion";
import FooterBigScreen from "@/app/components/FooterBigScreen";
import CloudsBackground from "../components/CloudsBackground";

export default function BigScreenPage() {
  const router = useRouter();
  const {
    currentMedia,
    isLoading,
    currentLanguage,
    allMedia,
    carbonActive,
    carbonLevel,
  } = useWebSocketBigScreen();
  const [showContent, setShowContent] = useState(false);
  const [showLoader, setShowLoader] = useState(false);

  const getCarbonColor = (value) => {
    if (value >= 90) return "#0a1f16"; // near-black greenish
    if (value >= 80) return "#133326"; // dark grey-green
    if (value >= 70) return "#1b4d33"; // darker green
    if (value >= 60) return "#236c3f"; // greenish
    if (value >= 50) return "#2e8b57"; // medium sea green
    if (value >= 40) return "#43a047"; // normal green
    if (value >= 30) return "#66bb6a"; // light green
    if (value >= 20) return "#8bc34a"; // lime green
    if (value >= 10) return "#a8e63f"; // bright lime
    return "#00c851"; // parrot green (lowest value)
  };

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
    if (isLoading) {
      setShowLoader(true);
      setShowContent(false);
    } else {
      const timer = setTimeout(() => {
        setShowLoader(false);
        setShowContent(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, currentMedia]);

  return (
    <Box
      sx={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        display: "flex",
      }}
    >
      {/* ✅ Background Component */}
      <CloudsBackground />

      {/* Main Content */}
      <Box
        sx={{
          position: "relative",
          flex: "1 1 auto",
          display: "flex",
          flexDirection: "row",
          zIndex: 10, // foreground layer
        }}
      >
        {carbonActive && (
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "90%",
              borderRadius: "2rem",
              backgroundColor: "rgba(255,255,255,0.9)",
              boxShadow: "0 0 30px rgba(0,0,0,0.4)",
              padding: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              zIndex: 999,
            }}
          >
            <Typography
              variant="h4"
              fontWeight="bold"
              dir={currentLanguage === "ar" ? "rtl" : "ltr"}
              sx={{
                color: "#333",
                letterSpacing: 1,
              }}
            >
              {translations[currentLanguage]?.title || translations.en.title}
            </Typography>

            <Box
              sx={{
                width: "100%",
                borderRadius: "1.5rem",
                background: getCarbonColor(carbonLevel),
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Box
                component="img"
                src="/omanCity.png"
                alt="City"
                sx={{
                  width: "100%",
                  height: "auto",
                  objectFit: "contain",
                  borderRadius: "1rem",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                }}
              />
            </Box>

            <Typography
              variant="h5"
              fontWeight="bold"
              dir={currentLanguage === "ar" ? "rtl" : "ltr"}
              sx={{
                color: "#333",
                letterSpacing: 1,
              }}
            >
              {translations[currentLanguage]?.subtitle ||
                translations.en.subtitle}
            </Typography>
          </Box>
        )}

        {/* LEFT 70% */}
        <Box
          sx={{
            flex: "0 0 70%",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
          }}
        >
          <IconButton
            sx={{
              position: "absolute",
              top: 20,
              left: 20,
              color: "#fff",
              zIndex: 9999,
            }}
            onClick={() => router.push("/")}
          >
            <ArrowBackIcon />
          </IconButton>

          {showLoader && (
            <Box sx={{ zIndex: 2 }}>
              <FourSquare
                color={["#32cd32", "#96D8EA", "#cd32cd", "#cd8032"]}
                size="large"
              />
            </Box>
          )}

          {!isLoading && showContent && !currentMedia && (
            <Box sx={{ position: "relative", width: "100%", height: "90%" }}>
              <Box
                component="img"
                src={currentLanguage === "en" ? "/CoverEn.gif" : "CoverAr.gif"}
                alt="Display Image"
                sx={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </Box>
          )}

          {!isLoading &&
            showContent &&
            currentMedia?.media?.type === "image" && (
              <Box
                component="img"
                src={currentMedia.media.url}
                alt="Display Image"
                sx={{
                  width: "90%",
                  height: "auto",
                  objectFit: "contain",
                  borderRadius: "2rem",
                  zIndex: 2,
                }}
              />
            )}

          {!isLoading &&
            showContent &&
            currentMedia?.media?.type === "video" && (
              <Box
                component="video"
                src={currentMedia.media.url}
                autoPlay
                muted
                loop
                sx={{
                  width: "90%",
                  height: "auto",
                  objectFit: "contain",
                  borderRadius: "2rem",
                  zIndex: 2,
                }}
              />
            )}
        </Box>

        {/* RIGHT 30% */}
        <Box
          sx={{
            flex: "0 0 30%",
            position: "relative",
            backgroundSize: "cover",
            backgroundPosition: "center",
            zIndex: 10,
          }}
        >
          <Box
            component="img"
            src="/road.png"
            alt="Road"
            sx={{
              position: "absolute",
              bottom: 0,
              right: -200,
              height: "90%",
              objectFit: "contain",
            }}
          />
          {allMedia
            .filter((m) => m.pinpoint?.file?.url)
            .map((m) => {
              const isActive = currentMedia?._id === m._id;
              const pin = m.pinpoint;

              return (
                <motion.img
                  key={m._id}
                  src={pin.file.url}
                  alt="Pinpoint"
                  initial={false}
                  animate={isActive ? { y: [0, -15, 0] } : { y: 0 }}
                  transition={
                    isActive
                      ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
                      : {}
                  }
                  style={{
                    position: "absolute",
                    top: `${pin.position.y}%`,
                    left: `${pin.position.x}%`,
                    transform: "translate(-50%, -50%)",
                    zIndex: isActive ? 3 : 1,
                    opacity: isActive ? 1 : 0.9,
                    filter: isActive
                      ? "drop-shadow(0 0 12px rgba(0, 150, 255, 0.8)) brightness(1.3) saturate(1.8) hue-rotate(90deg)"
                      : "brightness(0.95) saturate(0.9)",
                    transition: "filter 0.3s ease, opacity 0.3s ease",
                  }}
                />
              );
            })}
        </Box>

        <FooterBigScreen />
      </Box>
    </Box>
  );
}
