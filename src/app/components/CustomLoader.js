"use client";
import React from "react";
import { Box } from "@mui/material";
import { motion } from "framer-motion";

export default function LoadingBars() {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "15px",
      }}
    >
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          style={{
            width: "20px",
            height: "60px",
            background: "linear-gradient(45deg, #00ffcc, #0088ff)",
            borderRadius: "8px",
          }}
          initial={{ y: 0 }}
          animate={{
            y: [0, -30, 0],
            transition: {
              duration: 1,
              repeat: Infinity,
              repeatType: "mirror",
              ease: "easeInOut",
              delay: index * 0.2,
            },
          }}
        />
      ))}
    </Box>
  );
}
