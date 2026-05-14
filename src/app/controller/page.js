"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box, Typography, Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { motion } from "framer-motion";
import { Aurora } from "ambient-cbg";
import { useTheme } from "@mui/material/styles";
import useWebSocketController from "@/hooks/useWebSocketController";
import LanguageSelector from "@/app/components/LanguageSelector";
import { useLanguage } from "../context/LanguageContext";

export default function Controller() {
  const router = useRouter();
  const { sendCategorySelection, categoryOptions, categoryTree, sendCarbonMode, connected } =
    useWebSocketController();
  const { language } = useLanguage();
  const theme = useTheme();

  const [openCategory, setOpenCategory] = useState(null);
  const [selected, setSelected] = useState({ category: "", subcategory: "" });
  const [selectedPath, setSelectedPath] = useState([]);
  const [openCategoryNode, setOpenCategoryNode] = useState(null);
  const [selectedLeafId, setSelectedLeafId] = useState(null);

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
      sendCategorySelection(null, null, language, selectedPath);
    } else if (selected.category || selected.subcategory) {
      sendCategorySelection(selected.category, selected.subcategory, language);
    }
  }, [language, selected.category, selected.subcategory, selectedPath, sendCategorySelection]);

  const bubbleBase = {
    backgroundImage: "linear-gradient(145deg, #07280B 0%, #1C932D 58%, #390042 100%)",
    boxShadow: `rgba(7, 40, 11, 0.35) 0px 8px 22px,
                rgba(57, 0, 66, 0.25) 0px 16px 42px -10px,
                rgba(248, 252, 246, 0.18) 0px -4px 0px inset`,
    color: "#F8FCF6",
    width: "15rem",
    height: "15rem",
    borderRadius: "50%",
    display: "flex",
    fontFamily: getMotionFontFamily(),
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: "1.75rem",
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
    },
    ar: {
      instruction: "اضغط على الفئة لاستكشاف محتوياتها",
      back: "رجوع",
      carbonFootprint: "البصمة الكربونية",
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
          children: (node.children || []).map((child) => ({
            id: child._id,
            label: getNodeLabel(child),
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
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "center",
        gap: "4rem",
        position: "relative",
        overflow: "hidden",
        px: "3rem",
        textAlign: "center",
      }}
    >
      <LanguageSelector />
      <Box sx={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <Aurora />
      </Box>
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          background: theme.custom.gradients.heroSoft,
        }}
      />

      {!openCategoryNode ? (
        <>
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
                {category}
              </motion.div>
            );
          })}

          <Typography
            variant="h5"
            dir={isArabic ? "rtl" : "ltr"}
            sx={{
              position: "absolute",
              bottom: 30,
              color: "#F8FCF6",
              zIndex: 4,
              fontWeight: "bold",
              textAlign: "center",
              width: "100%",
              fontFamily: getMotionFontFamily(),
            }}
          >
            {translations[language].instruction}
          </Typography>
        </>
      ) : (
        (() => {
          const node = findNodeById(categoryTree, openCategoryNode);
          if (!node || !node.children || node.children.length === 0) return null;

          const currentPath = findPathToNode(categoryTree, openCategoryNode) || [];
          const parentPath = currentPath.slice(0, -1);
          const parentNode =
            parentPath.length > 0 ? findNodeById(categoryTree, parentPath[parentPath.length - 1]) : null;

          return (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "2rem",
                zIndex: 60,
                pt: 4,
              }}
            >
              <Box sx={{ position: "absolute", top: 30, left: 30, zIndex: 70 }}>
                <Button
                  variant="contained"
                  startIcon={<ArrowBackIcon />}
                  onClick={() => {
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
                    "&:hover": { backgroundColor: "rgba(248,252,246,1)" },
                  }}
                >
                  {translations[language].back}
                </Button>
              </Box>

              <Typography
                dir={isArabic ? "rtl" : "ltr"}
                sx={{
                  position: "absolute",
                  top: 100,
                  color: "#F8FCF6",
                  fontWeight: "bold",
                  fontSize: "2rem",
                  textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
                  textAlign: "center",
                  px: 2,
                  fontFamily: getMotionFontFamily(),
                }}
              >
                {getNodeLabel(node)}
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "2rem",
                  alignItems: "center",
                  justifyContent: "center",
                  px: 4,
                }}
              >
                {node.children.map((child) => {
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
                        width: "8rem",
                        height: "8rem",
                        fontSize: "1.25rem",
                        zIndex: 61,
                        backgroundImage: isSelectedLeaf
                          ? "linear-gradient(145deg, #43B455 0%, #1C932D 100%)"
                          : hasChildren
                            ? "linear-gradient(145deg, #390042 0%, #5A1B64 100%)"
                            : bubbleBase.backgroundImage,
                        boxShadow: isSelectedLeaf
                          ? "0 0 25px rgba(28, 147, 45, 0.65)"
                          : hasChildren
                            ? "0 0 18px rgba(57, 0, 66, 0.45)"
                            : bubbleBase.boxShadow,
                      }}
                    >
                      {getNodeLabel(child)}
                      {hasChildren && (
                        <Box
                          sx={{
                            position: "absolute",
                            bottom: 10,
                            right: 10,
                            fontSize: "0.8rem",
                            backgroundColor: "rgba(0,0,0,0.3)",
                            borderRadius: "50%",
                            width: 20,
                            height: 20,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          →
                        </Box>
                      )}
                      {isSelectedLeaf && (
                        <Box
                          sx={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            fontSize: "1.2rem",
                          }}
                        >
                          ✓
                        </Box>
                      )}
                    </motion.div>
                  );
                })}
              </Box>
            </Box>
          );
        })()
      )}

      <Typography
        variant="h5"
        dir={isArabic ? "rtl" : "ltr"}
        sx={{
          position: "absolute",
          bottom: 30,
          color: "#F8FCF6",
          zIndex: 4,
          fontWeight: "bold",
          textAlign: "center",
          width: "100%",
          fontFamily: getMotionFontFamily(),
          pointerEvents: "none",
          opacity: openCategoryNode ? 0 : 1,
        }}
      >
        {translations[language].instruction}
      </Typography>

      <motion.div
        onClick={() => {
          sendCarbonMode(true, 100);
          router.push("/controller/carbon-footprint");
        }}
        initial={false}
        animate={{
          scale: 1,
          background: "linear-gradient(145deg, #1C932D 0%, #43B455 100%)",
          boxShadow: "0 10px 24px rgba(28, 147, 45, 0.42)",
        }}
        transition={{ duration: 0.3 }}
        style={{
          position: "absolute",
          bottom: 30,
          right: 70,
          width: "8rem",
          height: "8rem",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: getMotionFontFamily(),
          fontWeight: "bold",
          fontSize: "1rem",
          color: "#F8FCF6",
          cursor: "pointer",
          userSelect: "none",
          zIndex: 99,
          border: "1px solid rgba(248, 252, 246, 0.18)",
          textAlign: "center",
          padding: "0.75rem",
        }}
      >
        {translations[language].carbonFootprint}
      </motion.div>
    </Box>
  );
}
