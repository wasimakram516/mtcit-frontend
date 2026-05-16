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
        width: "clamp(24px, 2.5vw, 42px)",
        height: "clamp(24px, 2.5vw, 42px)",
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
          opacity: 0.65,
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
                width: "clamp(3px, 0.3vw, 5px)",
                height: "clamp(3px, 0.3vw, 5px)",
                borderRadius: "50%",
                bgcolor: "rgba(255,255,255,0.45)",
              }}
            />
          ))}
        </Box>

        {/* Badge text */}
        <Typography
          sx={{
            fontSize: "clamp(0.55rem, 0.9vw, 0.85rem)",
            letterSpacing: "0.45em",
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
