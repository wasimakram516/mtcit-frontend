"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Typography } from "@mui/material";
import { normalizeSlidesForPlayback, pickSlideSource, pickDisplayTitle } from "@/utils/backgroundSlides";

const IMAGE_DURATION_MS = 30000;

/**
 * Full-bleed sequential background player.
 * Videos play to completion; images/GIFs hold for ~30s. Order = sequence (not z-index stack).
 */
export default function BackgroundSlideshow({
  slides = [],
  language = "en",
  imageDurationMs = IMAGE_DURATION_MS,
  sx = {},
}) {
  const ordered = useMemo(() => normalizeSlidesForPlayback(slides), [slides]);
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);
  const videoRef = useRef(null);

  const goNext = useCallback(() => {
    if (ordered.length <= 1) return;
    setIndex((i) => (i + 1) % ordered.length);
  }, [ordered.length]);

  useEffect(() => {
    setIndex(0);
  }, [ordered]);

  const current = ordered.length ? ordered[index % ordered.length] : null;
  const { src, type } = pickSlideSource(current, language);
  const isVideo = type === "video" && src;

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!current || !src || isVideo) return undefined;

    timerRef.current = setTimeout(goNext, imageDurationMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [current, src, isVideo, index, goNext, imageDurationMs]);

  if (!current || !src) {
    return (
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(135deg, #07280B 0%, #1C932D 52%, #390042 100%)",
          ...sx,
        }}
      />
    );
  }

  const opacity = current.opacity ?? 1;
  const dark = current.darkOverlay ?? 0;
  const light = current.lightOverlay ?? 0;
  const title = pickDisplayTitle(current.displayTitle, language);
  const titlePos = current.titlePosition || { x: 50, y: 50 };
  const titleFontPx = Math.max(24, Math.min(120, Number(current.titleFontSize ?? 56)));

  return (
    <Box sx={{ position: "absolute", inset: 0, overflow: "hidden", bgcolor: "#000", ...sx }}>
      {isVideo ? (
        <Box
          key={`${src}-${index}`}
          component="video"
          ref={videoRef}
          src={src}
          autoPlay
          muted
          loop={ordered.length <= 1}
          playsInline
          onEnded={goNext}
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity,
          }}
        />
      ) : (
        <Box
          key={`${src}-${index}`}
          component="img"
          src={src}
          alt=""
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity,
          }}
        />
      )}

      {dark > 0 && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            bgcolor: `rgba(0,0,0,${dark})`,
            pointerEvents: "none",
            zIndex: 2,
          }}
        />
      )}

      {light > 0 && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            bgcolor: `rgba(255,255,255,${light})`,
            pointerEvents: "none",
            zIndex: 3,
          }}
        />
      )}

      {title ? (
        <Typography
          sx={{
            position: "absolute",
            left: `${titlePos.x ?? 50}%`,
            top: `${titlePos.y ?? 50}%`,
            transform: "translate(-50%, -50%)",
            zIndex: 10,
            color: "#F8FCF6",
            fontWeight: 700,
            fontSize: `clamp(${Math.round(titleFontPx * 0.75)}px, ${(titleFontPx / 1920) * 100}vw, ${Math.round(
              titleFontPx * 1.18
            )}px)`,
            textAlign: "center",
            textShadow: "0 2px 12px rgba(0,0,0,0.65)",
            px: 2,
            maxWidth: "min(90%, 720px)",
            pointerEvents: "none",
          }}
        >
          {title}
        </Typography>
      ) : null}
    </Box>
  );
}
