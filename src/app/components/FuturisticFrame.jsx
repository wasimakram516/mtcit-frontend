"use client";
import { Box, Typography } from "@mui/material";

/**
 * Futuristic overlay frame — matches the reference HTML:
 *  - 4 corner L-marks
 *  - thin top & bottom horizontal gradient lines
 *  - 3 dots + badge text below the bottom line
 * Applied as an absolute overlay on top of the background slideshow.
 */
export default function FuturisticFrame({ language = "en" }) {
  const badgeText = language === "ar"
    ? "MTCIT · مبادرة التنقل الأخضر"
    : "MTCIT · Green Mobility Initiative";
  const lineStyle = {
    position: "absolute",
    left: "5%",
    right: "5%",
    height: "1px",
    background:
      "linear-gradient(90deg, transparent, rgba(255,255,255,0.22) 20%, rgba(255,255,255,0.22) 80%, transparent)",
    pointerEvents: "none",
    zIndex: 10,
  };

  // Corner mark: two lines forming an L-shape
  const Corner = ({ top, bottom, left, right, flipX, flipY }) => (
    <Box
      sx={{
        position: "absolute",
        width: "clamp(32px, 3.5vw, 56px)",
        height: "clamp(32px, 3.5vw, 56px)",
        top,
        bottom,
        left,
        right,
        zIndex: 10,
        pointerEvents: "none",
        transform: `scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})`,
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "1.5px",
          background: "rgba(255,255,255,0.55)",
        },
        "&::after": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          width: "1.5px",
          height: "100%",
          background: "rgba(255,255,255,0.55)",
        },
      }}
    />
  );

  return (
    <>
      {/* Horizontal lines */}
      <Box sx={{ ...lineStyle, top: "7%" }} />
      <Box sx={{ ...lineStyle, bottom: "7%" }} />

      {/* Corner marks */}
      <Corner top="5%"    left="3.5%"  />
      <Corner top="5%"    right="3.5%" flipX />
      <Corner bottom="5%" left="3.5%"  flipY />
      <Corner bottom="5%" right="3.5%" flipX flipY />

      {/* Badge — dots + text below the bottom line */}
      <Box
        sx={{
          position: "absolute",
          bottom: "2.5%",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "5px",
          opacity: 0.85,
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}
      >
        {/* Three dots */}
        <Box sx={{ display: "flex", gap: "6px" }}>
          {[0, 1, 2].map((i) => (
            <Box
              key={i}
              sx={{
                width: "clamp(5px, 0.45vw, 7px)",
                height: "clamp(5px, 0.45vw, 7px)",
                borderRadius: "50%",
                bgcolor: "rgba(255,255,255,0.45)",
              }}
            />
          ))}
        </Box>

        {/* Badge text */}
        <Typography
          sx={{
            fontSize: "clamp(0.85rem, 1.4vw, 1.4rem)",
            letterSpacing: "0.4em",
            color: "rgba(255,255,255,0.72)",
            textTransform: "uppercase",
            fontWeight: 500,
          }}
        >
          {badgeText}
        </Typography>
      </Box>
    </>
  );
}
