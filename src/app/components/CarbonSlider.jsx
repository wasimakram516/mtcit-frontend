"use client";
import { useRef, useEffect, useState } from "react";
import { Box } from "@mui/material";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

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

const CarbonSlider = ({ value = 100, onChange }) => {
  const trackRef = useRef(null);
  const [trackWidth, setTrackWidth] = useState(300);

  const x = useMotionValue(value);

  useEffect(() => {
    animate(x, value, { duration: 0.2 });
  }, [value]);

  useEffect(() => {
    if (trackRef.current) {
      setTrackWidth(trackRef.current.offsetWidth);
    }
  }, []);

  const xPercent = useTransform(x, (v) => `${v}%`);
  const pixelLeft = useTransform(x, (v) => {
    const maxOffset = trackWidth - 20;
    return `${(v / 100) * maxOffset}px`;
  });

  // Dynamically derive color using the same logic
  const fillColor = useTransform(x, (v) => getCarbonColor(v));

  const updateFromPosition = (clientX) => {
    const rect = trackRef.current.getBoundingClientRect();
    const relX = clientX - rect.left;
    const percent = clamp((relX / rect.width) * 100, 0, 100);
    x.set(percent);
    onChange?.(Math.round(percent));
  };

  return (
    <Box
      ref={trackRef}
      sx={{
        width: 300,
        height: 60,
        borderRadius: 25,
        backgroundColor: "#fff",
        position: "relative",
        overflow: "hidden",
        boxShadow: "inset 0 0 8px rgba(0,0,0,0.2)",
        cursor: "pointer",
        userSelect: "none",
      }}
      onClick={(e) => updateFromPosition(e.clientX)}
      onMouseMove={(e) => {
        if (e.buttons === 1) updateFromPosition(e.clientX);
      }}
    >
      {/* Dynamic Fill */}
      <motion.div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: "100%",
          width: xPercent,
          backgroundColor: fillColor,
          borderRadius: "inherit",
        }}
      />

      {/* Hidden Thumb */}
      <motion.div
        drag="x"
        dragConstraints={trackRef}
        dragElastic={0}
        style={{
          position: "absolute",
          top: "50%",
          left: pixelLeft,
          width: 20,
          height: 20,
          borderRadius: "50%",
          backgroundColor: "#fff",
          border: "2px solid #333",
          transform: "translateY(-50%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
          opacity: 0,
          boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
        }}
        onDrag={(e, info) => updateFromPosition(info.point.x)}
        whileTap={{ scale: 1.2 }}
      />
    </Box>
  );
};

export default CarbonSlider;
