"use client";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { normalizeMapEmbedUrl } from "@/utils/mapEmbeds";

const copy = {
  en: {
    title: "Interactive Map",
    subtitle: "Live embedded map with QR access for visitors.",
    live: "Live",
    controllerTitle: "Map Display Control",
    controllerSubtitle: "The selected map is now live on the big screen.",
  },
  ar: {
    title: "الخريطة التفاعلية",
    subtitle: "خريطة مضمّنة مباشرة مع رمز QR للزوار.",
    live: "مباشر",
    controllerTitle: "التحكم في عرض الخريطة",
    controllerSubtitle: "الخريطة المحددة معروضة الآن على الشاشة الكبيرة.",
  },
};

const isVideoAsset = (url) => {
  const value = String(url || "").toLowerCase().split("?")[0];
  return [".mp4", ".webm", ".ogg", ".mov", ".m4v"].some((ext) => value.endsWith(ext));
};

export default function MapEmbedExperience({
  language = "en",
  interactive = false,
  embedUrl = "",
  qrImageUrl = "",
  qrImageUrlEn = "",
  qrImageUrlAr = "",
}) {
  const isArabic = language === "ar";
  const t = copy[language] || copy.en;
  const resolvedEmbedUrl = normalizeMapEmbedUrl(embedUrl);

  // Pick language-specific QR, fall back to legacy single qrImageUrl
  const resolvedQrUrl = isArabic
    ? (qrImageUrlAr || qrImageUrlEn || qrImageUrl)
    : (qrImageUrlEn || qrImageUrl || qrImageUrlAr);
  const qrIsVideo = isVideoAsset(resolvedQrUrl);

  if (interactive) {
    return (
      <Box
        dir={isArabic ? "rtl" : "ltr"}
        sx={{
          width: "min(90vw, 1440px)",
          mx: "auto",
          color: "#F8FCF6",
        }}
      >
        <Stack spacing={3}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
            sx={{ mb: 1 }}
          >
            <Box sx={{ flex: 1, textAlign: "center" }}>
              <Typography
                sx={{
                  fontSize: "clamp(1.8rem, 2.8vw, 2.9rem)",
                  fontWeight: 700,
                  textShadow: "0 8px 24px rgba(0,0,0,0.35)",
                  lineHeight: 1.08,
                }}
              >
                {t.title}
              </Typography>
              <Typography
                sx={{
                  opacity: 0.88,
                  mt: 0.5,
                  textAlign: "center",
                  fontSize: "clamp(0.9rem, 1.15vw, 1rem)",
                }}
              >
                {t.subtitle}
              </Typography>
            </Box>
            <Chip
              label={t.live}
              sx={{
                bgcolor: "#1D9E75",
                color: "#fff",
                fontWeight: 700,
                fontSize: "clamp(0.92rem, 1.05vw, 1.1rem)",
                minWidth: "clamp(72px, 6vw, 108px)",
                boxShadow: "0 12px 24px rgba(29,158,117,0.35)",
              }}
            />
          </Stack>

          <Box
            sx={{
              position: "relative",
              height: "clamp(460px, 68vh, 860px)",
              borderRadius: "28px",
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.1)",
              bgcolor: "#0B1714",
              boxShadow: "0 18px 40px rgba(0,0,0,0.24)",
            }}
          >
            <Box
              component="iframe"
              src={resolvedEmbedUrl}
              title="Embedded map controller preview"
              loading="lazy"
              allowFullScreen
              sx={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                border: 0,
              }}
            />
          </Box>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      dir={isArabic ? "rtl" : "ltr"}
      sx={{
        width: "100%",
        maxWidth: "100%",
        mx: "auto",
        color: "#F6FCF6",
        height: "100%",
      }}
    >
      {resolvedQrUrl ? (
        <Box
          sx={{
            position: "relative",
            width: "100%",
            height: "100%",
            minHeight: "clamp(420px, 62vh, 760px)",
            overflow: "hidden",
          }}
        >
          {qrIsVideo ? (
            <Box
              component="video"
              src={resolvedQrUrl}
              autoPlay
              muted
              loop
              playsInline
              sx={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                bgcolor: "transparent",
              }}
            />
          ) : (
            <Box
              component="img"
              src={resolvedQrUrl}
              alt="Map QR code"
              sx={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                bgcolor: "transparent",
              }}
            />
          )}
        </Box>
      ) : (
        <Box
          sx={{
            position: "relative",
            borderRadius: "28px",
            overflow: "hidden",
            height: "100%",
            minHeight: 0,
            bgcolor: "#132823",
          }}
        >
          <Box
            sx={{
              position: "relative",
              height: "100%",
              minHeight: "clamp(420px, 62vh, 760px)",
              bgcolor: "#0B1714",
            }}
          >
            <Box
              component="iframe"
              src={resolvedEmbedUrl}
              title="Embedded map"
              loading="lazy"
              allowFullScreen
              sx={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                border: 0,
              }}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
}
