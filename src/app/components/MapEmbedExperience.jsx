"use client";
import { Box, Chip, Stack, Typography } from "@mui/material";

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

export default function MapEmbedExperience({
  language = "en",
  interactive = false,
  embedUrl = "",
  qrImageUrl = "",
  qrPosition = { x: 72, y: 74 },
  qrSize = { width: 16, height: 16 },
}) {
  const isArabic = language === "ar";
  const t = copy[language] || copy.en;

  if (interactive) {
    return (
      <Box
        dir={isArabic ? "rtl" : "ltr"}
        sx={{
          width: "min(92vw, 980px)",
          mx: "auto",
          p: { xs: 3, md: 4 },
          borderRadius: "28px",
          border: "1px solid rgba(248,252,246,0.14)",
          background:
            "linear-gradient(135deg, rgba(14,36,20,0.92) 0%, rgba(10,20,52,0.82) 100%)",
          boxShadow: "0 25px 55px rgba(0,0,0,0.28)",
          backdropFilter: "blur(12px)",
          color: "#F8FCF6",
        }}
      >
        <Stack spacing={3}>
          <Box>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
                textShadow: "0 8px 24px rgba(0,0,0,0.32)",
              }}
            >
              {t.controllerTitle}
            </Typography>
            <Typography
              sx={{
                mt: 0.75,
                color: "rgba(248,252,246,0.78)",
                fontSize: "clamp(0.95rem, 1.4vw, 1.05rem)",
              }}
            >
              {t.controllerSubtitle}
            </Typography>
          </Box>

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Chip
              label={t.live}
              sx={{
                bgcolor: "rgba(67,180,85,0.18)",
                color: "#F8FCF6",
                border: "1px solid rgba(67,180,85,0.4)",
                fontWeight: 700,
              }}
            />
            <Typography
              sx={{
                color: "rgba(248,252,246,0.72)",
                fontSize: "clamp(0.85rem, 1vw, 0.95rem)",
                maxWidth: "60%",
                textAlign: isArabic ? "left" : "right",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {embedUrl}
            </Typography>
          </Stack>

          <Box
            sx={{
              position: "relative",
              height: "clamp(320px, 42vw, 520px)",
              borderRadius: "22px",
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.1)",
              bgcolor: "rgba(8,18,16,0.42)",
            }}
          >
            <Box
              component="iframe"
              src={embedUrl}
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

            {qrImageUrl && (
              <Box
                sx={{
                  position: "absolute",
                  left: `${qrPosition.x}%`,
                  top: `${qrPosition.y}%`,
                  width: `${qrSize.width}%`,
                  height: `${qrSize.height}%`,
                  transform: "translate(-50%, -50%)",
                  borderRadius: "clamp(12px, 1vw, 18px)",
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.26)",
                  bgcolor: "rgba(255,255,255,0.92)",
                  boxShadow: "0 18px 40px rgba(0,0,0,0.28)",
                  p: "clamp(6px, 0.6vw, 10px)",
                }}
              >
                <Box
                  component="img"
                  src={qrImageUrl}
                  alt="Map QR code"
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              </Box>
            )}
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
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 2.5 }}
      >
        <Box sx={{ flex: 1, textAlign: "left" }}>
          <Typography
            sx={{
              fontSize: "clamp(1.8rem, 2.6vw, 2.7rem)",
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
              textAlign: "left",
              fontSize: "clamp(0.9rem, 1.2vw, 1rem)",
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
          borderRadius: "28px",
          overflow: "hidden",
          border: "1px solid rgba(17,34,28,0.92)",
          boxShadow: "0 10px 22px rgba(0,0,0,0.1)",
          bgcolor: "#132823",
          backdropFilter: "none",
        }}
      >
        <Box
          sx={{
            position: "relative",
            height: "clamp(360px, 42vw, 620px)",
            bgcolor: "#0B1714",
          }}
        >
          <Box
            component="iframe"
            src={embedUrl}
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

          {qrImageUrl && (
            <Box
              sx={{
                position: "absolute",
                left: `${qrPosition.x}%`,
                top: `${qrPosition.y}%`,
                width: `${qrSize.width}%`,
                height: `${qrSize.height}%`,
                transform: "translate(-50%, -50%)",
                borderRadius: "clamp(14px, 1.2vw, 22px)",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.28)",
                bgcolor: "rgba(255,255,255,0.92)",
                boxShadow: "0 18px 40px rgba(0,0,0,0.28)",
                p: "clamp(8px, 0.7vw, 12px)",
              }}
            >
              <Box
                component="img"
                src={qrImageUrl}
                alt="Map QR code"
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
