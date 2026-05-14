"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Box, Typography, Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckIcon from "@mui/icons-material/Check";
import { motion } from "framer-motion";
import { Aurora } from "ambient-cbg";
import { useTheme } from "@mui/material/styles";
import useWebSocketController from "@/hooks/useWebSocketController";
import LanguageSelector from "@/app/components/LanguageSelector";
import { useLanguage } from "../context/LanguageContext";

export default function Controller() {
  const router = useRouter();
  const {
    sendCategorySelection,
    sendSelectMedia,
    sendLanguageChange,
    categoryOptions,
    categoryTree,
    sendCarbonMode,
    connected,
    leafMedia,
  } = useWebSocketController();
  const { language } = useLanguage();
  const languageRef = useRef(language);
  languageRef.current = language;
  const theme = useTheme();

  const [openCategory, setOpenCategory] = useState(null);
  const [selected, setSelected] = useState({ category: "", subcategory: "" });
  const [selectedPath, setSelectedPath] = useState([]);
  const [openCategoryNode, setOpenCategoryNode] = useState(null);
  const [selectedLeafId, setSelectedLeafId] = useState(null);
  const [selectedMediaSlug, setSelectedMediaSlug] = useState(null);

  const isArabic = language === "ar";

  const getNodeLabel = (node) => {
    if (!node) return "";
    return isArabic ? node.name?.ar || node.name?.en || node._id : node.name?.en || node.name?.ar || node._id;
  };

  const getMotionFontFamily = () =>
    isArabic ? '"SF Mada", "Mada", sans-serif' : '"Aloevera", Georgia, serif';

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

  useEffect(() => {
    setSelectedMediaSlug(null);
  }, [selectedLeafId]);

  useEffect(() => {
    if (!leafMedia?.items?.length || !selectedMediaSlug) return;
    const stillThere = leafMedia.items.some((i) => i.slug === selectedMediaSlug);
    if (!stillThere) setSelectedMediaSlug(null);
  }, [leafMedia, selectedMediaSlug]);

  useEffect(() => {
    if (connected) {
      sendCarbonMode(false, 0);
    }
  }, [connected, sendCarbonMode]);

  useEffect(() => {
    if (!selected.category && !selected.subcategory) return;
    const timer = setTimeout(() => {
      setSelected({ category: "", subcategory: "" });
      setOpenCategory(null);
      sendCategorySelection("", "", language);
    }, 90000);
    return () => clearTimeout(timer);
  }, [selected, sendCategorySelection, language]);

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

  const bubbleBase = {
    background: "linear-gradient(145deg, rgba(82,24,105,0.85) 0%, rgba(135,46,162,0.95) 50%, rgba(57,0,66,0.85) 100%)",
    boxShadow: `rgba(0, 0, 0, 0.4) 0px 10px 30px,
                rgba(82, 24, 105, 0.6) 0px 15px 35px -5px,
                rgba(255, 255, 255, 0.1) 0px -4px 0px inset`,
    color: "#F8FCF6",
    width: "clamp(9rem, 40vw, 14rem)",
    height: "clamp(9rem, 40vw, 14rem)",
    borderRadius: "1.5rem",
    display: "flex",
    flexDirection: "column",
    fontFamily: getMotionFontFamily(),
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: "clamp(1.1rem, 4vw, 1.75rem)",
    padding: "0.5rem",
    cursor: "pointer",
    userSelect: "none",
    position: "relative",
    textTransform: "none",
    flexShrink: 0,
    transition: "box-shadow 0.2s, transform 0.2s",
    border: "1px solid rgba(248, 252, 246, 0.15)",
  };

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
      if (node.children && node.children.length) {
        setOpenCategoryNode(nodeId);
        setSelectedPath([]);
      } else {
        const path = findPathToNode(categoryTree, nodeId) || [];
        setSelectedPath(path);
        setSelected({ category: node.name?.en || "", subcategory: "" });
        sendCategorySelection(null, null, language, path);
        setOpenCategoryNode(null);
      }
      return;
    }

    if (openCategory === category) {
      setOpenCategory(null);
      setSelected({ category: "", subcategory: "" });
      sendCategorySelection("", "", language);
    } else if (subcategories.length === 0) {
      if (selected.category === category && selected.subcategory === "") {
        setSelected({ category: "", subcategory: "" });
        sendCategorySelection("", "", language);
      } else {
        setSelected({ category, subcategory: "" });
        sendCategorySelection(category, "", language);
      }
      setOpenCategory(null);
    } else {
      setOpenCategory(category);
      setSelected({ category: "", subcategory: "" });
    }
  };

  const handleSubBubbleClick = (category, subcategory, nodeId = null) => {
    if (categoryTree && nodeId) {
      const node = findNodeById(categoryTree, nodeId);
      if (!node) return;
      if (node.children && node.children.length) {
        setOpenCategoryNode(nodeId);
        setSelectedLeafId(null);
        return;
      }

      const path = findPathToNode(categoryTree, nodeId) || [];
      setSelectedPath(path);
      setSelectedLeafId(nodeId);
      setSelected({ category: node?.name?.en || category, subcategory: "" });
      sendCategorySelection(null, null, language, path);
      return;
    }

    if (selected.category === category && selected.subcategory === subcategory) {
      setSelected({ category: "", subcategory: "" });
      sendCategorySelection("", "", language);
      setOpenCategory(null);
    } else {
      setSelected({ category, subcategory });
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

      {/* Bottom Image masked with light green gradient */}
      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: "30vh",
          background: "linear-gradient(to top, rgba(93, 201, 108, 0.95) 0%, rgba(93, 201, 108, 0) 80%)",
          maskImage: "url('/omanCity.webp')",
          WebkitMaskImage: "url('/omanCity.webp')",
          maskSize: "100% 100%",
          WebkitMaskSize: "100% 100%",
          maskPosition: "bottom center",
          WebkitMaskPosition: "bottom center",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          zIndex: 2,
        }}
      />

      {!openCategoryNode ? (
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
              fontFamily: getMotionFontFamily(),
              textShadow: "2px 2px 4px rgba(0,0,0,0.5)"
            }}
          >
            {translations[language].roadmapHeading}
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: { xs: "1.5rem", md: "4rem" } }}>
            {displayCategories.map((cat) => {
              const category = cat.label;
            const subcategories = (cat.children || []).map((child) => child.label);
            const isActiveMain = selected.category === category && !selected.subcategory;

            return (
              <motion.div
                key={category}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                animate={isActiveMain ? { scale: 1.1, rotate: [0, 2, -2, 0] } : {}}
                transition={{ duration: 0.5 }}
                style={{
                  ...bubbleBase,
                  zIndex: 3,
                  backgroundImage: isActiveMain
                    ? "linear-gradient(145deg, #1C932D 0%, #43B455 52%, #390042 100%)"
                    : bubbleBase.backgroundImage,
                  boxShadow: isActiveMain
                    ? "0 0 28px rgba(28, 147, 45, 0.55)"
                    : bubbleBase.boxShadow,
                }}
                 onClick={() => handleCategoryClick(category, subcategories, cat.id)}
              >
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
              </motion.div>
            );
          })}
          </Box>
        </Box>
      ) : (
        (() => {
          const node = findNodeById(categoryTree, openCategoryNode);
          if (!node || !node.children || node.children.length === 0) return null;

          const currentPath = findPathToNode(categoryTree, openCategoryNode) || [];
          const parentPath = currentPath.slice(0, -1);
          const parentNode =
            parentPath.length > 0 ? findNodeById(categoryTree, parentPath[parentPath.length - 1]) : null;

          const leafChildMatch =
            selectedLeafId && node.children
              ? node.children.find((c) => String(c._id || c.id) === String(selectedLeafId))
              : null;
          const slugGridActive =
            Boolean(leafChildMatch) &&
            leafMedia &&
            String(leafMedia.leafId) === String(selectedLeafId);

          return (
            <Box
              sx={{
                width: "100%",
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "2rem",
                zIndex: 60,
                py: { xs: "6rem", md: "8rem" },
                position: "relative",
              }}
            >
              <Box sx={{ position: "fixed", top: { xs: "5rem", md: "7rem" }, left: { xs: "1rem", md: "3rem" }, zIndex: 70 }}>
                <Button
                  variant="contained"
                  onClick={() => {
                    setSelectedMediaSlug(null);

                    const drillNode = findNodeById(categoryTree, openCategoryNode);
                    const onSlugPicker =
                      selectedLeafId &&
                      drillNode?.children?.some(
                        (c) => String(c._id || c.id) === String(selectedLeafId)
                      ) &&
                      leafMedia &&
                      String(leafMedia.leafId) === String(selectedLeafId);

                    if (onSlugPicker) {
                      setSelectedLeafId(null);
                      return;
                    }

                    setSelectedLeafId(null);
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
              </Box>

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
                  fontFamily: getMotionFontFamily(),
                }}
              >
                {slugGridActive ? getNodeLabel(leafChildMatch) : getNodeLabel(node)}
              </Typography>

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
                            fontFamily: getMotionFontFamily(),
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
                          animate={active ? { scale: 1.15, rotate: [0, 2, -2, 0] } : {}}
                          transition={{ duration: 0.5 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            sendSelectMedia(row.slug, language);
                            setSelectedMediaSlug(row.slug);
                          }}
                          style={{
                            ...bubbleBase,
                            width: "10rem",
                            height: "10rem",
                            fontSize: "1rem",
                            zIndex: 61,
                            cursor: "pointer",
                            position: "relative",
                            backgroundImage: active
                              ? "linear-gradient(145deg, #43B455 0%, #1C932D 100%)"
                              : bubbleBase.backgroundImage,
                            boxShadow: active ? "0 0 25px rgba(28, 147, 45, 0.65)" : bubbleBase.boxShadow,
                          }}
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
                        </motion.div>
                      );
                    });
                  }

                  return node.children.map((child) => {
                    const hasChildren = child.children && child.children.length > 0;
                    const isSelectedLeaf = selectedLeafId === child._id && !hasChildren;

                    return (
                      <motion.div
                        key={child._id || child.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        animate={isSelectedLeaf ? { scale: 1.15, rotate: [0, 2, -2, 0] } : {}}
                        transition={{ duration: 0.5 }}
                        onClick={(event) => {
                          event.stopPropagation();
                          if (hasChildren) {
                            setOpenCategoryNode(child._id);
                            setSelectedLeafId(null);
                          } else {
                            handleSubBubbleClick(node.name?.en || "", child.name?.en || child.label, child._id || child.id);
                          }
                        }}
                        style={{
                          ...bubbleBase,
                          width: "10rem",
                          height: "10rem",
                          fontSize: "1rem",
                          zIndex: 61,
                          backgroundImage: isSelectedLeaf
                            ? "linear-gradient(145deg, #43B455 0%, #1C932D 100%)"
                            : bubbleBase.backgroundImage,
                          boxShadow: isSelectedLeaf
                            ? "0 0 25px rgba(28, 147, 45, 0.65)"
                            : bubbleBase.boxShadow,
                        }}
                      >
                        {child.icon && (
                          <Box
                            component="img"
                            src={child.icon}
                            sx={{ width: "4rem", height: "4rem", mb: 1, objectFit: "contain", borderRadius: "0.5rem" }}
                          />
                        )}
                        <Typography sx={{ fontWeight: "bold", fontSize: "1.1rem", px: 1 }}>
                          {getNodeLabel(child)}
                        </Typography>
                      </motion.div>
                    );
                  });
                })()}
              </Box>
            </Box>
          );
        })()
      )}

       {/* Removed Carbon Footprint Bubble */}
    </Box>
  );
}
