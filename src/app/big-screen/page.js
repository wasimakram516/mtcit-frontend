"use client";
import { useRouter } from "next/navigation";
import { Box, Typography, IconButton } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import useWebSocketBigScreen from "@/hooks/useWebSocketBigScreen";
import { FourSquare } from "react-loading-indicators";
import { motion } from "framer-motion";
import CloudsBackground from "@/app/components/CloudsBackground";
import DynamicBackground from "../components/DynamicBackground";

/** Layer X/Y/size are 0–100% of the media-stage box; keep rect inside so nothing spills past that frame. */
function getMediaLayerRect(position, size) {
  const x = Math.min(100, Math.max(0, Number(position?.x) || 0));
  const y = Math.min(100, Math.max(0, Number(position?.y) || 0));
  const rawW = Math.min(100, Math.max(0, Number(size?.width) || 100));
  const rawH = Math.min(100, Math.max(0, Number(size?.height) || 100));
  const width = Math.min(rawW, 100 - x);
  const height = Math.min(rawH, 100 - y);
  return { x, y, width, height };
}

export default function BigScreenPage() {
  const router = useRouter();
  const {
    currentMedia,
    isLoading,
    currentLanguage,
    allMedia,
    carbonActive,
    carbonLevel,
    categoryTree,
  } = useWebSocketBigScreen();

  /** Full-stage loader while controller is changing category (isLoading true). Slug-only updates set isLoading false without flashing this. */
  const showBlockingLoader = isLoading;

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

  // Build category display from categoryPath with proper names from categoryTree
  // (Kept for future use but not displayed)
  const getCategoryDisplay = () => {
    if (currentMedia?.categoryPath && currentMedia.categoryPath.length > 0 && categoryTree) {
      const nodeMap = {};
      const traverse = (node) => {
        nodeMap[node._id] = node;
        if (node.children) node.children.forEach(traverse);
      };
      categoryTree.forEach(traverse);
      const names = currentMedia.categoryPath
        .map(id => nodeMap[id]?.name?.en || '?')
        .filter(Boolean);
      return names.join(' / ');
    }
    return "";
  };

  const currentMediaLayers = [...(currentMedia?.layers || [])].sort(
    (first, second) => (first.zIndex || 0) - (second.zIndex || 0)
  );

  const stageAspectRatio = "7 / 3";
  const stageWidth = "min(98vw, calc(92vh * 7 / 3))";
  const stageRadius = "clamp(20px, 2vw, 48px)";
  const stagePadding = "clamp(12px, 1.6vw, 32px)";
  const logoSize = "clamp(72px, 5vw, 160px)";
  const mediaMaxWidth = "clamp(420px, 72vw, 2200px)";
  const mediaMaxHeight = "clamp(260px, 52vh, 1400px)";
  const coverMaxHeight = "clamp(240px, 72vh, 1500px)";
  const titleSize = "clamp(1.75rem, 2.4vw, 4rem)";
  const subtitleSize = "clamp(1.2rem, 1.8vw, 3rem)";

  /** Stacking inside the 90% stage: background lowest, media stack mid, logo on top. */
  const zStageFallbackBg = 0;
  const zStageMediaBgLayers = 1;
  const zStageForeground = 10;
  const zStagePinpoint = 100;

  return (
    <Box
      sx={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        display: "flex",
        overflow: "hidden",
      }}
    >
      {/* Full-Screen Base Layer (Vanta Clouds) */}
      <CloudsBackground />

      {/* 90% Centered Viewport for Custom Backgrounds & Media */}
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: stageWidth,
          aspectRatio: stageAspectRatio,
          maxHeight: "92vh",
          maxWidth: "98vw",
          zIndex: 1,
          overflow: "hidden",
          borderRadius: stageRadius,
          pointerEvents: "none",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          boxSizing: "border-box",
        }}
      >
        {/* Global Custom Background Fallback / Carbon Mode — bottom of stage stack */}
        {(carbonActive || !currentMedia || currentMediaLayers.length === 0) && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              zIndex: zStageFallbackBg,
            }}
          >
            <DynamicBackground language={currentLanguage} />
          </Box>
        )}

        {/* Media-Specific Background Layers — above fallback, below foreground */}
        {!carbonActive && currentMedia && currentMediaLayers.length > 0 && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex: zStageMediaBgLayers,
              backgroundColor: "#fff",
            }}
          >
            {currentMediaLayers.map((layer, index) => {
              const isAr = currentLanguage === "ar";
              const prefObj = isAr ? layer.fileAr : layer.fileEn;
              const prefUrl = prefObj?.url;

              const fallbackObj = isAr ? layer.fileEn : layer.fileAr;
              const fallbackUrl = fallbackObj?.url;

              let src = null;
              let type = "image";

              if (prefUrl) {
                src = prefUrl;
                type = prefObj?.type || (isAr ? layer.typeAr : layer.typeEn) || layer.type || "image";
              } else if (fallbackUrl) {
                src = fallbackUrl;
                type = fallbackObj?.type || (isAr ? layer.typeEn : layer.typeAr) || layer.type || "image";
              }

              if (!src) return null;

              return (
                <Box
                  key={`${src}-${index}`}
                  component={type === "video" ? "video" : "img"}
                  src={src}
                  autoPlay={type === "video"}
                  muted={type === "video"}
                  loop={type === "video"}
                  alt={`Media Layer ${index + 1}`}
                  sx={{
                    position: "absolute",
                    top: `${layer.position?.y || 0}%`,
                    left: `${layer.position?.x || 0}%`,
                    width: `clamp(220px, ${layer.size?.width || 100}%, 2200px)`,
                    height: `clamp(160px, ${layer.size?.height || 100}%, 1400px)`,
                    objectFit: "cover",
                    opacity: layer.opacity ?? 1,
                    transform: `rotate(${layer.rotation || 0}deg)`,
                    zIndex: layer.zIndex ?? index + 1,
                  }}
                />
              );
            })}
          </Box>
        )}
        
        {/* Main Content Area (Now inside the 90% centered boundary) */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: zStageForeground,
            pointerEvents: "auto", // Allow interactions inside the viewport
          }}
        >
        {carbonActive && (
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "100%",
              borderRadius: stageRadius,
              backgroundColor: "rgba(255,255,255,0.9)",
              boxShadow: "0 0 30px rgba(0,0,0,0.4)",
              padding: stagePadding,
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
                fontSize: titleSize,
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
                  width: "min(100%, 1800px)",
                  height: "auto",
                  objectFit: "contain",
                  borderRadius: "clamp(12px, 1vw, 24px)",
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
                fontSize: subtitleSize,
              }}
            >
              {translations[currentLanguage]?.subtitle ||
                translations.en.subtitle}
            </Typography>
          </Box>
        )}

        {/* Centered Content Area (90%) */}
        <Box
          sx={{
            flex: "1 1 auto",
            width: "100%",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >


          {showBlockingLoader && (
            <Box sx={{ zIndex: 2 }}>
              <FourSquare
                color={["#32cd32", "#96D8EA", "#cd32cd", "#cd8032"]}
                size="large"
              />
            </Box>
          )}

          {/* Idle cover — shown when no media is selected */}
          {!showBlockingLoader && !currentMedia && (
            <Box sx={{ position: "relative", width: "100%", height: "90%" }}>
              <Box
                component="img"
                src={currentLanguage === "en" ? "/CoverEn.gif" : "/CoverAr.gif"}
                alt="Display Image"
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  maxHeight: coverMaxHeight,
                }}
              />
            </Box>
          )}

          {/* 70% centered media content layers container (above background, below pinpoint) */}
          {currentMedia && (() => {
            const mediaLayerList = [...(currentMedia.mediaLayers || [])].sort(
              (a, b) => (a.zIndex || 0) - (b.zIndex || 0)
            );

            if (mediaLayerList.length === 0) return null;

            return (
              <Box
                sx={{
                  position: "relative",
                  width: "70%",
                  height: "70%", // Needs height so absolute children don't collapse
                  maxWidth: "clamp(320px, 70%, 1800px)",
                  flexShrink: 0,
                  overflow: "hidden",
                  borderRadius: stageRadius,
                  boxSizing: "border-box",
                }}
              >
                {/* 100% × 100% of the media frame — all layer % are relative to this box only */}
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                  }}
                >
                  {/* Media content layers */}
                  {mediaLayerList.map((layer, index) => {
                    const isAr = currentLanguage === "ar";
                    const prefObj = isAr ? layer.fileAr : layer.fileEn;
                    const prefUrl = prefObj?.url;

                    const fallbackObj = isAr ? layer.fileEn : layer.fileAr;
                    const fallbackUrl = fallbackObj?.url;

                    let src = null;
                    let type = "image";

                    if (prefUrl) {
                      src = prefUrl;
                      type = prefObj?.type || (isAr ? layer.typeAr : layer.typeEn) || layer.type || "image";
                    } else if (fallbackUrl) {
                      src = fallbackUrl;
                      type = fallbackObj?.type || (isAr ? layer.typeEn : layer.typeAr) || layer.type || "image";
                    }

                    if (!src || layer.isActive === false) return null;

                    const { x: posX, y: posY, width: sizeW, height: sizeH } = getMediaLayerRect(
                      layer.position,
                      layer.size
                    );

                    return (
                      <Box
                        key={`ml-${src}-${index}`}
                        component={type === "video" ? "video" : "img"}
                        src={src}
                        autoPlay={type === "video" || undefined}
                        muted={type === "video" || undefined}
                        loop={type === "video" || undefined}
                        playsInline={type === "video" || undefined}
                        alt={type !== "video" ? `Media Layer ${index + 1}` : undefined}
                        sx={{
                          position: "absolute",
                          top: `${posY}%`,
                          left: `${posX}%`,
                          width: `${sizeW}%`,
                          height: `${sizeH}%`,
                          maxWidth: "100%",
                          maxHeight: "100%",
                          boxSizing: "border-box",
                          objectFit: "contain",
                          objectPosition: "center",
                          opacity: layer.opacity ?? 1,
                          transform: `rotate(${layer.rotation || 0}deg)`,
                          transformOrigin: "center center",
                          zIndex: layer.zIndex ?? index + 1,
                          borderRadius: stageRadius,
                          boxShadow: index === 0 ? "0 20px 50px rgba(0,0,0,0.3)" : "none",
                        }}
                      />
                    );
                  })}
                </Box>
              </Box>
            );
          })()}
        </Box>

        {/* Logo / pinpoint — full 90% stage; X/Y are 0–100% of entire stage; above media & backgrounds */}
        {currentMedia?.pinpoint?.file?.url &&
          !carbonActive && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                zIndex: zStagePinpoint,
              }}
            >
              <motion.img
                src={currentMedia.pinpoint.file.url}
                alt="Logo"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                  position: "absolute",
                  top: `${currentMedia.pinpoint.position?.y || 0}%`,
                  left: `${currentMedia.pinpoint.position?.x || 0}%`,
                  transform: "translate(-50%, -50%)",
                  width: logoSize,
                  height: "auto",
                  filter: "drop-shadow(0 0 10px rgba(255,255,255,0.8))",
                }}
              />
            </Box>
          )}

        </Box>
      </Box>
    </Box>
  );
}
