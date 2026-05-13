"use client";
import { Box } from "@mui/material";

export default function FooterBigScreen() {
  return (
    <Box
      // This must sit inside a parent with `position: relative`
      sx={{
        position: "absolute",
        bottom: 0,
        left: 0,
        width: "100vw",      // span full viewport width
        height: "100%",     // adjust to the max height of your images
        pointerEvents: "none",
        zIndex: 1,           // behind your main content
      }}
    >
      {/* background covers entire footer */}
      <Box
        component="img"
        src="/bg2.png"
        alt="Background"
        sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",  // cover to fill width without distortion
          zIndex: 0,
        }}
      />

      {/* trees on top of bg */}
      <Box
        component="img"
        src="/treesBottom.gif"
        alt="Trees"
        sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          height: "250px",
          objectFit: "contain", // ensures the trees keep their aspect
          zIndex: 2,
        }}
      />
    </Box>
  );
}
