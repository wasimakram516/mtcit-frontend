"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box, IconButton, Typography, Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { motion } from "framer-motion";
import useWebSocketController from "@/hooks/useWebSocketController";
import { Aurora } from "ambient-cbg";
import LanguageSelector from "@/app/components/LanguageSelector";
import { useLanguage } from "../context/LanguageContext";

export default function Controller() {
  const router = useRouter();
  const { sendCategorySelection, categoryOptions, categoryTree, sendCarbonMode, connected } =
    useWebSocketController();
  const { language } = useLanguage();

  const [openCategory, setOpenCategory] = useState(null);
  const [selected, setSelected] = useState({ category: "", subcategory: "" });
  const [selectedPath, setSelectedPath] = useState([]);
  const [openCategoryNode, setOpenCategoryNode] = useState(null);
  const [selectedLeafId, setSelectedLeafId] = useState(null); // Track selected leaf to keep it highlighted

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
  }, [connected]);
  

  // Auto-clear selection after 90 seconds
  useEffect(() => {
    if (!selected.category && !selected.subcategory) return;
    const timer = setTimeout(() => {
      setSelected({ category: "", subcategory: "" });
      setOpenCategory(null);
      sendCategorySelection("", "", language);
    }, 90000);
    return () => clearTimeout(timer);
  }, [selected, sendCategorySelection, language]);

  // 💥 When language changes, re-trigger backend with current selection
  useEffect(() => {
    if (selectedPath.length) {
      sendCategorySelection(null, null, language, selectedPath);
    } else if (selected.category || selected.subcategory) {
      sendCategorySelection(selected.category, selected.subcategory, language);
    }
  }, [language, selected.category, selected.subcategory, selectedPath, sendCategorySelection]);

  const bubbleBase = {
    backgroundImage: "linear-gradient(to top, #a3bded 0%, #6991c7 100%)",
    boxShadow: `rgba(45, 35, 66, 0.4) 0px 2px 4px,
                rgba(45, 35, 66, 0.3) 0px 7px 13px -3px,
                rgba(58, 65, 111, 0.5) 0px -3px 0px inset`,
    color: "#fff",
    width: "15rem",
    height: "15rem",
    borderRadius: "50%",
    display: "flex",
    fontFamily: '"JetBrains Mono", monospace',
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
    "&:hover": {
      boxShadow: `rgba(45, 35, 66, 0.4) 0px 4px 8px,
                  rgba(45, 35, 66, 0.3) 0px 7px 13px -3px,
                  #3c4fe0 0px -3px 0px inset`,
      transform: "translateY(-2px)",
    },
  };

  const translations = {
    en: {
      instruction: "Tap a category to explore its contents",
      back: "Back",
    },
    ar: {
      instruction: "اضغط على الفئة لاستكشاف محتوياتها",
      back: "رجوع",
    },
  };

  const handleCategoryClick = (category, subcategories, nodeId = null) => {
    // If using categoryTree, nodeId will be populated
    if (categoryTree && nodeId) {
      const node = findNodeById(categoryTree, nodeId);
      if (!node) return;
      if (node.children && node.children.length) {
        // This is a parent node - open it to show children
        setOpenCategoryNode(nodeId);
        // Reset selected path but keep track of navigation path
        setSelectedPath([]);
      } else {
        // This is a leaf node - select it
        const path = findPathToNode(categoryTree, nodeId) || [];
        setSelectedPath(path);
        setSelected({ category: node.name?.en || "", subcategory: "" });
        sendCategorySelection(null, null, language, path);
        setOpenCategoryNode(null);
      }
      return;
    }

    // Legacy behavior
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
        // drill down into this node
        setOpenCategoryNode(nodeId);
        setSelectedLeafId(null); // Clear leaf selection when drilling down
        return;
      }
      // This is a leaf node - select it and keep drill-down open
      const path = findPathToNode(categoryTree, nodeId) || [];
      setSelectedPath(path);
      setSelectedLeafId(nodeId); // Mark this leaf as selected
      setSelected({ category: node?.name?.en || category, subcategory: "" });
      sendCategorySelection(null, null, language, path);
      // DON'T close the drill-down - keep it open so user can see their selection
      return;
    }

    if (
      selected.category === category &&
      selected.subcategory === subcategory
    ) {
      setSelected({ category: "", subcategory: "" });
      sendCategorySelection("", "", language);
      setOpenCategory(null);
    } else {
      setSelected({ category, subcategory });
      sendCategorySelection(category, subcategory, language);
    }
  };

  const displayCategories = categoryTree && Array.isArray(categoryTree)
    ? categoryTree.map((n) => ({
        id: n._id,
        label: n.name?.en || n._id,
        children: (n.children || []).map((c) => ({ id: c._id, label: c.name?.en || c._id })),
      }))
    : Object.entries(categoryOptions).map(([k, v]) => ({ id: k, label: k, children: (v || []).map((s) => ({ id: null, label: s })) }));

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

      {/* Show root categories OR children overlay - NOT both */}
      {!openCategoryNode ? (
        // ROOT LEVEL: Show only root categories
        <>
          {displayCategories.map((cat, index) => {
            const category = cat.label;
            const subcategories = (cat.children || []).map((c) => c.label);
            const isActiveMain =
              selected.category === category && !selected.subcategory;

            return (
              <motion.div
                key={category}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                animate={isActiveMain ? { scale: 1.1, rotate: [0, 2, -2, 0] } : {}}
                transition={{ duration: 0.5 }}
                style={{
                  ...bubbleBase,
                  backgroundImage: isActiveMain
                    ? "linear-gradient(to top, #64b5f6 0%, #1e88e5 100%)"
                    : bubbleBase.backgroundImage,
                  boxShadow: isActiveMain
                    ? "0 0 20px rgba(33, 150, 243, 0.8)"
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
            sx={{
              position: "absolute",
              bottom: 30,
              color: "white",
              fontWeight: "bold",
              textAlign: "center",
              width: "100%",
            }}
          >
            {translations[language].instruction}
          </Typography>
        </>
      ) : (
        // DRILL-DOWN LEVEL: Show only children of openCategoryNode
        (() => {
          const node = findNodeById(categoryTree, openCategoryNode);
          if (!node || !node.children || node.children.length === 0) return null;

          const currentPath = findPathToNode(categoryTree, openCategoryNode) || [];
          const parentPath = currentPath.slice(0, -1);
          const parentNode = parentPath.length > 0 ? findNodeById(categoryTree, parentPath[parentPath.length - 1]) : null;

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
              {/* Back Button - Top Left */}
              <Box sx={{ position: "absolute", top: 30, left: 30, zIndex: 70 }}>
                <Button
                  variant="contained"
                  startIcon={<ArrowBackIcon />}
                  onClick={() => {
                    setSelectedLeafId(null); // Clear leaf selection when going back
                    if (parentNode) {
                      setOpenCategoryNode(parentNode._id);
                    } else {
                      setOpenCategoryNode(null);
                    }
                  }}
                  sx={{
                    backgroundColor: "rgba(255,255,255,0.9)",
                    color: "#333",
                    "&:hover": { backgroundColor: "rgba(255,255,255,1)" },
                  }}
                >
                  {translations[language].back}
                </Button>
              </Box>

              {/* Current Level Title */}
              <Typography
                sx={{
                  position: "absolute",
                  top: 100,
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "2rem",
                  textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
                  textAlign: "center",
                  px: 2,
                }}
              >
                {node.name?.en}
              </Typography>

              {/* Children Bubbles */}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        // Check if this child has its own children
                        if (hasChildren) {
                          // Open this as the new parent
                          setOpenCategoryNode(child._id);
                          setSelectedLeafId(null); // Clear leaf selection when drilling deeper
                        } else {
                          // This is a leaf - select it
                          handleSubBubbleClick(node.name?.en || "", child.name?.en || child.label, child._id || child.id);
                        }
                      }}
                      style={{
                        ...bubbleBase,
                        width: "8rem",
                        height: "8rem",
                        fontSize: "1.25rem",
                        backgroundImage: isSelectedLeaf
                          ? "linear-gradient(to top, #76ff03 0%, #64dd17 100%)"
                          : (hasChildren ? "linear-gradient(120deg, #4facfe 0%, #00f2fe 100%)" : bubbleBase.backgroundImage),
                        boxShadow: isSelectedLeaf
                          ? "0 0 25px rgba(118, 255, 3, 0.9)"
                          : (hasChildren ? "0 0 12px rgba(102, 166, 255, 0.6)" : bubbleBase.boxShadow),
                      }}
                    >
                      {child.name?.en || child.label || child._id}
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
        sx={{
          position: "absolute",
          bottom: 30,
          color: "white",
          fontWeight: "bold",
          textAlign: "center",
          width: "100%",
        }}
      >
        {translations[language].instruction}
      </Typography>

      {/* Carbon Footprint Toggle Button */}
      <motion.div
        onClick={() => {
          sendCarbonMode(true, 100); 
          router.push("/controller/carbon-footprint")
        }}
        initial={false}
        animate={{
          scale: 1,
          background: "linear-gradient(to top, #00c851, #1de9b6)", // ✅ green gradient
          boxShadow: "0 4px 10px rgba(0, 200, 130, 0.4)", // ✅ optional green glow
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
          fontFamily: '"JetBrains Mono", monospace',
          fontWeight: "bold",
          fontSize: "1rem",
          color: "#fff",
          cursor: "pointer",
          userSelect: "none",
          zIndex: 99,
        }}
      >
        Carbon Footprint
      </motion.div>
    </Box>
  );
}
