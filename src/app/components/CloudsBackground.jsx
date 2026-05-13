"use client";
import { useEffect, useRef } from "react";
import { Box } from "@mui/material";

export default function CloudsBackground() {
  const vantaRef = useRef(null);
  const vantaEffect = useRef(null);

  useEffect(() => {
    let canceled = false;

    async function loadVanta() {
      const VANTA = await import("vanta/dist/vanta.clouds2.min");
      const THREE = await import("three");

      if (!canceled) {
        vantaEffect.current = VANTA.default({
          el: vantaRef.current,
          THREE: THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.00,
          minWidth: 200.00,
          scale: 1.00,
          backgroundColor: 0xffffff,
          skyColor: 0x9adcfc,
          cloudColor: 0xb7d2e1,
          texturePath: "/noise.png"
        });
      }
    }

    loadVanta();

    return () => {
      canceled = true;
      if (vantaEffect.current) vantaEffect.current.destroy();
    };
  }, []);

  return (
    <Box
      ref={vantaRef}
      sx={{
        position: "absolute",
        top: "-15vh",
        left: 0,
        width: "100%",
        height: "110%",
        zIndex: -10,
      }}
    />
  );
}
