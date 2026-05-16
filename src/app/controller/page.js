"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Box, Typography, Button, Slider, Stack, Chip } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckIcon from "@mui/icons-material/Check";
import { AnimatePresence, motion } from "framer-motion";
import useWebSocketController from "@/hooks/useWebSocketController";
import LanguageSelector from "@/app/components/LanguageSelector";
import { useLanguage } from "../context/LanguageContext";
import MapEmbedExperience from "@/app/components/MapEmbedExperience";

export default function Controller() {
  const {
    sendCategorySelection,
    sendLanguageChange,
    categoryOptions,
    categoryTree,
    sendCarbonMode,
    connected,
    displayMedia,
    leafMedia,
    currentExperience,
    currentExperienceState,
    sendExperienceState,
    sendSelectMedia,
    bigScreenReady,
    setBigScreenReady,
  } = useWebSocketController();
  const { language } = useLanguage();
  const languageRef = useRef(language);
  languageRef.current = language;

  const [openCategory, setOpenCategory] = useState(null);
  const [selected, setSelected] = useState({ category: "", subcategory: "" });
  const [selectedPath, setSelectedPath] = useState([]);
  const [openCategoryNode, setOpenCategoryNode] = useState(null);
  const [selectedLeafId, setSelectedLeafId] = useState(null);
  const [selectedMediaSlug, setSelectedMediaSlug] = useState(null);
  const [mediaForLeaf, setMediaForLeaf] = useState(null);
  const [pendingNodeId, setPendingNodeId] = useState(null);
  const [pendingSlug, setPendingSlug] = useState(null);
  const [pendingRect, setPendingRect] = useState(null);

  const capturePendingRect = (e) => {
    const el = e?.currentTarget || e?.target;
    if (el) setPendingRect(el.getBoundingClientRect());
  };

  const isArabic = language === "ar";

  const getNodeLabel = (node) => {
    if (!node) return "";
    return isArabic ? node.name?.ar || node.name?.en || node._id : node.name?.en || node.name?.ar || node._id;
  };

  const findPathToNode = (tree, targetId, path = []) => {
    for (const node of tree) {
      const newPath = [...path, String(node._id)];
      if (String(node._id) === String(targetId)) return newPath;
      if (node.children && node.children.length) {
        const found = findPathToNode(node.children, targetId, newPath);
        if (found) return found;
      }
    }
    return null;
  };

  const findNodeById = (tree, id) => {
    for (const node of tree) {
      if (String(node._id) === String(id)) return node;
      if (node.children && node.children.length) {
        const found = findNodeById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const getCategoryExperienceType = (node) => {
    if (node?.metadata?.strategyForecast?.enabled) return "strategy-forecast";
    if (node?.metadata?.electricVehicles?.enabled) return "electric-vehicles";
    if (node?.metadata?.mapEmbed?.enabled) return "map-embed";
    return null;
  };

  const isExperienceNode = (node) => Boolean(getCategoryExperienceType(node));

  const getExperienceShellWidth = (experienceType) =>
    experienceType === "map-embed" ? "min(90vw, 1440px)" : "min(92vw, 1040px)";

  const resetToRoot = useCallback(() => {
    setOpenCategory(null);
    setSelected({ category: "", subcategory: "" });
    setSelectedPath([]);
    setOpenCategoryNode(null);
    setSelectedLeafId(null);
    setSelectedMediaSlug(null);
    setMediaForLeaf(null);
    setPendingNodeId(null);
    setPendingSlug(null);
    setPendingRect(null);
    sendCategorySelection("", "", languageRef.current);
  }, [sendCategorySelection]);

  const renderExperienceComponent = (experienceType, state, isInteractive = true) => {
    if (isInteractive) {
      if (experienceType === "strategy-forecast") {
        const progress = Math.max(
          0,
          Math.min(100, Number(state?.progress ?? currentExperience?.config?.defaultProgress ?? 0) || 0)
        );
        const year = Math.round(2030 + (20 * progress) / 100);
        return (
          <Box
            sx={{
              width: "min(92vw, 760px)",
              mx: "auto",
              p: { xs: 3, md: 4 },
              borderRadius: "28px",
              border: "1px solid rgba(248,252,246,0.14)",
              background:
                "linear-gradient(180deg, rgba(14,36,20,0.72) 0%, rgba(40,16,58,0.62) 100%)",
              boxShadow: "0 25px 55px rgba(0,0,0,0.28)",
              backdropFilter: "blur(12px)",
            }}
          >
            <Stack spacing={3}>
              <Box>
                <Typography
                  sx={{
                    color: "#F8FCF6",
                    fontWeight: 700,
                    fontSize: "clamp(1.6rem, 3vw, 2.4rem)",

                    textShadow: "0 8px 24px rgba(0,0,0,0.32)",
                  }}
                >
                  {isArabic ? "التحكم في التوقعات الاستراتيجية" : "Strategy Forecast Control"}
                </Typography>
                <Typography
                  sx={{
                    mt: 0.75,
                    color: "rgba(248,252,246,0.78)",
                    fontSize: "clamp(0.95rem, 1.4vw, 1.05rem)",
                  }}
                >
                  {isArabic
                    ? "حرّك المؤشر لتحديث العرض الرئيسي على الشاشة الكبيرة."
                    : "Move the slider to update the live output on the big screen."}
                </Typography>
              </Box>

              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Chip
                  label={isArabic ? `السنة ${year}` : `Year ${year}`}
                  sx={{
                    bgcolor: "rgba(67,180,85,0.18)",
                    color: "#F8FCF6",
                    border: "1px solid rgba(67,180,85,0.4)",
                    fontWeight: 700,
                  }}
                />
                <Typography sx={{ color: "#8DF0C7", fontWeight: 700, fontSize: "clamp(1rem, 1.8vw, 1.25rem)" }}>
                  {progress}%
                </Typography>
              </Stack>

              <Stack direction="row" alignItems="center" spacing={2} dir="ltr">
                <Typography variant="caption" sx={{ color: "rgba(248,252,246,0.82)", minWidth: 40 }}>
                  2030
                </Typography>
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={progress}
                  onChange={(_, value) =>
                    sendExperienceState("strategy-forecast", {
                      progress: Array.isArray(value) ? value[0] : value,
                    })
                  }
                  aria-label="strategy forecast controller slider"
                  sx={{
                    color: "#1D9E75",
                    "& .MuiSlider-thumb": { width: 20, height: 20 },
                    "& .MuiSlider-track": { border: "none" },
                    "& .MuiSlider-rail": { bgcolor: "rgba(255,255,255,0.22)" },
                  }}
                />
                <Typography variant="caption" sx={{ color: "rgba(248,252,246,0.82)", minWidth: 40 }}>
                  2050
                </Typography>
              </Stack>
            </Stack>
          </Box>
        );
      }

      if (experienceType === "electric-vehicles") {
        const yearIndex = Math.max(
          0,
          Math.min(9, Math.round(Number(state?.yearIndex ?? currentExperience?.config?.defaultYearIndex ?? 9) || 0))
        );
        const selectedYear = 2017 + yearIndex;
        return (
          <Box
            sx={{
              width: "min(92vw, 760px)",
              mx: "auto",
              p: { xs: 3, md: 4 },
              borderRadius: "28px",
              border: "1px solid rgba(248,252,246,0.14)",
              background:
                "linear-gradient(180deg, rgba(14,36,20,0.72) 0%, rgba(12,64,37,0.62) 100%)",
              boxShadow: "0 25px 55px rgba(0,0,0,0.28)",
              backdropFilter: "blur(12px)",
            }}
          >
            <Stack spacing={3}>
              <Box>
                <Typography
                  sx={{
                    color: "#F8FCF6",
                    fontWeight: 700,
                    fontSize: "clamp(1.6rem, 3vw, 2.4rem)",

                    textShadow: "0 8px 24px rgba(0,0,0,0.32)",
                  }}
                >
                  {isArabic ? "التحكم في المركبات الكهربائية" : "Electric Vehicles Control"}
                </Typography>
                <Typography
                  sx={{
                    mt: 0.75,
                    color: "rgba(248,252,246,0.78)",
                    fontSize: "clamp(0.95rem, 1.4vw, 1.05rem)",
                  }}
                >
                  {isArabic
                    ? "اختر السنة لتحديث خريطة النمو والإحصاءات على الشاشة الكبيرة."
                    : "Choose the year to update the growth map and stats on the big screen."}
                </Typography>
              </Box>

              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Chip
                  label={isArabic ? `السنة ${selectedYear}` : `Year ${selectedYear}`}
                  sx={{
                    bgcolor: "rgba(67,180,85,0.18)",
                    color: "#F8FCF6",
                    border: "1px solid rgba(67,180,85,0.4)",
                    fontWeight: 700,
                  }}
                />
                <Typography sx={{ color: "#8DF0C7", fontWeight: 700, fontSize: "clamp(1rem, 1.8vw, 1.25rem)" }}>
                  {selectedYear}
                </Typography>
              </Stack>

              <Stack direction="row" alignItems="center" spacing={2} dir="ltr">
                <Typography variant="caption" sx={{ color: "rgba(248,252,246,0.82)", minWidth: 40 }}>
                  2017
                </Typography>
                <Slider
                  min={0}
                  max={9}
                  step={1}
                  value={yearIndex}
                  onChange={(_, value) =>
                    sendExperienceState("electric-vehicles", {
                      yearIndex: Array.isArray(value) ? value[0] : value,
                    })
                  }
                  aria-label="electric vehicles controller slider"
                  sx={{
                    color: "#1D9E75",
                    "& .MuiSlider-thumb": { width: 20, height: 20 },
                    "& .MuiSlider-track": { border: "none" },
                    "& .MuiSlider-rail": { bgcolor: "rgba(255,255,255,0.22)" },
                  }}
                />
                <Typography variant="caption" sx={{ color: "rgba(248,252,246,0.82)", minWidth: 40 }}>
                  2026
                </Typography>
              </Stack>
            </Stack>
          </Box>
        );
      }

      if (experienceType === "map-embed") {
        return (
          <MapEmbedExperience
            language={language}
            interactive
            embedUrl={currentExperience?.config?.embedUrl || ""}
            qrImageUrl={currentExperience?.config?.qrImageUrl || ""} 
            qrImageUrlEn={currentExperience?.config?.qrImageUrlEn || ""}
            qrImageUrlAr={currentExperience?.config?.qrImageUrlAr || ""}
            qrPosition={currentExperience?.config?.qrPosition}
            qrSize={currentExperience?.config?.qrSize}
          />
        );
      }
    }

    if (experienceType === "strategy-forecast") {
      return null;
    }

    if (experienceType === "electric-vehicles") {
      return null;
    }

    if (experienceType === "map-embed") {
      return null;
    }

    return null;
  };

  useEffect(() => {
    if (connected) {
      sendCarbonMode(false, 0);
    }
  }, [connected, sendCarbonMode]);

  const hasControllerSelection =
    Boolean(selected.category) ||
    Boolean(selected.subcategory) ||
    selectedPath.length > 0 ||
    Boolean(openCategory) ||
    Boolean(openCategoryNode) ||
    Boolean(selectedLeafId) ||
    Boolean(selectedMediaSlug) ||
    Boolean(currentExperience?.type);

  useEffect(() => {
    if (!hasControllerSelection) return;

    const timer = setTimeout(() => {
      resetToRoot();
    }, 90000);

    return () => clearTimeout(timer);
  }, [hasControllerSelection, resetToRoot]);

  useEffect(() => {
    if (selectedPath.length) {
      sendCategorySelection(null, null, languageRef.current, selectedPath);
    } else if (selected.category || selected.subcategory) {
      sendCategorySelection(selected.category, selected.subcategory, languageRef.current);
    }
  }, [selected.category, selected.subcategory, selectedPath, sendCategorySelection]);

  useEffect(() => {
    sendLanguageChange(language);
  }, [language, sendLanguageChange]);

  const isAnyPending = Boolean(pendingNodeId || pendingSlug);

  // Clear pending ring only when big screen confirms media has fully loaded
  useEffect(() => {
    if (!bigScreenReady) return;
    setPendingNodeId(null);
    setPendingSlug(null);
    setPendingRect(null);
    setBigScreenReady(false); // reset for next selection
  }, [bigScreenReady, setBigScreenReady]);

  // Safety timeout — clear after 5s no matter what (no media / no config on node)
  useEffect(() => {
    if (!isAnyPending) return;
    const t = setTimeout(() => { setPendingNodeId(null); setPendingSlug(null); setPendingRect(null); }, 5000);
    return () => clearTimeout(t);
  }, [isAnyPending]);

  const pageEase = [0.32, 0, 0.18, 1];
  const pageTransition = { duration: 0.35, ease: pageEase };

  /** Default = transparent (page bg shows through); active = original green gradient. */
  const bubbleActiveBackground =
    "linear-gradient(145deg, #1C932D 0%, #43B455 52%, #390042 100%)";
  const bubbleDefaultShadow = `
    0 0 0 1px rgba(248, 252, 246, 0.28),
    0 0 0 1px rgba(7, 40, 11, 0.2) inset,
    inset 0 1px 0 rgba(255, 255, 255, 0.16),
    inset 0 -1px 0 rgba(0, 0, 0, 0.18),
    0 18px 42px rgba(0, 0, 0, 0.45),
    0 6px 16px rgba(0, 0, 0, 0.28)
  `;
  const bubbleActiveShadow =
    "0 0 0 1px rgba(248, 252, 246, 0.22), 0 0 28px rgba(28, 147, 45, 0.55)";

  const getBubbleSx = (isActive, overrides = {}) => ({ position: "relative",
    width: "clamp(9rem, 40vw, 14rem)",
    height: "clamp(9rem, 40vw, 14rem)",
    borderRadius: "1.5rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: "clamp(1.1rem, 4vw, 1.75rem)",
    padding: "0.5rem",
    userSelect: "none",
    textTransform: "none",
    transition: "box-shadow 0.2s ease, background 0.2s ease, border-color 0.2s ease",
    border: isActive
      ? "1.5px solid rgba(248, 252, 246, 0.2)"
      : "1.5px solid rgba(248, 252, 246, 0.38)",
    color: "#F8FCF6",
    background: isActive ? bubbleActiveBackground : "transparent",
    boxShadow: isActive ? bubbleActiveShadow : bubbleDefaultShadow,
    ...overrides,
  });

  const translations = {
    en: {
      instruction: "Tap a category to explore its contents",
      back: "Back",
      carbonFootprint: "Carbon Footprint",
      chooseMedia: "Choose media",
      noMediaForCategory: "No media configured for this category yet.",
      roadmapHeading: "Zero Neutrality Roadmap",
    },
    ar: {
      instruction: "اضغط على الفئة لاستكشاف محتوياتها",
      back: "رجوع",
      carbonFootprint: "البصمة الكربونية",
      chooseMedia: "اختر الوسائط",
      noMediaForCategory: "لا توجد وسائط مضبوطة لهذه الفئة بعد.",
      roadmapHeading: "خارطة طريق الحياد الصفري",
    },
  };

  const handleCategoryClick = (category, subcategories, nodeId = null) => {
    if (categoryTree && nodeId) {
      const node = findNodeById(categoryTree, nodeId);
      if (!node) return;
      const path = findPathToNode(categoryTree, nodeId) || [];

      if (isExperienceNode(node)) {
        setSelectedPath(path);
        setSelectedLeafId(nodeId); setPendingNodeId(nodeId);
        setSelected({ category: node.name?.en || "", subcategory: "" });
        sendCategorySelection(null, null, language, path);
        setOpenCategoryNode(node.children && node.children.length ? nodeId : null);
        return;
      }

      if (node.children && node.children.length) {
        setOpenCategoryNode(nodeId);
        setSelectedPath([]);
        setSelectedLeafId(null);
        setPendingNodeId(null); setPendingSlug(null); setPendingRect(null);
        setSelectedMediaSlug(null);
      } else {
        setSelectedPath(path);
        setSelectedLeafId(nodeId); setPendingNodeId(nodeId);
        setSelected({ category: node.name?.en || "", subcategory: "" });
        sendCategorySelection(null, null, language, path);
        setOpenCategoryNode(null);
      }
      return;
    }

    if (openCategory === category) {
      setOpenCategory(null);
      setSelected({ category: "", subcategory: "" });
      setSelectedLeafId(null);
      sendCategorySelection("", "", language);
    } else if (subcategories.length === 0) {
      if (selected.category === category && selected.subcategory === "") {
        setSelected({ category: "", subcategory: "" });
        setSelectedLeafId(null);
        sendCategorySelection("", "", language);
      } else {
        setSelected({ category, subcategory: "" });
        setSelectedLeafId(null);
        sendCategorySelection(category, "", language);
      }
      setOpenCategory(null);
    } else {
      setOpenCategory(category);
      setSelected({ category: "", subcategory: "" });
      setSelectedLeafId(null);
    }
  };

  const handleSubBubbleClick = (category, subcategory, nodeId = null) => {
    if (categoryTree && nodeId) {
      const node = findNodeById(categoryTree, nodeId);
      if (!node) return;
      const path = findPathToNode(categoryTree, nodeId) || [];

      if (isExperienceNode(node)) {
        setSelectedPath(path);
        setSelectedLeafId(nodeId); setPendingNodeId(nodeId);
        setSelected({ category: node?.name?.en || category, subcategory: "" });
        sendCategorySelection(null, null, language, path);
        return;
      }

      if (node.children && node.children.length) {
        setOpenCategoryNode(nodeId);
        setSelectedLeafId(null);
        setPendingNodeId(null); setPendingSlug(null); setPendingRect(null);
        return;
      }

      setSelectedPath(path);
      setSelectedLeafId(nodeId); setPendingNodeId(nodeId);
      setSelected({ category: node?.name?.en || category, subcategory: "" });
      sendCategorySelection(null, null, language, path);
      return;
    }

    if (selected.category === category && selected.subcategory === subcategory) {
      setSelected({ category: "", subcategory: "" });
      setSelectedLeafId(null);
      sendCategorySelection("", "", language);
      setOpenCategory(null);
    } else {
      setSelected({ category, subcategory });
      setSelectedLeafId(null);
      sendCategorySelection(category, subcategory, language);
    }
  };

  const displayCategories =
    categoryTree && Array.isArray(categoryTree)
       ? categoryTree.map((node) => ({
          id: node._id,
          label: getNodeLabel(node),
          icon: node.icon,
          children: (node.children || []).map((child) => ({
            id: child._id,
            label: getNodeLabel(child),
            icon: child.icon,
          })),
        }))
      : Object.entries(categoryOptions).map(([key, value]) => ({
          id: key,
          label: key,
          children: (value || []).map((item) => ({ id: null, label: item })),
        }));

  const rootExperienceActive =
    Boolean(currentExperience?.type) &&
    selectedLeafId &&
    categoryTree &&
    (() => {
      const selectedNode = findNodeById(categoryTree, selectedLeafId);
      return Boolean(selectedNode && !selectedNode.parent);
    })();

  return (
    <Box
      sx={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        overflowX: "hidden",
        overflowY: "auto",
        textAlign: "center",
      }}
    >
      {/* Header Backdrop for Smooth Scrolling Cutoff */}
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: { xs: "9rem", md: "12rem" },
          background: "linear-gradient(to bottom, #082110 30%, transparent 100%)",
          zIndex: 65,
          pointerEvents: "none",
        }}
      />

      {/* Top Left Language Selector */}
      <Box
        sx={{
          position: "fixed",
          top: { xs: "1rem", md: "2rem" },
          left: { xs: "1rem", md: "3rem" },
          zIndex: 100,
        }}
      >
        <LanguageSelector absolute={false} />
      </Box>

      {/* Top Left Forum Logo */}
      <Box
        component="img"
        src="/gulf-green-mobility-forum.png"
        alt="The Gulf Green Mobility Forum"
        sx={{
          position: "fixed",
          top: { xs: "1rem", md: "1.35rem" },
          left: { xs: "8rem", md: "14rem" },
          width: { xs: "7rem", md: "11rem" },
          height: "auto",
          zIndex: 100,
          objectFit: "contain",
          filter: "drop-shadow(0 8px 18px rgba(0,0,0,0.28))",
          pointerEvents: "none",
        }}
      />

      {/* Top Right Logo */}
      <Box
        component="img"
        src="/mtcit-logo.webp"
        sx={{
          position: "fixed",
          top: { xs: "1rem", md: "2rem" },
          right: { xs: "1rem", md: "2rem" },
          height: { xs: "3rem", md: "5rem" },
          zIndex: 100,
          objectFit: "contain",
        }}
      />
      {/* Background Gradients */}
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: 1,
          background: "linear-gradient(to bottom, #082110 0%, #351347 45%, #359845 100%)",
        }}
      />

      {/* Bottom Image: desktop mask layer */}
      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: "30vh",
          background: "linear-gradient(to top, rgba(93, 201, 108, 0.95) 0%, rgba(93, 201, 108, 0) 80%)",
          maskImage: "url('/MTCIT-omanCity.webp')",
          WebkitMaskImage: "url('/MTCIT-omanCity.webp')",
          maskSize: "100% auto",
          WebkitMaskSize: "100% auto",
          maskPosition: "bottom left",
          WebkitMaskPosition: "bottom left",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          display: { xs: "none", md: "block" },
          zIndex: 2,
        }}
      />
      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: "30vh",
          background: "linear-gradient(to top, rgba(93, 201, 108, 0.95) 0%, rgba(93, 201, 108, 0) 80%)",
          maskImage: "url('/MTCIT-omanCity.webp')",
          WebkitMaskImage: "url('/MTCIT-omanCity.webp')",
          maskMode: "luminance",
          WebkitMaskMode: "luminance",
          maskSize: "100% auto",
          WebkitMaskSize: "100% auto",
          maskPosition: "bottom center",
          WebkitMaskPosition: "bottom center",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          display: { xs: "block", md: "none" },
          zIndex: 2,
          pointerEvents: "none",
        }}
      />

      <AnimatePresence mode="sync" initial={false}>
      {!openCategoryNode ? (
        <motion.div
          key="root-nodes"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={pageTransition}
        >
        <Box sx={{ 
          zIndex: 3, 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          justifyContent: "center",
          width: "100%", 
          minHeight: "100vh",
          py: { xs: "6rem", md: "8rem" },
          position: "relative"
        }}>
          {!rootExperienceActive && (
            <Typography
              variant="h2"
              dir={isArabic ? "rtl" : "ltr"}
              sx={{
                color: "#ffffff",
                fontWeight: "bold",
                mb: { xs: "2rem", md: "4rem" },
                fontSize: { xs: "2rem", sm: "3rem", md: "3.75rem" },
                textAlign: "center",
                px: 2,

                textShadow: "2px 2px 4px rgba(0,0,0,0.5)"
              }}
            >
              {translations[language].roadmapHeading}
            </Typography>
          )}
          {rootExperienceActive ? (
            <>
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, ease: pageEase }} style={{ position: "fixed", top: "clamp(4rem, 7rem, 7rem)", left: "clamp(1rem, 3rem, 3rem)", zIndex: 70 }}>
              <Button
                variant="contained"
                onClick={resetToRoot}
                sx={{
                  backgroundColor: "rgba(248,252,246,0.92)",
                  color: "#07280B",
                  minWidth: 0,
                  width: 50,
                  height: 50,
                  borderRadius: "50%",
                  "&:hover": { backgroundColor: "rgba(248,252,246,1)" },
                }}
              >
                <ArrowBackIcon />
              </Button>
            </motion.div>
            <motion.div
              key={currentExperience?.type}
              initial={{ opacity: 0, y: 32, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, ease: pageEase }}
              style={{ width: getExperienceShellWidth(currentExperience?.type), marginTop: "1rem" }}
            >
              {renderExperienceComponent(currentExperience?.type, currentExperienceState, true)}
            </motion.div>
            </>
          ) : (
            <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: { xs: "1.5rem", md: "4rem" } }}>
          {displayCategories.map((cat, catIndex) => {
            const category = cat.label;
            const subcategories = (cat.children || []).map((child) => child.label);
            const isActiveMain = selected.category === category && !selected.subcategory;

            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, scale: 0.82, y: 20 }}
                animate={isActiveMain
                  ? { opacity: 1, scale: 1.08, y: -2 }
                  : { opacity: 1, scale: 1, y: 0 }}
                whileHover={{ scale: isActiveMain ? 1.08 : 1.06 }}
                whileTap={{ scale: 0.93 }}
                transition={{
                  opacity: { duration: 0.3, delay: catIndex * 0.06 },
                  scale: { type: "spring", stiffness: 280, damping: 22 },
                  y: { duration: 0.3, delay: catIndex * 0.06, ease: pageEase },
                }}
                style={{
                  width: "clamp(9rem, 40vw, 14rem)",
                  height: "clamp(9rem, 40vw, 14rem)",
                  flexShrink: 0,
                  cursor: "pointer",
                  position: "relative",
                  zIndex: 3,
                }}
                onClick={(e) => { capturePendingRect(e); handleCategoryClick(category, subcategories, cat.id); }}
              >
                <Box sx={getBubbleSx(isActiveMain, { width: "100%", height: "100%", position: "relative" })}>
                    {isActiveMain && (
                      <Box
                        sx={{
                          position: "absolute",
                          top: 10,
                          right: 10,
                          width: 28,
                          height: 28,
                          borderRadius: "999px",
                          bgcolor: "rgba(248,252,246,0.98)",
                          color: "#1C932D",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 8px 18px rgba(0,0,0,0.22)",
                        }}
                      >
                        <CheckIcon sx={{ fontSize: 18 }} />
                      </Box>
                    )}
                {cat.icon && (
                  <Box
                    component="img"
                    src={cat.icon}
                        sx={{ width: { xs: "3rem", md: "6rem" }, height: { xs: "3rem", md: "6rem" }, mb: { xs: 1, md: 2 }, objectFit: "contain", borderRadius: "0.75rem" }}
                  />
                )}
                    <Typography sx={{ fontWeight: "bold", fontSize: "clamp(1rem, 3vw, 1.5rem)", px: { xs: 1, md: 2 } }}>
                  {category}
                </Typography>
                </Box>
              </motion.div>
            );
          })}
            </Box>
          )}
        </Box>
        </motion.div>
      ) : (
        (() => {
          const node = findNodeById(categoryTree, openCategoryNode);
          if (!node || !node.children || node.children.length === 0) {
            return (
              <Box
                sx={{
                  minHeight: "100vh",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 3,
                }}
              >
                <Button variant="contained" onClick={() => setOpenCategoryNode(null)}>
                  {translations[language].back}
                </Button>
              </Box>
            );
          }

          const currentPath = findPathToNode(categoryTree, openCategoryNode) || [];
          const parentPath = currentPath.slice(0, -1);
          const parentNode =
            parentPath.length > 0 ? findNodeById(categoryTree, parentPath[parentPath.length - 1]) : null;

          return (
            <motion.div
              key={`child-nodes-${openCategoryNode}`}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={pageTransition}
            >
            <Box
              sx={{
                zIndex: 3,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                minHeight: "100vh",
                py: { xs: "6rem", md: "8rem" },
                position: "relative",
              }}
            >
              {!(
                currentExperience?.type &&
                String(currentExperience.categoryId) === String(selectedLeafId)
              ) && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, ease: pageEase }} style={{ position: "fixed", top: "clamp(4rem, 7rem, 7rem)", left: "clamp(1rem, 3rem, 3rem)", zIndex: 70 }}>
                <Button
                  variant="contained"
                  onClick={() => {
                    setSelectedLeafId(null);
                    setSelectedPath([]);
                    setSelectedMediaSlug(null);
                    setPendingNodeId(null); setPendingSlug(null); setPendingRect(null);
                    sendCategorySelection("", "", language);
                    if (parentNode) {
                      setOpenCategoryNode(parentNode._id);
                    } else {
                      setOpenCategoryNode(null);
                    }
                  }}
                  sx={{
                    backgroundColor: "rgba(248,252,246,0.92)",
                    color: "#07280B",
                    minWidth: 0,
                    width: 50,
                    height: 50,
                    borderRadius: "50%",
                    "&:hover": { backgroundColor: "rgba(248,252,246,1)" },
                  }}
                >
                  <ArrowBackIcon />
                </Button>
              </motion.div>
              )}

              {!(
                currentExperience?.type &&
                String(currentExperience.categoryId) === String(selectedLeafId)
              ) && (
              <Typography
                dir={isArabic ? "rtl" : "ltr"}
                sx={{
                  color: "#F8FCF6",
                  fontWeight: "bold",
                  fontSize: { xs: "1.5rem", md: "2rem" },
                  textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
                  textAlign: "center",
                  px: 2,
                  mb: "2rem",
                  width: "100%",

                }}
              >
                {getNodeLabel(node)}
              </Typography>
              )}

              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: { xs: "1rem", md: "2rem" },
                  alignItems: "center",
                  justifyContent: "center",
                  px: { xs: 2, md: 4 },
                  mt: { xs: "5rem", md: "0" },
                }}
              >
                {(() => {
                  const leafSelectedUnderThisNode =
                    selectedLeafId &&
                    node.children?.some((c) => String(c._id || c.id) === String(selectedLeafId));
                  const showLeafMediaOnly =
                    leafSelectedUnderThisNode &&
                    leafMedia &&
                    String(leafMedia.leafId) === String(selectedLeafId);
                  const activeExperienceForLeaf =
                    currentExperience?.type &&
                    String(currentExperience.categoryId) === String(selectedLeafId);

                  if (activeExperienceForLeaf) {
                    return (
                      <motion.div key={currentExperience.type} initial={{ opacity: 0, y: 32, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.4, ease: pageEase }} style={{ width: getExperienceShellWidth(currentExperience.type) }}>
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, ease: pageEase }} style={{ position: "fixed", top: "clamp(4rem, 7rem, 7rem)", left: "clamp(1rem, 3rem, 3rem)", zIndex: 70 }}>
                          <Button
                            variant="contained"
                            onClick={() => {
                              setSelectedLeafId(null);
                              setSelectedPath([]);
                              setSelectedMediaSlug(null);
                              setOpenCategoryNode(node._id);
                              sendCategorySelection("", "", language);
                            }}
                            sx={{
                              backgroundColor: "rgba(248,252,246,0.92)",
                              color: "#07280B",
                              minWidth: 0,
                              width: 50,
                              height: 50,
                              borderRadius: "50%",
                              "&:hover": { backgroundColor: "rgba(248,252,246,1)" },
                            }}
                          >
                            <ArrowBackIcon />
                          </Button>
                        </motion.div>
                        {renderExperienceComponent(currentExperience.type, currentExperienceState, true)}
                      </motion.div>
                    );
                  }

                  if (showLeafMediaOnly) {
                    if (leafMedia.items.length === 0) {
                      return (
                        <Typography
                          key="no-leaf-media"
                          dir={isArabic ? "rtl" : "ltr"}
                          sx={{
                            color: "rgba(248,252,246,0.9)",
                            fontSize: "1rem",
                            maxWidth: "14rem",
                            textAlign: "center",
                            
                          }}
                        >
                          {translations[language].noMediaForCategory}
                        </Typography>
                      );
                    }

                    return leafMedia.items.map((row) => {
                      const active = selectedMediaSlug === row.slug;
                      return (
                        <motion.div
                          key={`media-${row.slug}`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          animate={active ? { scale: 1.06 } : { scale: 1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 28 }}
                          style={{
                            width: "10rem",
                            height: "10rem",
                            zIndex: 61,
                            cursor: "pointer",
                            position: "relative",
                            flexShrink: 0,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            capturePendingRect(e);
                            sendSelectMedia(row.slug, language);
                            setSelectedMediaSlug(row.slug);
                            setPendingSlug(row.slug);
                          }}
                        >
                          <Box
                            sx={getBubbleSx(active, {
                              width: "100%",
                              height: "100%",
                              fontSize: "1rem",
                              position: "relative",
                            })}
                          >
                          <Typography sx={{ fontWeight: "bold", fontSize: "1.1rem", px: 1 }}>
                            {row.title}
                          </Typography>
                          {active && (
                            <Box
                              sx={{
                                position: "absolute",
                                top: 6,
                                right: 6,
                                bgcolor: "rgba(0,0,0,0.35)",
                                borderRadius: "50%",
                                p: 0.25,
                                display: "flex",
                              }}
                            >
                              <CheckIcon sx={{ fontSize: 22, color: "#F8FCF6" }} />
                            </Box>
                          )}
                          </Box>
                        </motion.div>
                      );
                    });
                  }

                  return node.children.map((child) => {
                  const hasChildren = child.children && child.children.length > 0;
                    const childId = String(child._id || child.id || "");
                    const leafId = String(selectedPath?.[selectedPath.length - 1] || "");
                    const isActiveChild =
                      (leafId && leafId === childId) ||
                      (selected.category &&
                        selected.subcategory &&
                        selected.category === (node.name?.en || "") &&
                        selected.subcategory === (child.name?.en || child.label || ""));
                    const isSelectedLeaf =
                      !hasChildren &&
                      (String(selectedLeafId || "") === childId || isActiveChild);

                  return (
                    <motion.div
                      key={child._id || child.id}
                      whileHover={{ scale: 1.06 }}
                      whileTap={{ scale: 0.95 }}
                      animate={isSelectedLeaf ? { scale: 1.06 } : { scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 28 }}
                      style={{
                        width: "10rem",
                        height: "10rem",
                        zIndex: 61,
                        cursor: "pointer",
                        position: "relative",
                        flexShrink: 0,
                      }}
                      onClick={(event) => {
                        event.stopPropagation();
                        capturePendingRect(event);
                        const childNode = findNodeById(categoryTree, child._id || child.id);
                        // Experience nodes always trigger selection, even if they have children
                        if (isExperienceNode(childNode)) {
                          handleSubBubbleClick(
                            node.name?.en || "",
                            child.name?.en || child.label,
                            child._id || child.id
                          );
                        } else if (hasChildren) {
                          setOpenCategoryNode(child._id);
                          setSelectedLeafId(null);
                          setSelectedMediaSlug(null);
                          setPendingNodeId(null); setPendingSlug(null); setPendingRect(null);
                        } else {
                          handleSubBubbleClick(
                            node.name?.en || "",
                            child.name?.en || child.label,
                            child._id || child.id
                          );
                        }
                      }}
                    >
                      <Box
                        sx={getBubbleSx(isSelectedLeaf, {
                          width: "100%",
                          height: "100%",
                          fontSize: "1rem",
                          position: "relative",
                        })}
                      >
                      {child.icon && (
                        <Box
                          component="img"
                          src={child.icon}
                            sx={{
                              width: "4rem",
                              height: "4rem",
                              mb: 1,
                              objectFit: "contain",
                              borderRadius: "0.5rem",
                            }}
                        />
                      )}
                      <Typography sx={{ fontWeight: "bold", fontSize: "1.1rem", px: 1 }}>
                        {getNodeLabel(child)}
                      </Typography>
                      {isSelectedLeaf && (
                        <Box
                          sx={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                              width: 28,
                              height: 28,
                              borderRadius: "999px",
                              bgcolor: "rgba(248,252,246,0.98)",
                              color: "#1C932D",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: "0 8px 18px rgba(0,0,0,0.22)",
                            }}
                          >
                            <CheckIcon sx={{ fontSize: 18 }} />
                        </Box>
                      )}
                      </Box>
                    </motion.div>
                  );
                  });
                })()}
              </Box>
            </Box>
            </motion.div>
          );
        })()
      )}
      </AnimatePresence>

      {/* Pending ring — fixed, centered on the exact button that was tapped */}
      <AnimatePresence>
      {isAnyPending && pendingRect && (() => {
        const cx = pendingRect.left + pendingRect.width / 2;
        const cy = pendingRect.top + pendingRect.height / 2;
        const r = Math.max(pendingRect.width, pendingRect.height);
        return (
          <motion.div key="pending-overlay" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={{ duration: 0.3 }}
            style={{ position: "fixed", zIndex: 200, pointerEvents: "none", top: cy, left: cx, transform: "translate(-50%, -50%)" }}>
            {/* Outer ring */}
            <Box sx={{
              position: "absolute",
              width: r + 32, height: r + 32,
              top: -(r + 32) / 2, left: -(r + 32) / 2,
              borderRadius: "2rem",
              border: "3px solid rgba(255,255,255,0.1)",
              borderTopColor: "rgba(248,252,246,0.95)",
              borderRightColor: "rgba(67,180,85,0.8)",
              animation: "gRingOut 1s linear infinite",
              "@keyframes gRingOut": { to: { transform: "rotate(360deg)" } },
            }} />
            {/* Inner dashed ring */}
            <Box sx={{
              position: "absolute",
              width: r + 56, height: r + 56,
              top: -(r + 56) / 2, left: -(r + 56) / 2,
              borderRadius: "2.4rem",
              border: "2px dashed rgba(57,0,66,0.65)",
              animation: "gRingIn 1.65s linear infinite",
              "@keyframes gRingIn": { to: { transform: "rotate(-360deg)" } },
            }} />
            {/* Glow */}
            <Box sx={{
              position: "absolute",
              width: r + 16, height: r + 16,
              top: -(r + 16) / 2, left: -(r + 16) / 2,
              borderRadius: "1.8rem",
              background: "radial-gradient(circle, rgba(28,147,45,0.2) 0%, transparent 70%)",
              animation: "gGlow 1.8s ease-in-out infinite",
              "@keyframes gGlow": { "0%,100%": { opacity: 0.6 }, "50%": { opacity: 1 } },
            }} />
          </motion.div>
        );
      })()}
      </AnimatePresence>
    </Box>
  );
}